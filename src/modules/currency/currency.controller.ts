import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CurrencyService } from './currency.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@Controller('currency')
@ApiTags('currency')
@ApiBearerAuth()
export class CurrencyController {
  constructor(private readonly currencyService: CurrencyService) {}

  @Get('/all')
  findAll(){
    return this.currencyService.findAll()
  }  
}
