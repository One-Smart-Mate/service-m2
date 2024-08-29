import { ApiProperty } from "@nestjs/swagger";
import { IsNumber } from "class-validator";

export class UpdateCardReponsibleDTO {
  @ApiProperty({ description: 'The card Id', required: true })
  @IsNumber()
  cardId: number;
  @ApiProperty({ description: 'The responsible Id', required: true })
  @IsNumber()
  responsibleId: number;
  @ApiProperty({ description: 'The id of updated by', required: true })
  @IsNumber()
  idOfUpdatedBy: number;
}
