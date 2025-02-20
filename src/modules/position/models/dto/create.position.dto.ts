import { ApiProperty } from '@nestjs/swagger';
import {
  IsDecimal,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  IsDate
} from 'class-validator';

export class CreatePositionDto {
  @ApiProperty({
    description: 'Name of the position',
    example: 'Software Engineer',
    type: 'string',
    maxLength: 45,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(45)
  name: string;

  @ApiProperty({
    description: 'Category of the position in the organization',
    example: 'Engineering',
    type: 'string',
    maxLength: 45,
  })
  @IsString()
  @IsOptional()
  @MaxLength(45)
  category: string | null;

  @ApiProperty({
    description: 'Currency ID for the hourly cost',
    example: 1,
    type: 'number',
  })
  @IsInt()
  @IsOptional()
  currencyId: number | null;

  @ApiProperty({
    description: 'Currency symbol for the hourly cost',
    example: 'USD',
    type: 'string',
    maxLength: 3,
  })
  @IsString()
  @IsOptional()
  @MaxLength(3)
  currencySymbol: string | null;

  @ApiProperty({
    description: 'Description of the position',
    example: 'This position involves designing and developing software solutions.',
    type: 'string',
    maxLength: 100,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  description: string | null;

  @ApiProperty({
    description: 'Hourly cost for the position in the specified currency',
    example: 50.75,
    type: 'number',
    format: 'decimal',
  })
  @IsDecimal({ decimal_digits: '2', force_decimal: true })
  @IsOptional()
  hourCost: number | null;

  @ApiProperty({
    description: 'Created at timestamp',
    example: '2023-02-07T10:00:00Z',
    type: 'string',
    format: 'date-time',
  })
  @IsDate()
  @IsOptional()
  createdAt: Date | null;
}
