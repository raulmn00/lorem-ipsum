import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { photosApi, uploadApi } from '@/lib/api';
import { toast } from 'sonner';

export interface Photo {
  id: string;
  albumId: string;
  title: string;
  description: string | null;
  fileKey: string;
  thumbnailKey: string | null;
  sizeBytes: number;
  mimeType: string;
  dominantColor: string;
  acquiredAt: string;
  createdAt: string;
}

export interface PaginatedPhotos {
  data: Photo[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export function usePhotos(
  albumId: string,
  page = 1,
  limit = 20,
  sort: 'acquired_at' | 'created_at' = 'acquired_at',
  order: 'ASC' | 'DESC' = 'DESC'
) {
  return useQuery<PaginatedPhotos>({
    queryKey: ['photos', albumId, page, limit, sort, order],
    queryFn: async () => {
      const { data } = await photosApi.getByAlbum(albumId, page, limit, sort, order);
      return data;
    },
    enabled: !!albumId,
  });
}

export function usePhoto(id: string) {
  return useQuery<Photo>({
    queryKey: ['photo', id],
    queryFn: async () => {
      const { data } = await photosApi.getOne(id);
      return data;
    },
    enabled: !!id,
  });
}

export function useUpdatePhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { title?: string; description?: string } }) => {
      const response = await photosApi.update(id, data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['photos', data.albumId] });
      queryClient.invalidateQueries({ queryKey: ['photo', data.id] });
      toast.success('Foto atualizada com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao atualizar foto');
    },
  });
}

export function useDeletePhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, albumId }: { id: string; albumId: string }) => {
      await photosApi.delete(id);
      return albumId;
    },
    onSuccess: (albumId) => {
      queryClient.invalidateQueries({ queryKey: ['photos', albumId] });
      toast.success('Foto excluida com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao excluir foto');
    },
  });
}

export function useUploadPhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ albumId, file }: { albumId: string; file: File }) => {
      const { data } = await uploadApi.uploadPhoto(albumId, file);
      return { ...data, albumId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['photos', data.albumId] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao fazer upload');
    },
  });
}

export function useUploadPhotos() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ albumId, files }: { albumId: string; files: File[] }) => {
      const { data } = await uploadApi.uploadPhotos(albumId, files);
      return { ...data, albumId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['photos', data.albumId] });
      toast.success(`${data.photos?.length || 0} fotos enviadas com sucesso!`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao fazer upload');
    },
  });
}

export function usePresignedUrl(key: string | null) {
  return useQuery<string>({
    queryKey: ['presigned', key],
    queryFn: async () => {
      if (!key) return '';
      const { data } = await uploadApi.getPresignedUrl(key);
      return data.url;
    },
    enabled: !!key,
    staleTime: 55 * 60 * 1000, // 55 minutes (presigned URLs expire in 1 hour)
  });
}
