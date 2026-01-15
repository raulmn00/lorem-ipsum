import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { albumsApi } from '@/lib/api';
import { toast } from 'sonner';

export interface Album {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  isPublic: boolean;
  publicToken: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export function useAlbums(page = 1, limit = 10) {
  return useQuery<PaginatedResponse<Album>>({
    queryKey: ['albums', page, limit],
    queryFn: async () => {
      const { data } = await albumsApi.getAll(page, limit);
      return data;
    },
  });
}

export function useAlbum(id: string) {
  return useQuery<Album>({
    queryKey: ['album', id],
    queryFn: async () => {
      const { data } = await albumsApi.getOne(id);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateAlbum() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { title: string; description?: string }) => {
      const response = await albumsApi.create(data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['albums'] });
      toast.success('Album criado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao criar album');
    },
  });
}

export function useUpdateAlbum() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { title?: string; description?: string } }) => {
      const response = await albumsApi.update(id, data);
      return response.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['albums'] });
      queryClient.invalidateQueries({ queryKey: ['album', id] });
      toast.success('Album atualizado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao atualizar album');
    },
  });
}

export function useDeleteAlbum() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await albumsApi.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['albums'] });
      toast.success('Album excluido com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao excluir album');
    },
  });
}

export function useShareAlbum() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await albumsApi.share(id);
      return data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['albums'] });
      queryClient.invalidateQueries({ queryKey: ['album', id] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao compartilhar album');
    },
  });
}

export function useUnshareAlbum() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await albumsApi.unshare(id);
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['albums'] });
      queryClient.invalidateQueries({ queryKey: ['album', id] });
      toast.success('Compartilhamento removido!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao remover compartilhamento');
    },
  });
}
