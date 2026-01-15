'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCreateAlbum } from '@/hooks/use-albums';

const createAlbumSchema = z.object({
  title: z.string().min(1, 'Titulo e obrigatorio').max(255),
  description: z.string().max(1000).optional(),
});

type CreateAlbumForm = z.infer<typeof createAlbumSchema>;

interface CreateAlbumDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateAlbumDialog({ open, onOpenChange }: CreateAlbumDialogProps) {
  const createAlbum = useCreateAlbum();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateAlbumForm>({
    resolver: zodResolver(createAlbumSchema),
  });

  const onSubmit = async (data: CreateAlbumForm) => {
    await createAlbum.mutateAsync(data);
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar novo album</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titulo</Label>
              <Input id="title" {...register('title')} />
              {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descricao (opcional)</Label>
              <Textarea id="description" {...register('description')} rows={3} />
              {errors.description && <p className="text-sm text-red-500">{errors.description.message}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createAlbum.isPending}>
              {createAlbum.isPending ? 'Criando...' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
