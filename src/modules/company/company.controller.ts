import { Controller, Post, Body, Get, Param, Put, Patch } from '@nestjs/common';
import { CompanyService } from './company.service';
import { CreateCompanyDTO } from './models/dto/create-company.dto';
import { ApiBody, ApiOkResponse, ApiParam, ApiTags } from '@nestjs/swagger';
import { UpdateCompanyDTO } from './models/dto/update-company.dto';
import {UpdateStatusDTO } from './models/dto/update-status.dto';

@ApiTags('company')
@Controller('company')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Post('/create')
  @ApiBody({ type: CreateCompanyDTO })
  create(@Body() createCompanyDTO: CreateCompanyDTO) {
    return this.companyService.create(createCompanyDTO);
  }

  @Get('/all')
  findAll() {
    return this.companyService.findAllCompanies();
  }

  @Get('/:plantCode')
  @ApiParam({ name: 'plantCode', required: true, example: 1 })
  findOne(@Param('plantCode') id: number) {
    return this.companyService.findCompanyById(+id);
  }

  @Put('/update')
  @ApiBody({ type: UpdateCompanyDTO })
  updateCompany(@Body() updateCompanyDTO: UpdateCompanyDTO) {
    return this.companyService.update(updateCompanyDTO)
  }

  @Patch('/update/status')
  @ApiBody({type: UpdateStatusDTO})
  updateStatus(@Body() updateStatus: UpdateStatusDTO){
    return this.companyService.updateStatus(updateStatus)
  }
}
