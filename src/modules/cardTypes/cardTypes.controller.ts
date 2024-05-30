import { Controller, Get, Param } from '@nestjs/common';
import { CardTypesService } from './cardTypes.service';
import { ApiParam, ApiTags } from '@nestjs/swagger';

@Controller('cardTypes')
@ApiTags('cardTypes')
export class CardTypesController {
  constructor(private readonly cardTypesService: CardTypesService) {}

  @Get('/all/:siteId')
  @ApiParam({ name: 'siteId', required: true, example: 1 })
  findCardTypesByCompany(@Param('siteId') companyId: number) {
    return this.cardTypesService.findCompanyCardTypes(companyId);
  }
}
