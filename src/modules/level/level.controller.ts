import { Controller, Get, Post, Body, Param, Put } from '@nestjs/common';
import { LevelService } from './level.service';
import { ApiParam, ApiTags, ApiBody } from '@nestjs/swagger';
import { CreateLevelDto } from './models/dto/create.level.dto';
import { UpdateLevelDTO } from './models/dto/update.level.dto';
import { MoveLevelDto } from './models/dto/move.level.dto';

@Controller('level')
@ApiTags('level')
export class LevelController {
  constructor(private readonly levelService: LevelService) {}

  @Get('/all/:siteId')
  @ApiParam({ name: 'siteId', required: true, example: 1 })
  findActiveLevelsByCompanyId(@Param('siteId') siteId: number) {
    return this.levelService.findSiteActiveLevels(+siteId);
  }
  @Get('/all/:siteId/location')
  @ApiParam({ name: 'siteId', required: true, example: 1 })
  async findActiveLevelsByCompanyIdWithLocation(@Param('siteId') siteId: number) {
    return await this.levelService.findActiveLevelsWithCardLocation(+siteId);
  }
  @Get('/site/:siteId')
  @ApiParam({ name: 'siteId', required: true, example: 1 })
  findLevelsByCompanyId(@Param('siteId') siteId: number) {
    return this.levelService.findSiteLevels(+siteId);
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
}
