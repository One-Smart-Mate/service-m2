import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class UpdateCardPriorityDTO {
  @ApiProperty({ description: 'The card Id', required: true })
  @IsNumber()
  cardId: number;
  @ApiProperty({ description: 'The priority Id', required: true })
  @IsNumber()
  priorityId: number;
  @ApiProperty({ description: 'The id of updated by', required: true })
  @IsNumber()
  idOfUpdatedBy: number;
}
