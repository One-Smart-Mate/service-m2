import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { StatusService } from './status.service';

@Controller('status')
@ApiTags('status')
@ApiBearerAuth()
export class StatusController {
  constructor(private readonly statusService: StatusService) {}
  @Get('/all')
  findAll() {
    return this.statusService.findAllStatus();
  }
}
