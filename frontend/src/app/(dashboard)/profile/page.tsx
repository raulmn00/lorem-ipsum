'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Camera, Loader2, User, Mail, Calendar } from 'lucide-react';
import { uploadApi, authApi } from '@/lib/api';
import { toast } from 'sonner';

interface ProfileFormData {
  name: string;
}

const ACCEPTED_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
};

const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<ProfileFormData>({
    defaultValues: {
      name: user?.name || '',
    },
  });

  // Load avatar URL - use directly if external URL, otherwise get presigned URL from MinIO
  useEffect(() => {
    if (user?.avatarUrl) {
      // If it's an external URL (Google, etc), use it directly
      if (user.avatarUrl.startsWith('http://') || user.avatarUrl.startsWith('https://')) {
        setAvatarUrl(user.avatarUrl);
      } else {
        // Otherwise, get presigned URL from MinIO
        uploadApi.getPresignedUrl(user.avatarUrl)
          .then(({ data }) => setAvatarUrl(data.url))
          .catch(() => setAvatarUrl(null));
      }
    } else {
      setAvatarUrl(null);
    }
  }, [user?.avatarUrl]);

  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const onDropAvatar = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      const file = acceptedFiles[0];
      setIsUploading(true);

      try {
        await uploadApi.uploadAvatar(file);
        await refreshUser();
        toast.success('Foto de perfil atualizada!');
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Erro ao atualizar foto');
      } finally {
        setIsUploading(false);
      }
    },
    [refreshUser]
  );

  const onDropRejected = useCallback((fileRejections: any[]) => {
    fileRejections.forEach((rejection) => {
      const { file, errors } = rejection;
      errors.forEach((error: any) => {
        if (error.code === 'file-too-large') {
          const sizeMB = (file.size / 1024 / 1024).toFixed(1);
          toast.error(`${file.name} (${sizeMB}MB) excede o tamanho maximo de 5MB`);
        } else if (error.code === 'file-invalid-type') {
          toast.error(`${file.name} nao e um tipo de arquivo suportado`);
        }
      });
    });
  }, []);

  const { getRootProps, getInputProps, open } = useDropzone({
    onDrop: onDropAvatar,
    onDropRejected,
    accept: ACCEPTED_TYPES,
    maxSize: MAX_SIZE,
    maxFiles: 1,
    noClick: true,
    noKeyboard: true,
  });

  const onSubmit = async (data: ProfileFormData) => {
    setIsUpdating(true);
    try {
      await authApi.updateProfile(data);
      await refreshUser();
      toast.success('Perfil atualizado!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao atualizar perfil');
    } finally {
      setIsUpdating(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-32 w-32 rounded-full mx-auto" />
            <Skeleton className="h-10 w-full mt-6" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Meu Perfil</h1>

      {/* Avatar Card */}
      <Card>
        <CardHeader>
          <CardTitle>Foto de Perfil</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center">
          <div {...getRootProps()} className="relative group">
            <input {...getInputProps()} />
            <Avatar className="h-32 w-32">
              <AvatarImage src={avatarUrl || undefined} />
              <AvatarFallback className="text-3xl">{initials || 'U'}</AvatarFallback>
            </Avatar>
            <button
              onClick={open}
              disabled={isUploading}
              className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer disabled:cursor-not-allowed"
            >
              {isUploading ? (
                <Loader2 className="h-8 w-8 text-white animate-spin" />
              ) : (
                <Camera className="h-8 w-8 text-white" />
              )}
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            Clique na foto para alterar. JPG, PNG ou WebP. Max 5MB.
          </p>
        </CardContent>
      </Card>

      {/* Profile Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Informacoes Pessoais</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Nome
              </Label>
              <Input
                id="name"
                {...register('name', { required: 'Nome e obrigatorio' })}
                placeholder="Seu nome"
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </Label>
              <Input value={user.email} disabled className="bg-gray-50" />
              <p className="text-xs text-gray-500">O email nao pode ser alterado</p>
            </div>

            <Button type="submit" disabled={isUpdating}>
              {isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar alteracoes'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Account Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Informacoes da Conta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 text-sm">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span className="text-gray-500">Membro desde:</span>
            <span>Janeiro 2026</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
