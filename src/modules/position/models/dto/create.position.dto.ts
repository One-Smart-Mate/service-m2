import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  IsDate,
} from 'class-validator';

export class CreatePositionDto {
  @ApiProperty({ description: 'Site ID', example: 1, type: 'number' })
  @IsInt()
  @IsOptional()
  siteId: number | null;

  @ApiProperty({ description: 'Site Name', example: 'Main Office', type: 'string', maxLength: 100 })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  siteName: string | null;

  @ApiProperty({ description: 'Site Type', example: 'Headquarters', type: 'string', maxLength: 20 })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  siteType: string | null;

  @ApiProperty({ description: 'The service generate this', example: 2, type: 'number' })
  @IsInt()
  @IsOptional()
  areaId: number | null;

  @ApiProperty({ description: 'The service generate this', example: 'Development', type: 'string', maxLength: 100 })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  areaName: string | null;

  @ApiProperty({ description: 'Level ID', example: 3, type: 'number' })
  @IsInt()
  @IsOptional()
  levelId: number | null;

  @ApiProperty({ description: 'Level Name', example: 'Senior', type: 'string', maxLength: 45 })
  @IsString()
  @IsOptional()
  @MaxLength(45)
  levelName: string | null;

  @ApiProperty({ description: 'Route', example: '/engineering/software', type: 'string', maxLength: 250 })
  @IsString()
  @IsOptional()
  @MaxLength(250)
  route: string | null;

  @ApiProperty({ description: 'Name of the position', example: 'Software Engineer', type: 'string', maxLength: 45 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(45)
  name: string;

  @ApiProperty({ description: 'Description of the position', example: 'Responsible for software development.', type: 'string', maxLength: 100 })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  description: string | null;

  @ApiProperty({ description: 'Status', example: 'A', type: 'string', maxLength: 1 })
  @IsString()
  @IsOptional()
  @MaxLength(1)
  status: string | null;

  @ApiProperty({ description: 'User IDs to associate with the position', example: [1, 2], type: [Number] })
  @IsInt({ each: true })
  @IsOptional()
  userIds: number[] | null;
}