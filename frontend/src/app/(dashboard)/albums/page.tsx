'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Album, useAlbums, useShareAlbum } from '@/hooks/use-albums';
import { AlbumCard } from '@/components/albums/album-card';
import { CreateAlbumDialog } from '@/components/albums/create-album-dialog';
import { EditAlbumDialog } from '@/components/albums/edit-album-dialog';
import { DeleteAlbumDialog } from '@/components/albums/delete-album-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

export default function AlbumsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useAlbums(page, 12);
  const shareAlbum = useShareAlbum();

  const [createOpen, setCreateOpen] = useState(false);
  const [editAlbum, setEditAlbum] = useState<Album | null>(null);
  const [deleteAlbum, setDeleteAlbum] = useState<Album | null>(null);

  const handleShare = async (album: Album) => {
    if (album.isPublic && album.publicToken) {
      const url = `${window.location.origin}/shared/${album.publicToken}`;
      await navigator.clipboard.writeText(url);
      toast.success('Link copiado para a area de transferencia!');
    } else {
      const result = await shareAlbum.mutateAsync(album.id);
      const url = `${window.location.origin}/shared/${result.token}`;
      await navigator.clipboard.writeText(url);
      toast.success('Link de compartilhamento criado e copiado!');
    }
  };

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Erro ao carregar albuns</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Meus Albuns</h1>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo album
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-video" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : data?.data.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">Voce ainda nao tem nenhum album</p>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Criar primeiro album
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {data?.data.map((album) => (
              <AlbumCard
                key={album.id}
                album={album}
                onEdit={setEditAlbum}
                onDelete={setDeleteAlbum}
                onShare={handleShare}
              />
            ))}
          </div>

          {data && data.meta.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Anterior
              </Button>
              <span className="flex items-center px-4">
                Pagina {page} de {data.meta.totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.min(data.meta.totalPages, p + 1))}
                disabled={page === data.meta.totalPages}
              >
                Proxima
              </Button>
            </div>
          )}
        </>
      )}

      <CreateAlbumDialog open={createOpen} onOpenChange={setCreateOpen} />
      <EditAlbumDialog album={editAlbum} open={!!editAlbum} onOpenChange={(open) => !open && setEditAlbum(null)} />
      <DeleteAlbumDialog album={deleteAlbum} open={!!deleteAlbum} onOpenChange={(open) => !open && setDeleteAlbum(null)} />
    </div>
  );
}
