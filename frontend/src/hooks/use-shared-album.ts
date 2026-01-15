import { useQuery } from '@tanstack/react-query';
import { albumsApi, uploadApi } from '@/lib/api';

interface SharedAlbum {
  id: string;
  title: string;
  description: string | null;
  createdAt: string;
}

interface SharedPhoto {
  id: string;
  title: string;
  description: string | null;
  fileKey: string;
  thumbnailKey: string | null;
  dominantColor: string;
  acquiredAt: string;
}

export function useSharedAlbum(token: string) {
  return useQuery<SharedAlbum>({
    queryKey: ['shared-album', token],
    queryFn: async () => {
      const { data } = await albumsApi.getShared(token);
      return data;
    },
    enabled: !!token,
  });
}

// Note: For public photos, we need a public endpoint
// For now, we'll assume the photos are fetched with the album
// In production, you might want to create a separate public photos endpoint
export function usePublicPresignedUrl(key: string | null) {
  return useQuery<string>({
    queryKey: ['public-presigned', key],
    queryFn: async () => {
      if (!key) return '';
      // For public access, we need to use a different endpoint
      // that doesn't require authentication
      const { data } = await uploadApi.getPresignedUrl(key);
      return data.url;
    },
    enabled: !!key,
    staleTime: 55 * 60 * 1000,
  });
}
