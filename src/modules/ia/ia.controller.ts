import { Controller, Post, Body } from '@nestjs/common';
import { IaService } from './ia.service';
import { ApiTags, ApiOperation, ApiBody, ApiResponse } from '@nestjs/swagger';

@ApiTags('AI')
@Controller('ia')
export class IaController {
  constructor(private readonly iaService: IaService) {}

  @Post('convert-to-sql')
  @ApiOperation({ summary: 'Convert natural language queries to SQL' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          example: 'show me all active users',
          description: 'Natural language query to convert to SQL'
        }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Query processed successfully',
    schema: {
      type: 'object',
      properties: {
        sql: {
          type: 'string',
          example: 'SELECT * FROM users WHERE status = "active"'
        },
        refinedData: {
          type: 'object',
          description: 'SQL query results'
        }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Error in provided query'
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error'
  })
  async convertToSQL(@Body('query') query: string) {
    return this.iaService.convertToSQL(query);
  }
} 