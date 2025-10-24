import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChartsController } from './charts.controller';
import { ChartsService } from './charts.service';
import { Chart } from './entities/chart.entity';
import { ChartLevel } from './entities/chart-level.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Chart, ChartLevel]),
    UsersModule,
  ],
  controllers: [ChartsController],
  providers: [ChartsService],
  exports: [ChartsService],
})
export class ChartsModule {}
