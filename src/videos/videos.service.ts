import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Video } from './entities/video.entity';
import { SpacesService } from '../storage/spaces.service';
import {
  VideoVisibility,
  ModerationStatus,
} from '../common/enums/schema.enums';

@Injectable()
export class VideosService {
  private logger = new Logger(VideosService.name);

  constructor(
    @InjectRepository(Video)
    private videosRepository: Repository<Video>,
    private spacesService: SpacesService,
  ) {
    this.logger.log('VideosService initialized with SpacesService');
  }

  /**
   * Generate presigned upload URL for video
   * Uses new SpacesService (no ACL headers)
   */
  async generatePresignedUrl(
    userId: string,
    contentType: string,
    fileSize?: number,
  ) {
    // Validate inputs
    this.spacesService.validateContentType(contentType);
    if (fileSize) {
      this.spacesService.validateFileSize(fileSize);
    }

    // Extract file extension
    const extension = contentType.split('/')[1] || 'mp4';

    // Generate presigned URL
    const uploadResult = await this.spacesService.generatePresignedUploadUrl(
      userId,
      contentType,
      extension,
    );

    // Create video record in database
    const video = this.videosRepository.create({
      userId: userId,
      status: 'uploading',
      videoUrl: uploadResult.publicUrl,
      visibility: VideoVisibility.PUBLIC,
      moderationStatus: ModerationStatus.PENDING,
      viewCount: 0,
      likeCount: 0,
    });

    await this.videosRepository.save(video);

    this.logger.log(
      `Generated upload URL for video ${video.id}, expires in ${uploadResult.expiresIn}s`,
    );

    return {
      uploadUrl: uploadResult.uploadUrl,
      videoId: video.id,
      key: uploadResult.fileKey,
      publicUrl: uploadResult.publicUrl,
      expiresIn: uploadResult.expiresIn,
    };
  }

  /**
   * Confirm upload and set video as ready
   */
  async confirmUpload(
    videoId: string,
    metadata?: { title?: string; description?: string; duration?: number },
  ) {
    const video = await this.videosRepository.findOneBy({ id: videoId });
    if (!video) {
      throw new NotFoundException(`Video ${videoId} not found`);
    }

    // Update video metadata
    video.status = 'ready';
    if (metadata?.title) video.title = metadata.title;
    if (metadata?.description) video.description = metadata.description;
    if (metadata?.duration) video.duration = metadata.duration;

    await this.videosRepository.save(video);

    this.logger.log(`Video ${videoId} confirmed as ready`);
    return video;
  }

  /**
   * Increment view count (called when user watches video)
   */
  async incrementViewCount(videoId: string): Promise<void> {
    await this.videosRepository.increment({ id: videoId }, 'viewCount', 1);
  }

  /**
   * Increment like count
   */
  async incrementLikeCount(videoId: string): Promise<void> {
    await this.videosRepository.increment({ id: videoId }, 'likeCount', 1);
  }

  /**
   * Decrement like count
   */
  async decrementLikeCount(videoId: string): Promise<void> {
    await this.videosRepository.decrement({ id: videoId }, 'likeCount', 1);
  }

  /**
   * Get single video by ID
   */
  async findOne(id: string): Promise<Video> {
    const video = await this.videosRepository.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!video) {
      throw new NotFoundException(`Video ${id} not found`);
    }
    return video;
  }

  /**
   * Get all ready videos for feed
   */
  async findAll() {
    return this.videosRepository.find({
      relations: ['user'],
      order: { createdAt: 'DESC' },
      where: {
        status: 'ready',
        visibility: VideoVisibility.PUBLIC,
        moderationStatus: ModerationStatus.APPROVED,
      },
    });
  }

  /**
   * Get videos by user
   */
  async findByUser(userId: string) {
    return this.videosRepository.find({
      where: { userId: userId, status: 'ready' },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Search videos by title/description
   */
  async search(query: string): Promise<Video[]> {
    if (!query) return [];
    return this.videosRepository.find({
      where: [
        { title: Like(`%${query}%`), status: 'ready' },
        { description: Like(`%${query}%`), status: 'ready' },
      ],
      relations: ['user'],
      take: 20,
    });
  }

  /**
   * Update video metadata
   */
  async updateMetadata(
    videoId: string,
    updates: Partial<Pick<Video, 'title' | 'description' | 'visibility'>>,
  ): Promise<Video> {
    const video = await this.findOne(videoId);
    Object.assign(video, updates);
    return this.videosRepository.save(video);
  }

  /**
   * Soft delete video
   */
  async delete(videoId: string): Promise<void> {
    const video = await this.findOne(videoId);
    await this.videosRepository.softDelete(video.id);
    this.logger.log(`Video ${videoId} soft deleted`);
  }
}
