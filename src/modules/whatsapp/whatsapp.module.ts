import { Module } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { CustomLoggerService } from '../../common/logger/logger.service';
import { IaModule } from '../ia/ia.module';

@Module({
  imports: [
    IaModule
  ],
  controllers: [],
  providers: [WhatsappService, CustomLoggerService],
  exports: [WhatsappService],
})
export class WhatsappModule {} 