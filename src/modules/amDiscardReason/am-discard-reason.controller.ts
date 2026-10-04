import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Put,
  Post,
  Query,
} from '@nestjs/common';
import { AmDiscardReasonService } from './am-discard-reason.service';
import { CreateAmDiscardReasonDto } from './models/dto/create-am-discard-reason.dto';
import { UpdateAmDiscardReasonDto } from './models/dto/update-am-discard-reason.dto';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { RequireSiteAccess } from 'src/common/decorators/require-site-access.decorator';
import { SITE_ADMIN_ROLES } from 'src/common/auth/roles.constants';
import { RequireRoles } from 'src/common/decorators/roles.decorator';
import { SiteResourceAccess } from 'src/common/decorators/site-resource-access.decorator';

@ApiTags('AM Discard Reasons')
@ApiBearerAuth()
@Controller('am-discard-reasons')
export class AmDiscardReasonController {
  constructor(
    private readonly amDiscardReasonsService: AmDiscardReasonService,
  ) {}

  @Post()
  @RequireRoles(...SITE_ADMIN_ROLES)
  @RequireSiteAccess()
  @ApiOperation({ summary: 'Create a new discard reason' })
  @ApiBody({ type: CreateAmDiscardReasonDto })
  @ApiResponse({
    status: 201,
    description: 'Discard reason created successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  create(@Body() createAmDiscardReasonDto: CreateAmDiscardReasonDto) {
    return this.amDiscardReasonsService.create(createAmDiscardReasonDto);
  }

  @Get()
  @RequireSiteAccess()
  @ApiOperation({
    summary: 'Get all discard reasons for a site',
  })
  @ApiQuery({
    name: 'siteId',
    required: true,
    type: 'number',
    description: 'Site ID to filter reasons',
  })
  @ApiResponse({ status: 200, description: 'List of discard reasons' })
  findAll(@Query('siteId') siteId?: string) {
    if (siteId) {
      return this.amDiscardReasonsService.findBySite(+siteId);
    }
    return this.amDiscardReasonsService.findAll();
  }

  @Get(':id')
  @SiteResourceAccess({
    resource: 'discardReason',
    lookup: 'id',
    source: 'params',
    requestKey: 'id',
  })
  @ApiOperation({ summary: 'Get a discard reason by ID' })
  @ApiParam({ name: 'id', type: 'number', description: 'Discard reason ID' })
  @ApiResponse({ status: 200, description: 'Discard reason found' })
  @ApiResponse({ status: 404, description: 'Discard reason not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.amDiscardReasonsService.findOne(id);
  }

  @Put(':id')
  @RequireRoles(...SITE_ADMIN_ROLES)
  @SiteResourceAccess({
    resource: 'discardReason',
    lookup: 'id',
    source: 'params',
    requestKey: 'id',
  })
  @ApiOperation({ summary: 'Update a discard reason' })
  @ApiBody({ type: UpdateAmDiscardReasonDto })
  @ApiResponse({
    status: 200,
    description: 'Discard reason updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Discard reason not found' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAmDiscardReasonDto: UpdateAmDiscardReasonDto,
  ) {
    if (id !== updateAmDiscardReasonDto.id) {
      throw new BadRequestException('Route id and body id must match');
    }
    return this.amDiscardReasonsService.update(updateAmDiscardReasonDto);
  }

  @Delete(':id')
  @RequireRoles(...SITE_ADMIN_ROLES)
  @SiteResourceAccess({
    resource: 'discardReason',
    lookup: 'id',
    source: 'params',
    requestKey: 'id',
  })
  @ApiOperation({ summary: 'Delete a discard reason' })
  @ApiParam({ name: 'id', type: 'number', description: 'Discard reason ID' })
  @ApiResponse({ status: 200, description: 'Discard reason deleted successfully' })
  @ApiResponse({ status: 404, description: 'Discard reason not found' })
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.amDiscardReasonsService.delete(id);
  }
}
