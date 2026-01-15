import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { User } from '../users/entities/user.entity';
import { PasswordReset } from './entities/password-reset.entity';
import {
  RegisterDto,
  LoginDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  GoogleAuthDto,
} from './dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(PasswordReset)
    private passwordResetRepository: Repository<PasswordReset>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto) {
    const existingUser = await this.usersRepository.findOne({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email já cadastrado');
    }

    const passwordHash = await bcrypt.hash(registerDto.password, 12);

    const user = this.usersRepository.create({
      name: registerDto.name,
      email: registerDto.email,
      passwordHash,
    });

    await this.usersRepository.save(user);

    return this.generateTokens(user);
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersRepository.findOne({
      where: { email: loginDto.email },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    return this.generateTokens(user);
  }

  async googleAuth(googleAuthDto: GoogleAuthDto) {
    let user = await this.usersRepository.findOne({
      where: { googleId: googleAuthDto.googleId },
    });

    if (!user) {
      user = await this.usersRepository.findOne({
        where: { email: googleAuthDto.email },
      });

      if (user) {
        user.googleId = googleAuthDto.googleId;
        user.avatarUrl = googleAuthDto.avatarUrl || user.avatarUrl;
        await this.usersRepository.save(user);
      } else {
        user = this.usersRepository.create({
          name: googleAuthDto.name,
          email: googleAuthDto.email,
          googleId: googleAuthDto.googleId,
          avatarUrl: googleAuthDto.avatarUrl,
        });
        await this.usersRepository.save(user);
      }
    }

    return this.generateTokens(user);
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<{ token: string } | null> {
    const user = await this.usersRepository.findOne({
      where: { email: forgotPasswordDto.email },
    });

    if (!user) {
      return null;
    }

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    const passwordReset = this.passwordResetRepository.create({
      userId: user.id,
      token,
      expiresAt,
    });

    await this.passwordResetRepository.save(passwordReset);

    return { token };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const passwordReset = await this.passwordResetRepository.findOne({
      where: { token: resetPasswordDto.token },
      relations: ['user'],
    });

    if (!passwordReset) {
      throw new NotFoundException('Token inválido');
    }

    if (passwordReset.usedAt) {
      throw new UnauthorizedException('Token já utilizado');
    }

    if (new Date() > passwordReset.expiresAt) {
      throw new UnauthorizedException('Token expirado');
    }

    const passwordHash = await bcrypt.hash(resetPasswordDto.password, 12);

    await this.usersRepository.update(passwordReset.userId, { passwordHash });

    passwordReset.usedAt = new Date();
    await this.passwordResetRepository.save(passwordReset);

    return { message: 'Senha atualizada com sucesso' };
  }

  async validateUser(userId: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id: userId } });
  }

  async refreshTokens(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_SECRET'),
      });

      const user = await this.usersRepository.findOne({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new UnauthorizedException('Usuário não encontrado');
      }

      return this.generateTokens(user);
    } catch {
      throw new UnauthorizedException('Token inválido');
    }
  }

  private generateTokens(user: User) {
    const payload = { sub: user.id, email: user.email };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN', '7d'),
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    };
  }
}
