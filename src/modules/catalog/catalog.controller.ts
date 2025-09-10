import { Controller, Get, Param, UseGuards } from '@nestjs/common';
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
  async getCatalogs(@Param('siteId') siteId: number) {
    return await this.catalogService.getCatalogs(siteId);
  }
}