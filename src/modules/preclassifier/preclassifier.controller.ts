import { Controller, Get, Post, Body, Param, Put } from '@nestjs/common';
import { PreclassifierService } from './preclassifier.service';
import { ApiBody, ApiParam, ApiTags } from '@nestjs/swagger';
import { CreatePreclassifierDTO } from './models/dto/create-preclassifier.dto';
import { UpdatePreclassifierDTO } from './models/dto/update-preclassifier.dto';

@ApiTags('preclassifier')
@Controller('preclassifier')
export class PreclassifierController {
  constructor(private readonly preclassifierService: PreclassifierService) {}

  @Get('/all/:cardTypesId')
  @ApiParam({name:'cardTypesId', required: true, example: 1})
  findAllByCardTypes(@Param('cardTypesId') cardTypeId: number){
    return this.preclassifierService.findCardTypesPreclassifiers(cardTypeId)
  }

  @Get('/site/:siteId')
  @ApiParam({name:'siteId', required: true, example: 1})
  findAllBySite(@Param('siteId') siteId: number){
    return this.preclassifierService.findSitePreclassifiers(siteId)
  }

  @Get('/:id')
  @ApiParam({name:'id', required: true, example: 1})
  findOneById(@Param('id') siteId: number){
    return this.preclassifierService.findById(siteId)
  }

  @Post('/create')
  @ApiBody({type: CreatePreclassifierDTO})
  create(@Body() createPreclassifierDTO: CreatePreclassifierDTO){
    return this.preclassifierService.create(createPreclassifierDTO)
  }

  @Put('/update')
  @ApiBody({type: UpdatePreclassifierDTO})
  update(@Body() updatePreclassifierDTO:UpdatePreclassifierDTO){
    return this.preclassifierService.update(updatePreclassifierDTO)
  }
}
