import { Controller, Get, Post, Body, Param, Put } from '@nestjs/common';
import { LevelService } from './level.service';
import { ApiParam, ApiTags } from '@nestjs/swagger';
import { CreateLevelDto } from './models/dto/create.level.dto';
import { UpdateLevelDTO } from './models/dto/update.level.dto';

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
  @ApiParam({ name: 'levelId', required: true, example: 1, description: 'ID del nivel para obtener su ruta' })
  getLevelPath(@Param('levelId') levelId: number) {
    return this.levelService.getLevelPathById(+levelId);
  }
}
