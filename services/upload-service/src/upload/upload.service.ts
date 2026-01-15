import { Injectable } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { StorageService } from '../storage/storage.service';
import { ImageService, ProcessedImage } from '../image/image.service';

export interface UploadResult {
  fileKey: string;
  thumbnailKey: string;
  sizeBytes: number;
  mimeType: string;
  dominantColor: string;
  acquiredAt: Date;
}

@Injectable()
export class UploadService {
  constructor(
    private storageService: StorageService,
    private imageService: ImageService,
  ) {}

  async uploadPhoto(
    userId: string,
    albumId: string,
    buffer: Buffer,
  ): Promise<UploadResult> {
    // Process image (validate, extract metadata, generate thumbnail)
    const processed: ProcessedImage = await this.imageService.processImage(buffer);

    // Generate unique keys for storage
    const photoId = uuid();
    const fileKey = `${userId}/${albumId}/${photoId}.jpg`;
    const thumbnailKey = `${userId}/${albumId}/${photoId}_thumb.jpg`;

    // Upload to MinIO
    await this.storageService.uploadFile(
      fileKey,
      processed.original,
      processed.metadata.mimeType,
    );

    await this.storageService.uploadFile(
      thumbnailKey,
      processed.thumbnail,
      'image/jpeg',
    );

    return {
      fileKey,
      thumbnailKey,
      sizeBytes: processed.metadata.sizeBytes,
      mimeType: processed.metadata.mimeType,
      dominantColor: processed.metadata.dominantColor,
      acquiredAt: processed.metadata.acquiredAt,
    };
  }

  async getPresignedUrl(key: string): Promise<string> {
    return this.storageService.getPresignedUrl(key);
  }

  async deletePhoto(fileKey: string, thumbnailKey: string): Promise<void> {
    await Promise.all([
      this.storageService.deleteFile(fileKey),
      thumbnailKey ? this.storageService.deleteFile(thumbnailKey) : Promise.resolve(),
    ]);
  }
}
