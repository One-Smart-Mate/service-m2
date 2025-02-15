import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength, IsUrl } from 'class-validator';

export class CreateCiltDto {
  @ApiProperty({
    description: 'Name of the CILT procedure',
    example: 'Cleaning',
    type: 'string',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({
    description: 'Description of the procedure',
    example: 'Step-by-step instructions on how to perform cleaning tasks.',
    type: 'string',
  })
  @IsString()
  @IsOptional()
  description: string | null;

  @ApiProperty({
    description: 'List of required tools',
    example: 'Broom, detergent, protective gloves',
    type: 'string',
  })
  @IsString()
  @IsOptional()
  toolsRequired: string | null;

  @ApiProperty({
    description: 'Indicates if the procedure meets the standard',
    example: true,
    type: 'boolean',
  })
  @IsBoolean()
  @IsOptional()
  standardOk: boolean;

  @ApiProperty({
    description: 'Repository URL for documentation',
    example: 'https://example.com/cilt-docs',
    type: 'string',
  })
  @IsUrl()
  @IsOptional()
  repositoryUrl: string | null;
}
