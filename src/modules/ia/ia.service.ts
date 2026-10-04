import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  HttpException,
  Injectable,
  InternalServerErrorException,
  OnModuleInit,
} from '@nestjs/common';
import { CustomLoggerService } from '../../common/logger/logger.service';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import {
  applyResultLimit,
  extractSqlFromModelResponse,
  IA_QUERYABLE_TABLES,
  IA_RESULT_LIMIT,
  validateReadOnlySql,
} from './ia-query-policy';

@Injectable()
export class IaService implements OnModuleInit {
  private genAI: GoogleGenerativeAI;
  private model: any;
  private readonly availableTables = IA_QUERYABLE_TABLES;

  constructor(
    private readonly logger: CustomLoggerService,
    @InjectDataSource('iaConnection') private readonly iaDataSource: DataSource,
  ) {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  }

  async onModuleInit() {
    try {
      if (!this.iaDataSource.isInitialized) {
        await this.iaDataSource.initialize();
        this.logger.logIA('Database connection established');
      }
    } catch (error) {
      this.logger.logException('IaService', 'onModuleInit', error);
      throw new InternalServerErrorException('Error connecting to database');
    }
  }

  private async getTableStructure(tableName: string): Promise<string> {
    const queryRunner = this.iaDataSource.createQueryRunner();
    try {
      await queryRunner.connect();
      if (
        !this.availableTables.includes(
          tableName as (typeof IA_QUERYABLE_TABLES)[number],
        )
      ) {
        throw new InternalServerErrorException(
          'Table is not available for AI queries',
        );
      }

      const createTable = await queryRunner.query(
        `SHOW CREATE TABLE \`${tableName}\``,
      );
      return createTable[0]['Create Table'];
    } finally {
      await queryRunner.release();
    }
  }

  private formatQueryResult(result: any): any {
    if (Array.isArray(result)) {
      return result.map((row) => {
        const formattedRow = {};
        for (const [key, value] of Object.entries(row)) {
          // Remove table aliases from column names
          const cleanKey = key.replace(/^[a-z]+\./, '');
          formattedRow[cleanKey] = value;
        }
        return formattedRow;
      });
    }
    return result;
  }

  private beautifyData(data: any[]): string {
    if (!data || data.length === 0) {
      return 'No se encontraron resultados para tu consulta.';
    }

    const keys = Object.keys(data[0]);
    if (keys.length === 1 && keys[0].toLowerCase().includes('count')) {
      const countValue = data[0][keys[0]];
      return `El resultado de tu consulta es: ${countValue}.`;
    }

    let response = 'Aquí están los resultados de tu consulta:\n\n';
    data.forEach((row, index) => {
      response += `*Registro ${index + 1}:*\n`;
      for (const [key, value] of Object.entries(row)) {
        const formattedKey = key
          .replace(/_/g, ' ')
          .replace(/\b\w/g, (l) => l.toUpperCase());
        response += `  - *${formattedKey}:* ${value}\n`;
      }
      response += '\n';
    });
    return response.trim();
  }

  async convertToSQL(
    naturalLanguage: string,
  ): Promise<{ sql: string; refinedData: any; beautifiedData: string }> {
    try {
      if (!this.iaDataSource.isInitialized) {
        await this.iaDataSource.initialize();
      }

      this.logger.logIA(`Available tables: ${this.availableTables.join(', ')}`);

      // First, ask AI to identify relevant tables
      const tablesPrompt = `
                Based on the following natural language query:
                "${naturalLanguage}"
                
                Which database tables would you need to query?
                Available tables are: ${this.availableTables.join(', ')}
                
                Respond ONLY with a comma-separated list of table names, no additional explanations.
            `;

      const tablesResult = await this.model.generateContent(tablesPrompt);
      const tablesResponse = await tablesResult.response;
      const relevantTables = tablesResponse
        .text()
        .split(',')
        .map((t) => t.trim());

      // Get structure of relevant tables
      const tableStructures = {};
      for (const table of relevantTables) {
        if (this.availableTables.includes(table)) {
          tableStructures[table] = await this.getTableStructure(table);
        }
      }

      const prompt = `
                Convert the following natural language query to SQL:
                "${naturalLanguage}"
                
                Consider that:
                1. You are working with a MySQL database
                2. Available tables are: ${this.availableTables.join(', ')}
                3. Structure of relevant tables:
                ${JSON.stringify(tableStructures, null, 2)}
                
                4. Important rules:
                   - Use soft delete (deleted_at IS NULL) when appropriate
                   - Include necessary JOINs to get related information
                   - Optimize the query for better performance
                   - Use table aliases for better readability
                   - Include only the SQL query, no additional explanations
                   - Generate exactly one SELECT query; never generate writes or DDL
                   - Do not use comments, subqueries, UNION, system variables, functions that access files, or database-qualified table names
                   - Only use the available tables listed above
                   - The query must be valid and executable
                   - Select ONLY relevant fields, do not use SELECT *
                   - For general queries, include only the most important fields
                   - For specific queries, include only necessary fields
                   - DO NOT use parameter placeholders (?) in the query
                   - All values must be hardcoded in the query
                   - For COUNT queries, use COUNT(*) and include a descriptive alias
                   - Always verify the data exists before returning results
                   - Return no more than ${IA_RESULT_LIMIT} rows
            `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Extract SQL from text
      const generatedSql = extractSqlFromModelResponse(text);
      const sql = validateReadOnlySql(generatedSql, this.availableTables);
      const boundedSql = applyResultLimit(sql);

      // Execute SQL query
      const queryRunner = this.iaDataSource.createQueryRunner();
      let readOnlyTransactionStarted = false;
      try {
        await queryRunner.connect();
        await queryRunner.query('START TRANSACTION READ ONLY');
        readOnlyTransactionStarted = true;
        const rawResult = await queryRunner.query(boundedSql);
        await queryRunner.query('ROLLBACK');
        readOnlyTransactionStarted = false;
        this.logger.logIA('Validated read-only AI query executed');

        const refinedData = this.formatQueryResult(rawResult);
        const beautifiedData = this.beautifyData(refinedData);

        return {
          sql,
          refinedData: refinedData,
          beautifiedData,
        };
      } finally {
        if (readOnlyTransactionStarted) {
          await queryRunner.query('ROLLBACK').catch(() => undefined);
        }
        await queryRunner.release();
      }
    } catch (error) {
      this.logger.logException('IaService', 'convertToSQL', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Error processing the query with AI',
      );
    }
  }
}
