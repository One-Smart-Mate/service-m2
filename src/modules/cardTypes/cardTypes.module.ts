import { Module } from '@nestjs/common';
import { CardTypesService } from './cardTypes.service';
import { CardTypesController } from './cardTypes.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CardTypesEntity } from './entities/cardTypes.entity';
import { CardEntity } from '../card/entities/card.entity';
import { CompanyModule } from '../company/company.module';
import { UsersModule } from '../users/users.module';
import { SiteModule } from '../site/site.module';
import { CardTypesCatalogEntity } from './entities/card.types.catalog.entity';
import { FirebaseModule } from '../firebase/firebase.module';

@Module({
  imports: [
    SiteModule,
    CardEntity,
    CompanyModule,
    UsersModule,
    FirebaseModule,
    TypeOrmModule.forFeature([CardTypesEntity, CardTypesCatalogEntity,CardEntity]),
  ],
  controllers: [CardTypesController],
  providers: [CardTypesService],
  exports: [CardTypesService],
})
export class CardTypesModule {}
