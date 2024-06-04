import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { PreclassifierService } from './preclassifier.service';
import { CreatePreclassifierDto } from './models/dto/create-preclassifier.dto';
import { UpdatePreclassifierDto } from './models/dto/update-preclassifier.dto';
import { ApiParam, ApiTags } from '@nestjs/swagger';

@ApiTags('preclassifier')
@Controller('preclassifier')
export class PreclassifierController {
  constructor(private readonly preclassifierService: PreclassifierService) {}

  @Get('/all/:cardTypesId')
  @ApiParam({name:'cardTypesId', required: true, example: 1})
  findAllByCardTypes(@Param('cardTypesId') cardTypeId: number){
    return this.preclassifierService.findCardTypesPreclassifiers(cardTypeId)
  }
}
