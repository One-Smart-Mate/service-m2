import { Controller, Post, Body } from '@nestjs/common';
import { IaService } from './ia.service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { RequireRoles } from 'src/common/decorators/roles.decorator';
import { PLATFORM_ADMIN_ROLE } from 'src/common/auth/roles.constants';
import { NaturalLanguageQueryDto } from './dto/natural-language-query.dto';

@ApiBearerAuth()
@ApiTags('AI')
@Controller('ia')
export class IaController {
  constructor(private readonly iaService: IaService) {}

  @Post('convert-to-sql')
  @RequireRoles(PLATFORM_ADMIN_ROLE)
  @ApiOperation({ summary: 'Convert natural language queries to SQL' })
  @ApiResponse({
    status: 200,
    description: 'Query processed successfully',
    schema: {
      type: 'object',
      properties: {
        sql: {
          type: 'string',
          example: 'SELECT id, description FROM cards WHERE deleted_at IS NULL',
        },
        refinedData: {
          type: 'object',
          description: 'SQL query results',
        },
        beautifiedData: {
          type: 'string',
          description: 'Formatted query results for display',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Error in provided query',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async convertToSQL(@Body() body: NaturalLanguageQueryDto) {
    return this.iaService.convertToSQL(body.query);
  }
}
