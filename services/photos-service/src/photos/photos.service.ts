import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { Photo } from './entities/photo.entity';
import { CreatePhotoDto, UpdatePhotoDto } from './dto';

@Injectable()
export class PhotosService {
  private readonly albumsServiceUrl: string;

  constructor(
    @InjectRepository(Photo)
    private photosRepository: Repository<Photo>,
    private httpService: HttpService,
    private configService: ConfigService,
  ) {
    this.albumsServiceUrl = this.configService.get<string>('ALBUMS_SERVICE_URL') || 'http://localhost:4002';
  }

  async findByAlbum(
    albumId: string,
    page = 1,
    limit = 20,
    sort: 'acquired_at' | 'created_at' = 'acquired_at',
    order: 'ASC' | 'DESC' = 'DESC',
  ) {
    const orderField = sort === 'acquired_at' ? 'acquiredAt' : 'createdAt';

    const [photos, total] = await this.photosRepository.findAndCount({
      where: { albumId },
      order: { [orderField]: order },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: photos,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findBySharedAlbum(token: string, page = 1, limit = 20) {
    // Verify the album is shared by calling albums-service
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.albumsServiceUrl}/albums/shared/${token}`),
      );
      const album = response.data;

      // Get photos for this album
      return this.findByAlbum(album.id, page, limit);
    } catch {
      throw new NotFoundException('Álbum não encontrado ou não está compartilhado');
    }
  }

  async findOne(id: string): Promise<Photo> {
    const photo = await this.photosRepository.findOne({
      where: { id },
    });

    if (!photo) {
      throw new NotFoundException('Foto não encontrada');
    }

    return photo;
  }

  async create(createPhotoDto: CreatePhotoDto): Promise<Photo> {
    const photo = this.photosRepository.create({
      ...createPhotoDto,
      acquiredAt: new Date(createPhotoDto.acquiredAt),
    });

    return this.photosRepository.save(photo);
  }

  async update(id: string, updatePhotoDto: UpdatePhotoDto): Promise<Photo> {
    const photo = await this.findOne(id);
    Object.assign(photo, updatePhotoDto);
    return this.photosRepository.save(photo);
  }

  async remove(id: string): Promise<void> {
    const photo = await this.findOne(id);
    await this.photosRepository.remove(photo);
  }

  async countByAlbum(albumId: string): Promise<number> {
    return this.photosRepository.count({ where: { albumId } });
  }
}
