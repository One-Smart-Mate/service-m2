import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Put,
} from '@nestjs/common';
import { PriorityService } from './priority.service';
import { ApiBody, ApiParam, ApiTags } from '@nestjs/swagger';
import { CreatePriorityDTO } from './models/dto/create.priority.dto';
import { UpdatePriorityDTO } from './models/dto/update.priority.dto';

@ApiTags('priority')
@Controller('priority')
export class PriorityController {
  constructor(private readonly priorityService: PriorityService) {}

  @Get('/all/:siteId')
  @ApiParam({ name: 'siteId', required: true, example: 1 })
  findActivePrioritiesByCompanyId(@Param('siteId') siteId: number) {
    return this.priorityService.findSiteActivePriorities(+siteId);
  }

  @Get('/site/:siteId')
  @ApiParam({ name: 'siteId', required: true, example: 1 })
  findPrioritiesByCompanyId(@Param('siteId') siteId: number) {
    return this.priorityService.findSitePriorities(+siteId);
  }

  @Post('/create')
  @ApiBody({ type: CreatePriorityDTO })
  create(@Body() createPriorityDTO: CreatePriorityDTO) {
    return this.priorityService.create(createPriorityDTO);
  }

  @Put('/update')
  @ApiBody({ type: UpdatePriorityDTO })
  update(@Body() updatePriorityDTO: UpdatePriorityDTO) {
    return this.priorityService.update(updatePriorityDTO);
  }
  @Get('/one/:id')
  @ApiParam({ name: 'id', example: 1 })
  findOneById(@Param('id') id: number) {
    return this.priorityService.findById(id);
  }
}
