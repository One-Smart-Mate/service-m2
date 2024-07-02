import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { CardTypesService } from './cardTypes.service';
import { ApiBody, ApiParam, ApiTags } from '@nestjs/swagger';
import { CreateCardTypesDTO } from './dto/create.cardTypes.dto';
import { UpdateCardTypesDTO } from './dto/update.cardTypes.dto';
import { plainToClass } from 'class-transformer';
import { FindOneCardTypeDTO } from './dto/findOne.cardType.dto';

@Controller('card-types')
@ApiTags('card-types')
export class CardTypesController {
  constructor(private readonly cardTypesService: CardTypesService) {}

  @Get('/all/:siteId')
  @ApiParam({ name: 'siteId', required: true, example: 1 })
  findCardTypesByCompany(@Param('siteId') siteId: number) {
    return this.cardTypesService.findSiteCardTypes(siteId);
  }

  @Post('/create')
  @ApiBody({type: CreateCardTypesDTO})
  create(@Body() createCardTypesDTO:CreateCardTypesDTO){
    return this.cardTypesService.create(createCardTypesDTO)
  }

  @Put('/update')
  @ApiBody({type: UpdateCardTypesDTO})
  update(@Body() updateCardTypesDTO: UpdateCardTypesDTO){
    return this.cardTypesService.update(updateCardTypesDTO)
  }

  @Get('/card-type/:id')
  @ApiParam({ name: 'id', required: true, example: 1 })
  findoneById(@Param('id') id: number) {
    return this.cardTypesService.findById(id)
  }

  @Get('/catalogs')
  findCardTypesCatalogs() {
    return this.cardTypesService.findAllCatalogs()
  }
}
