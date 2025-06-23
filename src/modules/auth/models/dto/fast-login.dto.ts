import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { stringConstants } from 'src/utils/string.constant';

export class FastLoginDTO {
  @ApiProperty({
    description: 'The fast password of the user',
    example: 'A1B2C3D4',
  })
  @IsString()
  fastPassword: string;

  @ApiProperty({
    description:
      'Platform origin of login',
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