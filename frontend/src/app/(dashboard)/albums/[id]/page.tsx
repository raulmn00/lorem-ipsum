'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Share2 } from 'lucide-react';
import { useAlbum, useShareAlbum } from '@/hooks/use-albums';
import { usePhotos } from '@/hooks/use-photos';
import { PhotoGrid } from '@/components/photos/photo-grid';
import { PhotoUpload } from '@/components/photos/photo-upload';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

export default function AlbumDetailPage() {
  const params = useParams();
  const albumId = params.id as string;
  const [page, setPage] = useState(1);
  const [sortOrder, setSortOrder] = useState<'DESC' | 'ASC'>('DESC');

  const { data: album, isLoading: albumLoading } = useAlbum(albumId);
  const { data: photosData, isLoading: photosLoading } = usePhotos(
    albumId,
    page,
    20,
    'acquired_at',
    sortOrder
  );
  const shareAlbum = useShareAlbum();

  const handleShare = async () => {
    if (!album) return;

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

  return (
    <div>
      <div className="mb-8">
        <Link href="/albums" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Voltar aos albuns
        </Link>

        {albumLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
        ) : album ? (
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold">{album.title}</h1>
              {album.description && (
                <p className="text-gray-600 mt-1">{album.description}</p>
              )}
            </div>
            <Button variant="outline" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-2" />
              {album.isPublic ? 'Copiar link' : 'Compartilhar'}
            </Button>
          </div>
        ) : null}
      </div>

      <div className="mb-6">
        <PhotoUpload albumId={albumId} />
      </div>

      <div className="flex items-center justify-between mb-6">
        <span className="text-sm text-gray-600">
          {photosData?.meta.total || 0} foto(s)
        </span>
        <Tabs value={sortOrder} onValueChange={(v) => setSortOrder(v as 'ASC' | 'DESC')}>
          <TabsList>
            <TabsTrigger value="DESC">Mais recentes</TabsTrigger>
            <TabsTrigger value="ASC">Mais antigas</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <PhotoGrid photos={photosData?.data || []} isLoading={photosLoading} albumId={albumId} />

      {photosData && photosData.meta.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Anterior
          </Button>
          <span className="flex items-center px-4">
            Pagina {page} de {photosData.meta.totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.min(photosData.meta.totalPages, p + 1))}
            disabled={page === photosData.meta.totalPages}
          >
            Proxima
          </Button>
        </div>
      )}
    </div>
  );
}
