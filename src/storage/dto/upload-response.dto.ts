import { ApiProperty } from '@nestjs/swagger';

export class UploadResponseDto {
  @ApiProperty({
    description: 'Presigned URL for uploading the file',
    example: 'https://scorella-storage.ams3.digitaloceanspaces.com/...',
  })
  uploadUrl: string;

  @ApiProperty({
    description: 'Video ID in database',
    example: '47417131-b310-4ede-b13d-f0cb8cd43db3',
  })
  videoId: string;

  @ApiProperty({
    description: 'Storage key/path for the file',
    example: 'raw/user-id/video-id.mp4',
  })
  fileKey: string;

  @ApiProperty({
    description: 'Public URL to access the file after upload',
    example: 'https://scorella-storage.ams3.digitaloceanspaces.com/raw/user-id/video-id.mp4',
  })
  publicUrl: string;

  @ApiProperty({
    description: 'URL expiration time in seconds',
    example: 3600,
  })
  expiresIn: number;
}
