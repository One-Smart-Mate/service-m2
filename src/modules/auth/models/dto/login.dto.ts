import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsIn, IsISO8601, IsOptional, IsString, MinLength } from 'class-validator';

export class LoginDTO {
  @ApiProperty({ description: 'email', example: 'username@domain' })
  @Transform(({ value }) => value.trim())
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'password', example: '********', minimum: 8 })
  @Transform(({ value }) => value.trim())
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ 
    description: 'Platform origin of login', 
    example: 'web', 
    enum: ['web', 'app', 'android', 'ios'],
    required: false,
    default: 'web'
  })
  @IsOptional()
  @IsString()
  @IsIn(['web', 'app', 'android', 'ios'])
  platform: string = 'web';

  @ApiProperty({ 
    description: 'Login date and time', 
    example: '2025-05-08T00:00:00.000Z',
    required: false
  })
  @IsOptional()
  @IsISO8601()
  loginDate: string = new Date().toISOString();
}
