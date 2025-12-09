import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository, Like } from 'typeorm';
import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Video } from './entities/video.entity';
import { v4 as uuidv4 } from 'uuid';
import {
  VideoVisibility,
  ModerationStatus,
} from '../common/enums/schema.enums';

@Injectable()
export class VideosService {
  private s3Client: S3Client;
  private logger = new Logger(VideosService.name);
  private bucketName: string;
  private spacesEndpoint: string;
  private spacesRegion: string;

  constructor(
    @InjectRepository(Video)
    private videosRepository: Repository<Video>,
    private configService: ConfigService,
  ) {
    // Config for DigitalOcean Spaces (S3 Compatible)
    this.spacesEndpoint =
      this.configService.get<string>('S3_ENDPOINT') || 'https://ams3.digitaloceanspaces.com';
    this.spacesRegion = this.configService.get<string>('S3_REGION') || 'ams3';
    this.bucketName =
      this.configService.get<string>('S3_BUCKET_VIDEOS') || 'scorella-videos';

    this.s3Client = new S3Client({
      endpoint: this.spacesEndpoint,
      region: this.spacesRegion,
      credentials: {
        accessKeyId: this.configService.get<string>('S3_ACCESS_KEY') || '',
        secretAccessKey: this.configService.get<string>('S3_SECRET_KEY') || '',
      },
      forcePathStyle: false, // Required for DigitalOcean Spaces
    });

    this.logger.log(
      `VideosService initialized with bucket: ${this.bucketName} at ${this.spacesEndpoint}`,
    );
  }

  /**
   * Build public URL for DigitalOcean Spaces
   * Format: https://bucket.region.digitaloceanspaces.com/key
   */
  private buildPublicUrl(key: string): string {
    return `https://${this.bucketName}.${this.spacesRegion}.digitaloceanspaces.com/${key}`;
  }

  /**
   * Generate presigned upload URL for video
   */
  async generatePresignedUrl(userId: string, contentType: string) {
    const fileId = uuidv4();
    const extension = contentType.split('/')[1] || 'mov';
    const key = `raw/${userId}/${fileId}.${extension}`;

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: contentType,
      ACL: 'public-read',
    });

    const uploadUrl = await getSignedUrl(this.s3Client, command, {
      expiresIn: 3600, // 1 hour
    });

    // Create 'uploading' Video Record
    const video = this.videosRepository.create({
      userId: userId,
      status: 'uploading',
      videoUrl: this.buildPublicUrl(key),
      visibility: VideoVisibility.PUBLIC,
      moderationStatus: ModerationStatus.PENDING,
    });

    await this.videosRepository.save(video);

    this.logger.log(`Generated upload URL for video ${video.id}`);

    return {
      uploadUrl,
      videoId: video.id,
      key: key,
      publicUrl: video.videoUrl,
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

