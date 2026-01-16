'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ChevronLeft, ChevronRight, Pencil, Trash2, Download } from 'lucide-react';
import { Photo, usePresignedUrl, useUpdatePhoto, useDeletePhoto } from '@/hooks/use-photos';

interface PhotoModalProps {
  photo: Photo | null;
  photos: Photo[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPhotoChange: (photo: Photo) => void;
}

export function PhotoModal({ photo, photos, open, onOpenChange, onPhotoChange }: PhotoModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const { data: imageUrl } = usePresignedUrl(photo?.fileKey || null);
  const updatePhoto = useUpdatePhoto();
  const deletePhoto = useDeletePhoto();

  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      title: photo?.title || '',
      description: photo?.description || '',
    },
  });

  useEffect(() => {
    if (photo) {
      reset({
        title: photo.title,
        description: photo.description || '',
      });
    }
    setIsEditing(false);
  }, [photo, reset]);

  const currentIndex = photos.findIndex((p) => p.id === photo?.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < photos.length - 1;

  const handlePrev = useCallback(() => {
    if (hasPrev) {
      onPhotoChange(photos[currentIndex - 1]);
    }
  }, [hasPrev, currentIndex, photos, onPhotoChange]);

  const handleNext = useCallback(() => {
    if (hasNext) {
      onPhotoChange(photos[currentIndex + 1]);
    }
  }, [hasNext, currentIndex, photos, onPhotoChange]);

  const onSubmit = async (data: { title: string; description: string }) => {
    if (!photo) return;
    await updatePhoto.mutateAsync({ id: photo.id, data });
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (!photo) return;
    await deletePhoto.mutateAsync({ id: photo.id, albumId: photo.albumId });
    onOpenChange(false);
  };

  const handleDownload = () => {
    if (imageUrl) {
      window.open(imageUrl, '_blank');
    }
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, handlePrev, handleNext]);

  if (!photo) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0" showCloseButton={true}>
        <DialogTitle className="sr-only">{photo.title}</DialogTitle>
        <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
          {imageUrl && (
            <img
              src={imageUrl}
              alt={photo.title}
              className="max-w-full max-h-full object-contain"
            />
          )}

          {hasPrev && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
              onClick={handlePrev}
            >
              <ChevronLeft className="h-8 w-8" />
            </Button>
          )}

          {hasNext && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
              onClick={handleNext}
            >
              <ChevronRight className="h-8 w-8" />
            </Button>
          )}
        </div>

        <div className="p-4 bg-white">
          {isEditing ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="photo-title">Titulo</Label>
                <Input id="photo-title" {...register('title')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="photo-description">Descricao</Label>
                <Textarea id="photo-description" {...register('description')} rows={2} />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={updatePhoto.isPending}>
                  {updatePhoto.isPending ? 'Salvando...' : 'Salvar'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          ) : (
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold">{photo.title}</h3>
                {photo.description && (
                  <p className="text-sm text-gray-600 mt-1">{photo.description}</p>
                )}
                <div className="flex gap-4 mt-2 text-xs text-gray-500">
                  <span>Data: {new Date(photo.acquiredAt).toLocaleDateString('pt-BR')}</span>
                  <span>Tamanho: {(photo.sizeBytes / 1024 / 1024).toFixed(2)} MB</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" onClick={() => setIsEditing(true)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={handleDownload}>
                  <Download className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={handleDelete} className="text-red-600">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
