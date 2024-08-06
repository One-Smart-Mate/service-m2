import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
} from '@nestjs/common';
import { CardService } from './card.service';
import { ApiParam, ApiTags } from '@nestjs/swagger';
import { CreateCardDTO } from './models/dto/create-card.dto';
import { UpdateDefinitiveSolutionDTO } from './models/dto/update.definitive.solution.dto';
import { UpdateProvisionalSolutionDTO } from './models/dto/update.provisional.solution.dto';

@Controller('card')
@ApiTags('card')
export class CardController {
  constructor(private readonly cardService: CardService) {}

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
  findSiteCardsGroupedByPreclassifier(@Param('siteId') siteId: number) {
    return this.cardService.findSiteCardsGroupedByPreclassifier(siteId);
  }

  @Get('/site/methodologies/:siteId')
  findSiteCardsGroupedByMethodology(@Param('siteId') siteId: number) {
    return this.cardService.findSiteCardsGroupedByMethodology(siteId);
  }

  @Get('/site/areas/:siteId')
  findSiteCardsGroupedByArea(@Param('siteId') siteId: number) {
    return this.cardService.findSiteCardsGroupedByArea(siteId);
  }

  @Get('/site/creators/:siteId')
  findSiteCardsGroupedByCreator(@Param('siteId') siteId: number) {
    return this.cardService.findSiteCardsGroupedByCreator(siteId);
  }

  @Get('/site/weeks/:siteId')
  findSiteCardsGroupedByWeeks(@Param('siteId') siteId: number) {
    return this.cardService.findSiteCardsGroupedByWeeks(siteId);
  }
}
