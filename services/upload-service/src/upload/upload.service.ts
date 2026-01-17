import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { v4 as uuid } from 'uuid';
import { firstValueFrom } from 'rxjs';
import { StorageService } from '../storage/storage.service';
import { ImageService, ProcessedImage } from '../image/image.service';

export interface UploadResult {
  id: string;
  fileKey: string;
  thumbnailKey: string;
  sizeBytes: number;
  mimeType: string;
  dominantColor: string;
  acquiredAt: Date;
}

export interface AvatarUploadResult {
  avatarUrl: string;
}

export interface UserInfo {
  id: string;
  email: string;
}

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly photosServiceUrl: string;
  private readonly authServiceUrl: string;

  constructor(
    private storageService: StorageService,
    private imageService: ImageService,
    private httpService: HttpService,
    private configService: ConfigService,
  ) {
    this.photosServiceUrl = this.configService.get<string>('PHOTOS_SERVICE_URL') || 'http://localhost:4003';
    this.authServiceUrl = this.configService.get<string>('AUTH_SERVICE_URL') || 'http://localhost:4001';
  }

  async uploadPhoto(
    user: UserInfo,
    albumId: string,
    buffer: Buffer,
  ): Promise<UploadResult> {
    // Process image (validate, extract metadata, generate thumbnail)
    const processed: ProcessedImage = await this.imageService.processImage(buffer);

    // Generate unique keys for storage
    const photoId = uuid();
    const fileKey = `${user.id}/${albumId}/${photoId}.jpg`;
    const thumbnailKey = `${user.id}/${albumId}/${photoId}_thumb.jpg`;

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

    // Create photo record in photos-service
    const photoRecord = await this.createPhotoRecord(user, {
      albumId,
      title: `Photo ${photoId.substring(0, 8)}`,
      fileKey,
      thumbnailKey,
      sizeBytes: processed.metadata.sizeBytes,
      mimeType: processed.metadata.mimeType,
      dominantColor: processed.metadata.dominantColor,
      acquiredAt: processed.metadata.acquiredAt.toISOString(),
    });

    return {
      id: photoRecord.id,
      fileKey,
      thumbnailKey,
      sizeBytes: processed.metadata.sizeBytes,
      mimeType: processed.metadata.mimeType,
      dominantColor: processed.metadata.dominantColor,
      acquiredAt: processed.metadata.acquiredAt,
    };
  }

  private async createPhotoRecord(user: UserInfo, data: {
    albumId: string;
    title: string;
    fileKey: string;
    thumbnailKey: string;
    sizeBytes: number;
    mimeType: string;
    dominantColor: string;
    acquiredAt: string;
  }): Promise<{ id: string }> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.photosServiceUrl}/photos`, data, {
          headers: {
            'x-user-id': user.id,
            'x-user-email': user.email,
            'Content-Type': 'application/json',
          },
        }),
      );
      this.logger.log(`Photo record created: ${response.data.id}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to create photo record: ${error.message}`);
      throw error;
    }
  }

  async uploadAvatar(user: UserInfo, buffer: Buffer): Promise<AvatarUploadResult> {
    // Process image for avatar (resize to 256x256)
    const processed = await this.imageService.processAvatar(buffer);

    // Generate unique key for avatar (overwrite previous if exists)
    const avatarKey = `avatars/${user.id}.jpg`;

    // Upload to MinIO
    await this.storageService.uploadFile(
      avatarKey,
      processed,
      'image/jpeg',
    );

    // Update user's avatar in auth-service
    await this.updateUserAvatar(user, avatarKey);

    this.logger.log(`Avatar uploaded for user ${user.id}`);

    return { avatarUrl: avatarKey };
  }

  private async updateUserAvatar(user: UserInfo, avatarKey: string): Promise<void> {
    try {
      await firstValueFrom(
        this.httpService.patch(
          `${this.authServiceUrl}/auth/profile`,
          { avatarUrl: avatarKey },
          {
            headers: {
              'x-user-id': user.id,
              'x-user-email': user.email,
              'Content-Type': 'application/json',
            },
          },
        ),
      );
      this.logger.log(`Avatar URL updated in auth-service for user ${user.id}`);
    } catch (error) {
      this.logger.error(`Failed to update avatar URL: ${error.message}`);
      throw error;
    }
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
