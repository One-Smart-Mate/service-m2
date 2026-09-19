import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthSessionService } from './auth-session.service';
import { AuthSessionEntity } from './entities/auth-session.entity';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([AuthSessionEntity])],
  providers: [AuthSessionService],
  exports: [AuthSessionService],
})
export class AuthSessionModule {}
