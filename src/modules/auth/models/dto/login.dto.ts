import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { stringConstants } from 'src/utils/string.constant';

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
    example: stringConstants.OS_WEB, 
    enum: [stringConstants.OS_WEB, stringConstants.OS_ANDROID, stringConstants.OS_IOS, 'app'],
    required: false,
    default: stringConstants.OS_WEB
  })
  @IsOptional()
  @IsString()
  @IsIn([stringConstants.OS_WEB, stringConstants.OS_ANDROID, stringConstants.OS_IOS, 'app'])
  platform: string = stringConstants.OS_WEB;
}
