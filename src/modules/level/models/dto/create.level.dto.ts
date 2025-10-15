import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateLevelDto {
  @ApiProperty({
    description: 'Id of the responsible',
    example: 1,
    type: 'number',
  })
  @IsInt()
  @IsOptional()
  responsibleId: number | null;

  @ApiProperty({
    description: 'Id of the site',
    example: 1,
    type: 'number',
  })
  @IsNumber()
  @IsNotEmpty()
  siteId: number;

  companyId?: number;
  responsibleName?: string;

  @ApiProperty({
    description: 'Id of the superior level',
    example: 1,
    type: 'number',
    required: false,
  })
  @IsNumber()
  @IsOptional()
  superiorId?: number;

  level?: number;

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
    description: 'Auto-assign level responsible as mechanic when creating cards',
    type: 'number',
    maxLength: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  assignWhileCreate?: number;

  createdAt?: Date;
}
