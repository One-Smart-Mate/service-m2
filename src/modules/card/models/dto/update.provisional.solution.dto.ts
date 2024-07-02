import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsNotEmpty, IsNumber, IsString, ValidateNested } from 'class-validator';


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

export class UpdateProvisionalSolutionDTO {
  @ApiProperty({ description: 'The card Id', required: true })
  @IsNumber()
  cardId: number;
  
  @ApiProperty({ description: 'The user provisional Id', required: true })
  @IsNumber()
  userProvisionalSolutionId: number;

  @ApiProperty({ description: 'The user app provisional Id', required: true })
  @IsNumber()
  userAppProvisionalSolutionId: number;

  @ApiProperty({ required: false })
  @IsString()
  comments: string;

  @ApiProperty({ type: [Evidence] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Evidence)
  evidences: Evidence[];
}
