import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, Matches } from 'class-validator';

export class FindByUserDTO {
  @ApiProperty({
    description: 'User ID',
    example: 1,
    type: Number
  })
  @IsNumber()
  userId: number;

  @ApiProperty({
    description: 'Date in format YYYY-MM-DD',
    example: '2024-03-20',
    type: String
  })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'The date must be in format YYYY-MM-DD',
  })
  date: string;
} 