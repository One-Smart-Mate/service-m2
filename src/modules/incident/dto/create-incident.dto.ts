
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsIn } from 'class-validator';

export class CreateIncidentDto {
  @ApiProperty({ 
    example: 'browser',
    enum: ['browser', 'android', 'ios'],
    description: 'Platform where the incident occurred'
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(['browser', 'android', 'ios'])
  platform: 'browser' | 'android' | 'ios';

  @ApiProperty({ 
    example: 'This is a test description',
    description: 'Description of the incident'
  })
  @IsString()
  @IsNotEmpty()
  description: string;
}
