import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsIn } from 'class-validator';

export class LogoutDTO {
  @ApiProperty({ description: 'Id del usuario', required: true })
  @IsNumber()
  userId: number;

  @ApiProperty({ description: 'OS Name (ANDROID, IOS, WEB)', required: true })
  @IsString()
  @IsIn(['ANDROID', 'IOS', 'WEB'])
  osName: string;
} 