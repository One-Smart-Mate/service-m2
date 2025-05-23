import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, Matches } from 'class-validator';

export class FindByUserDTO {
  @ApiProperty({
    description: 'ID del usuario',
    example: 1,
    type: Number
  })
  @IsNumber()
  userId: number;

  @ApiProperty({
    description: 'Fecha en formato YYYY-MM-DD',
    example: '2024-03-20',
    type: String
  })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'La fecha debe estar en formato YYYY-MM-DD',
  })
  date: string;
} 