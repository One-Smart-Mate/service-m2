import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsString, Length, MinLength, Matches } from 'class-validator';

export class ResetPasswordDTO {
  @ApiProperty({ description: 'email', example: 'username@domain' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'password', example: '********', minimum: 8 })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(8)
  newPassword: string;

  @ApiProperty({ description: 'code', example: 'AFA123', minimum: 6 })
  @IsString()
  @Length(6, 6)
  @Matches(/^[A-Z0-9]{6}$/i)
  resetCode: string;
}
