import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  Length,
  IsNotEmpty,
  IsEmail,
  IsUrl,
  IsISO8601,
  IsIn,
} from 'class-validator';
import { stringConstants } from 'src/utils/string.constant';
export class UpadeSiteDTO {
  @ApiProperty({ type: 'number', description: 'Id', required: true })
  @IsNumber()
  @IsNotEmpty()
  id: number;

  @ApiProperty({
    type: 'string',
    description: 'Site code',
    minLength: 6,
    maxLength: 6,
    required: true,
  })
  @IsString()
  @Length(6, 6, { message: 'Site code must be exactly 6 characters' })
  @IsNotEmpty()
  siteCode: string;

  @ApiProperty({
    type: 'string',
    description: 'Site name',
    maxLength: 100,
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  siteBusinessName: string;

  @ApiProperty({
    type: 'string',
    description: 'Site name',
    maxLength: 100,
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    type: 'string',
    description: 'Site type',
    maxLength: 20,
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  siteType: string;

  @ApiProperty({ description: 'RFC of the company', required: true })
  @IsNotEmpty()
  @IsString()
  rfc: string;

  @ApiProperty({ description: 'Address of the company', required: true })
  @IsNotEmpty()
  @IsString()
  address: string;

  @ApiProperty({ description: 'Contact person', required: true })
  @IsNotEmpty()
  @IsString()
  contact: string;

  @ApiProperty({
    description: 'Position of the contact person',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  position: string;

  @ApiProperty({ description: 'Phone number of the company', required: true })
  @IsNotEmpty()
  @IsString()
  phone: string;

  @ApiProperty({ description: 'Phone extension (Optional)', required: false })
  @IsOptional()
  @IsString()
  extension?: string;

  @ApiProperty({
    description: 'Celular number of the contact person (Optional)',
  })
  @IsString()
  cellular: string;

  @ApiProperty({ description: 'Email address of the company', required: true })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'URL of the company logo',
    required: true,
    example: 'url',
  })
  @IsNotEmpty()
  @IsUrl()
  logo: string;

  @ApiProperty({
    description: 'Latitud',
    example: '37.7749',
  })
  @IsString()
  @IsOptional()
  latitud?: string;

  @ApiProperty({
    description: 'Longitud',
    example: '-122.4194',
  })
  @IsString()
  @IsOptional()
  longitud?: string;

  @ApiProperty({
    type: 'string',
    format: 'date',
    description: 'Due date',
    required: true,
    example: '2023-06-20',
  })
  @IsNotEmpty()
  @IsISO8601()
  dueDate: string;

  @ApiProperty({
    type: 'number',
    description: 'Monthly payment',
    minimum: 0,
    required: true,
  })
  @IsNotEmpty()
  @IsNumber()
  monthlyPayment: number;

  @ApiProperty({
    type: 'string',
    description: 'Currency code',
    maxLength: 3,
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  currency: string;

  @ApiProperty({
    type: 'number',
    description: 'App history days',
    required: true,
  })
  @IsNumber()
  @IsNotEmpty()
  appHistoryDays: number;

  @ApiProperty({
    description: 'Status',
    required: true,
    example: 'A or I',
    minimum: 1,
  })
  @IsNotEmpty()
  @IsString()
  @IsIn([stringConstants.activeStatus, stringConstants.inactiveStatus])
  status: string;

  updatedAt?: Date;
}
