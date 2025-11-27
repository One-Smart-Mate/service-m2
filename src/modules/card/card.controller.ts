import { Controller, Get, Post, Body, Param, Put, Query, UseGuards } from '@nestjs/common';
import { CardService } from './card.service';
import { ApiParam, ApiTags, ApiBody, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '../auth/guard/auth.guard';
import { SiteAccessGuard } from '../auth/guard/site-access.guard';
import { CreateCardDTO } from './models/dto/create.card.dto';
import { UpdateDefinitiveSolutionDTO } from './models/dto/update.definitive.solution.dto';
import { UpdateProvisionalSolutionDTO } from './models/dto/update.provisional.solution.dto';
import { UpdateCardPriorityDTO } from './models/dto/update.card.priority.dto';
import { UpdateCardMechanicDTO } from './models/dto/upate.card.responsible.dto';
import { DiscardCardDto } from './models/dto/discard.card.dto';
import {
  CardReportGroupedDTO,
  CardReportDetailsDTO,
  CardsByMachineDTO,
  CardsByComponentsDTO,
  CardReportStackedDTO,
  CardTimeSeriesDTO,
} from './models/dto/card.report.dto';

@Controller('card')
@UseGuards(AuthGuard, SiteAccessGuard)
@ApiTags('card')
@ApiBearerAuth()
export class CardController {
  constructor(private readonly cardService: CardService) {}

  @Get('/all/level-machine/:siteId/:levelMachineId')
  @ApiParam({ name: 'siteId' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (default: 1)', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page (default: 50)', example: 50 })
  async findByLevelMachineId(
    @Param('siteId') siteId: number,
    @Param('levelMachineId') levelMachineId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 50;
    const result = await this.cardService.findByLevelMachineId(siteId, levelMachineId, pageNum, limitNum);

    // Legacy support: if no pagination params, return only the array
    if (!page && !limit) {
      return result.data;
    }

    // New format: return full pagination object
    return result;
  }

  @Get('/all/:siteId')
  @ApiParam({ name: 'siteId' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (default: 1)', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page (default: 50)', example: 50 })
  async findBySiteId(
    @Param('siteId') siteId: number,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 50;
    const result = await this.cardService.findSiteCards(siteId, pageNum, limitNum);

    // Legacy support: if no pagination params, return only the array
    if (!page && !limit) {
      return result.data;
    }

    // New format: return full pagination object
    return result;
  }

  @Get('/all/:siteId/paginated')
  @ApiParam({ name: 'siteId' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (default: 1)', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page (default: 50)', example: 50 })
  @ApiQuery({ name: 'searchText', required: false, description: 'General search text' })
  @ApiQuery({ name: 'cardNumber', required: false, description: 'Card number filter' })
  @ApiQuery({ name: 'location', required: false, description: 'Location filter' })
  @ApiQuery({ name: 'levelMachineId', required: false, description: 'Level Machine ID filter' })
  @ApiQuery({ name: 'creator', required: false, description: 'Creator name filter' })
  @ApiQuery({ name: 'resolver', required: false, description: 'Resolver/Responsible filter' })
  @ApiQuery({ name: 'dateFilterType', required: false, description: 'Date filter type (creation or due)' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (ISO format)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date (ISO format)' })
  @ApiQuery({ name: 'sortOption', required: false, description: 'Sort option' })
  @ApiQuery({ name: 'status', required: false, description: 'Card status filter (comma-separated: A,C,R)', example: 'A' })
  @ApiQuery({ name: 'userId', required: false, description: 'User ID for filtering my cards' })
  @ApiQuery({ name: 'myCards', required: false, description: 'Filter cards created by or assigned to user', example: 'true' })
  findBySiteIdPaginated(
    @Param('siteId') siteId: number,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('searchText') searchText?: string,
    @Query('cardNumber') cardNumber?: string,
    @Query('location') location?: string,
    @Query('levelMachineId') levelMachineId?: string,
    @Query('creator') creator?: string,
    @Query('resolver') resolver?: string,
    @Query('dateFilterType') dateFilterType?: 'creation' | 'due' | '',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('sortOption') sortOption?: 'dueDate-asc' | 'dueDate-desc' | 'creationDate-asc' | 'creationDate-desc' | '',
    @Query('status') status?: string,
    @Query('userId') userId?: number,
    @Query('myCards') myCards?: string,
  ) {
    return this.cardService.findSiteCardsPaginated(
      siteId,
      page || 1,
      limit || 50,
      {
        searchText,
        cardNumber,
        location,
        levelMachineId,
        creator,
        resolver,
        dateFilterType,
        startDate,
        endDate,
        sortOption,
        status,
        userId,
        myCards: myCards === 'true',
      }
    );
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

  @Get('/count/:siteId')
  @ApiParam({ name: 'siteId', description: 'Site ID' })
  countCards(@Param('siteId') siteId: number) {
    return this.cardService.countSiteCards(siteId);
  }

  @Get('/:cardId')
  findByIDAndGetEvidences(@Param('cardId') cardId: number) {
    return this.cardService.findCardByIDAndGetEvidences(cardId);
  }

  @Post('/create')
  create(@Body() createCardDTO: CreateCardDTO) {
    return this.cardService.createOptimized(createCardDTO);
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
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Card status filter (comma-separated: A,C,R)',
    example: 'A'
  })
  findSiteCardsGroupedByPreclassifier(
    @Param('siteId') siteId: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('status') status?: string,
  ) {
    return this.cardService.findSiteCardsGroupedByPreclassifier(
      siteId,
      startDate,
      endDate,
      status
    );
  }

  @Get('/site/methodologies/:siteId')
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Card status filter (comma-separated: A,C,R)',
    example: 'A'
  })
  findSiteCardsGroupedByMethodology(
    @Param('siteId') siteId: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('status') status?: string,
  ) {
    return this.cardService.findSiteCardsGroupedByMethodology(
      siteId,
      startDate,
      endDate,
      status,
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
  @ApiParam({ name: 'siteId', description: 'Site ID', example: 1 })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date filter (YYYY-MM-DD)', example: '2025-01-01' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date filter (YYYY-MM-DD)', example: '2025-09-05' })
  @ApiQuery({ name: 'status', required: false, description: 'Card status filter (comma-separated: A,C,R)', example: 'A' })
  findSiteCardsGroupedByAreaMore(
    @Param('siteId') siteId: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('status') status?: string,
  ) {
    return this.cardService.findSiteCardsGroupedByAreaMore(
      siteId,
      startDate,
      endDate,
      status,
    );
  }

  @Get('/site/machines/:siteId')
  @ApiParam({ name: 'siteId', description: 'Site ID', example: 1 })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date filter (YYYY-MM-DD)', example: '2025-01-01' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date filter (YYYY-MM-DD)', example: '2025-09-05' })
  @ApiQuery({ name: 'status', required: false, description: 'Card status filter (comma-separated: A,C,R)', example: 'A' })
  findSiteCardsGroupedByMachine(
    @Param('siteId') siteId: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('status') status?: string,
  ) {
    return this.cardService.findSiteCardsGroupedByMachine(
      siteId,
      startDate,
      endDate,
      status,
    );
  }

  @Get('/site/area/machines/:siteId/:areaId')
  @ApiParam({ name: 'siteId', description: 'Site ID', example: 1 })
  @ApiParam({ name: 'areaId', description: 'Area ID', example: 1 })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date filter (YYYY-MM-DD)', example: '2025-01-01' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date filter (YYYY-MM-DD)', example: '2025-09-05' })
  @ApiQuery({ name: 'status', required: false, description: 'Card status filter (comma-separated: A,C,R)', example: 'A' })
  findAreaCardsGroupedByMachine(
    @Param('siteId') siteId: number,
    @Param('areaId') areaId: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('status') status?: string,
  ) {
    return this.cardService.findAreaCardsGroupedByMachine(
      siteId,
      areaId,
      startDate,
      endDate,
      status,
    );
  }

  @Get('/site/creators/:siteId')
  @ApiParam({ name: 'siteId', description: 'Site ID', example: 1  })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date filter (YYYY-MM-DD)', example: '2025-01-01' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date filter (YYYY-MM-DD)', example: '2025-09-05' })
  @ApiQuery({ name: 'status', required: false, description: 'Card status filter (comma-separated: A,C,R)', example: 'A' })
  findSiteCardsGroupedByCreator(
    @Param('siteId') siteId: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('status') status?: string,
  ) {
    return this.cardService.findSiteCardsGroupedByCreator(
      siteId,
      startDate,
      endDate,
      status,
    );
  }

  @Get('/site/mechanics/:siteId')
  @ApiParam({ name: 'siteId', description: 'Site ID', example: 1 })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date filter (YYYY-MM-DD)', example: '2025-01-01' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date filter (YYYY-MM-DD)', example: '2025-09-05' })
  @ApiQuery({ name: 'status', required: false, description: 'Card status filter (comma-separated: A,C,R)', example: 'A' })
  findSiteCardsGroupedByMechanic(
    @Param('siteId') siteId: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('status') status?: string,
  ) {
    return this.cardService.findSiteCardsGroupedByMechanic(
      siteId,
      startDate,
      endDate,
      status,
    );
  }

  @Get('/site/definitive-user/:siteId')
  @ApiQuery({ 
    name: 'status', 
    required: false, 
    description: 'Card status filter - Note: Always uses C,R regardless of parameter', 
    example: 'C,R' 
  })
  findSiteCardsGroupedByDefinitveUser(
    @Param('siteId') siteId: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('status') status?: string,
  ) {
    // Always use C,R status for definitive users regardless of parameter
    console.log(status)
    return this.cardService.findSiteCardsGroupedByDefinitiveUser(
      siteId,
      startDate,
      endDate,
      'C,R',
    );
  }

  @Get('/site/weeks/:siteId')
  @ApiParam({ name: 'siteId', description: 'Site ID', example: 1 })
  @ApiQuery({ name: 'status', required: false, description: 'Card status filter (comma-separated: A,C,R)', example: 'A' })
  findSiteCardsGroupedByWeeks(
    @Param('siteId') siteId: number,
    @Query('status') status?: string,
  ) {
    return this.cardService.findSiteCardsGroupedByWeeks(siteId, status);
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

  @Post('/update/custom-due-date')
  updateCardCustomDueDate(
    @Body() body: { cardId: number; customDueDate: string; idOfUpdatedBy: number }
  ) {
    return this.cardService.updateCardCustomDueDate(body);
  }

  @Get()
  @ApiQuery({ 
    name: 'status', 
    required: false, 
    description: 'Card status filter (comma-separated: A,C,R)', 
    example: 'A' 
  })
  getCards(
    @Query('siteId') siteId: number,
    @Query('area') area?: string,
    @Query('nodeName') nodeName?: string,
    @Query('preclassifier') preclassifier?: string,
    @Query('mechanic') mechanic?: string,
    @Query('creator') creator?: string,
    @Query('definitiveUser') definitiveUser?: string,
    @Query('cardTypeName') cardTypeName?: string,
    @Query('status') status?: string,
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
      status,
    });
  }
  @Get('by-level/:levelId')
  @ApiQuery({ name: 'page', required: false, description: 'Page number (default: 1)', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page (default: 50)', example: 50 })
  async getCardsByLevel(
    @Param('levelId') levelId: number,
    @Query('siteId') siteId: number,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 50;
    const result = await this.cardService.getCardsByLevelId(siteId, levelId, pageNum, limitNum);

    // Legacy support: if no pagination params, return only the array
    if (!page && !limit) {
      return result.data;
    }

    // New format: return full pagination object
    return result;
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

  @Get('/site/calendar/:siteId')
  @ApiParam({ name: 'siteId' })
  @ApiQuery({ name: 'startDate', required: true })
  @ApiQuery({ name: 'endDate', required: true })
  @ApiQuery({ name: 'status', required: false })
  findCardsForCalendar(
    @Param('siteId') siteId: number,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('status') status?: string,
  ) {
    return this.cardService.findCardsForCalendar(siteId, startDate, endDate, status);
  }

  @Get('/site/discarded-cards/:siteId')
  @ApiParam({ name: 'siteId', description: 'Site ID', example: 1 })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date filter (YYYY-MM-DD)', example: '2025-01-01' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date filter (YYYY-MM-DD)', example: '2025-09-05' })
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

  // Advanced Card Reports Endpoints
  @Post('/report/grouped')
  @ApiBody({ type: CardReportGroupedDTO })
  getCardReportGrouped(@Body() dto: CardReportGroupedDTO) {
    return this.cardService.getCardReportGrouped(dto);
  }

  @Post('/report/details')
  @ApiBody({ type: CardReportDetailsDTO })
  getCardReportDetails(@Body() dto: CardReportDetailsDTO) {
    return this.cardService.getCardReportDetails(dto);
  }

  @Post('/report/by-machine')
  @ApiBody({ type: CardsByMachineDTO })
  getCardsByMachine(@Body() dto: CardsByMachineDTO) {
    return this.cardService.getCardsByMachine(dto);
  }

  @Post('/report/by-components')
  @ApiBody({ type: CardsByComponentsDTO })
  getCardsByComponents(@Body() dto: CardsByComponentsDTO) {
    return this.cardService.getCardsByComponents(dto);
  }

  @Post('/report/stacked')
  @ApiBody({ type: CardReportStackedDTO })
  getCardReportStacked(@Body() dto: CardReportStackedDTO) {
    return this.cardService.getCardReportStacked(dto);
  }

  @Post('/report/time-series')
  @ApiBody({ type: CardTimeSeriesDTO })
  getCardTimeSeries(@Body() dto: CardTimeSeriesDTO) {
    return this.cardService.getCardTimeSeries(dto);
  }
}
