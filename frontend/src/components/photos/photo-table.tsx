'use client';

import { useState } from 'react';
import { Photo, usePresignedUrl } from '@/hooks/use-photos';
import { useSetAlbumThumbnail } from '@/hooks/use-albums';
import { PhotoModal } from './photo-modal';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreVertical, Pencil, Trash2, Download, ImageIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface PhotoTableProps {
  photos: Photo[];
  isLoading: boolean;
  albumId: string;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function PhotoTableRow({
  photo,
  onView,
  onSetAsCover
}: {
  photo: Photo;
  onView: () => void;
  onSetAsCover: () => void;
}) {
  const { data: thumbnailUrl } = usePresignedUrl(photo.thumbnailKey);
  const { data: fullUrl } = usePresignedUrl(photo.fileKey);

  const handleDownload = () => {
    if (fullUrl) {
      window.open(fullUrl, '_blank');
    }
  };

  return (
    <TableRow className="cursor-pointer hover:bg-gray-50" onClick={onView}>
      <TableCell>
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded overflow-hidden flex-shrink-0"
            style={{ backgroundColor: photo.dominantColor }}
          >
            {thumbnailUrl && (
              <img
                src={thumbnailUrl}
                alt={photo.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            )}
          </div>
          <span className="font-medium truncate max-w-[200px]">{photo.title}</span>
        </div>
      </TableCell>
      <TableCell className="text-gray-600">
        {formatFileSize(photo.sizeBytes)}
      </TableCell>
      <TableCell className="text-gray-600">
        {new Date(photo.acquiredAt).toLocaleDateString('pt-BR')}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded border border-gray-300"
            style={{ backgroundColor: photo.dominantColor }}
            title={photo.dominantColor}
          />
          <span className="text-sm text-gray-600">{photo.dominantColor}</span>
        </div>
      </TableCell>
      <TableCell onClick={(e) => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onView}>
              <Pencil className="h-4 w-4 mr-2" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onSetAsCover}>
              <ImageIcon className="h-4 w-4 mr-2" />
              Definir como capa
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onView} className="text-red-600">
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

export function PhotoTable({ photos, isLoading, albumId }: PhotoTableProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const setThumbnail = useSetAlbumThumbnail();

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        Nenhuma foto neste album ainda
      </div>
    );
  }

  return (
    <>
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">Foto</TableHead>
              <TableHead className="w-[100px]">Tamanho</TableHead>
              <TableHead className="w-[150px]">Data de aquisicao</TableHead>
              <TableHead className="w-[150px]">Cor predominante</TableHead>
              <TableHead className="w-[60px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {photos.map((photo) => (
              <PhotoTableRow
                key={photo.id}
                photo={photo}
                onView={() => setSelectedPhoto(photo)}
                onSetAsCover={() => {
                  setThumbnail.mutate({ albumId, thumbnailKey: photo.thumbnailKey || photo.fileKey });
                }}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      <PhotoModal
        photo={selectedPhoto}
        photos={photos}
        open={!!selectedPhoto}
        onOpenChange={(open) => !open && setSelectedPhoto(null)}
        onPhotoChange={setSelectedPhoto}
      />
    </>
  );
}
