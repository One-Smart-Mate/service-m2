import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString} from 'class-validator';

export class CreateLevelDto {
  @ApiProperty({
    description: 'Id of the responsible',
    example: 1,
    type: 'number',
  })
  @IsNumber()
  @IsNotEmpty()
  responsibleId: number;

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

  createdAt?: Date;
}
