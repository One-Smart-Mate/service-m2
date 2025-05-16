import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsNumber,
  IsISO8601,
  Length,
} from 'class-validator';

export class CreateCiltMstrDTO {
  @ApiProperty({ required: false, description: 'Site ID' })
  @IsOptional()
  @IsNumber()
  siteId?: number;

  @ApiProperty({ required: false, description: 'Position ID' })
  @IsOptional()
  @IsNumber()
  positionId?: number;

  @ApiProperty({
    required: false,
    description: 'CILT name',
    maxLength: 45,
  })
  @IsOptional()
  @IsString()
  @Length(1, 45)
  ciltName?: string;

  @ApiProperty({
    required: false,
    description: 'CILT description',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  ciltDescription?: string;

  @ApiProperty({ required: false, description: 'Creator ID' })
  @IsOptional()
  @IsNumber()
  creatorId?: number;

  @ApiProperty({
    required: false,
    description: 'Creator name',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  creatorName?: string;

  @ApiProperty({ required: false, description: 'Reviewer ID' })
  @IsOptional()
  @IsNumber()
  reviewerId?: number;

  @ApiProperty({
    required: false,
    description: 'Reviewer name',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  reviewerName?: string;

  @ApiProperty({ required: false, description: 'Approver ID' })
  @IsOptional()
  @IsNumber()
  approvedById?: number;

  @ApiProperty({
    required: false,
    description: 'Approver name',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  approvedByName?: string;

  @ApiProperty({
    required: false,
    description: 'Standard execution time in seconds',
  })
  @IsOptional()
  @IsNumber()
  standardTime?: number;

  @ApiProperty({
    required: false,
    description: 'Learning time',
    maxLength: 25,
  })
  @IsOptional()
  @IsString()
  @Length(1, 25)
  learnigTime?: string;

  @ApiProperty({
    required: false,
    description: 'Layout image URL',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @Length(1, 500)
  urlImgLayout?: string;

  @ApiProperty({ required: false, description: 'CILT order', default: 1 })
  @IsOptional()
  @IsNumber()
  order?: number;

  @ApiProperty({
    required: false,
    description: 'CILT status',
    default: 'A',
  })
  @IsOptional()
  @IsString()
  @Length(1, 1)
  status?: string;

  @ApiProperty({ description: 'Last used date in ISO format (YYYY-MM-DDTHH:mm:ss.sssZ)', default: '2023-06-20T00:00:00.000Z' })
  @IsOptional()
  @IsISO8601()
  dateOfLastUsed: string;

  @ApiProperty({ description: 'CILT due date in ISO format (YYYY-MM-DDTHH:mm:ss.sssZ)', required: false })
  @IsOptional()
  @IsISO8601()
  ciltDueDate?: string;

  @ApiProperty({ description: 'Creation date in ISO format (YYYY-MM-DDTHH:mm:ss.sssZ)', default: '2023-06-20T00:00:00.000Z' })
  @IsISO8601()
  createdAt: string;
}
