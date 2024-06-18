import { IsInt, IsNotEmpty, IsString, IsEnum, IsBoolean, IsDate, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

enum Feasibility {
  Alto = 'Alto',
  Bajo = 'Bajo',
}

enum Effect {
  Alto = 'Alto',
  Bajo = 'Bajo',
}

enum CardTypeMethodology {
  M = 'M',
  C = 'C',
}

enum CardTypeValue {
  Safe = 'safe',
  Unsafe = 'unsafe',
}

export class CreateCardDTO {
  @ApiProperty()
  @IsInt()
  siteCardId: number;

  @ApiProperty()
  @IsInt()
  siteId: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  siteCode: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  cardUUID: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  cardTypeColor: string;

  @ApiProperty({ enum: ['Alto', 'Bajo'], nullable: true })
  @IsEnum(Feasibility)
  @IsOptional()
  feasibility: Feasibility | null;

  @ApiProperty({ enum: ['Alto', 'Bajo'], nullable: true })
  @IsEnum(Effect)
  @IsOptional()
  effect: Effect | null;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  status: string;

  @ApiProperty()
  @IsDate()
  cardCreationDate: Date;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  cardDueDate: string;

  @ApiProperty({ required: false })
  @IsInt()
  @IsOptional()
  areaId: number | null;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  areaName: string;

  @ApiProperty()
  @IsInt()
  level: number;

  @ApiProperty()
  @IsInt()
  superiorId: number;

  @ApiProperty()
  @IsInt()
  priorityId: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  priorityCode: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  priorityDescription: string;

  @ApiProperty({ enum: ['M', 'C'], nullable: true })
  @IsEnum(CardTypeMethodology)
  @IsOptional()
  cardTypeMethodology: CardTypeMethodology | null;

  @ApiProperty({ required: false })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  cardTypeMethodologyName: string | null;

  @ApiProperty({ enum: ['safe', 'unsafe'] })
  @IsEnum(CardTypeValue)
  cardTypeValue: CardTypeValue;

  @ApiProperty()
  @IsInt()
  cardTypeId: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  cardTypeName: string;

  @ApiProperty()
  @IsInt()
  preclassifierId: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  preclassifierCode: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  preclassifierDescription: string;

  @ApiProperty()
  @IsInt()
  creatorId: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  creatorName: string;

  @ApiProperty()
  @IsInt()
  responsableId: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  responsableName: string;

  @ApiProperty({ required: false })
  @IsInt()
  @IsOptional()
  mechanicId: number | null;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  mechanicName: string | null;

  @ApiProperty({ required: false })
  @IsInt()
  @IsOptional()
  userProvisionalSolutionId: number | null;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  userProvisionalSolutionName: string | null;

  @ApiProperty({ required: false })
  @IsInt()
  @IsOptional()
  userAppProvisionalSolutionId: number | null;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  userAppProvisionalSolutionName: string | null;

  @ApiProperty({ required: false })
  @IsInt()
  @IsOptional()
  userDefinitiveSolutionId: number | null;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  userDefinitiveSolutionName: string | null;

  @ApiProperty({ required: false })
  @IsInt()
  @IsOptional()
  userAppDefinitiveSolutionId: number | null;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  userAppDefinitiveSolutionName: string | null;

  @ApiProperty({ required: false })
  @IsInt()
  @IsOptional()
  managerId: number | null;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  managerName: string | null;

  @ApiProperty({ required: false })
  @IsDate()
  @IsOptional()
  cardManagerCloseDate: Date | null;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  commentsManagerAtCardClose: string | null;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  commentsAtCardCreation: string | null;

  @ApiProperty({ required: false })
  @IsDate()
  @IsOptional()
  cardProvisionalSolutionDate: Date | null;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  commentsAtCardProvisionalSolution: string | null;

  @ApiProperty({ required: false })
  @IsDate()
  @IsOptional()
  cardDefinitiveSolutionDate: Date | null;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  commentsAtCardDefinitiveSolution: string | null;

  @ApiProperty()
  @IsBoolean()
  evidenceAucr: boolean;

  @ApiProperty()
  @IsBoolean()
  evidenceVicr: boolean;

  @ApiProperty()
  @IsBoolean()
  evidenceImcr: boolean;

  @ApiProperty()
  @IsBoolean()
  evidenceAucl: boolean;

  @ApiProperty()
  @IsBoolean()
  evidenceVicl: boolean;

  @ApiProperty()
  @IsBoolean()
  evidenceImcl: boolean;
}
