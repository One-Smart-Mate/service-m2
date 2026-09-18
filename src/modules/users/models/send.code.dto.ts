import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsString, Length, Matches } from 'class-validator';

export class SendCodeDTO {
  @ApiProperty({ description: 'email', example: 'username@domain' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'code', example: 'AFA123', minimum: 6 })
  @IsString()
  @Length(6, 6)
  @Matches(/^[A-Z0-9]{6}$/i)
  resetCode: string;
}
