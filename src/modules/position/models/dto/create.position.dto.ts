import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  IsISO8601
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

  @ApiProperty({ description: 'Area ID', example: 2, type: 'number' })
  @IsInt()
  @IsOptional()
  areaId: number | null;

  @ApiProperty({ description: 'Area Name', example: 'Development', type: 'string', maxLength: 100 })
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

  @ApiProperty({ description: 'Order', example: 1, type: 'number' })
  @IsInt()
  @IsOptional()
  order: number | null;

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

  @ApiProperty({ description: 'Node Responsible ID', example: 1, type: 'number' })
  @IsInt()
  @IsOptional()
  nodeResponsableId: number | null;

  @ApiProperty({ description: 'Node Responsible Name', example: 'John Doe', type: 'string', maxLength: 100 })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  nodeResponsableName: string | null;

  @ApiProperty({ description: 'User IDs to associate with the position', example: [1, 2], type: [Number] })
  @IsInt({ each: true })
  @IsOptional()
  userIds: number[] | null;

  @ApiProperty({ description: 'Creation date in ISO format (YYYY-MM-DDTHH:mm:ss.sssZ)', default: '2023-06-20T00:00:00.000Z' })
  @IsISO8601()
  createdAt: string;
}