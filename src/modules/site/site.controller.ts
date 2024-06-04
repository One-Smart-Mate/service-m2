import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { SiteService } from './site.service';
import { ApiBody, ApiParam, ApiTags } from '@nestjs/swagger';
import { CreateSiteDTO } from './models/dto/create-site.dto';

@ApiTags('sites')
@Controller('sites')
export class SiteController {
  constructor(private readonly siteService: SiteService) {}

  @Get('/all/:companyId')
  @ApiParam({name: 'companyId', required: true, example: 1})
  findAllByCompany(@Param('companyId') companyId: number) {
    return this.siteService.findCompanySites(companyId);
  }

  @Post('/create')
  @ApiBody({type: CreateSiteDTO})
  create(@Body() createSiteDTO: CreateSiteDTO){
    return this.siteService.create(createSiteDTO)
  }
}
