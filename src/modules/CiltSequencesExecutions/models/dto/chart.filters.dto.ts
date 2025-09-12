import { IsOptional, IsInt, IsDateString } from 'class-validator';
import { Transform } from 'class-transformer';

export class ChartFiltersDTO {
  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsInt()
  @Transform(({ value }) => parseInt(value))
  siteId?: number;

  @IsOptional()
  @IsInt()
  @Transform(({ value }) => parseInt(value))
  positionId?: number;

  @IsOptional()
  @IsInt()
  @Transform(({ value }) => parseInt(value))
  levelId?: number;
} 