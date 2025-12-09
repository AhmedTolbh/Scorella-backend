import { Controller, Get, Query, Headers, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ApiTags, ApiOperation, ApiQuery, ApiHeader } from '@nestjs/swagger';
import { RecommendationsService } from './recommendations.service';

@ApiTags('recommendations')
@Controller('api/v1/recommendations')
export class RecommendationsController {
  constructor(
    private readonly recommendationsService: RecommendationsService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Get personalized video recommendations',
    description:
      'Returns a list of recommended videos based on user interests and behavior. Includes transparency headers for EU AI Act compliance.',
  })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({
    name: 'exclude',
    required: false,
    type: String,
    description: 'Comma-separated video IDs to exclude',
  })
  @ApiHeader({
    name: 'x-user-id',
    required: false,
    description: 'User ID for personalized recommendations',
  })
  async getRecommendations(
    @Query('limit') limit?: number,
    @Query('exclude') exclude?: string,
    @Headers('x-user-id') userId?: string,
    @Res({ passthrough: true }) res?: Response,
  ) {
    const excludeVideoIds = exclude ? exclude.split(',') : [];

    let result;

    if (userId) {
      result = await this.recommendationsService.getRecommendations(userId, {
        limit: limit || 10,
        excludeVideoIds,
      });
    } else {
      // Cold start for anonymous/new users
      const recommendations =
        await this.recommendationsService.getColdStartRecommendations(
          limit || 10,
        );
      result = { recommendations, total: recommendations.length };
    }

    // EU AI Act compliance: Add transparency header (FR-27)
    if (res) {
      res.header(
        'x-rec-reason',
        JSON.stringify({
          algorithm: 'hybrid-scoring',
          factors: ['popularity', 'recency', 'user_interests'],
          version: '1.0',
        }),
      );
    }

    return {
      success: true,
      data: result.recommendations.map((item) => ({
        video: item.video,
        reason: item.reason,
        weights: item.weights,
      })),
      meta: {
        total: result.total,
        algorithm: 'hybrid-scoring',
      },
    };
  }
}
