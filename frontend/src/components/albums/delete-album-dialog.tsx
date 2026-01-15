'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Album, useDeleteAlbum } from '@/hooks/use-albums';

interface DeleteAlbumDialogProps {
  album: Album | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteAlbumDialog({ album, open, onOpenChange }: DeleteAlbumDialogProps) {
  const deleteAlbum = useDeleteAlbum();

  const handleDelete = async () => {
    if (!album) return;
    await deleteAlbum.mutateAsync(album.id);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Excluir album</DialogTitle>
          <DialogDescription>
            Tem certeza que deseja excluir o album &quot;{album?.title}&quot;? Esta acao nao pode ser desfeita.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleteAlbum.isPending}>
            {deleteAlbum.isPending ? 'Excluindo...' : 'Excluir'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
