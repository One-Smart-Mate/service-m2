import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { CompanyService } from './company.service';
import { CreateCompanyDTO } from './dto/create-company.dto';
import { ApiBody, ApiOkResponse, ApiParam, ApiTags } from '@nestjs/swagger';

@ApiTags('company')
@Controller('company')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Post('/create')
  @ApiBody({ type: CreateCompanyDTO })
  create(@Body() createCompanyDto: CreateCompanyDTO) {
    return this.companyService.create(createCompanyDto);
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
}
