import { CardEntity } from '../entities/card.entity';

export interface SyncedCardResult {
  cardUUID: string;
  success: true;
  outcome: 'created' | 'existing';
  card: CardEntity;
}

export interface FailedCardSyncResult {
  cardUUID: string;
  success: false;
  statusCode: number;
  message: string;
}

export type CardSyncItemResult = SyncedCardResult | FailedCardSyncResult;

export interface CardSyncResponse {
  total: number;
  succeeded: number;
  failed: number;
  results: CardSyncItemResult[];
}
