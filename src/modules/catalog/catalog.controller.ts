import { Controller, Get, Param, Query, UseGuards, Request } from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { ApiBearerAuth, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/guard/auth.guard';

@Controller('catalog')
@UseGuards(AuthGuard)
@ApiTags('catalog')
@ApiBearerAuth()
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get(':siteId')
  async getCatalogs(@Param('siteId') siteId: number, @Request() req) {
    return await this.catalogService.getCatalogs(siteId, req.user.id);
  }

  @Get(':siteId/paginated')
  @ApiParam({ name: 'siteId', description: 'Site ID' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (default: 1)', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page (default: 200)', example: 200 })
  async getCatalogsPaginated(
    @Param('siteId') siteId: number,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Request() req?,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 200;
    return await this.catalogService.getCatalogsPaginated(siteId, req.user.id, pageNum, limitNum);
  }
}