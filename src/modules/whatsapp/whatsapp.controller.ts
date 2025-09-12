import { Controller, Post, Body, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiBody, ApiProperty } from '@nestjs/swagger';
import { WhatsappService } from './whatsapp.service';
import { IsArray, ValidateNested, IsString, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class AuthMessageDto {
  @ApiProperty({ example: '5217773280963', description: 'Phone number with country code' })
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @ApiProperty({ example: '123456', description: 'Authentication code' })
  @IsString()
  @IsNotEmpty()
  code: string;
}

export class SendAuthMessagesDto {
  @ApiProperty({ 
    type: [AuthMessageDto],
    description: 'Array of phone numbers and authentication codes',
    example: [
      { phoneNumber: '5217773280963', code: '123456' },
      { phoneNumber: '5217773270384', code: '789012' }
    ]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AuthMessageDto)
  authMessages: AuthMessageDto[];
}

@ApiTags('WhatsApp')
@ApiBearerAuth()
@Controller('whatsapp')
export class WhatsappController {
  constructor(private readonly whatsappService: WhatsappService) {}

  @Post('send-auth-messages')
  @ApiOperation({ summary: 'Send authentication messages via WhatsApp template' })
  @ApiBody({
    type: SendAuthMessagesDto,
    description: 'Array of phone numbers and authentication codes',
    examples: {
      example1: {
        summary: 'Send auth messages to multiple users',
        value: {
          authMessages: [
            {
              phoneNumber: '5217773280963',
              code: '123456'
            },
            {
              phoneNumber: '5217773270384',
              code: '789012'
            }
          ]
        }
      }
    }
  })
  async sendAuthenticationMessages(@Body() sendAuthMessagesDto: SendAuthMessagesDto) {
    return await this.whatsappService.sendAuthenticationMessages(sendAuthMessagesDto.authMessages);
  }

  @Post('phone-info')
  @ApiOperation({ summary: 'Get WhatsApp phone number information' })
  async getPhoneNumberInfo() {
    return await this.whatsappService.getPhoneNumberInfo();
  }

  @Get('templates')
  @ApiOperation({ 
    summary: 'Get WhatsApp message templates',
    description: 'Retrieves all approved WhatsApp message templates for the business account'
  })
  async getMessageTemplates() {
    return await this.whatsappService.getMessageTemplates();
  }

  @Get('templates/:name')
  @ApiOperation({ 
    summary: 'Get specific WhatsApp message template by name',
    description: 'Retrieves a specific WhatsApp message template by name and optional language'
  })
  async getTemplateByName(
    @Param('name') name: string,
    @Query('language') language?: string
  ) {
    return await this.whatsappService.getTemplateByName(name, language);
  }

  @Post('templates/create-auth')
  @ApiOperation({ 
    summary: 'Create authentication template',
    description: 'Creates a new WhatsApp authentication template with format: "Your fast password is {{code}}"'
  })
  async createAuthenticationTemplate() {
    return await this.whatsappService.createAuthenticationTemplate();
  }
} 