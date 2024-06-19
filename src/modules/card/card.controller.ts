import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CardService } from './card.service';
import { ApiParam, ApiTags } from '@nestjs/swagger';

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
}
