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

  @ApiProperty({ description: 'Phone number of the user', required: false })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiProperty({ description: 'Email address of the user', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ description: 'Password for the user', required: false })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiProperty({
    description: 'Fast password for quick access (4 letters)',
    required: false,
    example: 'aBcD',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[a-zA-Z]{4}$/, {
    message: 'Fast password must be 4 letters',
  })
  fastPassword?: string;
} 