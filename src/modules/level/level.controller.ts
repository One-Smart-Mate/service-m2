import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { LevelService } from './level.service';
import { ApiParam, ApiTags } from '@nestjs/swagger';

@Controller('level')
@ApiTags('level')
export class LevelController {
  constructor(private readonly levelService: LevelService) {}

  @Get('/all/:siteId')
  @ApiParam({ name: 'siteId', required: true, example: 1 })
  findPrioritiesByCompanyId(@Param('siteId') siteId: number) {
    return this.levelService.findSiteLevels(+siteId);
  }
}
