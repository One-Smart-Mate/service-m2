import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { FirebaseModule } from '../firebase/firebase.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NotificationOutboxEntity } from './entities/notification-outbox.entity';
import { NotificationOutboxService } from './notification-outbox.service';
import { NotificationOutboxProcessor } from './notification-outbox.processor';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    FirebaseModule,
    MailModule,
    UsersModule,
    TypeOrmModule.forFeature([NotificationOutboxEntity]),
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationOutboxService,
    NotificationOutboxProcessor,
  ],
  exports: [NotificationsService, NotificationOutboxService],
})
export class NotificationsModule {}
