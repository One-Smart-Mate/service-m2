import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsInt, IsPositive } from 'class-validator';

export class ValidateTrainingDTO {
  @ApiProperty({
    description: 'Training record ids the supervisor is validating',
    example: [10, 11, 12],
    type: [Number],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  @IsPositive({ each: true })
  recordIds: number[];
}
