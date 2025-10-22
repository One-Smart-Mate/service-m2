import { Controller, Get, Post, Body, Param, Put, Query } from '@nestjs/common';
import { LevelService } from './level.service';
import { ApiParam, ApiTags, ApiBody, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CreateLevelDto } from './models/dto/create.level.dto';
import { UpdateLevelDTO } from './models/dto/update.level.dto';
import { MoveLevelDto } from './models/dto/move.level.dto';
import { CloneLevelDto } from './models/dto/clone.level.dto';

@Controller('level')
@ApiTags('level')
@ApiBearerAuth()
export class LevelController {
  constructor(private readonly levelService: LevelService) {}

  @Get('/all/:siteId')
  @ApiParam({ name: 'siteId', required: true, example: 1 })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (default: 1)', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page (default: 50)', example: 50 })
  findActiveLevelsByCompanyId(
    @Param('siteId') siteId: number,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.levelService.findSiteActiveLevels(+siteId, page, limit);
  }
  @Get('/all/:siteId/location')
  @ApiParam({ name: 'siteId', required: true, example: 1 })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (default: 1)', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page (default: 50)', example: 50 })
  async findActiveLevelsByCompanyIdWithLocation(
    @Param('siteId') siteId: number,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return await this.levelService.findActiveLevelsWithCardLocation(+siteId, page, limit);
  }
  @Get('/site/:siteId')
  @ApiParam({ name: 'siteId', required: true, example: 1 })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (default: 1)', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page (default: 50)', example: 50 })
  findLevelsByCompanyId(
    @Param('siteId') siteId: number,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.levelService.findSiteLevels(+siteId, page, limit);
  }
  @Post('/create')
  create(@Body() createLevelDTO: CreateLevelDto) {
    return this.levelService.create(createLevelDTO);
  }
  @Put('/update')
  update(@Body() updateLevelDTO: UpdateLevelDTO) {
    return this.levelService.update(updateLevelDTO);
  }

  @Get('/:levelId')
  @ApiParam({ name: 'levelId', required: true, example: 1 })
  findById(@Param('levelId') levelId: number) {
    return this.levelService.findById(+levelId);
  }

  @Get('/path/:levelId')
  @ApiParam({ name: 'levelId', required: true, example: 1, description: 'Level ID' })
  getLevelPath(@Param('levelId') levelId: number) {
    return this.levelService.getLevelPathById(+levelId);
  }

  @Put('/move')
  @ApiBody({
    type: MoveLevelDto,
    description: 'Move a level to a new position in the hierarchy. The children are automatically reassigned.'
  })
  moveLevel(@Body() moveLevelDto: MoveLevelDto) {
    return this.levelService.moveLevel(moveLevelDto);
  }

  @Get('/machine/:siteId/:machineId')
  @ApiParam({ name: 'siteId', required: true, example: 1, description: 'Site ID' })
  @ApiParam({ name: 'machineId', required: true, example: 'ABC123', description: 'Level Machine ID' })
  async findByMachineIdWithPath(
    @Param('siteId') siteId: number,
    @Param('machineId') machineId: string
  ) {
    return this.levelService.findByMachineIdWithPath(+siteId, machineId);
  }

  @Get('/tree/:siteId/lazy')
  @ApiParam({ name: 'siteId', required: true, example: 1, description: 'Site ID' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (default: 1)', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page (default: 50)', example: 50 })
  async getLevelTreeLazy(
    @Param('siteId') siteId: number,
    @Query('parentId') parentId?: number,
    @Query('depth') depth: number = 2,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.levelService.getLevelTreeLazy(+siteId, parentId, depth, page, limit);
  }

  @Get('/tree/:siteId/children/:parentId')
  @ApiParam({ name: 'siteId', required: true, example: 1, description: 'Site ID' })
  @ApiParam({ name: 'parentId', required: true, example: 1, description: 'Parent Level ID' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (default: 1)', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page (default: 50)', example: 50 })
  async getChildrenLevels(
    @Param('siteId') siteId: number,
    @Param('parentId') parentId: number,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.levelService.getChildrenLevels(+siteId, +parentId, page, limit);
  }

  @Get('/stats/:siteId')
  @ApiParam({ name: 'siteId', required: true, example: 1, description: 'Site ID' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (default: 1)', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page (default: 50)', example: 50 })
  async getLevelStats(
    @Param('siteId') siteId: number,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.levelService.getLevelStats(+siteId, page, limit);
  }

  @Post('/clone')
  @ApiBody({
    type: CloneLevelDto,
    description: 'Clone a level with all its descendants (children, grandchildren, etc.). The cloned level will be a sibling of the original (same parent). All cloned names will have " (Copia)" suffix.'
  })
  async cloneLevel(@Body() cloneLevelDto: CloneLevelDto) {
    return this.levelService.cloneLevel(cloneLevelDto.levelId);
  }
}
