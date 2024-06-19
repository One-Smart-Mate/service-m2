import { Module } from '@nestjs/common';
import { CardService } from './card.service';
import { CardController } from './card.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CardEntity } from './entities/card.entity';
import { EvidenceEntity } from '../evidence/entities/evidence.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CardEntity, EvidenceEntity])],
  controllers: [CardController],
  providers: [CardService],
})
export class CardModule {}
