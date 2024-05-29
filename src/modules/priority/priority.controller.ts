import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { PriorityService } from './priority.service';
import { ApiBody, ApiParam, ApiTags } from '@nestjs/swagger';
import { CreatePriorityDTO } from './dto/create.priority.dto';

@ApiTags('priority')
@Controller('priority')
export class PriorityController {
  constructor(private readonly priorityService: PriorityService) {}

  @Get('/all/:siteId')
  @ApiParam({ name: 'siteId', required: true, example: 1 })
  findPrioritiesByCompanyId(@Param('siteId') id: number) {
    return this.priorityService.findCompanyPriorities(+id);
  }

  @Post('/create')
  @ApiBody({ type: CreatePriorityDTO })
  create(@Body() createPriorityDTO: CreatePriorityDTO) {
    return this.priorityService.create(createPriorityDTO);
  }
}
