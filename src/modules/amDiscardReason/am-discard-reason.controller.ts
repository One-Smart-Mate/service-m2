import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Put,
  Post,
  Query,
} from '@nestjs/common';
import { AmDiscardReasonService } from './am-discard-reason.service';
import { CreateAmDiscardReasonDto } from './models/dto/create-am-discard-reason.dto';
import { UpdateAmDiscardReasonDto } from './models/dto/update-am-discard-reason.dto';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('AM Discard Reasons')
@Controller('am-discard-reasons')
export class AmDiscardReasonController {
  constructor(
    private readonly amDiscardReasonsService: AmDiscardReasonService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new discard reason' })
  @ApiBody({ type: CreateAmDiscardReasonDto })
  @ApiResponse({
    status: 201,
    description: 'Discard reason created successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  create(@Body() createAmDiscardReasonDto: CreateAmDiscardReasonDto) {
    return this.amDiscardReasonsService.create(createAmDiscardReasonDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all discard reasons, optionally filtered by site',
  })
  @ApiQuery({
    name: 'siteId',
    required: false,
    type: 'number',
    description: 'Site ID to filter reasons',
  })
  @ApiResponse({ status: 200, description: 'List of discard reasons' })
  findAll(@Query('siteId') siteId?: string) {
    if (siteId) {
      return this.amDiscardReasonsService.findBySite(+siteId);
    }
    return this.amDiscardReasonsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a discard reason by ID' })
  @ApiParam({ name: 'id', type: 'number', description: 'Discard reason ID' })
  @ApiResponse({ status: 200, description: 'Discard reason found' })
  @ApiResponse({ status: 404, description: 'Discard reason not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.amDiscardReasonsService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a discard reason' })
  @ApiBody({ type: UpdateAmDiscardReasonDto })
  @ApiResponse({
    status: 200,
    description: 'Discard reason updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Discard reason not found' })
  update(
    @Body() updateAmDiscardReasonDto: UpdateAmDiscardReasonDto,
  ) {
    return this.amDiscardReasonsService.update(updateAmDiscardReasonDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a discard reason' })
  @ApiParam({ name: 'id', type: 'number', description: 'Discard reason ID' })
  @ApiResponse({ status: 200, description: 'Discard reason deleted successfully' })
  @ApiResponse({ status: 404, description: 'Discard reason not found' })
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.amDiscardReasonsService.delete(id);
  }
} 