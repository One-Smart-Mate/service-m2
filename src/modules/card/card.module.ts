import { Module } from '@nestjs/common';
import { CardService } from './card.service';
import { CardController } from './card.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CardEntity } from './entities/card.entity';
import { SiteModule } from '../site/site.module';
import { PriorityModule } from '../priority/priority.module';
import { CardTypesModule } from '../cardTypes/cardTypes.module';
import { PreclassifierModule } from '../preclassifier/preclassifier.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [SiteModule, PriorityModule, CardTypesModule, PreclassifierModule, UsersModule,TypeOrmModule.forFeature([CardEntity])],
  controllers: [CardController],
  providers: [CardService],
})
export class CardModule {}
