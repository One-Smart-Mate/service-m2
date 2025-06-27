import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsIn, IsNumber, IsOptional, IsString } from 'class-validator';
import { stringConstants } from 'src/utils/string.constant';

export class UpdateLastLoginDTO {
  @ApiProperty({
    description: 'ID del usuario',
    example: 123,
  })
  @IsNumber()
  userId: number;

  @ApiProperty({
    description: 'Fecha del login',
    example: '2025-01-29T10:30:00.000Z',
  })
  @IsDateString()
  date: string;

  @ApiProperty({
    description: 'Plataforma origen del login',
    example: stringConstants.OS_WEB,
    enum: [
      stringConstants.OS_WEB,
      stringConstants.OS_ANDROID,
      stringConstants.OS_IOS,
      'app',
    ],
    required: false,
    default: stringConstants.OS_WEB,
  })
  @IsOptional()
  @IsString()
  @IsIn([
    stringConstants.OS_WEB,
    stringConstants.OS_ANDROID,
    stringConstants.OS_IOS,
    'app',
  ])
  platform: string = stringConstants.OS_WEB;
} 