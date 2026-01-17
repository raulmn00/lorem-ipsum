import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';

@Injectable()
export class CombinedAuthGuard implements CanActivate {
  private jwtGuard = new (AuthGuard('jwt'))();

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    // First, try internal auth headers
    const userId = request.headers['x-user-id'];
    const userEmail = request.headers['x-user-email'];

    if (userId && userEmail) {
      request['user'] = {
        id: userId as string,
        email: userEmail as string,
      };
      return true;
    }

    // If no internal headers, try JWT
    try {
      return await this.jwtGuard.canActivate(context) as boolean;
    } catch {
      throw new UnauthorizedException('Authentication required');
    }
  }
}
