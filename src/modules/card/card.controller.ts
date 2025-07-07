import { Controller, Get, Post, Body, Param, Put, Query } from '@nestjs/common';
import { CardService } from './card.service';
import { ApiParam, ApiTags, ApiBody } from '@nestjs/swagger';
import { CreateCardDTO } from './models/dto/create.card.dto';
import { UpdateDefinitiveSolutionDTO } from './models/dto/update.definitive.solution.dto';
import { UpdateProvisionalSolutionDTO } from './models/dto/update.provisional.solution.dto';
import { UpdateCardPriorityDTO } from './models/dto/update.card.priority.dto';
import { UpdateCardMechanicDTO } from './models/dto/upate.card.responsible.dto';
import { DiscardCardDto } from './models/dto/discard.card.dto';

@Controller('card')
@ApiTags('card')
export class CardController {
  constructor(private readonly cardService: CardService) {}

  @Get('/all/level-machine/:siteId/:levelMachineId')
  @ApiParam({ name: 'siteId' })
  findByLevelMachineId(
    @Param('siteId') siteId: number,
    @Param('levelMachineId') levelMachineId: string,
  ) {
    return this.cardService.findByLevelMachineId(siteId, levelMachineId);
  }

  @Get('/all/:siteId')
  @ApiParam({ name: 'siteId' })
  findBySiteId(@Param('siteId') siteId: number) {
    return this.cardService.findSiteCards(siteId);
  }
  @Get('/uuid/:uuid')
  @ApiParam({ name: 'uuid' })
  findByCardUUID(@Param('uuid') uuid: string) {
    return this.cardService.findCardByUUID(uuid);
  }
  @Get('/responsible/:responsibleId')
  @ApiParam({ name: 'responsibleId' })
  findByResponsibleId(@Param('responsibleId') responsibleId: number) {
    return this.cardService.findResponsibleCards(responsibleId);
  }

  @Get('/:cardId')
  findByIDAndGetEvidences(@Param('cardId') cardId: number) {
    return this.cardService.findCardByIDAndGetEvidences(cardId);
  }

  @Post('/create')
  create(@Body() createCardDTO: CreateCardDTO) {
    return this.cardService.create(createCardDTO);
  }
  @Put('/update/definitive-solution')
  updateDefinitiveSolution(
    @Body() updateDefinitiveSolutionDTO: UpdateDefinitiveSolutionDTO,
  ) {
    return this.cardService.updateDefinitivesolution(
      updateDefinitiveSolutionDTO,
    );
  }
  @Put('/update/provisional-solution')
  updateProvisionalSolution(
    @Body() updateProvisionalSolutionDTO: UpdateProvisionalSolutionDTO,
  ) {
    return this.cardService.updateProvisionalSolution(
      updateProvisionalSolutionDTO,
    );
  }
  @Get('/all/zone/:superiorId/:siteId')
  @ApiParam({ name: 'superiorId' })
  @ApiParam({ name: 'siteId' })
  getCardsZone(
    @Param('superiorId') superiorId: number,
    @Param('siteId') siteId: number,
  ) {
    return this.cardService.getCardBySuperiorId(superiorId, siteId);
  }

  @Get('/site/preclassifiers/:siteId')
  findSiteCardsGroupedByPreclassifier(
    @Param('siteId') siteId: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.cardService.findSiteCardsGroupedByPreclassifier(
      siteId,
      startDate,
      endDate,
    );
  }

  @Get('/site/methodologies/:siteId')
  findSiteCardsGroupedByMethodology(
    @Param('siteId') siteId: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.cardService.findSiteCardsGroupedByMethodology(
      siteId,
      startDate,
      endDate,
    );
  }

  @Get('/site/areas/:siteId')
  findSiteCardsGroupedByArea(
    @Param('siteId') siteId: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.cardService.findSiteCardsGroupedByArea(
      siteId,
      startDate,
      endDate,
    );
  }
  @Get('/site/areas/more/:siteId')
  findSiteCardsGroupedByAreaMore(
    @Param('siteId') siteId: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.cardService.findSiteCardsGroupedByAreaMore(
      siteId,
      startDate,
      endDate,
    );
  }

