import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsString,
  Length,
  MaxLength,
} from 'class-validator';

export class CreatePreclassifierDTO {
  @ApiProperty({
    description: 'Preclassifier code',
    maxLength: 3,
  })
  @IsString()
  @MaxLength(3)
  @IsNotEmpty()
  preclassifierCode: string;

  @ApiProperty({
    description: 'Preclassifier description',
    maxLength: 100,
  })
  @IsString()
  @Length(1, 100)
  @IsNotEmpty()
  preclassifierDescription: string;

  @ApiProperty({
    description: 'Card type ID',
    type: 'integer',
    example: '1234567890123456789',
  })
  @IsInt()
  @IsNotEmpty()
  cardTypeId: number;

  createdAt?: Date;

  siteId?: number;

  siteCode: string;
}
