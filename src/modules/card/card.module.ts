import { forwardRef, Module } from '@nestjs/common';
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
import { UserEntity } from '../users/entities/user.entity';
import { LevelModule } from '../level/level.module';
import { CardNoteEntity } from '../cardNotes/card.notes.entity';
import { FirebaseModule } from '../firebase/firebase.module';
import { AmDiscardReasonEntity } from '../amDiscardReason/entities/am-discard-reason.entity';
import { CardCreationPersistence } from './card-creation.persistence';
import { CardSolutionPersistence } from './card-solution.persistence';
import { CardMutationPersistence } from './card-mutation.persistence';
import { CardDeltaSyncReader } from './card-delta-sync.reader';
import { CardEvidenceUploadEntity } from './entities/card-evidence-upload.entity';
import { CardEvidenceUploadService } from './card-evidence-upload.service';
import { R2CardEvidenceService } from './r2-card-evidence.service';

@Module({
  imports: [
    SiteModule,
    PriorityModule,
    CardTypesModule,
    PreclassifierModule,
    UsersModule,
    forwardRef(() => LevelModule),
    FirebaseModule,
    TypeOrmModule.forFeature([CardEntity, CardEvidenceUploadEntity, EvidenceEntity, CardNoteEntity, UserEntity, AmDiscardReasonEntity]),
  ],
  controllers: [CardController],
  providers: [
    CardService,
    CardCreationPersistence,
    CardSolutionPersistence,
    CardMutationPersistence,
    CardDeltaSyncReader,
    R2CardEvidenceService,
    CardEvidenceUploadService,
  ],
  exports: [CardService],
})
export class CardModule {}
