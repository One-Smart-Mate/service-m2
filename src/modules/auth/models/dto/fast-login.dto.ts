import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MinLength, Matches } from 'class-validator';
import { stringConstants } from 'src/utils/string.constant';

export class FastLoginDTO {
  @ApiProperty({
    description: 'The fast password of the user',
    example: 'AaDb',
  })
  @IsString()
  @MinLength(4)
  fastPassword: string;

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
  timezone?: string;

  @ApiProperty({
    description: 'Platform origin of login',
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