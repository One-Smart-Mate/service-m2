import { Controller, Get } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { HealthService } from './health.service';

@Public()
@Controller('health')
export class HealthController {
  constructor(private readonly readiness: HealthService) {}
  @Get('live') live() {
    return { status: 'alive' };
  }
  @Get('ready') ready() {
    return this.readiness.check();
  }
}
