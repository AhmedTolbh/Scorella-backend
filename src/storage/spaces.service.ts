import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

export interface PresignedUploadResult {
  uploadUrl: string;
  fileKey: string;
  publicUrl: string;
  expiresIn: number;
}

@Injectable()
export class SpacesService {
  private readonly logger = new Logger(SpacesService.name);
  private s3Client: S3Client;
  private bucketName: string;
  private region: string;
  private endpoint: string;

  constructor(private configService: ConfigService) {
    this.endpoint = this.configService.get<string>('S3_ENDPOINT') || 'https://ams3.digitaloceanspaces.com';
    this.region = this.configService.get<string>('S3_REGION') || 'ams3';
    this.bucketName = this.configService.get<string>('S3_BUCKET_VIDEOS') || 'scorella-storage';

    const accessKeyId = this.configService.get<string>('S3_ACCESS_KEY');
    const secretAccessKey = this.configService.get<string>('S3_SECRET_KEY');

    if (!accessKeyId || !secretAccessKey) {
      throw new Error('S3 credentials are missing. Check S3_ACCESS_KEY and S3_SECRET_KEY environment variables.');
    }

    this.s3Client = new S3Client({
      endpoint: this.endpoint,
      region: this.region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      forcePathStyle: false,
    });

    this.logger.log(
      `SpacesService initialized: bucket=${this.bucketName}, region=${this.region}`,
    );
  }

  /**
   * Generate presigned upload URL for DigitalOcean Spaces
   * NOTE: Does NOT use x-amz-acl header (DigitalOcean Spaces doesn't support it)
   */
  async generatePresignedUploadUrl(
    userId: string,
    contentType: string,
    fileExtension: string = 'mp4',
  ): Promise<PresignedUploadResult> {
    const fileId = uuidv4();
    const fileKey = `raw/${userId}/${fileId}.${fileExtension}`;

    // Create PUT command WITHOUT ACL
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: fileKey,
      ContentType: contentType,
      // NOTE: No ACL parameter - DigitalOcean Spaces doesn't support it
    });

    const expiresIn = 3600; // 1 hour
    const uploadUrl = await getSignedUrl(this.s3Client, command, {
      expiresIn,
    });

    const publicUrl = this.buildPublicUrl(fileKey);

    this.logger.log(`Generated presigned URL for file: ${fileKey}`);

    return {
      uploadUrl,
      fileKey,
      publicUrl,
      expiresIn,
    };
  }

  /**
   * Build public URL for DigitalOcean Spaces
   * Format: https://bucket.region.digitaloceanspaces.com/key
   */
  private buildPublicUrl(key: string): string {
    return `https://${this.bucketName}.${this.region}.digitaloceanspaces.com/${key}`;
  }

  /**
   * Validate file size
   */
  validateFileSize(fileSizeBytes: number, maxSizeMB: number = 100): void {
    const maxBytes = maxSizeMB * 1024 * 1024;
    if (fileSizeBytes > maxBytes) {
      throw new Error(
        `File size ${fileSizeBytes} bytes exceeds maximum of ${maxSizeMB}MB`,
      );
    }
  }

  /**
   * Validate content type
   */
  validateContentType(contentType: string): void {
    const allowedTypes = [
      'video/mp4',
      'video/quicktime',
      'video/x-m4v',
      'video/mov',
    ];
    if (!allowedTypes.includes(contentType.toLowerCase())) {
      throw new Error(
        `Content type ${contentType} not allowed. Allowed: ${allowedTypes.join(', ')}`,
      );
    }
  }
}
