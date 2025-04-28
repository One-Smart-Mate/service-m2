import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsString, IsBoolean, IsDateString } from 'class-validator';

export class CreateCiltMstrDTO {
  @ApiProperty({ description: 'ID of the site' })
  @IsOptional()
  @IsNumber()
  siteId?: number;

  @ApiProperty({ description: 'ID of the position' })
  @IsOptional()
  @IsNumber()
  positionId?: number;

  @ApiProperty({ description: 'Name of the CILT' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: 'Description of the CILT' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Tools required for the CILT' })
  @IsOptional()
  @IsString()
  toolsRequired?: string;

  @ApiProperty({ description: 'Standard OK status' })
  @IsOptional()
  @IsBoolean()
  standardOk?: boolean;

  @ApiProperty({ description: 'URL of the repository' })
  @IsOptional()
  @IsString()
  repositoryUrl?: string;

  @ApiProperty({ description: 'ID of the creator' })
  @IsOptional()
  @IsNumber()
  creatorId?: number;

  @ApiProperty({ description: 'Name of the creator' })
  @IsOptional()
  @IsString()
  creatorName?: string;

  @ApiProperty({ description: 'ID of the reviewer' })
  @IsOptional()
  @IsNumber()
  reviewerId?: number;

  @ApiProperty({ description: 'Name of the reviewer' })
  @IsOptional()
  @IsString()
  reviewerName?: string;

  @ApiProperty({ description: 'ID of the approver' })
  @IsOptional()
  @IsNumber()
  approvedById?: number;

  @ApiProperty({ description: 'Name of the approver' })
  @IsOptional()
  @IsString()
  approvedByName?: string;

  @ApiProperty({ description: 'Standard time in minutes' })
  @IsOptional()
  @IsNumber()
  standardTime?: number;

  @ApiProperty({ description: 'Learning time' })
  @IsOptional()
  @IsString()
  learningTime?: string;

  @ApiProperty({ description: 'URL of the layout image' })
  @IsOptional()
  @IsString()
  urlImgLayout?: string;

  @ApiProperty({ description: 'Order of the CILT' })
  @IsOptional()
  @IsNumber()
  order?: number;

  @ApiProperty({ description: 'Status of the CILT', default: 'A' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({ description: 'Date of last use' })
  @IsOptional()
  @IsDateString()
  dateOfLastUsed?: string | Date;
}
