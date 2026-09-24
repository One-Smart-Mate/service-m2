import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional } from 'class-validator';

export class UpdateCardPriorityDTO {
  @ApiProperty({ description: 'The card Id', required: true })
  @IsNumber()
  cardId: number;
  @ApiProperty({ description: 'The priority Id', required: true })
  @IsNumber()
  priorityId: number;
  @ApiProperty({
    description: 'Deprecated and ignored. The authenticated user is used.',
    required: false,
    deprecated: true,
  })
  @IsOptional()
  @IsNumber()
  idOfUpdatedBy?: number;
}
