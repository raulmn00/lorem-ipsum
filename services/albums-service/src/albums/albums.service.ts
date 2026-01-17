import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { randomBytes } from 'crypto';
import { Album } from './entities/album.entity';
import { CreateAlbumDto, UpdateAlbumDto } from './dto';

@Injectable()
export class AlbumsService {
  private readonly photosServiceUrl: string;

  constructor(
    @InjectRepository(Album)
    private albumsRepository: Repository<Album>,
    private httpService: HttpService,
    private configService: ConfigService,
  ) {
    this.photosServiceUrl = this.configService.get<string>('PHOTOS_SERVICE_URL') || 'http://localhost:4003';
  }

  async findAllByUser(userId: string, page = 1, limit = 10) {
    const [albums, total] = await this.albumsRepository.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: albums,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, userId: string): Promise<Album> {
    const album = await this.albumsRepository.findOne({
      where: { id, userId },
    });

    if (!album) {
      throw new NotFoundException('Álbum não encontrado');
    }

    return album;
  }

  async create(userId: string, createAlbumDto: CreateAlbumDto): Promise<Album> {
    const album = this.albumsRepository.create({
      ...createAlbumDto,
      userId,
    });

    return this.albumsRepository.save(album);
  }

  async update(
    id: string,
    userId: string,
    updateAlbumDto: UpdateAlbumDto,
  ): Promise<Album> {
    const album = await this.findOne(id, userId);

    Object.assign(album, updateAlbumDto);

    return this.albumsRepository.save(album);
  }

  async remove(id: string, userId: string): Promise<void> {
    const album = await this.findOne(id, userId);

    // Check if album has photos
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.photosServiceUrl}/photos/album/${id}/count`, {
          headers: {
            'x-user-id': userId,
            'x-user-email': 'internal@system',
          },
        }),
      );

      if (response.data.count > 0) {
        throw new BadRequestException(
          `Não é possível excluir o álbum pois ele contém ${response.data.count} foto(s). Exclua as fotos primeiro.`
        );
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      // If photos service is unavailable, log but allow deletion
      console.error('Could not check photos count:', error.message);
    }

    await this.albumsRepository.remove(album);
  }

  async share(id: string, userId: string): Promise<{ token: string; url: string }> {
    const album = await this.findOne(id, userId);

    if (!album.publicToken) {
      album.publicToken = randomBytes(32).toString('hex');
      album.isPublic = true;
      await this.albumsRepository.save(album);
    }

    return {
      token: album.publicToken,
      url: `/shared/${album.publicToken}`,
    };
  }

  async unshare(id: string, userId: string): Promise<void> {
    const album = await this.findOne(id, userId);

    album.publicToken = null;
    album.isPublic = false;
    await this.albumsRepository.save(album);
  }

  async findByPublicToken(token: string): Promise<Album> {
    const album = await this.albumsRepository.findOne({
      where: { publicToken: token, isPublic: true },
    });

    if (!album) {
      throw new NotFoundException('Álbum não encontrado ou não está compartilhado');
    }

    return album;
  }

  async setThumbnail(id: string, userId: string, thumbnailKey: string): Promise<Album> {
    const album = await this.findOne(id, userId);
    album.thumbnailKey = thumbnailKey;
    return this.albumsRepository.save(album);
  }

  async removeThumbnail(id: string, userId: string): Promise<Album> {
    const album = await this.findOne(id, userId);
    album.thumbnailKey = null;
    return this.albumsRepository.save(album);
  }
}
