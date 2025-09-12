import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
} from '@nestjs/common';
import { SiteService } from './site.service';
import { ApiBody, ApiParam, ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CreateSiteDTO } from './models/dto/create-site.dto';
import { UpadeSiteDTO } from './models/dto/update.site.dto';
import { plainToClass } from 'class-transformer';
import { FindOneSiteDTO } from './models/dto/findOne.site.dto';

@ApiTags('sites')
@ApiBearerAuth()
@Controller('sites')
export class SiteController {
  constructor(private readonly siteService: SiteService) {}

  @Get('/all/:companyId')
  @ApiParam({ name: 'companyId', required: true, example: 1 })
  findAllByCompany(@Param('companyId') companyId: number) {
    return this.siteService.findCompanySites(companyId);
  }

  @Post('/create')
  @ApiBody({ type: CreateSiteDTO })
  create(@Body() createSiteDTO: CreateSiteDTO) {
    return this.siteService.create(createSiteDTO);
  }

  @Put('/update')
  @ApiBody({ type: UpadeSiteDTO })
  update(@Body() updateSiteDTO: UpadeSiteDTO) {
    return this.siteService.update(updateSiteDTO);
  }

  @Get('site/:siteId')
  @ApiParam({ name: 'siteId', required: true, example: 1 })
  async findById(@Param('siteId') siteId: number) {
    const site = await this.siteService.findById(siteId);
    return plainToClass(FindOneSiteDTO, site, {
      excludeExtraneousValues: true,
    });
  }
  @Get('user-sites/:userId')
  @ApiParam({ name: 'userId', required: true, example: 1 })
  async findUserSites(@Param('userId') userId: number) {
    return this.siteService.findUserSitesId(userId);
  }
  @Get('/all')
  findAll() {
    return this.siteService.findAll();
  }

  @Get('/:siteId/users/roles-and-positions')
  @ApiOperation({ summary: 'Get users by site with roles and positions' })
  @ApiParam({ name: 'siteId', type: 'number' })
  @ApiResponse({ 
    status: 200, 
    description: 'Users retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Site not found' })
  async findUsersWithRolesAndPositions(@Param('siteId') siteId: number) {
    return this.siteService.findUsersWithRolesAndPositions(siteId);
  }
}
