import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class SetAppTokenDTO {
  @ApiProperty({ description: 'Id', required: true })
  @IsNumber()
  userId: number;
  @ApiProperty({ description: 'App token', required: true })
  @IsString()
  appToken: string;
}
