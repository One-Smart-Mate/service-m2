import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsIn } from 'class-validator';

export class SetAppTokenDTO {
  @ApiProperty({ description: 'Id', required: true })
  @IsNumber()
  userId: number;

  @ApiProperty({ description: 'App token', required: true })
  @IsString()
  appToken: string;

  @ApiProperty({ description: 'OS Name (ANDROID, IOS, WEB)', required: true })
  @IsString()
  @IsIn(['ANDROID', 'IOS', 'WEB'])
  osName: string;

  @ApiProperty({ description: 'OS version (número de versión)', required: true })
  @IsString()
  osVersion: string;
}
