import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Request,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SITE_ADMIN_ROLES } from 'src/common/auth/roles.constants';
import { RequireRoles } from 'src/common/decorators/roles.decorator';
import { OplTrainingService } from './oplTraining.service';
import { AssignOplToPositionDTO } from './models/dto/assignOplToPosition.dto';
import { SelfCompleteTrainingDTO } from './models/dto/selfCompleteTraining.dto';
import { ValidateTrainingDTO } from './models/dto/validateTraining.dto';

@ApiTags('opl-training')
@ApiBearerAuth()
@Controller('opl-training')
export class OplTrainingController {
  constructor(private readonly oplTrainingService: OplTrainingService) {}

  // --- Assignment (admin) ---

  @Post('assign')
  @RequireRoles(...SITE_ADMIN_ROLES)
  @ApiOperation({ summary: 'Assign an OPL (course) to a position' })
  @ApiResponse({ status: 201, description: 'OPL assigned to the position' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  assign(@Body() dto: AssignOplToPositionDTO) {
    return this.oplTrainingService.assignOplToPosition(dto);
  }

  @Delete('assign/:id')
  @RequireRoles(...SITE_ADMIN_ROLES)
  @ApiOperation({ summary: 'Remove an OPL<->position assignment' })
  @ApiParam({ name: 'id', type: 'number', description: 'Assignment id' })
  @ApiResponse({ status: 200, description: 'Assignment removed' })
  removeAssignment(@Param('id', ParseIntPipe) id: number) {
    return this.oplTrainingService.removeAssignment(id);
  }

  @Get('positions/opl/:oplId')
  @ApiOperation({ summary: 'List positions an OPL is assigned to' })
  @ApiParam({ name: 'oplId', type: 'number', description: 'OPL id' })
  @ApiResponse({ status: 200, description: 'List of assigned positions' })
  findPositionsByOpl(@Param('oplId', ParseIntPipe) oplId: number) {
    return this.oplTrainingService.findPositionsByOpl(oplId);
  }

  // --- Matrix (admin) ---

  @Get('matrix/site/:siteId')
  @RequireRoles(...SITE_ADMIN_ROLES)
  @ApiOperation({ summary: 'Training matrix (users x courses) for a site' })
  @ApiParam({ name: 'siteId', type: 'number', description: 'Site id' })
  @ApiResponse({ status: 200, description: 'Training matrix' })
  getMatrix(@Param('siteId', ParseIntPipe) siteId: number) {
    return this.oplTrainingService.getMatrixBySite(siteId);
  }

  // --- User flow ---

  @Get('my-records')
  @ApiOperation({ summary: "Current user's own training records" })
  @ApiResponse({ status: 200, description: 'List of training records' })
  myRecords(@Request() req: any) {
    return this.oplTrainingService.getRecordsByUser(req.user.id);
  }

  @Get('records/user/:userId')
  @RequireRoles(...SITE_ADMIN_ROLES)
  @ApiOperation({ summary: 'Training records for a given user' })
  @ApiParam({ name: 'userId', type: 'number', description: 'User id' })
  @ApiResponse({ status: 200, description: 'List of training records' })
  recordsByUser(@Param('userId', ParseIntPipe) userId: number) {
    return this.oplTrainingService.getRecordsByUser(userId);
  }

  @Post('self-complete')
  @ApiOperation({ summary: 'User marks an OPL as taken (pending validation)' })
  @ApiResponse({ status: 201, description: 'Marked as self-completed' })
  selfComplete(@Body() dto: SelfCompleteTrainingDTO, @Request() req: any) {
    return this.oplTrainingService.selfComplete(req.user.id, dto.oplId);
  }

  // --- Supervisor flow ---

  @Post('validate')
  @RequireRoles(...SITE_ADMIN_ROLES)
  @ApiOperation({ summary: 'Supervisor validates training records' })
  @ApiResponse({ status: 201, description: 'Records validated' })
  validate(@Body() dto: ValidateTrainingDTO, @Request() req: any) {
    return this.oplTrainingService.validate(dto, req.user.id);
  }
}
