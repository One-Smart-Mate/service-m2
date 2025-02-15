import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, IsUrl } from 'class-validator';

export class UpdateCiltDto {
  @ApiProperty({
    description: 'ID of the CILT procedure',
    example: 1,
    type: 'number',
  })
  @IsInt()
  @IsNotEmpty()
  id: number;

  @ApiProperty({
    description: 'Updated name of the CILT procedure',
    example: 'Advanced Cleaning',
    type: 'string',
    maxLength: 255,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  name: string;

  @ApiProperty({
    description: 'Updated description of the procedure',
    example: 'More detailed steps for advanced cleaning.',
    type: 'string',
  })
  @IsString()
  @IsOptional()
  description: string | null;

  @ApiProperty({
    description: 'Updated list of required tools',
    example: 'Vacuum cleaner, disinfectant, protective gear',
    type: 'string',
  })
  @IsString()
  @IsOptional()
  toolsRequired: string | null;

  @ApiProperty({
    description: 'Indicates if the updated procedure meets the standard',
    example: false,
    type: 'boolean',
  })
  @IsBoolean()
  @IsOptional()
  standardOk: boolean;

  @ApiProperty({
    description: 'Updated repository URL for documentation',
    example: 'https://example.com/cilt-updated-docs',
    type: 'string',
  })
  @IsUrl()
  @IsOptional()
  repositoryUrl: string | null;
}
