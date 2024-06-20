import { IsInt, IsNotEmpty, IsString, IsEnum, IsBoolean, IsDate, IsOptional, IsISO8601 } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

enum Feasibility {
  Alto = 'Alto',
  Bajo = 'Bajo',
}

enum Effect {
  Alto = 'Alto',
  Bajo = 'Bajo',
}

enum CardTypeValue {
  Safe = 'safe',
  Unsafe = 'unsafe',
}

export class CreateCardDTO {
  siteCardId?: number;

  @ApiProperty()
  @IsInt()
  siteId: number;

  siteCode?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  cardUUID: string;


  cardTypeColor?: string;

  @ApiProperty({ enum: ['Alto', 'Bajo'], nullable: true })
  @IsEnum(Feasibility)
  @IsOptional()
  feasibility: Feasibility | null;

  @ApiProperty({ enum: ['Alto', 'Bajo'], nullable: true })
  @IsEnum(Effect)
  @IsOptional()
  effect: Effect | null;


  @ApiProperty({type: 'Date', example: '2023-06-20T00:00:00.000Z'})
  @IsISO8601()
  cardCreationDate: string;

  cardDueDate?: Date;

  @ApiProperty({ required: false })
  @IsInt()
  @IsOptional()
  areaId: number | null;

  areaName?: string;
  level?: number;
  superiorId?: number;

  @ApiProperty()
  @IsInt()
  priorityId: number;

  priorityCode?: string;
  priorityDescription?: string;

  cardTypeMethodology?: string;
  cardTypeMethodologyName?: string;

  @ApiProperty({ enum: ['safe', 'unsafe'] })
  @IsEnum(CardTypeValue)
  cardTypeValue: CardTypeValue;

  @ApiProperty()
  @IsInt()
  cardTypeId: number;

  cardTypeName?: string;

  @ApiProperty()
  @IsInt()
  preclassifierId: number;

  preclassifierCode?: string;
  preclassifierDescription?: string;

  @ApiProperty()
  @IsInt()
  creatorId: number;

  creatorName?: string;

  @ApiProperty()
  @IsInt()
  responsableId: number;

  responsableName?: string;

  @ApiProperty({ required: false })
  @IsInt()
  @IsOptional()
  mechanicId: number | null;

  mechanicName?: string;

  @ApiProperty({ required: false })
  @IsInt()
  @IsOptional()
  userProvisionalSolutionId: number | null;

  userProvisionalSolutionName?: string;

  @ApiProperty({ required: false })
  @IsInt()
  @IsOptional()
  userAppProvisionalSolutionId: number | null;

  userAppProvisionalSolutionName: string;

  @ApiProperty({ required: false })
  @IsInt()
  @IsOptional()
  userDefinitiveSolutionId: number | null;

  userDefinitiveSolutionName?: string;

  @ApiProperty({ required: false })
  @IsInt()
  @IsOptional()
  userAppDefinitiveSolutionId: number | null;

  userAppDefinitiveSolutionName?: string;

  @ApiProperty({ required: false })
  @IsInt()
  @IsOptional()
  managerId: number | null;

  managerName?: string;

  @ApiProperty({ required: false, type: 'Date', example: '2023-06-20T00:00:00.000Z'})
  @IsISO8601()
  cardManagerCloseDate: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  commentsManagerAtCardClose: string | null;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  commentsAtCardCreation: string | null;

  @ApiProperty({ required: false, type: 'Date', example: '2023-06-20T00:00:00.000Z'})
  @IsISO8601()
  cardProvisionalSolutionDate: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  commentsAtCardProvisionalSolution: string | null;

  @ApiProperty({ required: false, type: 'Date', example: '2023-06-20T00:00:00.000Z'})
  @IsISO8601()
  cardDefinitiveSolutionDate: string;

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

  createdAt?: Date
}
