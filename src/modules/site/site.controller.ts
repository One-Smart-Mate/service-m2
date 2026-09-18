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
import {
  PLATFORM_ADMIN_ROLE,
  SITE_ADMIN_ROLES,
} from 'src/common/auth/roles.constants';
import { RequireRoles } from 'src/common/decorators/roles.decorator';
import { SelfOrRoles } from 'src/common/decorators/self-or-roles.decorator';
import { SiteResourceAccess } from 'src/common/decorators/site-resource-access.decorator';

@ApiTags('sites')
@ApiBearerAuth()
@Controller('sites')
export class SiteController {
  constructor(private readonly siteService: SiteService) {}

  @Get('/all/:companyId')
  @RequireRoles(PLATFORM_ADMIN_ROLE)
  @ApiParam({ name: 'companyId', required: true, example: 1 })
  findAllByCompany(@Param('companyId') companyId: number) {
    return this.siteService.findCompanySites(companyId);
  }

  @Post('/create')
  @RequireRoles(PLATFORM_ADMIN_ROLE)
  @ApiBody({ type: CreateSiteDTO })
  create(@Body() createSiteDTO: CreateSiteDTO) {
    return this.siteService.create(createSiteDTO);
  }

  @Put('/update')
  @RequireRoles(...SITE_ADMIN_ROLES)
  @SiteResourceAccess({
    resource: 'site',
    lookup: 'id',
    source: 'body',
    requestKey: 'id',
  })
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
  @SelfOrRoles({
    source: 'params',
    requestKey: 'userId',
    roles: SITE_ADMIN_ROLES,
  })
  @SiteResourceAccess({
    resource: 'user',
    lookup: 'id',
    source: 'params',
    requestKey: 'userId',
  })
  @ApiParam({ name: 'userId', required: true, example: 1 })
  async findUserSites(@Param('userId') userId: number) {
    return this.siteService.findUserSitesId(userId);
  }
  @Get('/all')
  @RequireRoles(PLATFORM_ADMIN_ROLE)
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
