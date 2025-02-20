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

export class UpdatePositionDto {
  @ApiProperty({
    description: 'Id of the position',
    required: true,
    example: 1,
    type: 'number',
  })
  @IsNotEmpty()
  @IsInt()
  id: number;

  @ApiProperty({
    description: 'Name of the position',
    type: 'string',
    maxLength: 45,
    example: 'Software Engineer',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(45)
  name: string;

  @ApiProperty({
    description: 'Category of the position in the organization',
    type: 'string',
    maxLength: 45,
    example: 'Engineering',
  })
  @IsString()
  @IsOptional()
  @MaxLength(45)
  category: string | null;

  @ApiProperty({
    description: 'Currency ID for the hourly cost',
    type: 'number',
    example: 1,
  })
  @IsInt()
  @IsOptional()
  currencyId: number | null;

  @ApiProperty({
    description: 'Currency symbol for the hourly cost',
    type: 'string',
    maxLength: 3,
    example: 'USD',
  })
  @IsString()
  @IsOptional()
  @MaxLength(3)
  currencySymbol: string | null;

  @ApiProperty({
    description: 'Description of the position',
    type: 'string',
    maxLength: 100,
    example: 'This position involves designing and developing software solutions.',
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  description: string | null;

  @ApiProperty({
    description: 'Hourly cost for the position in the specified currency',
    type: 'number',
    format: 'decimal',
    example: 50.75,
  })
  @IsDecimal({ decimal_digits: '2', force_decimal: true })
  @IsOptional()
  hourCost: number | null;
  @ApiProperty({
    description: 'Updated at timestamp',
    example: '2023-02-07T12:00:00Z',
    type: 'string',
    format: 'date-time',
  })
  @IsDate()
  @IsOptional()
  updatedAt: Date | null;

  @ApiProperty({
    description: 'Deleted at timestamp',
    example: '2023-02-07T12:30:00Z',
    type: 'string',
    format: 'date-time',
  })
  @IsDate()
  @IsOptional()
  deletedAt: Date | null;
}
