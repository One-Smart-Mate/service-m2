import { IsNumber, IsString } from 'class-validator';

export class SendCardAssignmentDto {
  @IsNumber()
  userId: number;

  @IsNumber()
  cardId: number;

  @IsString()
  cardName: string;
}
