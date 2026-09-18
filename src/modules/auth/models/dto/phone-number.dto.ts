import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, Matches } from 'class-validator';

export class PhoneNumberDTO {
  @ApiProperty({ 
    description: 'Phone number without plus sign', 
    example: '527773280963',
    pattern: '^[0-9]{10,15}$'
  })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @Matches(/^[0-9]{10,15}$/, {
    message: 'phoneNumber must be a valid phone number without plus sign (10-15 digits)'
  })
  phoneNumber: string;
}
