import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WhatsappService } from './whatsapp.service';
import { WhatsappController } from './whatsapp.controller';
import { CustomLoggerService } from '../../common/logger/logger.service';
// import { IaModule } from '../ia/ia.module';

@Module({
  imports: [
    ConfigModule,
    // IaModule
  ],
  controllers: [WhatsappController],
  providers: [WhatsappService, CustomLoggerService],
  exports: [WhatsappService],
})
export class WhatsappModule {} 