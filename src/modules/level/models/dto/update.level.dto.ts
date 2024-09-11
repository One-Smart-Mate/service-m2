import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { stringConstants } from 'src/utils/string.constant';

export class UpdateLevelDTO {
  @ApiProperty({ description: 'Id', required: true })
  @IsNotEmpty()
  @IsNumber()
  id: number;

  @ApiProperty({
    description: 'Id of the responsible',
    example: 1,
    type: 'number',
  })
  @IsInt()
  @IsOptional()
  responsibleId: number | null;
  responsibleName?: string;

  @ApiProperty({
    description: 'Name of the level',
    type: 'string',
    maxLength: 45,
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Level description',
    type: 'string',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: 'Level machineId',
    type: 'string',
    maxLength: 50,
  })
  @IsOptional()
  levelMachineId: string | null;

  @ApiProperty({
    description: 'Notify user',
    type: 'number',
    maxLength: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  notify: number;

  @ApiProperty({
    description: 'Status',
    required: true,
    minimum: 1,
  })
  @IsNotEmpty()
  @IsString()
  status: string;

  updatedAt?: Date;
}
