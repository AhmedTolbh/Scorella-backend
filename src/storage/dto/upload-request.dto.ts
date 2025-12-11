import { IsString, IsNotEmpty, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UploadRequestDto {
  @ApiProperty({
    description: 'User ID (UUID format)',
    example: '1e90fbb3-3dfe-499a-8447-33e7367bab40',
  })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    description: 'Content type of the file',
    example: 'video/mp4',
    enum: ['video/mp4', 'video/quicktime', 'video/mov', 'video/x-m4v'],
  })
  @IsString()
  @IsNotEmpty()
  contentType: string;

  @ApiProperty({
    description: 'File size in bytes',
    example: 10485760,
    minimum: 1,
    maximum: 104857600, // 100MB
  })
  @IsNumber()
  @Min(1)
  @Max(104857600) // 100MB max
  fileSize: number;
}
