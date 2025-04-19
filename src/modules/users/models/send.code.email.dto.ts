import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsOptional, IsString } from 'class-validator';
import { stringConstants } from 'src/utils/string.constant';

export class SendCodeEmailDto {
  @ApiProperty({ description: 'email', example: 'username@domain' })
  @Transform(({ value }) => value.trim())
  @IsEmail()
  email: string;

  @ApiProperty({ 
    description: 'Language of the email', 
    example: 'ES',
    enum: [stringConstants.LANG_ES, stringConstants.LANG_EN],
    default: stringConstants.LANG_ES,
    required: false
  })
  @IsString()
  @IsOptional()
  translation?: typeof stringConstants.LANG_ES | typeof stringConstants.LANG_EN = stringConstants.LANG_ES;
} 