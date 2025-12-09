import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiBody } from '@nestjs/swagger';
import { VideosService } from './videos.service';

@ApiTags('videos')
@Controller('videos')
export class VideosController {
  constructor(private readonly videosService: VideosService) {}

  @Post('upload-url')
  @ApiOperation({ summary: 'Get presigned upload URL for video' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'string', format: 'uuid' },
        contentType: { type: 'string', example: 'video/mp4' },
      },
    },
  })
  async getUploadUrl(@Body() body: { userId: string; contentType: string }) {
    return this.videosService.generatePresignedUrl(
      body.userId,
      body.contentType,
    );
  }

  @Patch(':id/confirm')
  @ApiOperation({ summary: 'Confirm video upload and set metadata' })
  @ApiParam({ name: 'id', description: 'Video ID' })
  confirm(
    @Param('id') id: string,
    @Body() body?: { title?: string; description?: string; duration?: number },
  ) {
    return this.videosService.confirmUpload(id, body);
  }

  @Post(':id/view')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Record a video view' })
  async recordView(@Param('id') id: string) {
    await this.videosService.incrementViewCount(id);
  }

  @Post(':id/like')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Like a video' })
  async like(@Param('id') id: string) {
    await this.videosService.incrementLikeCount(id);
  }

  @Delete(':id/like')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Unlike a video' })
  async unlike(@Param('id') id: string) {
    await this.videosService.decrementLikeCount(id);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search videos by title or description' })
  search(@Query('q') query: string) {
    return this.videosService.search(query);
  }

  @Get('feed')
  @ApiOperation({ summary: 'Get video feed' })
  findAll() {
    return this.videosService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single video by ID' })
  findOne(@Param('id') id: string) {
    return this.videosService.findOne(id);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get videos by user' })
  findByUser(@Param('userId') userId: string) {
    return this.videosService.findByUser(userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update video metadata' })
  update(
    @Param('id') id: string,
    @Body() body: { title?: string; description?: string },
  ) {
    return this.videosService.updateMetadata(id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a video' })
  async delete(@Param('id') id: string) {
    await this.videosService.delete(id);
  }
}

