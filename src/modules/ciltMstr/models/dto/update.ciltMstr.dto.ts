import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsISO8601, Length, IsNotEmpty } from 'class-validator';

export class UpdateCiltMstrDTO {
  @ApiProperty({ description: 'CILT ID', example: 54 })
  @IsNotEmpty()
  @IsNumber()
  id: number;

  @ApiProperty({ required: false, description: 'Site ID', example: 1 })
  @IsOptional()
  @IsNumber()
  siteId?: number;

  @ApiProperty({ required: false, description: 'CILT name', maxLength: 45, example: 'Welding Procedure' })
  @IsOptional()
  @IsString()
  @Length(1, 45)
  ciltName?: string;

  @ApiProperty({ required: false, description: 'CILT description', maxLength: 255, example: 'Detailed steps for welding metal parts' })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  ciltDescription?: string;

  @ApiProperty({ required: false, description: 'Creator ID', example: 10 })
  @IsOptional()
  @IsNumber()
  creatorId?: number;

  @ApiProperty({ required: false, description: 'Creator name', maxLength: 100, example: 'John Doe' })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  creatorName?: string;

  @ApiProperty({ required: false, description: 'Reviewer ID', example: 12 })
  @IsOptional()
  @IsNumber()
  reviewerId?: number;

  @ApiProperty({ required: false, description: 'Reviewer name', maxLength: 100, example: 'Jane Smith' })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  reviewerName?: string;

  @ApiProperty({ required: false, description: 'Approver ID', example: 15 })
  @IsOptional()
  @IsNumber()
  approvedById?: number;

  @ApiProperty({ required: false, description: 'Approver name', maxLength: 100, example: 'Alice Johnson' })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  approvedByName?: string;

  @ApiProperty({ required: false, description: 'Standard execution time in seconds', example: 120 })
  @IsOptional()
  @IsNumber()
  standardTime?: number;

  @ApiProperty({ required: false, description: 'Layout image URL', maxLength: 500, example: 'https://myapp.com/layouts/welding.png' })
  @IsOptional()
  @IsString()
  @Length(1, 500)
  urlImgLayout?: string;

  @ApiProperty({ required: false, description: 'CILT order', default: 1, example: 2 })
  @IsOptional()
  @IsNumber()
  order?: number;

  @ApiProperty({ required: false, description: 'CILT status (A = Active, I = Inactive)', default: 'A', maxLength: 1, example: 'A' })
  @IsOptional()
  @IsString()
  @Length(1, 1)
  status?: string;

  @ApiProperty({ description: 'Last used date in ISO format (YYYY-MM-DDTHH:mm:ss.sssZ)', example: '2025-05-30T00:00:00.000Z' })
  @IsISO8601()
  dateOfLastUsed: string;

  @ApiProperty({ required: false, description: 'CILT due date in ISO format (YYYY-MM-DDTHH:mm:ss.sssZ)', example: '2025-06-15T08:00:00.000Z' })
  @IsOptional()
  @IsISO8601()
  ciltDueDate?: string;

  @ApiProperty({ description: 'Update date in ISO format (YYYY-MM-DDTHH:mm:ss.sssZ)', example: '2025-05-30T10:00:00.000Z' })
  @IsISO8601()
  updatedAt: string;
}
