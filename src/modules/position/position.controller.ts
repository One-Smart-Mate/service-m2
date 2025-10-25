import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
} from '@nestjs/common';
import { PositionService } from './position.service';
import { ApiParam, ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CreatePositionDto } from './models/dto/create.position.dto';
import { UpdatePositionDto } from './models/dto/update.position.dto';
import { UpdatePositionOrderDTO } from './models/dto/update-order.dto';
import { UsersService } from '../users/users.service';


@Controller('position')
@ApiTags('position')
@ApiBearerAuth()
export class PositionController {
  constructor(
    private readonly positionService: PositionService,
    private readonly usersService: UsersService,
  ) {}

  @Get('/all')
  findAll() {
    return this.positionService.findAll();
  }

  @Get('/site/:siteId')
  @ApiParam({ name: 'siteId', required: true, example: 1 })
  async findBySiteId(@Param('siteId') siteId: number) {
    try {
      const positions = await this.positionService.findBySiteId(+siteId);

      if (!Array.isArray(positions)) {
        return [];
      }

      // Get user IDs for each position
      const positionsWithUsers = await Promise.all(
        positions.map(async (position) => {
          try {
            const userPositions = await this.usersService.findUsersByPositionId(position.id);
            const userIds = Array.isArray(userPositions) ? userPositions.map(user => user.id) : [];
            return {
              ...position,
              userIds
            };
          } catch (error) {
            return {
              ...position,
              userIds: []
            };
          }
        })
      );

      return positionsWithUsers;
    } catch (error) {
      return [];
    }
  }

  @Get('/site/:siteId/level/:levelId')
  @ApiParam({ name: 'siteId', required: true, example: 1 })
  @ApiParam({ name: 'levelId', required: true, example: 2 })
  findBySiteIdAndLevelId(
    @Param('siteId') siteId: number,
    @Param('levelId') levelId: number,
  ) {
    return this.positionService.findBySiteIdAndLevelId(+siteId, +levelId);
  }

  @Get('/user/:userId')
  @ApiParam({ name: 'userId', required: true, example: 1 })
  findAllByUser(@Param('userId') userId: number) {
    return this.positionService.findAllByUser(+userId);
  }

  @Get('/area/:areaId')
  @ApiParam({ name: 'areaId', required: true, example: 3 })
  findByAreaId(@Param('areaId') areaId: number) {
    return this.positionService.findByAreaId(+areaId);
  }

  @Get('/:positionId/users')
  @ApiParam({ name: 'positionId', required: true, example: 1 })
  async findUsersByPosition(@Param('positionId') positionId: number) {
    return this.usersService.findUsersByPositionId(positionId);
  }

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

  @Put('/update-order')
  @ApiOperation({ summary: 'Update position order' })
  updateOrder(@Body() updateOrderDto: UpdatePositionOrderDTO) {
    return this.positionService.updateOrder(updateOrderDto);
  }
}
