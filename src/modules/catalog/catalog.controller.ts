import { Controller, Get, Param, UseGuards, Request } from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
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
}