import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from './entities/repository.entity';
import { RepositoryService } from './repository.service';

@Module({
  imports: [TypeOrmModule.forFeature([Repository])],
  providers: [RepositoryService],
  exports: [RepositoryService],
})
export class RepositoryModule {} 