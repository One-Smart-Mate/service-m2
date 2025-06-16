import { Module } from '@nestjs/common';
import { IaController } from './ia.controller';
import { IaService } from './ia.service';
import { CustomLoggerService } from '../../common/logger/logger.service';

@Module({
  controllers: [IaController],
  providers: [IaService, CustomLoggerService],
  exports: [IaService],
})
export class IaModule {} 