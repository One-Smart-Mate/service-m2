import { IsOptional, IsInt, IsDateString, Matches, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class ChartFiltersDTO {
  @IsDateString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  startDate: string;

  @IsDateString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  endDate: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(({ value }) => Number(value))
  siteId?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(({ value }) => Number(value))
  positionId?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(({ value }) => Number(value))
  levelId?: number;
}
