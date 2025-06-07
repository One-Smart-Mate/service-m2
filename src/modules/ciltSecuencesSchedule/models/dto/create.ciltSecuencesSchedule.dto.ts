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
  IsEnum
} from 'class-validator';
import { ScheduleType } from 'src/utils/string.constant';

export class CreateCiltSecuencesScheduleDto {
  @ApiProperty({ required: false, description: 'Site ID', default: 1 })
  @IsOptional()
  @IsNumber()
  siteId?: number;

  @ApiProperty({ required: false, description: 'CILT ID', default: 1 })
  @IsOptional()
  @IsNumber()
  ciltId?: number;

  @ApiProperty({ required: false, description: 'Sequence ID', default: 1 })
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
    description: 'Type of schedule: dai, wee, mon, yea, man',
    enum: ScheduleType,
    default: ScheduleType.DAILY
  })
  @IsOptional()
  @IsEnum(ScheduleType)
  scheduleType?: ScheduleType;

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
    example: '2024-01-01'
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

  @ApiProperty({ required: false, description: 'Allow execute before flag (0 or 1)', default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  allowExecuteBefore?: number;

  @ApiProperty({ required: false, description: 'Allow execute before minutes' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  allowExecuteBeforeMinutes?: number;

  @ApiProperty({ required: false, description: 'Tolerance before minutes' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  toleranceBeforeMinutes?: number;

  @ApiProperty({ required: false, description: 'Tolerance after minutes' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  toleranceAfterMinutes?: number;

  @ApiProperty({ required: false, description: 'Allow execute after due flag (0 or 1)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  allowExecuteAfterDue?: number;

  @ApiProperty({ 
    required: false, 
    description: 'Status (A=Active, I=Inactive)', 
    default: 'A',
    maxLength: 1
  })
  @IsOptional()
  @IsString()
  @Length(1, 1)
  @Matches(/^[AI]$/, {
    message: 'Status must be either A (Active) or I (Inactive)'
  })
  status?: string;

  @ApiProperty({ 
    required: false, 
    description: 'Order number for the schedule',
    default: 1
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  order?: number;

  @ApiProperty({ description: 'Creation date in ISO format (YYYY-MM-DDTHH:mm:ss.sssZ)', default: '2023-06-20T00:00:00.000Z' })
  @IsISO8601()
  createdAt: string;
} 