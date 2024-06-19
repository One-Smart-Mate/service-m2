import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMinSize,
  ArrayNotEmpty,
  IsArray,
  IsEmail,
  IsInt,
  IsPositive,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateUserDTO {
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

  @ApiProperty({ description: 'Password for the user' })
  @IsString()
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
  
}
