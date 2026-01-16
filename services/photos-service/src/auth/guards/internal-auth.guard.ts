import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class InternalAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const userId = request.headers['x-user-id'];
    const userEmail = request.headers['x-user-email'];

    if (!userId || !userEmail) {
      throw new UnauthorizedException('Missing user headers');
    }

    // Attach user to request
    request['user'] = {
      id: userId as string,
      email: userEmail as string,
    };

    return true;
  }
}
