'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreVertical, Pencil, Trash2, Share2, ExternalLink, Image, ImageIcon } from 'lucide-react';
import { Album } from '@/hooks/use-albums';
import { uploadApi } from '@/lib/api';
import { AlbumCoverModal } from './album-cover-modal';

interface AlbumCardProps {
  album: Album;
  onEdit: (album: Album) => void;
  onDelete: (album: Album) => void;
  onShare: (album: Album) => void;
}

export function AlbumCard({ album, onEdit, onDelete, onShare }: AlbumCardProps) {
  const formattedDate = new Date(album.createdAt).toLocaleDateString('pt-BR');
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [coverModalOpen, setCoverModalOpen] = useState(false);

  useEffect(() => {
    if (album.thumbnailKey) {
      uploadApi.getPresignedUrl(album.thumbnailKey)
        .then(({ data }) => setThumbnailUrl(data.url))
        .catch(() => setThumbnailUrl(null));
    } else {
      setThumbnailUrl(null);
    }
  }, [album.thumbnailKey]);

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <Link href={`/albums/${album.id}`}>
        <div className="aspect-video bg-gray-100 flex items-center justify-center overflow-hidden">
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt={album.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <Image className="h-12 w-12 text-gray-300" />
          )}
        </div>
      </Link>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <Link href={`/albums/${album.id}`} className="flex-1">
            <h3 className="font-semibold truncate hover:text-blue-600">{album.title}</h3>
            {album.description && (
              <p className="text-sm text-gray-500 line-clamp-2 mt-1">{album.description}</p>
            )}
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(album)}>
                <Pencil className="h-4 w-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onShare(album)}>
                <Share2 className="h-4 w-4 mr-2" />
                {album.isPublic ? 'Gerenciar link' : 'Compartilhar'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCoverModalOpen(true)}>
                <ImageIcon className="h-4 w-4 mr-2" />
                Definir capa
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(album)} className="text-red-600">
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
      <CardFooter className="px-4 py-3 bg-gray-50 flex justify-between items-center">
        <span className="text-xs text-gray-500">{formattedDate}</span>
        {album.isPublic && (
          <span className="text-xs text-green-600 flex items-center gap-1">
            <ExternalLink className="h-3 w-3" />
            Publico
          </span>
        )}
      </CardFooter>

      <AlbumCoverModal
        album={album}
        open={coverModalOpen}
        onOpenChange={setCoverModalOpen}
      />
    </Card>
  );
}
