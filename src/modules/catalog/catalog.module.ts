import { Module } from '@nestjs/common';
import { CatalogController } from './catalog.controller';
import { CatalogService } from './catalog.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module';
import { CatalogSnapshotReader } from './catalog-snapshot.reader';

@Module({
  imports: [
    UsersModule,
    TypeOrmModule.forFeature([]),
  ],
  controllers: [CatalogController],
  providers: [CatalogService, CatalogSnapshotReader],
  exports: [CatalogService],
})
export class CatalogModule {}
