import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { CreateCardDTO } from './create.card.dto';

export const CARD_SYNC_BATCH_MAX_SIZE = 25;

export class SyncCardsDTO {
  @ApiProperty({ type: [CreateCardDTO], maxItems: CARD_SYNC_BATCH_MAX_SIZE })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(CARD_SYNC_BATCH_MAX_SIZE)
  @ArrayUnique((card?: CreateCardDTO | null) => card?.cardUUID)
  @ValidateNested({ each: true })
  @Type(() => CreateCardDTO)
  cards: CreateCardDTO[];
}
