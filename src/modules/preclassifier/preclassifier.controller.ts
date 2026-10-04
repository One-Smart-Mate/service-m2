import { Controller, Get, Post, Body, Param, Put } from '@nestjs/common';
import { PreclassifierService } from './preclassifier.service';
import { ApiBody, ApiParam, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CreatePreclassifierDTO } from './models/dto/create-preclassifier.dto';
import { UpdatePreclassifierDTO } from './models/dto/update-preclassifier.dto';
import { SITE_ADMIN_ROLES } from 'src/common/auth/roles.constants';
import { RequireRoles } from 'src/common/decorators/roles.decorator';
import { SiteResourceAccess } from 'src/common/decorators/site-resource-access.decorator';

@ApiTags('preclassifier')
@ApiBearerAuth()
@Controller('preclassifier')
export class PreclassifierController {
  constructor(private readonly preclassifierService: PreclassifierService) {}

  @Get('/all/:cardTypesId')
  @SiteResourceAccess({
    resource: 'cardType',
    lookup: 'id',
    source: 'params',
    requestKey: 'cardTypesId',
  })
  @ApiParam({ name: 'cardTypesId', required: true, example: 1 })
  findAllAcviteByCardTypes(@Param('cardTypesId') cardTypeId: number) {
    return this.preclassifierService.findCardTypesActivePreclassifiers(
      cardTypeId,
    );
  }

  @Get('/card-type/:cardTypesId')
  @SiteResourceAccess({
    resource: 'cardType',
    lookup: 'id',
    source: 'params',
    requestKey: 'cardTypesId',
  })
  @ApiParam({ name: 'cardTypesId', required: true, example: 1 })
  findAllByCardTypes(@Param('cardTypesId') cardTypeId: number) {
    return this.preclassifierService.findCardTypesPreclassifiers(cardTypeId);
  }

  @Get('/site/:siteId')
  @ApiParam({ name: 'siteId', required: true, example: 1 })
  findAllActiveBySite(@Param('siteId') siteId: number) {
    return this.preclassifierService.findSiteActivePreclassifiers(siteId);
  }

  @Get('/:id')
  @SiteResourceAccess({
    resource: 'preclassifier',
    lookup: 'id',
    source: 'params',
    requestKey: 'id',
  })
  @ApiParam({ name: 'id', required: true, example: 1 })
  findOneById(@Param('id') siteId: number) {
    return this.preclassifierService.findById(siteId);
  }

  @Post('/create')
  @RequireRoles(...SITE_ADMIN_ROLES)
  @SiteResourceAccess({
    resource: 'cardType',
    lookup: 'id',
    source: 'body',
    requestKey: 'cardTypeId',
  })
  @ApiBody({ type: CreatePreclassifierDTO })
  create(@Body() createPreclassifierDTO: CreatePreclassifierDTO) {
    return this.preclassifierService.create(createPreclassifierDTO);
  }

  @Put('/update')
  @RequireRoles(...SITE_ADMIN_ROLES)
  @SiteResourceAccess({
    resource: 'preclassifier',
    lookup: 'id',
    source: 'body',
    requestKey: 'id',
  })
  @ApiBody({ type: UpdatePreclassifierDTO })
  update(@Body() updatePreclassifierDTO: UpdatePreclassifierDTO) {
    return this.preclassifierService.update(updatePreclassifierDTO);
  }
}
