import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
} from '@nestjs/common';
import { PriorityService } from './priority.service';
import { ApiBody, ApiParam, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CreatePriorityDTO } from './models/dto/create.priority.dto';
import { UpdatePriorityDTO } from './models/dto/update.priority.dto';
import { SITE_ADMIN_ROLES } from 'src/common/auth/roles.constants';
import { RequireRoles } from 'src/common/decorators/roles.decorator';
import { SiteResourceAccess } from 'src/common/decorators/site-resource-access.decorator';

@ApiTags('priority')
@ApiBearerAuth()
@Controller('priority')
export class PriorityController {
  constructor(private readonly priorityService: PriorityService) {}

  @Get('/all/:siteId')
  @ApiParam({ name: 'siteId', required: true, example: 1 })
  findActivePrioritiesByCompanyId(@Param('siteId') siteId: number) {
    return this.priorityService.findSiteActivePriorities(+siteId);
  }

  @Get('/site/:siteId')
  @ApiParam({ name: 'siteId', required: true, example: 1 })
  findPrioritiesByCompanyId(@Param('siteId') siteId: number) {
    return this.priorityService.findSitePriorities(+siteId);
  }

  @Post('/create')
  @RequireRoles(...SITE_ADMIN_ROLES)
  @ApiBody({ type: CreatePriorityDTO })
  create(@Body() createPriorityDTO: CreatePriorityDTO) {
    return this.priorityService.create(createPriorityDTO);
  }

  @Put('/update')
  @RequireRoles(...SITE_ADMIN_ROLES)
  @SiteResourceAccess({
    resource: 'priority',
    lookup: 'id',
    source: 'body',
    requestKey: 'id',
  })
  @ApiBody({ type: UpdatePriorityDTO })
  update(@Body() updatePriorityDTO: UpdatePriorityDTO) {
    return this.priorityService.update(updatePriorityDTO);
  }
  @Get('/one/:id')
  @SiteResourceAccess({
    resource: 'priority',
    lookup: 'id',
    source: 'params',
    requestKey: 'id',
  })
  @ApiParam({ name: 'id', example: 1 })
  findOneById(@Param('id') id: number) {
    return this.priorityService.findById(id);
  }
}
