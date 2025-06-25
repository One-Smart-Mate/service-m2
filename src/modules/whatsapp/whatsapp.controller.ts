import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { WhatsappService } from './whatsapp.service';

@ApiTags('WhatsApp')
@Controller('whatsapp')
export class WhatsappController {
  constructor(private readonly whatsappService: WhatsappService) {}

  @Get('connection')
  getConnectionInfo() {
    return this.whatsappService.getConnectionInfo();
  }

  @Get('qr')
  getQrCode() {
    const connectionInfo = this.whatsappService.getConnectionInfo();
    return {
      qrCode: connectionInfo.qrCode,
      qrRequired: connectionInfo.qrRequired,
      status: connectionInfo.status
    };
  }
} 