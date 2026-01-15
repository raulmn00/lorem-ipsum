import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { ProxyModule } from './proxy/proxy.module';
import { GatewayModule } from './gateway/gateway.module';
import { JwtStrategy } from './auth/strategies/jwt.strategy';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    ProxyModule,
    GatewayModule,
  ],
  providers: [JwtStrategy],
})
export class AppModule {}
