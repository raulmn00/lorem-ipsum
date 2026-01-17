'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, User, Image, Settings } from 'lucide-react';
import { uploadApi } from '@/lib/api';

export function Header() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

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

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="border-b bg-white">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/albums" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Image className="h-6 w-6 text-blue-600" />
          <span className="font-semibold text-lg">Meus Albuns</span>
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10">
                <AvatarImage src={avatarUrl || undefined} />
                <AvatarFallback>{initials || 'U'}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/profile" className="flex items-center gap-2 cursor-pointer">
                <Settings className="h-4 w-4" />
                <span>Meu Perfil</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2 text-red-600">
              <LogOut className="h-4 w-4" />
              <span>Sair</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
