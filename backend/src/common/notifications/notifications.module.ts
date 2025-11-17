import { Module } from '@nestjs/common';
import { NotificationsGateway } from './notifications.gateway';
import { LoggerModule } from '../logger/logger.module';

@Module({
  imports: [LoggerModule],
  providers: [NotificationsGateway],
  exports: [NotificationsGateway],
})
export class NotificationsModule {}
