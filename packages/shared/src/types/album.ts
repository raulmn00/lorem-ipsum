export interface Album {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  isPublic: boolean;
  publicToken: string | null;
  coverPhotoUrl: string | null;
  photoCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAlbumDto {
  title: string;
  description?: string;
}

export interface UpdateAlbumDto {
  title?: string;
  description?: string;
}

export interface ShareAlbumResponse {
  url: string;
  token: string;
}
