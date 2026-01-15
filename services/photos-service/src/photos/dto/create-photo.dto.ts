import {
  IsString,
  IsUUID,
  IsNumber,
  IsOptional,
  MaxLength,
  IsDateString,
} from 'class-validator';

export class CreatePhotoDto {
  @IsUUID()
  albumId: string;

  @IsString()
  @MaxLength(255)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsString()
  fileKey: string;

  @IsOptional()
  @IsString()
  thumbnailKey?: string;

  @IsNumber()
  sizeBytes: number;

  @IsString()
  mimeType: string;

  @IsString()
  dominantColor: string;

  @IsDateString()
  acquiredAt: string;
}
