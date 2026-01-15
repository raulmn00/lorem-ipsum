import {
  Controller,
  All,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { ProxyService } from '../proxy/proxy.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../auth/decorators/current-user.decorator';

@Controller()
export class GatewayController {
  constructor(private proxyService: ProxyService) {}

  // Auth routes (public)
  @All('auth/*')
  async authRoutes(@Req() req: Request) {
    const path = req.path.replace('/api', '');
    return this.proxyService.forward('auth', path, req.method, req.body);
  }

  // Albums routes (protected)
  @All('albums/*')
  @UseGuards(JwtAuthGuard)
  async albumsRoutes(
    @Req() req: Request,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const path = req.path.replace('/api', '');
    return this.proxyService.forward('albums', path, req.method, req.body, {
      'x-user-id': user.id,
      'x-user-email': user.email,
    });
  }

  @All('albums')
  @UseGuards(JwtAuthGuard)
  async albumsRoot(
    @Req() req: Request,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const path = req.path.replace('/api', '');
    return this.proxyService.forward('albums', path, req.method, req.body, {
      'x-user-id': user.id,
      'x-user-email': user.email,
    });
  }

  // Public album sharing (no auth)
  @All('albums/shared/*')
  async sharedAlbumRoute(@Req() req: Request) {
    const path = req.path.replace('/api', '');
    return this.proxyService.forward('albums', path, req.method, req.body);
  }

  // Photos routes (protected)
  @All('photos/*')
  @UseGuards(JwtAuthGuard)
  async photosRoutes(
    @Req() req: Request,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const path = req.path.replace('/api', '');
    return this.proxyService.forward('photos', path, req.method, req.body, {
      'x-user-id': user.id,
      'x-user-email': user.email,
    });
  }

  // Upload routes (protected) - Note: For file uploads, use direct connection
  @All('upload/*')
  @UseGuards(JwtAuthGuard)
  async uploadRoutes(
    @Req() req: Request,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const path = req.path.replace('/api', '');
    return this.proxyService.forward('upload', path, req.method, req.body, {
      'x-user-id': user.id,
      'x-user-email': user.email,
    });
  }
}
