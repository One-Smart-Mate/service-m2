import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { PositionService } from './position.service';
import { ApiParam, ApiTags } from '@nestjs/swagger';
import { CreatePositionDto } from './models/dto/create.position.dto';
import { UpdatePositionDto } from './models/dto/update.position.dto';

@Controller('position')
@ApiTags('position')
export class PositionController {
  constructor(private readonly positionService: PositionService) {}

  @Get('/all')
  findAll() {
    return this.positionService.findAll();
  }
// This endpoint needs a relationship between the positions and site.
// Until then, this endpoint has been commented out to avoid potential errors.
//   @Get('/site/:siteId')
//   @ApiParam({ name: 'siteId', required: true, example: 1 })
//   findAllBySite(@Param('siteId') siteId: number) {
//     return this.positionService.findAllBySite(+siteId);
//   }

  @Get('/user/:userId')
  @ApiParam({ name: 'userId', required: true, example: 1 })
  findAllByUser(@Param('userId') userId: number) {
    return this.positionService.findAllByUser(+userId);
  }
// This endpoint needs a relationship between the positions and site.
// Until then, this endpoint has been commented out to avoid potential errors.
//   @Get('/site-with-users/:siteId')
//   @ApiParam({ name: 'siteId', required: true, example: 1 })
//   findAllBySiteWithUsers(@Param('siteId') siteId: number) {
//     return this.positionService.findAllBySiteWithUsers(+siteId);
//   }

  @Get('/:id')
  @ApiParam({ name: 'id', required: true, example: 1 })
  findById(@Param('id') id: number) {
    return this.positionService.findById(+id);
  }

  @Post('/create')
  create(@Body() createPositionDto: CreatePositionDto) {
    return this.positionService.create(createPositionDto);
  }

  @Put('/update')
  update(@Body() updatePositionDto: UpdatePositionDto) {
    return this.positionService.update(updatePositionDto);
  }

  @Delete('/:id')
  @ApiParam({ name: 'id', required: true, example: 1 })
  delete(@Param('id') id: number) {
    return this.positionService.delete(+id);
  }
}
