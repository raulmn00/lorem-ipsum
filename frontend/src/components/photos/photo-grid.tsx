'use client';

import { useState } from 'react';
import { Photo } from '@/hooks/use-photos';
import { PhotoCard } from './photo-card';
import { PhotoModal } from './photo-modal';
import { Skeleton } from '@/components/ui/skeleton';

interface PhotoGridProps {
  photos: Photo[];
  isLoading: boolean;
}

export function PhotoGrid({ photos, isLoading }: PhotoGridProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="aspect-square" />
            <Skeleton className="h-4 w-3/4" />
          </div>
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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {photos.map((photo) => (
          <PhotoCard
            key={photo.id}
            photo={photo}
            onClick={() => setSelectedPhoto(photo)}
            onEdit={() => {
              setSelectedPhoto(photo);
            }}
            onDelete={() => {
              // Will be handled in modal
              setSelectedPhoto(photo);
            }}
          />
        ))}
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
