import { ApiProperty } from '@nestjs/swagger';
import {
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsString,
  Length,
  MaxLength,
} from 'class-validator';
import { stringConstants } from 'src/utils/string.constant';

export class UpdatePreclassifierDTO {
  @ApiProperty({
    example: 1,
    description: 'The ID of the preclassifier.',
    type: 'number',
  })
  @IsNotEmpty()
  @IsNumber()
  id: number;

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
    description: 'Status',
    required: true,
    minimum: 1,
  })
  @IsNotEmpty()
  @IsString()
  status: string;
}
