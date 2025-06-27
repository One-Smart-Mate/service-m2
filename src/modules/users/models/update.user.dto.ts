import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMinSize,
  ArrayNotEmpty,
  IsArray,
  IsEmail,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  Min,
  Matches,
} from 'class-validator';
import { stringConstants } from 'src/utils/string.constant';

export class UpdateUserDTO {
  @ApiProperty({ description: 'Id', required: true })
  @IsNumber()
  id: number;

  @ApiProperty({ description: 'Name of the user' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Email address of the user' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'ID of the site associated with the user' })
  @IsInt()
  @IsPositive()
  siteId: number;

  @ApiProperty({ description: 'Password for the user', required: false})
  @IsString()
  @IsOptional()
  password: string;

  @ApiProperty({ description: 'Upload card data with DataNet' })
  @IsInt()
  @Min(0)
  @Max(255)
  uploadCardDataWithDataNet: number;

  @ApiProperty({ description: 'Upload card evidence with DataNet' })
  @IsInt()
  @Min(0)
  @Max(255)
  uploadCardEvidenceWithDataNet: number;

  @ApiProperty({ description: 'Roles assigned to the user', type: [Number] })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMinSize(1)
  roles: number[];

  @ApiProperty({
    description: 'Status',
    required: true,
    example: 'A or I',
    minimum: 1,
  })
  @IsString()
  @IsIn([stringConstants.activeStatus, stringConstants.inactiveStatus])
  status: string;

  @ApiProperty({
    description: 'Fast password for quick access (4 letters)',
    required: false,
    example: 'aBcD',
  })
  @IsString()
  @IsOptional()
  @Matches(/^[a-zA-Z]{4}$/, {
    message: 'Fast password must be 4 letters',
  })
  fastPassword?: string;
}
