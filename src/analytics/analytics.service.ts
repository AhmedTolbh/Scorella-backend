import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { AnalyticsEvent, EventType } from './entities/analytics-event.entity';

export interface BatchEventDto {
  eventType: EventType;
  videoId?: string;
  sessionId?: string;
  timestamp?: number;
  meta?: {
    playDurationMs?: number;
    videoDurationMs?: number;
    percentWatched?: number;
    isScrubbing?: boolean;
    volumeLevel?: number;
  };
  context?: {
    network?: string;
    deviceModel?: string;
    appVersion?: string;
    locale?: string;
  };
}

export interface VideoAnalytics {
  videoId: string;
  views: number;
  avgWatchTimeMs: number;
  completionRate: number;
  likes: number;
  shares: number;
  comments: number;
}

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @InjectRepository(AnalyticsEvent)
    private readonly eventRepository: Repository<AnalyticsEvent>,
  ) {}

  /**
   * Record batch of events from iOS client
   * Implements FR-7 from SRS
   */
  async recordEvents(
    userId: string,
    events: BatchEventDto[],
  ): Promise<{ success: boolean; count: number }> {
    try {
      const entities = events.map((event) => {
        const entity = new AnalyticsEvent();
        entity.userId = userId;
        entity.eventType = event.eventType;
        entity.videoId = event.videoId ?? '';
        entity.sessionId = event.sessionId ?? '';
        entity.meta = event.meta ?? {};
        entity.context = event.context ?? {};
        return entity;
      });

      await this.eventRepository.save(entities);

      this.logger.log(`Recorded ${entities.length} events for user ${userId}`);
      return { success: true, count: entities.length };
    } catch (error) {
      this.logger.error(`Failed to record events: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get analytics for a specific video (Creator Dashboard)
   * Implements FR-23 from SRS
   */
  async getVideoAnalytics(
    videoId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<VideoAnalytics> {
    const where: any = { videoId };

    if (startDate && endDate) {
      where.createdAt = Between(startDate, endDate);
    }

    // Count different event types
    const [viewStarts, viewCompletes, likes, shares, comments] =
      await Promise.all([
        this.eventRepository.count({
          where: { ...where, eventType: EventType.VIEW_START },
        }),
        this.eventRepository.count({
          where: { ...where, eventType: EventType.VIEW_COMPLETE },
        }),
        this.eventRepository.count({
          where: { ...where, eventType: EventType.LIKE },
        }),
        this.eventRepository.count({
          where: { ...where, eventType: EventType.SHARE },
        }),
        this.eventRepository.count({
          where: { ...where, eventType: EventType.COMMENT },
        }),
      ]);

    // Calculate average watch time from view_percent events
    const watchTimeResult = await this.eventRepository
      .createQueryBuilder('event')
      .select("AVG((event.meta->>'playDurationMs')::numeric)", 'avgWatchTime')
      .where('event.videoId = :videoId', { videoId })
      .andWhere('event.eventType = :eventType', {
        eventType: EventType.VIEW_PERCENT,
      })
      .getRawOne();

    const avgWatchTimeMs = parseFloat(watchTimeResult?.avgWatchTime) || 0;
    const completionRate =
      viewStarts > 0 ? (viewCompletes / viewStarts) * 100 : 0;

    return {
      videoId,
      views: viewStarts,
      avgWatchTimeMs: Math.round(avgWatchTimeMs),
      completionRate: Math.round(completionRate * 10) / 10,
      likes,
      shares,
      comments,
    };
  }

  /**
   * Get simplified insights for creators
   * Implements FR-25 from SRS
   */
  async getVideoInsights(videoId: string): Promise<string[]> {
    const analytics = await this.getVideoAnalytics(videoId);
    const insights: string[] = [];

    if (analytics.completionRate < 30) {
      insights.push('Most viewers drop off early. Consider a stronger hook.');
    }

    if (analytics.completionRate > 70) {
      insights.push('Great retention! Viewers are watching till the end.');
    }

    if (analytics.likes / analytics.views > 0.1) {
      insights.push('High like ratio! Your content resonates well.');
    }

    if (analytics.shares / analytics.views > 0.05) {
      insights.push('Good shareability! Viewers find this worth sharing.');
    }

    return insights.length > 0 ? insights : ['Keep creating! More data needed.'];
  }
}
