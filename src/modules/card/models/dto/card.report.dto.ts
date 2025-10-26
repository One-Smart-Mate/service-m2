import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, IsIn } from 'class-validator';

export class CardReportGroupedDTO {
  @ApiProperty({ description: 'Site ID', example: 1 })
  @IsInt()
  @IsNotEmpty()
  siteId: number;

  @ApiProperty({ description: 'Root node ID', example: 792 })
  @IsInt()
  @IsNotEmpty()
  rootNode: number;

  @ApiProperty({ description: 'Target level', example: 4 })
  @IsInt()
  @IsNotEmpty()
  targetLevel: number;

  @ApiProperty({ description: 'Grouping level', example: 2 })
  @IsInt()
  @IsNotEmpty()
  groupingLevel: number;

  @ApiProperty({ description: 'Start date', example: '2024-01-01' })
  @IsString()
  @IsNotEmpty()
  dateStart: string;

  @ApiProperty({ description: 'End date', example: '2025-10-31' })
  @IsString()
  @IsNotEmpty()
  dateEnd: string;

  @ApiProperty({
    description: 'Status filter: A (Active), R (Resolved), or AR (Both)',
    example: 'AR',
    required: false,
    enum: ['A', 'R', 'AR']
  })
  @IsOptional()
  @IsString()
  @IsIn(['A', 'R', 'AR'])
  statusFilter?: string;
}

export class CardReportDetailsDTO {
  @ApiProperty({ description: 'Site ID', example: 1 })
  @IsInt()
  @IsNotEmpty()
  siteId: number;

  @ApiProperty({ description: 'Root node ID', example: 792 })
  @IsInt()
  @IsNotEmpty()
  rootId: number;

  @ApiProperty({ description: 'Target level', example: 4 })
  @IsInt()
  @IsNotEmpty()
  targetLevel: number;

  @ApiProperty({ description: 'Start date', example: '2024-01-01' })
  @IsString()
  @IsNotEmpty()
  dateStart: string;

  @ApiProperty({ description: 'End date', example: '2025-10-31' })
  @IsString()
  @IsNotEmpty()
  dateEnd: string;
}

export class CardsByMachineDTO {
  @ApiProperty({ description: 'Site ID', example: 1 })
  @IsInt()
  @IsNotEmpty()
  siteId: number;

  @ApiProperty({ description: 'Machine ID', example: 100 })
  @IsInt()
  @IsNotEmpty()
  machineId: number;

  @ApiProperty({ description: 'Target level', example: 4 })
  @IsInt()
  @IsNotEmpty()
  targetLevel: number;

  @ApiProperty({ description: 'Start date', example: '2024-01-01' })
  @IsString()
  @IsNotEmpty()
  dateStart: string;

  @ApiProperty({ description: 'End date', example: '2025-10-31' })
  @IsString()
  @IsNotEmpty()
  dateEnd: string;
}

export class CardsByComponentsDTO {
  @ApiProperty({ description: 'Site ID', example: 1 })
  @IsInt()
  @IsNotEmpty()
  siteId: number;

  @ApiProperty({
    description: 'Component IDs',
    example: [101, 102, 103],
    type: [Number]
  })
  @IsInt({ each: true })
  @IsNotEmpty()
  componentIds: number[];

  @ApiProperty({ description: 'Start date', example: '2024-01-01' })
  @IsString()
  @IsNotEmpty()
  dateStart: string;

  @ApiProperty({ description: 'End date', example: '2025-10-31' })
  @IsString()
  @IsNotEmpty()
  dateEnd: string;
}

export class CardReportStackedDTO {
  @ApiProperty({ description: 'Site ID', example: 1 })
  @IsInt()
  @IsNotEmpty()
  siteId: number;

  @ApiProperty({ description: 'Root node ID', example: 792 })
  @IsInt()
  @IsNotEmpty()
  rootNode: number;

  @ApiProperty({ description: 'First grouping level (G1)', example: 2 })
  @IsInt()
  @IsNotEmpty()
  g1Level: number;

  @ApiProperty({ description: 'Second grouping level (G2)', example: 3 })
  @IsInt()
  @IsNotEmpty()
  g2Level: number;

  @ApiProperty({ description: 'Target level (for stacking)', example: 5 })
  @IsInt()
  @IsNotEmpty()
  targetLevel: number;

  @ApiProperty({ description: 'Start date', example: '2024-01-01' })
  @IsString()
  @IsNotEmpty()
  dateStart: string;

  @ApiProperty({ description: 'End date', example: '2025-10-31' })
  @IsString()
  @IsNotEmpty()
  dateEnd: string;

  @ApiProperty({
    description: 'Status filter: A (Active), R (Resolved), or AR (Both)',
    example: 'AR',
    required: false,
    enum: ['A', 'R', 'AR']
  })
  @IsOptional()
  @IsString()
  @IsIn(['A', 'R', 'AR'])
  statusFilter?: string;
}
