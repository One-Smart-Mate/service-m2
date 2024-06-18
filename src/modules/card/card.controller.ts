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
}
