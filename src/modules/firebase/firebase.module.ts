import { Module } from '@nestjs/common';
import {
  firebaseMessagingProvider,
  firebaseProvider,
} from 'src/config/firebase.config';
import { FirebaseService } from './firebase.service';
import { ConfigModule } from '@nestjs/config';
import { CustomLoggerService } from 'src/common/logger/logger.service';

@Module({
  imports: [ConfigModule],
  providers: [
    firebaseProvider,
    firebaseMessagingProvider,
    FirebaseService,
    CustomLoggerService,
  ],
  exports: [FirebaseService],
})
export class FirebaseModule {}
