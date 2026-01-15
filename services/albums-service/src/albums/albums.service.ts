import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import { Album } from './entities/album.entity';
import { CreateAlbumDto, UpdateAlbumDto } from './dto';

@Injectable()
export class AlbumsService {
  constructor(
    @InjectRepository(Album)
    private albumsRepository: Repository<Album>,
  ) {}

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
}
