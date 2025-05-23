import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsNumber,
  IsISO8601,
  Length,
  Min,
  Max,
  Matches,
} from 'class-validator';

export class CreateCiltSecuencesScheduleDto {
  @ApiProperty({ required: false, description: 'Site ID' })
  @IsOptional()
  @IsNumber()
  siteId?: number;

  @ApiProperty({ required: false, description: 'CILT ID' })
  @IsOptional()
  @IsNumber()
  ciltId?: number;

  @ApiProperty({ required: false, description: 'Sequence ID' })
  @IsOptional()
  @IsNumber()
  secuenceId?: number;

  @ApiProperty({ required: false, description: 'Frequency', maxLength: 5, default: 'FT' })
  @IsOptional()
  @IsString()
  @Length(1, 5)
  frecuency?: string;

  @ApiProperty({ 
    description: 'Schedule time in format HH:mm:ss', 
    required: false, 
    default: '08:00:00',
    example: '08:00:00',
    type: 'string'
  })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/, {
    message: 'Schedule must be in format HH:mm:ss'
  })
  schedule?: string;

  @ApiProperty({ 
    required: false, 
    description: 'Type of schedule: daily, weekly, monthly, yearly',
    maxLength: 3,
    default: 'D1'
  })
  @IsOptional()
  @IsString()
  @Length(1, 3)
  scheduleType?: string;

  @ApiProperty({ 
    description: 'End date in format YYYY-MM-DD', 
    required: false, 
    default: '2024-12-31',
    example: '2024-12-31',
    type: 'string'
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'End date must be in format YYYY-MM-DD'
  })
  endDate?: string;

  @ApiProperty({ required: false, description: 'Monday flag (0 or 1)', default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  mon?: number;

  @ApiProperty({ required: false, description: 'Tuesday flag (0 or 1)', default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  tue?: number;

  @ApiProperty({ required: false, description: 'Wednesday flag (0 or 1)', default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  wed?: number;

  @ApiProperty({ required: false, description: 'Thursday flag (0 or 1)', default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  thu?: number;

  @ApiProperty({ required: false, description: 'Friday flag (0 or 1)', default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  fri?: number;

  @ApiProperty({ required: false, description: 'Saturday flag (0 or 1)', default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  sat?: number;

  @ApiProperty({ required: false, description: 'Sunday flag (0 or 1)', default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  sun?: number;

  @ApiProperty({ required: false, description: 'Day of month (1-31)' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(31)
  dayOfMonth?: number;

  @ApiProperty({ required: false, description: 'Week of month (1-5)' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  weekOfMonth?: number;

  @ApiProperty({ 
    description: 'Date of year in format YYYY-MM-DD', 
    required: false,
    example: '2024-12-31',
    type: 'string'
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Date of year must be in format YYYY-MM-DD'
  })
  dateOfYear?: string;

  @ApiProperty({ required: false, description: 'Month of year (1-12)' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(12)
  monthOfYear?: number;

  @ApiProperty({ required: false, description: 'Status', default: 'A', maxLength: 1 })
  @IsOptional()
  @IsString()
  @Length(1, 1)
  status?: string;

  @ApiProperty({ description: 'Creation date in ISO format (YYYY-MM-DDTHH:mm:ss.sssZ)', default: '2023-06-20T00:00:00.000Z' })
  @IsISO8601()
  createdAt: string;
} 