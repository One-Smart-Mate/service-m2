import {
  IsInt,
  IsNotEmpty,
  IsString,
  IsEnum,
  IsOptional,
  IsISO8601,
  IsArray,
  ValidateNested,
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
  url: string;
}

export class CreateCardDTO {
  @ApiProperty()
  @IsInt()
  siteId: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  cardUUID: string;

  @ApiProperty({ type: 'Date', example: '2023-06-20T00:00:00.000Z' })
  @IsISO8601()
  cardCreationDate: string;

  @ApiProperty({ required: false })
  @IsInt()
  @IsOptional()
  nodeId: number | null;

  @ApiProperty({required: false})
  @IsOptional()
  @IsInt()
  priorityId: number | 0 | null;

  @ApiProperty({ enum: ['safe', 'unsafe'] })
  @IsEnum(CardTypeValue)
  @IsOptional()
  cardTypeValue: CardTypeValue | null;

  @ApiProperty()
  @IsInt()
  cardTypeId: number;

  @ApiProperty()
  @IsInt()
  preclassifierId: number;

  @ApiProperty()
  @IsInt()
  creatorId: number;
  
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  comments: string | null;

  @ApiProperty({ type: [Evidence] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Evidence)
  evidences: Evidence[];
}
