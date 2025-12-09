import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Query,
} from '@nestjs/common';
import { VideosService } from './videos.service';

@Controller('videos')
export class VideosController {
  constructor(private readonly videosService: VideosService) {}

  @Post('upload-url')
  async getUploadUrl(@Body() body: { userId: string; contentType: string }) {
    return this.videosService.generatePresignedUrl(
      body.userId,
      body.contentType,
    );
  }

  @Patch(':id/confirm')
  confirm(@Param('id') id: string) {
    return this.videosService.confirmUpload(id);
  }

  @Get('search')
  search(@Query('q') query: string) {
    return this.videosService.search(query);
  }

  @Get('feed')
  findAll() {
    return this.videosService.findAll();
  }

  @Get('user/:userId')
  findByUser(@Param('userId') userId: string) {
    return this.videosService.findByUser(userId);
  }
}
