import { Transform } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';

export enum CardEvidenceUploadType {
  IMCR = 'IMCR',
  VICR = 'VICR',
  AUCR = 'AUCR',
}

export class UploadCardEvidenceDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  @Matches(/^[A-Za-z0-9_-]+$/)
  cardUUID: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  @Matches(/^[A-Za-z0-9_-]+$/)
  evidenceId: string;

  @Transform(({ value }) => String(value).toUpperCase())
  @IsEnum(CardEvidenceUploadType)
  evidenceType: CardEvidenceUploadType;
}