  @Get('/site/machines/:siteId')
  findSiteCardsGroupedByMachine(
    @Param('siteId') siteId: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.cardService.findSiteCardsGroupedByMachine(
      siteId,
      startDate,
      endDate,
    );
  }

  @Get('/site/area/machines/:siteId/:areaId')
  findAreaCardsGroupedByMachine(
    @Param('siteId') siteId: number,
    @Param('areaId') areaId: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.cardService.findAreaCardsGroupedByMachine(
      siteId,
      areaId,
      startDate,
      endDate,
    );
  }

  @Get('/site/creators/:siteId')
  findSiteCardsGroupedByCreator(
    @Param('siteId') siteId: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.cardService.findSiteCardsGroupedByCreator(
      siteId,
      startDate,
      endDate,
    );
  }

  @Get('/site/mechanics/:siteId')
  findSiteCardsGroupedByMechanic(
    @Param('siteId') siteId: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.cardService.findSiteCardsGroupedByMechanic(
      siteId,
      startDate,
      endDate,
    );
  }

  @Get('/site/definitive-user/:siteId')
  findSiteCardsGroupedByDefinitveUser(
    @Param('siteId') siteId: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.cardService.findSiteCardsGroupedByDefinitiveUser(
      siteId,
      startDate,
      endDate,
    );
  }

  @Get('/site/weeks/:siteId')
  findSiteCardsGroupedByWeeks(@Param('siteId') siteId: number) {
    return this.cardService.findSiteCardsGroupedByWeeks(siteId);
  }

  @Get('/notes/:cardId')
  findCardNotes(@Param('cardId') cardId: number) {
    return this.cardService.findCardNotes(cardId);
  }

  @Get('/notes/uuid/:cardUUID')
  findCardNotesByUUID(@Param('cardUUID') cardUUID: string) {
    return this.cardService.findCardNotesByUUID(cardUUID);
  }

  @Post('/update/priority')
  updateCardPriority(@Body() updateCardPriorityDTO: UpdateCardPriorityDTO) {
    return this.cardService.updateCardPriority(updateCardPriorityDTO);
  }

  @Post('/update/mechanic')
  updateCardResponsible(
    @Body() updateCardResponsibleDTO: UpdateCardMechanicDTO,
  ) {
    return this.cardService.updateCardMechanic(updateCardResponsibleDTO);
  }

  @Get()
  getCards(
    @Query('siteId') siteId: number,
    @Query('area') area?: string,
    @Query('nodeName') nodeName?: string,
    @Query('preclassifier') preclassifier?: string,
    @Query('mechanic') mechanic?: string,
    @Query('creator') creator?: string,
    @Query('definitiveUser') definitiveUser?: string,
    @Query('cardTypeName') cardTypeName?: string,
  ) {
    return this.cardService.getCards({
      siteId,
      area,
      nodeName,
      preclassifier,
      mechanic,
      creator,
      definitiveUser,
      cardTypeName,
    });
  }
  @Get('by-level/:levelId')
  async getCardsByLevel(
    @Param('levelId') levelId: number,
    @Query('siteId') siteId: number,
  ) {
    return await this.cardService.getCardsByLevelId(siteId, levelId);
  }

  @Get('/user/:userId')
  @ApiParam({ name: 'userId' })
  findUserCards(@Param('userId') userId: number) {
    return this.cardService.findUserCards(userId);
  }

  @Post('/discard')
  @ApiBody({ type: DiscardCardDto })
  discardCard(@Body() dto: DiscardCardDto) {
    return this.cardService.discardCard(dto);
  }

  @Get('/site/discarded-cards/:siteId')
  findSiteDiscardedCardsGroupedByUser(
    @Param('siteId') siteId: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.cardService.findSiteDiscardedCardsGroupedByUser(
      siteId,
      startDate,
      endDate,
    );
  }

  @Get('/fast-password/:siteId/:fastPassword')
  @ApiParam({ name: 'siteId', description: 'Site ID where to search for the user' })
  @ApiParam({ name: 'fastPassword', description: 'Fast password of the user' })
  findCardsByFastPassword(
    @Param('siteId') siteId: number,
    @Param('fastPassword') fastPassword: string,
  ) {
    return this.cardService.findCardsByFastPassword(siteId, fastPassword);
  }
}
