import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';
import { stringConstants } from 'src/utils/string.constant';

export class SendCardAssignmentDto {
  @ApiProperty({ description: 'User ID', example: 1 })
  @IsNumber()
  userId: number;

  @ApiProperty({ description: 'Card ID', example: 1 })
  @IsNumber()
  cardId: number;

  @ApiProperty({ description: 'Card name', example: 'Maintenance card' })
  @IsString()
  cardName: string;

  @ApiProperty({ 
    description: 'Language of the email', 
    example: 'ES',
    enum: [stringConstants.LANG_ES, stringConstants.LANG_EN],
    default: stringConstants.LANG_ES,
    required: false
  })
  @IsString()
  @IsOptional()
  translation?: typeof stringConstants.LANG_ES | typeof stringConstants.LANG_EN = stringConstants.LANG_ES;
}
