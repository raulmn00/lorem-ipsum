'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreVertical, Pencil, Trash2, Download } from 'lucide-react';
import { Photo, usePresignedUrl } from '@/hooks/use-photos';

interface PhotoCardProps {
  photo: Photo;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function PhotoCard({ photo, onClick, onEdit, onDelete }: PhotoCardProps) {
  const { data: thumbnailUrl } = usePresignedUrl(photo.thumbnailKey);
  const { data: fullUrl } = usePresignedUrl(photo.fileKey);

  const handleDownload = async () => {
    if (fullUrl) {
      window.open(fullUrl, '_blank');
    }
  };

  return (
    <Card
      className="overflow-hidden group cursor-pointer hover:shadow-lg transition-shadow"
      style={{ backgroundColor: photo.dominantColor }}
    >
      <div className="relative aspect-square" onClick={onClick}>
        {thumbnailUrl && (
          <img
            src={thumbnailUrl}
            alt={photo.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
      </div>
      <div className="p-2 bg-white flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{photo.title}</p>
          <p className="text-xs text-gray-500">
            {new Date(photo.acquiredAt).toLocaleDateString('pt-BR')}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              <Pencil className="h-4 w-4 mr-2" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete} className="text-red-600">
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Card>
  );
}
