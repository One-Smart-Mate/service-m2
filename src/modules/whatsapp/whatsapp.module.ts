import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WhatsappService } from './whatsapp.service';
import { WhatsappController } from './whatsapp.controller';
import { CustomLoggerService } from '../../common/logger/logger.service';

@Module({
  imports: [
    ConfigModule,
  ],
  controllers: [WhatsappController],
  providers: [WhatsappService, CustomLoggerService],
  exports: [WhatsappService],
})
export class WhatsappModule {} 