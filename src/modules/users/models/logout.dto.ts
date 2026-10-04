import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsIn, IsOptional } from 'class-validator';

export class LogoutDTO {
  @ApiProperty({
    description:
      'Deprecated. The user is obtained from the authenticated session.',
    required: false,
    deprecated: true,
  })
  @IsOptional()
  @IsNumber()
  userId?: number;

  @ApiProperty({ description: 'OS Name (ANDROID, IOS, WEB)', required: true })
  @IsString()
  @IsIn(['ANDROID', 'IOS', 'WEB'])
  osName: string;
}
