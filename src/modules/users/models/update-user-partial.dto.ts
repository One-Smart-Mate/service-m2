import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';

export class UpdateUserPartialDTO {
  @ApiProperty({ description: 'Id', required: true })
  @IsNotEmpty()
  @IsNumber()
  id: number;

  @ApiProperty({ description: 'Name of the user', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: 'Email address of the user', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ description: 'Password for the user', required: false })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiProperty({ 
    description: 'Fast password for quick access (hexadecimal format)', 
    required: false,
    example: 'A1B2C3'
  })
  @IsOptional()
  @IsString()
  @Matches(/^[0-9A-Fa-f]+$/, { message: 'Fast password must be in hexadecimal format' })
  fastPassword?: string;
} 