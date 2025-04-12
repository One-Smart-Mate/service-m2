import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMinSize,
  ArrayNotEmpty,
  IsArray,
  IsEmail,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { stringConstants } from 'src/utils/string.constant';

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

  @ApiProperty({ 
    description: 'Lenguaje del correo de bienvenida', 
    example: 'ES',
    enum: [stringConstants.LANG_ES, stringConstants.LANG_EN],
    default: stringConstants.LANG_ES,
    required: false
  })
  @IsString()
  translation?: typeof stringConstants.LANG_ES | typeof stringConstants.LANG_EN = stringConstants.LANG_ES;
}
