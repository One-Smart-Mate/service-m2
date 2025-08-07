import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNumber, IsOptional, IsString, Matches, IsISO8601 } from 'class-validator';
import { stringConstants } from 'src/utils/string.constant';

export class UpdateLastLoginDTO {
  @ApiProperty({
    description: 'User ID',
    example: 123,
  })
  @IsNumber()
  userId: number;

  @ApiProperty({
    description: 'Date of the login',
    example: '2025-01-29T10:30:00.000Z',
  })
  @IsISO8601()
  date: Date;

  @ApiProperty({
    description: 'Timezone of the user (IANA format)',
    example: 'America/Mexico_City',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Matches(/^([A-Z][a-zA-Z]*\/[A-Za-z_\/\-]+|UTC|GMT[+-]?\d{1,2}(:\d{2})?)$/, {
    message: 'timezone must be a valid IANA timezone format (e.g., America/Mexico_City, UTC, GMT+5)',
  })
  timezone: string;

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