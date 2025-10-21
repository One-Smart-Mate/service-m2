import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import { stringConstants } from 'src/utils/string.constant';

export class UpdateUserPartialDTO {
  @ApiProperty({ description: 'Id', required: true })
  @IsNotEmpty()
  @IsNumber()
  id: number;

  @ApiProperty({ description: 'Name of the user', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: 'Phone number of the user', required: false })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiProperty({ 
    description: 'Language of the welcome email', 
    example: 'ES',
    enum: [stringConstants.LANG_ES, stringConstants.LANG_EN],
    default: stringConstants.LANG_ES,
    required: false
  })
  @IsString()
  translation?: typeof stringConstants.LANG_ES | typeof stringConstants.LANG_EN = stringConstants.LANG_ES;

  @ApiProperty({ description: 'Email address of the user', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ description: 'Password for the user', required: false })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiProperty({
    description: 'Fast password for quick access (4 alphanumeric characters: a-z, A-Z, 0-9)',
    required: false,
    example: 'aB3d',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[a-zA-Z0-9]{4}$/, {
    message: 'Fast password must be 4 alphanumeric characters (a-z, A-Z, 0-9)',
  })
  fastPassword?: string;
} 