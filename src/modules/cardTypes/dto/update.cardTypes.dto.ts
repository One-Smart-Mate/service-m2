import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsInt,
  MaxLength,
  IsNumber,
  Min,
  Max,
  IsHexColor,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
export class UpdateCardTypesDTO {
  @ApiProperty({
    example: 1,
    description: 'The ID of the cardType.',
    type: 'number',
  })
  @IsNotEmpty()
  @IsNumber()
  id: number;

  @ApiProperty({
    description: 'Name of the card type methodology',
    maxLength: 25,
  })
  @IsString()
  @MaxLength(25)
  @IsNotEmpty()
  methodology: string;

  @ApiProperty({
    description: 'Name of the card type',
    maxLength: 45,
  })
  @IsString()
  @MaxLength(45)
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Description of the card type',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: 'Hexa color code of the card type without "#"',
    maxLength: 6,
  })
  @IsString()
  @IsHexColor()
  @IsNotEmpty()
  color: string;

  @ApiProperty({
    description: 'Id of the responsible person (user)',
    maxLength: 100,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  responsableId?: number;

  responsableName?: string;

  email?: string;

  @ApiProperty({
    description: 'Quantity of pictures to create',
    required: false,
  })
  @IsInt()
  @Min(0)
  @Max(255)
  @IsOptional()
  quantityPicturesCreate?: number;

  @ApiProperty({
    description: 'Quantity of audios to create',
    required: false,
  })
  @IsInt()
  @Min(0)
  @Max(255)
  @IsOptional()
  quantityAudiosCreate?: number;

  @ApiProperty({
    description: 'Quantity of videos to create',
    required: false,
  })
  @IsInt()
  @Min(0)
  @Max(255)
  @IsOptional()
  quantityVideosCreate?: number;

  @ApiProperty({
    description: 'Duration of audios to create',
    required: false,
  })
  @IsInt()
  @IsOptional()
  audiosDurationCreate?: number;

  @ApiProperty({
    description: 'Duration of videos to create',
    required: false,
  })
  @IsInt()
  @IsOptional()
  videosDurationCreate?: number;

  @ApiProperty({
    description: 'Quantity of pictures to close',
    required: false,
  })
  @IsInt()
  @Min(0)
  @Max(255)
  @IsOptional()
  quantityPicturesClose?: number;

  @ApiProperty({
    description: 'Quantity of audios to close',
    required: false,
  })
  @IsInt()
  @Min(0)
  @Max(255)
  @IsOptional()
  quantityAudiosClose?: number;

  @ApiProperty({
    description: 'Quantity of videos to close',
    required: false,
  })
  @IsInt()
  @Min(0)
  @Max(255)
  @IsOptional()
  quantityVideosClose?: number;

  @ApiProperty({
    description: 'Duration of audios to close',
    required: false,
  })
  @IsInt()
  @IsOptional()
  audiosDurationClose?: number;

  @ApiProperty({
    description: 'Duration of videos to close',
    required: false,
  })
  @IsInt()
  @IsOptional()
  videosDurationClose?: number;

  @ApiProperty({
    description: 'Quantity of pictures per session',
    example: 5,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(255)
  quantityPicturesPs?: number;

  @ApiProperty({
    description: 'Quantity of audios per session',
    example: 3,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(255)
  quantityAudiosPs?: number;

  @ApiProperty({
    description: 'Quantity of videos per session',
    example: 2,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(255)
  quantityVideosPs?: number;

  @ApiProperty({
    description: 'Total duration of audios per session in seconds',
    example: 120,
    required: false,
  })
  @IsOptional()
  @IsInt()
  audiosDurationPs?: number;

  @ApiProperty({
    description: 'Total duration of videos per session in seconds',
    example: 300,
    required: false,
  })
  @IsOptional()
  @IsInt()
  videosDurationPs?: number;

  @ApiProperty({
    description: 'Status',
    required: true,
    minimum: 1,
  })
  @IsNotEmpty()
  @IsString()
  status: string;

  updatedAt?: Date;
}
