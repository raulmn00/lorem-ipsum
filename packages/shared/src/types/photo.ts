export interface Photo {
  id: string;
  albumId: string;
  title: string;
  description: string | null;
  fileKey: string;
  thumbnailKey: string | null;
  fileUrl?: string;
  thumbnailUrl?: string;
  sizeBytes: number;
  mimeType: string;
  dominantColor: string;
  acquiredAt: Date;
  createdAt: Date;
}

export interface CreatePhotoDto {
  albumId: string;
  title: string;
  description?: string;
  acquiredAt?: Date;
  dominantColor?: string;
}

export interface UpdatePhotoDto {
  title?: string;
  description?: string;
}

export interface UploadPhotoResponse {
  photo: Photo;
  message: string;
}
