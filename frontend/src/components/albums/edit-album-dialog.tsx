'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Album, useUpdateAlbum } from '@/hooks/use-albums';

const editAlbumSchema = z.object({
  title: z.string().min(1, 'Titulo e obrigatorio').max(255),
  description: z.string().max(1000).optional(),
});

type EditAlbumForm = z.infer<typeof editAlbumSchema>;

interface EditAlbumDialogProps {
  album: Album | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditAlbumDialog({ album, open, onOpenChange }: EditAlbumDialogProps) {
  const updateAlbum = useUpdateAlbum();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditAlbumForm>({
    resolver: zodResolver(editAlbumSchema),
  });

  useEffect(() => {
    if (album) {
      reset({
        title: album.title,
        description: album.description || '',
      });
    }
  }, [album, reset]);

  const onSubmit = async (data: EditAlbumForm) => {
    if (!album) return;
    await updateAlbum.mutateAsync({ id: album.id, data });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar album</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Titulo</Label>
              <Input id="edit-title" {...register('title')} />
              {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Descricao (opcional)</Label>
              <Textarea id="edit-description" {...register('description')} rows={3} />
              {errors.description && <p className="text-sm text-red-500">{errors.description.message}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={updateAlbum.isPending}>
              {updateAlbum.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
