import {
  IsInt,
  IsNotEmpty,
  IsString,
  IsEnum,
  IsOptional,
  IsArray,
  ValidateNested,
  IsBoolean,
  MaxLength,
  Min,
  ArrayMaxSize,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

enum CardTypeValue {
  Safe = 'safe',
  Unsafe = 'unsafe',
  nullType = ''
}

enum EvidenceType {
  IMCR = 'IMCR',
  IMCL = 'IMCL',
  IMPS = 'IMPS',
  VICR = 'VICR',
  VICL = 'VICL',
  VIPS = 'VIPS',
  AUCR = 'AUCR',
  AUCL = 'AUCL',
  AUPS = 'AUPS',
}

class Evidence {
  @ApiProperty({ description: 'Type of the evidence', enum: EvidenceType })
  @IsEnum(EvidenceType)
  @IsNotEmpty()
  type: EvidenceType;

  @ApiProperty({ description: 'URL of the evidence' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  url: string;
}

export class CreateCardDTO {
  @ApiProperty()
  @IsInt()
  @Min(1)
  siteId: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  cardUUID: string;

  @ApiProperty({ type: 'string', format: 'date-time', example: '2023-06-20T00:00:00.000Z' })
  @IsString()
  @IsNotEmpty()
  cardCreationDate: string;

  @ApiProperty()
  @IsInt()
  @Min(1)
  nodeId: number;

  @ApiProperty()
  @IsInt()
  @Min(1)
  priorityId: number;

  @ApiProperty({ enum: ['safe', 'unsafe'] })
  @IsEnum(CardTypeValue)
  @IsOptional()
  cardTypeValue: CardTypeValue | null;

  @ApiProperty()
  @IsInt()
  @Min(1)
  cardTypeId: number;

  @ApiProperty()
  @IsInt()
  @Min(1)
  preclassifierId: number;

  @ApiProperty({
    required: false,
    deprecated: true,
    description: 'Ignored by the API. The creator is derived from the authenticated session.',
  })
  @IsOptional()
  @IsInt()
  creatorId?: number;
  
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  comments: string | null;

  @ApiProperty({ type: [Evidence] })
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => Evidence)
  evidences: Evidence[];

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @MaxLength(45)
  appSo: string | null;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @MaxLength(45)
  appVersion: string | null;

  @ApiProperty({ required: false, description: 'Custom due date for wildcard priority in YYYY-MM-DD format' })
  @IsString()
  @IsOptional()
  @MaxLength(10)
  customDueDate: string | null;

  @ApiProperty({ required: false, description: 'Whether to notify the level responsible when creating the card', default: false })
  @IsOptional()
  @IsBoolean()
  notifyResponsible: boolean;
}
