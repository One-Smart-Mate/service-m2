import { Injectable, OnModuleInit } from '@nestjs/common';
import { makeWASocket, DisconnectReason, useMultiFileAuthState } from '@whiskeysockets/baileys';
import * as qrcode from 'qrcode-terminal';
import { Boom } from '@hapi/boom';
import { CustomLoggerService } from '../../common/logger/logger.service';
import { IaService } from '../ia/ia.service';

@Injectable()
export class WhatsappService implements OnModuleInit {
  private sock: any;
  private qrCode: string | null = null;
  private connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'qr_required' = 'disconnected';

  constructor(
    private readonly logger: CustomLoggerService,
    private readonly iaService: IaService,
  ) {}

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
          this.setupMessageHandler();
        }
      });

      this.sock.ev.on('creds.update', saveCreds);
    } catch (error) {
      this.logger.logException('WhatsappService', 'initializeConnection', error);
      throw error;
    }
  }

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
}
