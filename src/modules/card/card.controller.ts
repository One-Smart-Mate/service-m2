import { Controller, Get, Post, Body, Patch, Param, Delete, Put } from '@nestjs/common';
import { CardService } from './card.service';
import { ApiParam, ApiTags } from '@nestjs/swagger';
import { CreateCardDTO } from './models/dto/create-card.dto';
import { UpdateDefinitiveSolutionDTO } from './models/dto/update.definitive.solution.dto';

@Controller('card')
@ApiTags('card')
export class CardController {
  constructor(private readonly cardService: CardService) {}

  @Get('/all/:siteId')
  @ApiParam({name: 'siteId'})
  findBySiteId(@Param('siteId') siteId: number){
    return this.cardService.findSiteCards(siteId)
  }
  @Get('/responsible/:responsibleId')
  @ApiParam({name: 'responsibleId'})
  findByResponsibleId(@Param('responsibleId') responsibleId: number){
    return this.cardService.findSiteCards(responsibleId)
  }

  @Get('/:cardId')
  findByIDAndGetEvidences(@Param('cardId') cardId: number){
    return this.cardService.findCardByIDAndGetEvidences(cardId)
  }

  @Post('/create')
  create(@Body() createCardDTO: CreateCardDTO){
    return this.cardService.create(createCardDTO)
  }
  @Put('/update/definitive-solution')
  updateDefinitiveSolution(@Body() updateDefinitiveSolutionDTO: UpdateDefinitiveSolutionDTO){
    return this.cardService.updateDefinitivesolution(updateDefinitiveSolutionDTO)
  }

  @Get('/all/zone/:superiorId')
  @ApiParam({name: 'superiorId'})
  getCardsZone(@Param('superiorId') superiorId: number){
    return this.cardService.getCardBySuperiorId(superiorId)
  }
}
