import { Controller, Get, Post, Put, Param, Body } from '@nestjs/common';
import { CiltService } from './cilt.service';
import { CreateCiltDto } from './models/dto/create.cilt.dto';
import { UpdateCiltDto } from './models/dto/update.cilt.dto';

@Controller('cilt')
export class CiltController {
  constructor(private readonly ciltService: CiltService) {}

  @Get()
  async findAll() {
    return await this.ciltService.findAll();
  }

  @Get(':id')
  async findById(@Param('id') id: number) {
    return await this.ciltService.findById(id);
  }

  @Post()
  async create(@Body() createCiltDto: CreateCiltDto) {
    return await this.ciltService.create(createCiltDto);
  }

  @Put()
  async update(@Body() updateCiltDto: UpdateCiltDto) {
    return await this.ciltService.update(updateCiltDto);
  }
}
