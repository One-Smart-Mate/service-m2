import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMinSize,
  ArrayNotEmpty,
  IsArray,
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  Min,
  Matches,
} from 'class-validator';
import { stringConstants } from 'src/utils/string.constant';

export class CreateUserDTO {
  @ApiProperty({ description: 'Name of the user' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Email address of the user' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Phone number of the user' })
  @IsString()
  phoneNumber?: string;

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
    description: 'Language of the welcome email', 
    example: 'ES',
    enum: [stringConstants.LANG_ES, stringConstants.LANG_EN],
    default: stringConstants.LANG_ES,
    required: false
  })
  @IsString()
  translation?: typeof stringConstants.LANG_ES | typeof stringConstants.LANG_EN = stringConstants.LANG_ES;

  @ApiProperty({
    description: 'Fast password for quick access (4 alphanumeric characters: a-z, A-Z, 0-9)',
    required: false,
    example: 'aB3d',
  })
  @IsString()
  @IsOptional()
  @Matches(/^[a-zA-Z0-9]{4}$/, {
    message: 'Fast password must be 4 alphanumeric characters (a-z, A-Z, 0-9)',
  })
  fastPassword?: string;

  @ApiProperty({
    description: 'Status',
    required: false,
    example: 'A, I or C',
    default: 'A',
  })
  @IsString()
  @IsOptional()
  @IsIn([stringConstants.activeStatus, stringConstants.inactiveStatus, stringConstants.cancelledStatus])
  status?: string;
}
