import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, Between } from 'typeorm';
import { AnalyticsEvent, EventType } from '../analytics/entities/analytics-event.entity';
import { Video } from '../videos/entities/video.entity';
import { User } from '../users/entities/user.entity';
import { Cron, CronExpression } from '@nestjs/schedule';

export interface UserActivityProfile {
  userId: string;
  totalWatchTimeMs: number;
  videosWatched: number;
  avgCompletionRate: number;
  preferredTopics: string[];
  engagementScore: number;
  lastActiveAt: Date;
}

export interface VideoPerformanceScore {
  videoId: string;
  qualityScore: number;
  viralPotential: number;
  engagementMultiplier: number;
  factors: {
    completionRate: number;
    likeRatio: number;
    shareVelocity: number;
    commentSentiment: number;
  };
}

@Injectable()
export class AIAnalyticsService implements OnModuleInit {
  private readonly logger = new Logger(AIAnalyticsService.name);

  constructor(
    @InjectRepository(AnalyticsEvent)
    private readonly eventRepository: Repository<AnalyticsEvent>,
    @InjectRepository(Video)
    private readonly videoRepository: Repository<Video>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  onModuleInit() {
    this.logger.log('AI Analytics Service initialized - Background processing enabled');
  }

  /**
   * Calculate user activity profile for personalization
   * Runs analysis on user behavior patterns
   */
  async calculateUserProfile(userId: string): Promise<UserActivityProfile> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get all events for user in last 30 days
    const events = await this.eventRepository.find({
      where: {
        userId,
        createdAt: MoreThan(thirtyDaysAgo),
      },
    });

    // Calculate metrics
    const viewEvents = events.filter((e) => e.eventType === EventType.VIEW_START);
    const completeEvents = events.filter((e) => e.eventType === EventType.VIEW_COMPLETE);

    let totalWatchTime = 0;
    events.forEach((e) => {
      if (e.meta?.playDurationMs) {
        totalWatchTime += e.meta.playDurationMs;
      }
    });

    const completionRate =
      viewEvents.length > 0 ? (completeEvents.length / viewEvents.length) * 100 : 0;

    // Calculate engagement score (0-100)
    const likeEvents = events.filter((e) => e.eventType === EventType.LIKE).length;
    const shareEvents = events.filter((e) => e.eventType === EventType.SHARE).length;
    const commentEvents = events.filter((e) => e.eventType === EventType.COMMENT).length;

    const engagementScore = Math.min(
      100,
      (likeEvents * 2 + shareEvents * 5 + commentEvents * 3 + viewEvents.length * 0.5) /
        Math.max(1, viewEvents.length) *
        10,
    );

    return {
      userId,
      totalWatchTimeMs: totalWatchTime,
      videosWatched: viewEvents.length,
      avgCompletionRate: Math.round(completionRate * 10) / 10,
      preferredTopics: [], // Would be populated from video metadata analysis
      engagementScore: Math.round(engagementScore * 10) / 10,
      lastActiveAt: events[0]?.createdAt || new Date(),
    };
  }

  /**
   * Calculate video performance score for ranking
   * Used by recommendation algorithm
   */
  async calculateVideoScore(videoId: string): Promise<VideoPerformanceScore> {
    const video = await this.videoRepository.findOneBy({ id: videoId });
    if (!video) {
      throw new Error(`Video ${videoId} not found`);
    }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const events = await this.eventRepository.find({
      where: {
        videoId,
        createdAt: MoreThan(sevenDaysAgo),
      },
    });

    const views = events.filter((e) => e.eventType === EventType.VIEW_START).length;
    const completes = events.filter((e) => e.eventType === EventType.VIEW_COMPLETE).length;
    const likes = events.filter((e) => e.eventType === EventType.LIKE).length;
    const shares = events.filter((e) => e.eventType === EventType.SHARE).length;

    const completionRate = views > 0 ? completes / views : 0;
    const likeRatio = views > 0 ? likes / views : 0;
    const shareVelocity = shares / 7; // Shares per day

    // Calculate quality score (0-100)
    const qualityScore =
      completionRate * 40 + // 40% weight on completion
      likeRatio * 30 + // 30% weight on likes
      Math.min(shareVelocity, 1) * 30; // 30% weight on shares (capped)

    // Viral potential based on share velocity and engagement
    const viralPotential = Math.min(100, shareVelocity * 20 + likeRatio * 50);

    return {
      videoId,
      qualityScore: Math.round(qualityScore * 10) / 10,
      viralPotential: Math.round(viralPotential * 10) / 10,
      engagementMultiplier: 1 + qualityScore / 100,
      factors: {
        completionRate: Math.round(completionRate * 100) / 100,
        likeRatio: Math.round(likeRatio * 100) / 100,
        shareVelocity: Math.round(shareVelocity * 100) / 100,
        commentSentiment: 0.5, // Placeholder - would use NLP
      },
    };
  }

  /**
   * Background job: Update video rankings
   * Runs every hour
   */
  @Cron(CronExpression.EVERY_HOUR)
  async updateVideoRankings() {
    this.logger.log('Running hourly video ranking update...');

    try {
      const videos = await this.videoRepository.find({
        where: { status: 'ready' },
        order: { createdAt: 'DESC' },
        take: 100, // Top 100 recent videos
      });

      for (const video of videos) {
        try {
          const score = await this.calculateVideoScore(video.id);
          // Store score in video metadata or separate table
          this.logger.debug(`Video ${video.id} score: ${score.qualityScore}`);
        } catch (error) {
          this.logger.warn(`Failed to score video ${video.id}: ${error.message}`);
        }
      }

      this.logger.log(`Updated rankings for ${videos.length} videos`);
    } catch (error) {
      this.logger.error(`Video ranking update failed: ${error.message}`);
    }
  }

  /**
   * Background job: Detect trending content
   * Runs every 15 minutes
   */
  @Cron(CronExpression.EVERY_10_MINUTES)
  async detectTrending() {
    this.logger.log('Detecting trending content...');

    const fifteenMinutesAgo = new Date();
    fifteenMinutesAgo.setMinutes(fifteenMinutesAgo.getMinutes() - 15);

    // Find videos with sudden spike in views
    const recentViews = await this.eventRepository
      .createQueryBuilder('event')
      .select('event.videoId', 'videoId')
      .addSelect('COUNT(*)', 'viewCount')
      .where('event.eventType = :type', { type: EventType.VIEW_START })
      .andWhere('event.createdAt > :since', { since: fifteenMinutesAgo })
      .groupBy('event.videoId')
      .having('COUNT(*) > :threshold', { threshold: 10 })
      .orderBy('viewCount', 'DESC')
      .limit(10)
      .getRawMany();

    if (recentViews.length > 0) {
      this.logger.log(`Found ${recentViews.length} trending videos`);
      // Could emit event or update cache for trending section
    }
  }

  /**
   * Background job: User engagement analysis
   * Runs daily at midnight
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async dailyUserAnalysis() {
    this.logger.log('Running daily user engagement analysis...');

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dayBefore = new Date();
    dayBefore.setDate(dayBefore.getDate() - 2);

    // Count daily active users
    const dauCount = await this.eventRepository
      .createQueryBuilder('event')
      .select('COUNT(DISTINCT event.userId)', 'count')
      .where('event.createdAt > :since', { since: yesterday })
      .getRawOne();

    this.logger.log(`Daily Active Users: ${dauCount?.count || 0}`);

    // Could store in analytics table or send to monitoring service
  }
}
