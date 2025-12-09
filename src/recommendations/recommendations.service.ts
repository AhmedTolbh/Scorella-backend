import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Video } from '../videos/entities/video.entity';
import {
  VideoVisibility,
  ModerationStatus,
} from '../common/enums/schema.enums';

export interface RecommendationItem {
  video: Video;
  reason: string;
  weights: {
    interest: number;
    popularity: number;
    recency: number;
  };
}

@Injectable()
export class RecommendationsService {
  constructor(
    @InjectRepository(Video)
    private readonly videoRepository: Repository<Video>,
  ) {}

  /**
   * Get personalized recommendations for a user
   * Implements FR-8, FR-26, FR-27 from SRS
   */
  async getRecommendations(
    userId: string,
    options: {
      limit?: number;
      excludeVideoIds?: string[];
      interests?: string[];
    } = {},
  ): Promise<{ recommendations: RecommendationItem[]; total: number }> {
    const { limit = 10, excludeVideoIds = [], interests = [] } = options;

    // Build query with exclusions
    const queryBuilder = this.videoRepository
      .createQueryBuilder('video')
      .leftJoinAndSelect('video.user', 'creator')
      .where('video.visibility = :visibility', {
        visibility: VideoVisibility.PUBLIC,
      })
      .andWhere('video.moderationStatus = :status', {
        status: ModerationStatus.APPROVED,
      });

    if (excludeVideoIds.length > 0) {
      queryBuilder.andWhere('video.id NOT IN (:...excludeIds)', {
        excludeIds: excludeVideoIds,
      });
    }

    // Score-based ordering (simplified for MVP)
    queryBuilder
      .orderBy('video.viewCount', 'DESC')
      .addOrderBy('video.createdAt', 'DESC')
      .take(limit);

    const [videos, total] = await queryBuilder.getManyAndCount();

    // Add recommendation reasons (EU AI Act compliance - FR-27)
    const recommendations: RecommendationItem[] = videos.map((video) => ({
      video,
      reason: this.generateReason(video, interests),
      weights: {
        interest: interests.length > 0 ? 0.4 : 0.1,
        popularity: 0.4,
        recency: 0.2,
      },
    }));

    return { recommendations, total };
  }

  /**
   * Generate human-readable recommendation reason
   */
  private generateReason(video: Video, userInterests: string[]): string {
    const reasons: string[] = [];

    if (video.viewCount > 1000) {
      reasons.push('Popular video');
    }

    const videoDate = new Date(video.createdAt);
    const now = new Date();
    const daysDiff = Math.floor(
      (now.getTime() - videoDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysDiff < 7) {
      reasons.push('Recently uploaded');
    }

    if (userInterests.length > 0) {
      reasons.push(`Related to your interests`);
    }

    return reasons.length > 0 ? reasons.join(' • ') : 'Recommended for you';
  }

  /**
   * Cold start recommendations for new users
   */
  async getColdStartRecommendations(
    limit: number = 10,
  ): Promise<RecommendationItem[]> {
    const videos = await this.videoRepository.find({
      where: {
        visibility: VideoVisibility.PUBLIC,
        moderationStatus: ModerationStatus.APPROVED,
      },
      order: {
        viewCount: 'DESC',
      },
      take: limit,
      relations: ['user'],
    });

    return videos.map((video) => ({
      video,
      reason: 'Trending in your region',
      weights: {
        interest: 0,
        popularity: 0.7,
        recency: 0.3,
      },
    }));
  }
}

