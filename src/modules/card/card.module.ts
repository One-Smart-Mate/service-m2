import { Module } from '@nestjs/common';
import { CardService } from './card.service';
import { CardController } from './card.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CardEntity } from './entities/card.entity';
import { EvidenceEntity } from '../evidence/entities/evidence.entity';
import { SiteModule } from '../site/site.module';
import { PriorityModule } from '../priority/priority.module';
import { CardTypesModule } from '../cardTypes/cardTypes.module';
import { PreclassifierModule } from '../preclassifier/preclassifier.module';
import { UsersModule } from '../users/users.module';
import { LevelModule } from '../level/level.module';
import { CardNoteEntity } from '../cardNotes/card.notes.entity';
import { FirebaseModule } from '../firebase/firebase.module';

@Module({
  imports: [
    SiteModule,
    PriorityModule,
    CardTypesModule,
    PreclassifierModule,
    UsersModule,
    LevelModule,
    FirebaseModule,
    TypeOrmModule.forFeature([CardEntity, EvidenceEntity, CardNoteEntity]),
  ],
  controllers: [CardController],
  providers: [CardService],
  exports: [CardService],
})
export class CardModule {}
