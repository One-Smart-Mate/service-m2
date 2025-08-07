import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { makeWASocket, DisconnectReason, useMultiFileAuthState } from '@whiskeysockets/baileys';
import * as qrcode from 'qrcode-terminal';
import { Boom } from '@hapi/boom';
import { CustomLoggerService } from '../../common/logger/logger.service';
// import { IaService } from '../ia/ia.service';

@Injectable()
export class WhatsappService implements OnModuleInit {
  private sock: any;
  private qrCode: string | null = null;
  private connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'qr_required' = 'disconnected';
  private readonly notificationNumbers: string[];

  constructor(
    private readonly logger: CustomLoggerService,
    private readonly configService: ConfigService,
  ) {
    const userPhoneOne = this.configService.get<string>('USER_ONE');
    const userPhoneTwo = this.configService.get<string>('USER_TWO');
    
    this.notificationNumbers = [userPhoneOne, userPhoneTwo].filter(Boolean);
    
    this.logger.logWhatsapp(`Notification numbers configured: ${this.notificationNumbers.length} numbers`);
  }

  async onModuleInit() {
    this.logger.logWhatsapp('Starting WhatsApp service');
    await this.initializeConnection();
  }

  getConnectionInfo() {
    return {
      status: this.connectionStatus,
      qrRequired: this.connectionStatus === 'qr_required',
      qrCode: this.qrCode
    };
  }

  private async initializeConnection() {
    try {
      const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

      this.connectionStatus = 'connecting';
      this.logger.logWhatsapp('Starting connection with WhatsApp');

      this.sock = makeWASocket({
        printQRInTerminal: true,
        auth: state,
      });

      this.sock.ev.on('connection.update', (update: any) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          this.qrCode = qr;
          this.connectionStatus = 'qr_required';
          qrcode.generate(qr, { small: true });
          this.logger.logWhatsapp('Scan QR code required');
        }

        if (connection === 'close') {
          const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
          if (shouldReconnect) {
            this.connectionStatus = 'disconnected';
            this.qrCode = null;
            this.logger.logWhatsapp('Connection closed, trying to reconnect in 3 seconds');
            setTimeout(() => this.initializeConnection(), 3000);
          }
        } else if (connection === 'open') {
          this.connectionStatus = 'connected';
          this.qrCode = null;
          this.logger.logWhatsapp('Connection established with WhatsApp');
          // this.setupMessageHandler();
        }
      });

      this.sock.ev.on('creds.update', saveCreds);
    } catch (error) {
      this.logger.logException('WhatsappService', 'initializeConnection', error);
      throw error;
    }
  }

  async sendToMultipleNumbers(message: string, numbers?: string[]) {
    if (this.connectionStatus !== 'connected') {
      this.logger.logWhatsapp('WhatsApp not connected, cannot send messages');
      return { success: false, error: 'WhatsApp not connected' };
    }

    const numbersToSend = numbers || this.notificationNumbers;
    const results = [];

    this.logger.logWhatsapp(`Sending incident notification to ${numbersToSend.length} numbers`);

    for (const number of numbersToSend) {
      try {
        const formattedNumber = `${number}@s.whatsapp.net`;
        await this.sock.sendMessage(formattedNumber, { text: message });
        
        results.push({ number, success: true });
        this.logger.logWhatsapp(`Message sent successfully to ${number}`);
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        results.push({ number, success: false, error: error.message });
        this.logger.logException('WhatsappService', 'sendToMultipleNumbers', error);
      }
    }

    return { success: true, results };
  }


  async sendIncidentNotification(incidentDescription: string) {
    return await this.sendToMultipleNumbers(incidentDescription);
  }

  /* 
  private setupMessageHandler() {
    this.sock.ev.on('messages.upsert', async (m: any) => {
      try {
        const msg = m.messages[0];

        if (msg.key.remoteJid.endsWith('@g.us') || msg.key.fromMe) {
          return;
        }

        const sender = msg.key.remoteJid;
        const messageText = msg.message?.conversation || msg.message?.extendedTextMessage?.text;

        if (!messageText) {
            this.logger.logWhatsapp('Message without text, ignoring.');
            return;
        }

        try {
            await this.sock.sendPresenceUpdate('composing', sender);
            
            const iaResponse = await this.iaService.convertToSQL(messageText);

            await this.sock.sendPresenceUpdate('paused', sender);
            await this.sock.sendMessage(sender, { text: iaResponse.beautifiedData });

        } catch (error) {
            this.logger.logException('WhatsappService', 'iaProcessing', error);
            await this.sock.sendMessage(sender, { text: ' There was an error processing your request. Please try again.' });
        }
        
      } catch (error) {
        this.logger.logException('WhatsappService', 'messageHandler', error);
      }
    });
  }
  */
}
