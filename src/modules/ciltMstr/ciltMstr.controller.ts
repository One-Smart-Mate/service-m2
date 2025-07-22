import { Controller, Get, Post, Put, Param, Body, Delete, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { CiltMstrService } from './ciltMstr.service';
import { CreateCiltMstrDTO } from './models/dto/create.ciltMstr.dto';
import { UpdateCiltMstrDTO } from './models/dto/update.ciltMstr.dto';
import { FindByUserDTO } from './models/dto/find-by-user.dto';
import { FindBySiteDTO } from './models/dto/find-by-site.dto';
import { UpdateCiltOrderDTO } from './models/dto/update-order.dto';

@ApiTags('Cilt Master')
@ApiBearerAuth()
@Controller('cilt-mstr')
export class CiltMstrController {
  constructor(private readonly ciltMstrService: CiltMstrService) {}

  @Get("/all")
  @ApiOperation({ summary: 'Get all CILTs' })
  async findAll() {
    return await this.ciltMstrService.findAll();
  }

  @Get('site/:siteId')
  @ApiOperation({ summary: 'Get all CILTs by site ID' })
  @ApiParam({ name: 'siteId', type: 'number', description: 'Site ID' })
  async findBySiteId(@Param('siteId') siteId: number) {
    return await this.ciltMstrService.findBySiteId(siteId);
  }

  @Post('user')
  @ApiOperation({ summary: 'Get all CILTs related to positions assigned to a user' })
  @ApiBody({ type: FindByUserDTO })
  async findByUserId(@Body() findByUserDto: FindByUserDTO, @Request() req: any) {
    const userTimezone = req.user?.timezone;    
    return await this.ciltMstrService.findCiltsByUserId(
      findByUserDto.userId,
      findByUserDto.date,
      userTimezone
    );
  }
  
  @Get('user-read-only/:userId/:date')
  @ApiOperation({ summary: 'Get all CILTs related to positions assigned to a user' })
  @ApiParam({ name: 'userId', type: 'number', description: 'User ID' })
  @ApiParam({ name: 'date', type: 'string', description: 'Date in format YYYY-MM-DD' })
  async findCiltsByUserIdReadOnly(
    @Param('userId') userId: number, 
    @Param('date') date: string,
    @Request() req: any
  ) {
    const userTimezone = req.user?.timezone;
    return await this.ciltMstrService.findCiltsByUserIdReadOnly(
      userId,
      date,
      userTimezone
    );
  }

  @Post('site')
  @ApiOperation({ summary: 'Get all CILTs and generate executions for all users in a site for a specific date' })
  @ApiBody({ type: FindBySiteDTO })
  async findCiltsBySiteId(@Body() findBySiteDto: FindBySiteDTO) {
    return await this.ciltMstrService.findCiltsBySiteId(
      findBySiteDto.siteId,
      findBySiteDto.date
    );
  }

  @Get('details/:ciltMstrId')
  @ApiOperation({ summary: 'Get detailed information of a CILT including its sequences and executions' })
  @ApiParam({ name: 'ciltMstrId', type: 'number', description: 'CILT Master ID' })
  async findCiltDetailsById(@Param('ciltMstrId') ciltMstrId: number) {
    return await this.ciltMstrService.findCiltDetailsById(ciltMstrId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a CILT by ID' })
  @ApiParam({ name: 'id', type: 'number', description: 'CILT ID' })
  async findById(@Param('id') id: number) {
    return await this.ciltMstrService.findById(id);
  }

  @Post("/create")
  @ApiOperation({ summary: 'Create a new CILT' })
  @ApiBody({ type: CreateCiltMstrDTO })
  async create(@Body() createCiltDto: CreateCiltMstrDTO) {
    return await this.ciltMstrService.create(createCiltDto);
  }

  @Put("/update")
  @ApiOperation({ summary: 'Update a CILT' })
  @ApiBody({ type: UpdateCiltMstrDTO })
  async update(@Body() updateCiltDto: UpdateCiltMstrDTO) {
    return await this.ciltMstrService.update(updateCiltDto);
  }

  @Put("/update-order")
  @ApiOperation({ summary: 'Update CILT order' })
  @ApiBody({ type: UpdateCiltOrderDTO })
  async updateOrder(@Body() updateOrderDto: UpdateCiltOrderDTO) {
    return await this.ciltMstrService.updateOrder(updateOrderDto);
  }

  @Post('/clone/:id')
  @ApiOperation({ summary: 'Clone a CILT master with its sequences' })
  @ApiParam({ name: 'id', type: 'number', description: 'CILT Master ID to clone' })
  async cloneCiltMaster(@Param('id') id: number) {
    return await this.ciltMstrService.cloneCiltMaster(id);
  }

  @Delete('/delete/:id')
  @ApiOperation({ summary: 'Delete a CILT master' })
  @ApiParam({ name: 'id', type: 'number', description: 'CILT Master ID to delete' })
  async delete(@Param('id') id: number) {
    return await this.ciltMstrService.softDelete(id);
  }
}
