import { Injectable, BadRequestException } from '@nestjs/common';
import sharp from 'sharp';
import exifr from 'exifr';
import Vibrant from 'node-vibrant';
import { fromBuffer as fileTypeFromBuffer } from 'file-type';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
];

const THUMBNAIL_SIZE = 300;

export interface ImageMetadata {
  mimeType: string;
  sizeBytes: number;
  acquiredAt: Date;
  dominantColor: string;
}

export interface ProcessedImage {
  original: Buffer;
  thumbnail: Buffer;
  metadata: ImageMetadata;
}

@Injectable()
export class ImageService {
  async processImage(buffer: Buffer): Promise<ProcessedImage> {
    // Validate mime-type
    const fileType = await fileTypeFromBuffer(buffer);
    if (!fileType || !ALLOWED_MIME_TYPES.includes(fileType.mime)) {
      throw new BadRequestException(
        `Tipo de arquivo não permitido. Use: ${ALLOWED_MIME_TYPES.join(', ')}`,
      );
    }

    // Extract EXIF data for acquired date
    let acquiredAt = new Date();
    try {
      const exifData = await exifr.parse(buffer, { pick: ['DateTimeOriginal', 'CreateDate'] });
      if (exifData?.DateTimeOriginal) {
        acquiredAt = new Date(exifData.DateTimeOriginal);
      } else if (exifData?.CreateDate) {
        acquiredAt = new Date(exifData.CreateDate);
      }
    } catch {
      // EXIF parsing failed, use current date
    }

    // Extract dominant color
    let dominantColor = '#808080';
    try {
      const palette = await Vibrant.from(buffer).getPalette();
      if (palette.Vibrant) {
        dominantColor = palette.Vibrant.hex;
      } else if (palette.Muted) {
        dominantColor = palette.Muted.hex;
      }
    } catch {
      // Color extraction failed, use default gray
    }

    // Generate thumbnail
    const thumbnail = await sharp(buffer)
      .resize(THUMBNAIL_SIZE, THUMBNAIL_SIZE, {
        fit: 'cover',
        position: 'center',
      })
      .jpeg({ quality: 80 })
      .toBuffer();

    return {
      original: buffer,
      thumbnail,
      metadata: {
        mimeType: fileType.mime,
        sizeBytes: buffer.length,
        acquiredAt,
        dominantColor,
      },
    };
  }
}
