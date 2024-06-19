import { ApiProperty } from '@nestjs/swagger';
import {
  IsIn,
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
  @IsNumber()
  @IsNotEmpty()
  responsibleId: number;
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
    description: 'Status',
    required: true,
    example: 'A or I',
    minimum: 1,
  })
  @IsNotEmpty()
  @IsString()
  @IsIn([stringConstants.activeStatus, stringConstants.inactiveStatus])
  status: string;

  updatedAt?: Date;
}
