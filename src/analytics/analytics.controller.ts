import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Headers,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader, ApiBody } from '@nestjs/swagger';
import { AnalyticsService, BatchEventDto } from './analytics.service';

@ApiTags('analytics')
@Controller('api/v1')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post('events')
  @ApiOperation({
    summary: 'Record batch of analytics events',
    description:
      'Receives batch events from iOS client (view_start, view_percent, like, etc.)',
  })
  @ApiHeader({ name: 'x-user-id', required: true })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        events: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              eventType: { type: 'string', example: 'view_start' },
              videoId: { type: 'string', format: 'uuid' },
              sessionId: { type: 'string', format: 'uuid' },
              meta: {
                type: 'object',
                properties: {
                  playDurationMs: { type: 'number' },
                  percentWatched: { type: 'number' },
                },
              },
            },
          },
        },
      },
    },
  })
  async recordEvents(
    @Headers('x-user-id') userId: string,
    @Body('events') events: BatchEventDto[],
  ) {
    const result = await this.analyticsService.recordEvents(userId, events);
    return {
      success: true,
      message: `Recorded ${result.count} events`,
    };
  }

  @Get('videos/:videoId/analytics')
  @ApiOperation({
    summary: 'Get video analytics (Creator Dashboard)',
    description: 'Returns views, watch time, completion rate, etc.',
  })
  async getVideoAnalytics(
    @Param('videoId') videoId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const analytics = await this.analyticsService.getVideoAnalytics(
      videoId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );

    return {
      success: true,
      data: analytics,
    };
  }

  @Get('videos/:videoId/insights')
  @ApiOperation({
    summary: 'Get simplified insights for video',
    description: 'Returns human-readable insights like "Most viewers drop off after 5 seconds"',
  })
  async getVideoInsights(@Param('videoId') videoId: string) {
    const insights = await this.analyticsService.getVideoInsights(videoId);

    return {
      success: true,
      data: { insights },
    };
  }
}
