import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsISO8601, IsOptional, Length, IsString, MaxLength, IsNumber } from 'class-validator';

export class UpdateOplTypeDto {
  @ApiProperty({
    description: 'The ID of the OPL Type',
    example: 1,
  })
  @IsNotEmpty()
  @IsInt()
  id: number;

  @ApiProperty({
    description: 'Site ID where this OPL type belongs',
    example: 1,
  })
  @IsNotEmpty()
  @IsNumber()
  siteId: number;

  @ApiProperty({
    description:
      'Document type: OPL, OPL for improvement, security OPL, basic knowledge OPL, SOP, etc.',
    maxLength: 50,
    example: 'SOP',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  documentType: string;

  @ApiProperty({
    description: 'Status of the OPL type (A for Active, I for Inactive)',
    maxLength: 1,
    example: 'A',
    required: false,
    default: 'A',
  })
  @IsOptional()
  @IsString()
  @Length(1, 1)
  status?: string;
  
  @ApiProperty({
    description: 'Creation date in ISO format (YYYY-MM-DDTHH:mm:ss.sssZ)',
    default: '2023-06-20T00:00:00.000Z',
  })
  @IsISO8601()
  updatedAt: string;
}
