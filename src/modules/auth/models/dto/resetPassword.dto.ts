import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class ResestPasswordDTO {
  @ApiProperty({ description: 'email', example: 'username@domain' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'password', example: '********', minimum: 8 })
  @Transform(({ value }) => value.trim())
  @IsString()
  @MinLength(8)
  newPassword;
}
