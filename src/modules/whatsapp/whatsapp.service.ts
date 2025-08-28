import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CustomLoggerService } from '../../common/logger/logger.service';
import axios from 'axios';

export interface AuthMessage {
  phoneNumber: string;
  code: string;
  language?: string;
}

export interface WhatsAppTemplateResponse {
  messaging_product: string;
  contacts: Array<{
    input: string;
    wa_id: string;
  }>;
  messages: Array<{
    id: string;
  }>;
}

@Injectable()
export class WhatsappService {
  private readonly whatsappApiUrl = 'https://graph.facebook.com/v23.0';
  private readonly accessToken: string;
  private readonly phoneNumberId: string;
  private readonly wabaId: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: CustomLoggerService,
  ) {
    this.accessToken = this.configService.get<string>('WHATSAPP_ACCESS_TOKEN');
    this.phoneNumberId = this.configService.get<string>('WHATSAPP_PHONE_NUMBER_ID');
    this.wabaId = this.configService.get<string>('WHATSAPP_WABA_ID') || this.phoneNumberId;
    
    this.logger.log(`WhatsApp Service initialized with Phone Number ID: ${this.phoneNumberId}`);
  }

  async sendAuthenticationMessages(authMessages: AuthMessage[]): Promise<WhatsAppTemplateResponse[]> {
    const results: WhatsAppTemplateResponse[] = [];

    for (const authMessage of authMessages) {
      try {
        const result = await this.sendAuthenticationMessage(
          authMessage.phoneNumber, 
          authMessage.code, 
          authMessage.language
        );
        results.push(result);
        this.logger.log(`Authentication message sent successfully to ${authMessage.phoneNumber}`);
      } catch (error) {
        this.logger.error(`Failed to send authentication message to ${authMessage.phoneNumber}`, error);
        throw new HttpException(
          `Failed to send message to ${authMessage.phoneNumber}: ${error.message}`,
          HttpStatus.BAD_REQUEST
        );
      }
    }

    return results;
  }

  /**
   * Cleans phone number by removing special characters and formatting
   * @param phoneNumber - Raw phone number string
   * @returns Cleaned phone number with only digits and country code
   */
  private cleanPhoneNumber(phoneNumber: string): string {
    // Remove all non-digit characters except '+'
    let cleaned = phoneNumber.replace(/[^\d+]/g, '');
    
    // If it doesn't start with '+', add it for international format
    if (!cleaned.startsWith('+')) {
      cleaned = '+' + cleaned;
      this.logger.debug(`Added country code prefix to phone number: ${cleaned}`);
    }
    
    this.logger.debug(`Phone number cleaned from "${phoneNumber}" to "${cleaned}"`);
    return cleaned;
  }

  private async sendAuthenticationMessage(phoneNumber: string, code: string, userLanguage?: string): Promise<WhatsAppTemplateResponse> {
    const url = `${this.whatsappApiUrl}/${this.phoneNumberId}/messages`;
    
    // Clean phone number before sending
    const cleanedPhoneNumber = this.cleanPhoneNumber(phoneNumber);
    
    // Use the created authentication template
    const templateName = 'fast_password';
    // Map user language to WhatsApp template language codes
    let templateLanguage = 'es_ES'; // Default to Spanish
    if (userLanguage === 'EN') {
      templateLanguage = 'en_US';
    } else if (userLanguage === 'ES') {
      templateLanguage = 'es_ES';
    }
    
    this.logger.log(`Using authentication template: ${templateName} (${templateLanguage})`);
    this.logger.log(`Template ID: 24829177996687017 (APPROVED - login_code)`);
    
    // Template payload (funciona siempre)
    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: cleanedPhoneNumber,
      type: 'template',
      template: {
        name: templateName,
        language: {
          code: templateLanguage
        },
        components: [
          {
            type: 'body',
            parameters: [
              {
                type: 'text',
                text: code
              }
            ]
          },
          {
            type: 'button',
            sub_type: 'url',
            index: '0',
            parameters: [
              {
                type: 'text',
                text: code
              }
            ]
          }
        ]
      }
    };

    const headers = {
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
    };

    try {
      this.logger.log(`Sending authentication template message to ${cleanedPhoneNumber} with code: ${code}`);
      this.logger.debug(`Request payload:`, JSON.stringify(payload, null, 2));
      
      const response = await axios.post(url, payload, { headers });
      
      this.logger.log(`WhatsApp API Response Status: ${response.status}`);
      this.logger.log(`WhatsApp API Response Data:`, JSON.stringify(response.data, null, 2));
      
      return response.data;
    } catch (error) {
      const errorDetails = {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        phoneNumber: cleanedPhoneNumber,
        code: code
      };
      
      this.logger.error('WhatsApp API Error Details:', JSON.stringify(errorDetails, null, 2));
      
      const finalErrorMessage = error.response?.data?.error?.message 
        || error.response?.data?.message
        || error.message 
        || 'Failed to send WhatsApp template message';
      
      throw new HttpException(
        `WhatsApp API Error: ${finalErrorMessage} (Phone: ${cleanedPhoneNumber})`,
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getPhoneNumberInfo(): Promise<any> {
    const url = `${this.whatsappApiUrl}/${this.phoneNumberId}`;
    
    const headers = {
      'Authorization': `Bearer ${this.accessToken}`,
    };

    try {
      const response = await axios.get(url, { headers });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get phone number info:', error.response?.data || error.message);
      throw new HttpException(
        'Failed to get phone number information',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getMessageTemplates(): Promise<any> {
    // Correct endpoint according to Meta docs: GET /{whatsapp-business-account-id}/message_templates
    const url = `${this.whatsappApiUrl}/${this.wabaId}/message_templates`;
    
    const headers = {
      'Authorization': `Bearer ${this.accessToken}`,
    };

    try {
      this.logger.log(`Fetching message templates for WABA ID: ${this.wabaId}`);
      this.logger.debug(`Request URL: ${url}`);
      
      const response = await axios.get(url, { headers });
      
      // Templates are directly in the data array
      const templates = response.data.data || [];
      this.logger.log(`Found ${templates.length} templates`);
      this.logger.debug('Templates response:', JSON.stringify(response.data, null, 2));
      
      return {
        waba_id: this.wabaId,
        templates: templates,
        total_templates: templates.length,
        paging: response.data.paging
      };
    } catch (error) {
      const errorDetails = {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        wabaId: this.wabaId,
        url: url
      };
      
      this.logger.error('WhatsApp Templates API Error Details:', JSON.stringify(errorDetails, null, 2));
      
      const errorMessage = error.response?.data?.error?.message 
        || error.response?.data?.message
        || error.message 
        || 'Failed to fetch WhatsApp message templates';
      
      throw new HttpException(
        `WhatsApp Templates API Error: ${errorMessage}`,
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getTemplateByName(templateName: string, language?: string): Promise<any> {
    try {
      const templatesResponse = await this.getMessageTemplates();
      
      let template = templatesResponse.templates.find(t => t.name === templateName);
      
      if (language) {
        template = templatesResponse.templates.find(t => 
          t.name === templateName && t.language === language
        );
      }
      
      if (!template) {
        throw new HttpException(
          `Template "${templateName}" not found${language ? ` for language ${language}` : ''}`,
          HttpStatus.NOT_FOUND
        );
      }
      
      this.logger.log(`Found template: ${template.name} (${template.language}) - Status: ${template.status}`);
      
      return template;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      this.logger.error('Failed to get template by name:', error.message);
      throw new HttpException(
        `Failed to retrieve template: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

    async buildTemplateComponents(template: any, parameters: { [key: string]: string }): Promise<any[]> {
      const components = [];
      
      if (!template.components) {
        this.logger.warn('Template has no components defined');
        return components;
      }
      
      for (const component of template.components) {
        if (component.type === 'BODY' && component.text && component.text.includes('{{')) {
          // Extract parameter placeholders and map them
          const bodyParams = [];
          const matches = component.text.match(/\{\{(\d+)\}\}/g) || [];
          
          for (let i = 0; i < matches.length; i++) {
            const paramKey = Object.keys(parameters)[i];
            if (paramKey && parameters[paramKey]) {
              bodyParams.push({
                type: 'text',
                text: parameters[paramKey]
              });
            }
          }
          
          if (bodyParams.length > 0) {
            components.push({
              type: 'body',
              parameters: bodyParams
            });
          }
        }
        
        if (component.type === 'HEADER' && component.format === 'TEXT' && parameters.header) {
          components.push({
            type: 'header',
            parameters: [
              {
                type: 'text',
                text: parameters.header
              }
            ]
          });
        }
      }
      
      return components;
    }

    async createAuthenticationTemplate(): Promise<any> {
      const url = `${this.whatsappApiUrl}/${this.wabaId}/upsert_message_templates`;
      
      const headers = {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      };

      const templatePayload = {
        name: 'login_code',
        code: 'login_code',
        languages: ['en_US', 'es_ES'],
        category: 'AUTHENTICATION',
        components: [
          {
            type: 'BODY',
            add_security_recommendation: true
          },
          {
            type: 'BUTTONS',
            buttons: [
              {
                type: 'OTP',
                otp_type: 'COPY_CODE'
              }
            ]
          }
        ]
      };

      try {
        this.logger.log('Creating authentication template...');
        this.logger.debug('Template payload:', JSON.stringify(templatePayload, null, 2));
        
        const response = await axios.post(url, templatePayload, { headers });
        
        this.logger.log('Template created successfully:', JSON.stringify(response.data, null, 2));
        
        return {
          success: true,
          template_id: response.data.id,
          status: response.data.status,
          message: 'Authentication template created successfully. It needs to be approved by WhatsApp before use.',
          template: response.data
        };
      } catch (error) {
        const errorDetails = {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message,
          wabaId: this.wabaId,
          url: url,
          payload: templatePayload
        };
        
        this.logger.error('Template creation failed:', JSON.stringify(errorDetails, null, 2));
        
        const errorMessage = error.response?.data?.error?.message 
          || error.response?.data?.message
          || error.message 
          || 'Failed to create authentication template';
        
        throw new HttpException(
          `Template Creation Error: ${errorMessage}`,
          error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR
        );
      }
    }
  }
