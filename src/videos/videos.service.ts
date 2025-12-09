import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository, Like } from 'typeorm';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Video } from './entities/video.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class VideosService {
  private s3Client: S3Client;
  private logger = new Logger(VideosService.name);
  private bucketName: string;

  constructor(
    @InjectRepository(Video)
    private videosRepository: Repository<Video>,
    private configService: ConfigService,
  ) {
    // Config for DigitalOcean Spaces (S3 Compatible)
    const endpoint =
      this.configService.get<string>('S3_ENDPOINT') || 'http://localhost:9000';
    const region = this.configService.get<string>('S3_REGION') || 'us-east-1';

    this.bucketName =
      this.configService.get<string>('S3_BUCKET_VIDEOS') || 'scorella-videos';

    this.s3Client = new S3Client({
      endpoint: endpoint,
      region: region,
      credentials: {
        accessKeyId: this.configService.get<string>('S3_ACCESS_KEY') || '',
        secretAccessKey: this.configService.get<string>('S3_SECRET_KEY') || '',
      },
      forcePathStyle: false,
    });
  }

  async generatePresignedUrl(userId: string, contentType: string) {
    const fileId = uuidv4();
    const extension = contentType.split('/')[1] || 'mov';
    const key = `raw/${userId}/${fileId}.${extension}`;

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: contentType,
      ACL: 'public-read', // Or private if we want authed access only
    });

    const uploadUrl = await getSignedUrl(this.s3Client, command, {
      expiresIn: 3600,
    });

    // Create 'Pending' Video Record
    const video = this.videosRepository.create({
      userId: userId,
      status: 'uploading',
      videoUrl: `${this.configService.get('S3_ENDPOINT')}/${this.bucketName}/${key}`, // This constructs the public URL. For DO Spaces it might be https://bucket.region.digitaloceanspaces.com/key
    });

    await this.videosRepository.save(video);

    return {
      uploadUrl,
      videoId: video.id,
      key: key,
      publicUrl: video.videoUrl,
    };
  }

  async confirmUpload(videoId: string) {
    await this.videosRepository.update(videoId, { status: 'ready' });
    return this.videosRepository.findOneBy({ id: videoId });
  }

  async findAll() {
    return this.videosRepository.find({
      relations: ['user'],
      order: { createdAt: 'DESC' },
      where: { status: 'ready' },
    });
  }

  async findByUser(userId: string) {
    return this.videosRepository.find({
      where: { userId: userId, status: 'ready' },
      order: { createdAt: 'DESC' },
    });
  }

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
}
