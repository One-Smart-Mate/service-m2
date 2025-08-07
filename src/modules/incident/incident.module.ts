
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IncidentEntity } from './entities/incident.entity';
import { IncidentService } from './incident.service';
import { IncidentController } from './incident.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      IncidentEntity,
    ])
  ],
  controllers: [IncidentController],
  providers: [IncidentService],
  exports: [IncidentService],
})
export class IncidentModule {}
