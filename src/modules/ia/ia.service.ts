import { GoogleGenerativeAI } from '@google/generative-ai';
import { Injectable, InternalServerErrorException, OnModuleInit } from '@nestjs/common';
import { CustomLoggerService } from '../../common/logger/logger.service';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';

@Injectable()
export class IaService implements OnModuleInit {
    private genAI: GoogleGenerativeAI;
    private model: any;
    private readonly availableTables = [
        'am_discard_reasons', 'card_types', 'card_types_catalog', 'card_types_notes',
        'cards', 'cards_notes', 'cards_status', 'cilt_frecuencies', 'cilt_mstr',
        'cilt_mstr_position_levels', 'cilt_secuences', 'cilt_sequences',
        'cilt_sequences_evidences', 'cilt_sequences_executions',
        'cilt_sequences_frecuencies_OLD', 'cilt_sequences_schedule', 'cilt_types',
        'companies', 'companies_notes', 'currencies', 'evidences', 'items_OLD',
        'levels', 'levels_notes', 'machine_downtime_reasons', 'migration_table',
        'opl_details', 'opl_mstr', 'opl_mstr_levels', 'password_resets_OLD',
        'permissions_OLD', 'positions', 'preclassifiers', 'preclassifiers_notes',
        'priorities', 'priorities_notes', 'repository_OLD', 'role', 'sites',
        'sites_notes', 'status', 'user_has_sites', 'user_role', 'users',
        'users_positions'
    ];

    constructor(
        private readonly logger: CustomLoggerService,
        @InjectDataSource('iaConnection') private readonly iaDataSource: DataSource
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
            const createTable = await queryRunner.query(`SHOW CREATE TABLE ${tableName}`);
            return createTable[0]['Create Table'];
        } finally {
            await queryRunner.release();
        }
    }

    private formatQueryResult(result: any): any {
        if (Array.isArray(result)) {
            return result.map(row => {
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

    async convertToSQL(naturalLanguage: string): Promise<{ sql: string; refinedData: any }> {
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
            const relevantTables = tablesResponse.text().split(',').map(t => t.trim());

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
                   - The query must be valid and executable
                   - Select ONLY relevant fields, do not use SELECT *
                   - For general queries, include only the most important fields
                   - For specific queries, include only necessary fields
                   - DO NOT use parameter placeholders (?) in the query
                   - All values must be hardcoded in the query
                   - For COUNT queries, use COUNT(*) and include a descriptive alias
                   - Always verify the data exists before returning results
            `;

            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            // Extract SQL from text
            const sqlMatch = text.match(/```sql\n([\s\S]*?)\n```/) || text.match(/SELECT[\s\S]*?;/i);
            const sql = sqlMatch ? sqlMatch[1].trim() : text.trim();

            if (!sql) {
                throw new Error('Could not generate a valid SQL query');
            }

            // Execute SQL query
            const queryRunner = this.iaDataSource.createQueryRunner();
            try {
                await queryRunner.connect();
                const result = await queryRunner.query(sql);
                this.logger.logIA(`SQL query executed: ${sql.substring(0, 100)}...`);
                return { 
                    sql, 
                    refinedData: this.formatQueryResult(result)
                };
            } finally {
                await queryRunner.release();
            }
        } catch (error) {
            this.logger.logException('IaService', 'convertToSQL', error);
            throw new InternalServerErrorException('Error processing the query with AI');
        }
    }
} 