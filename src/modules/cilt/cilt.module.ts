import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CiltService } from './cilt.service';
import { CiltController } from './cilt.controller';
import { CiltEntity } from './entities/cilt.entity';
import { PositionsCiltEntity } from "./entities/cilts.positions.entity";
import { RepositoryEntity } from '../repository/entities/repository.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CiltEntity, 
      PositionsCiltEntity,  // 👈 Agregar tabla intersección con Position
      RepositoryEntity       // 👈 Agregar tabla intersección con Repository
    ]),
  ],
  controllers: [CiltController],
  providers: [CiltService],
  exports: [CiltService],
})
export class CiltModule {}
