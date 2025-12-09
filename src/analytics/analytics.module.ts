import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsEvent } from './entities/analytics-event.entity';
import { AIAnalyticsService } from './ai-analytics.service';
import { Video } from '../videos/entities/video.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([AnalyticsEvent, Video, User]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, AIAnalyticsService],
  exports: [AnalyticsService, AIAnalyticsService],
})
export class AnalyticsModule {}
