import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { PhotosService } from './photos.service';
import { Photo } from './entities/photo.entity';
import { CreatePhotoDto, UpdatePhotoDto } from './dto';

describe('PhotosService', () => {
  let service: PhotosService;
  let repository: jest.Mocked<Repository<Photo>>;

  const mockPhoto: Photo = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    albumId: '123e4567-e89b-12d3-a456-426614174001',
    title: 'Test Photo',
    description: 'Test description',
    fileKey: 'photos/test.jpg',
    thumbnailKey: 'thumbs/test.jpg',
    sizeBytes: 1024000,
    mimeType: 'image/jpeg',
    dominantColor: '#FF5733',
    acquiredAt: new Date('2024-01-15'),
    createdAt: new Date('2024-01-15'),
  };

  const mockRepository = {
    findAndCount: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    count: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PhotosService,
        {
          provide: getRepositoryToken(Photo),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<PhotosService>(PhotosService);
    repository = module.get(getRepositoryToken(Photo));

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByAlbum', () => {
    it('should return paginated photos for an album', async () => {
      const photos = [mockPhoto];
      mockRepository.findAndCount.mockResolvedValue([photos, 1]);

      const result = await service.findByAlbum(mockPhoto.albumId, 1, 20);

      expect(result).toEqual({
        data: photos,
        meta: {
          total: 1,
          page: 1,
          limit: 20,
          totalPages: 1,
        },
      });
      expect(mockRepository.findAndCount).toHaveBeenCalledWith({
        where: { albumId: mockPhoto.albumId },
        order: { acquiredAt: 'DESC' },
        skip: 0,
        take: 20,
      });
    });

    it('should handle pagination correctly', async () => {
      mockRepository.findAndCount.mockResolvedValue([[], 50]);

      const result = await service.findByAlbum(mockPhoto.albumId, 3, 10);

      expect(result.meta).toEqual({
        total: 50,
        page: 3,
        limit: 10,
        totalPages: 5,
      });
      expect(mockRepository.findAndCount).toHaveBeenCalledWith({
        where: { albumId: mockPhoto.albumId },
        order: { acquiredAt: 'DESC' },
        skip: 20,
        take: 10,
      });
    });

    it('should sort by created_at when specified', async () => {
      mockRepository.findAndCount.mockResolvedValue([[], 0]);

      await service.findByAlbum(mockPhoto.albumId, 1, 20, 'created_at', 'ASC');

      expect(mockRepository.findAndCount).toHaveBeenCalledWith({
        where: { albumId: mockPhoto.albumId },
        order: { createdAt: 'ASC' },
        skip: 0,
        take: 20,
      });
    });

    it('should sort by acquired_at in ascending order when specified', async () => {
      mockRepository.findAndCount.mockResolvedValue([[], 0]);

      await service.findByAlbum(mockPhoto.albumId, 1, 20, 'acquired_at', 'ASC');

      expect(mockRepository.findAndCount).toHaveBeenCalledWith({
        where: { albumId: mockPhoto.albumId },
        order: { acquiredAt: 'ASC' },
        skip: 0,
        take: 20,
      });
    });
  });

  describe('findOne', () => {
    it('should return a photo when found', async () => {
      mockRepository.findOne.mockResolvedValue(mockPhoto);

      const result = await service.findOne(mockPhoto.id);

      expect(result).toEqual(mockPhoto);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockPhoto.id },
      });
    });

    it('should throw NotFoundException when photo not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        'Foto não encontrada',
      );
    });
  });

  describe('create', () => {
    it('should create and return a new photo', async () => {
      const createDto: CreatePhotoDto = {
        albumId: mockPhoto.albumId,
        title: 'New Photo',
        description: 'New description',
        fileKey: 'photos/new.jpg',
        thumbnailKey: 'thumbs/new.jpg',
        sizeBytes: 2048000,
        mimeType: 'image/jpeg',
        dominantColor: '#00FF00',
        acquiredAt: '2024-01-20T10:00:00.000Z',
      };

      const createdPhoto = {
        ...mockPhoto,
        ...createDto,
        acquiredAt: new Date(createDto.acquiredAt),
      };

      mockRepository.create.mockReturnValue(createdPhoto);
      mockRepository.save.mockResolvedValue(createdPhoto);

      const result = await service.create(createDto);

      expect(result).toEqual(createdPhoto);
      expect(mockRepository.create).toHaveBeenCalledWith({
        ...createDto,
        acquiredAt: new Date(createDto.acquiredAt),
      });
      expect(mockRepository.save).toHaveBeenCalledWith(createdPhoto);
    });

    it('should create photo without optional fields', async () => {
      const createDto: CreatePhotoDto = {
        albumId: mockPhoto.albumId,
        title: 'New Photo',
        fileKey: 'photos/new.jpg',
        sizeBytes: 2048000,
        mimeType: 'image/jpeg',
        dominantColor: '#00FF00',
        acquiredAt: '2024-01-20T10:00:00.000Z',
      };

      const createdPhoto = {
        ...createDto,
        id: 'new-id',
        acquiredAt: new Date(createDto.acquiredAt),
        createdAt: new Date(),
      };

      mockRepository.create.mockReturnValue(createdPhoto);
      mockRepository.save.mockResolvedValue(createdPhoto);

      const result = await service.create(createDto);

      expect(result).toEqual(createdPhoto);
    });
  });

  describe('update', () => {
    it('should update and return the photo', async () => {
      const updateDto: UpdatePhotoDto = {
        title: 'Updated Title',
        description: 'Updated description',
      };

      const updatedPhoto = { ...mockPhoto, ...updateDto };

      mockRepository.findOne.mockResolvedValue(mockPhoto);
      mockRepository.save.mockResolvedValue(updatedPhoto);

      const result = await service.update(mockPhoto.id, updateDto);

      expect(result).toEqual(updatedPhoto);
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should update only title when description not provided', async () => {
      const updateDto: UpdatePhotoDto = {
        title: 'Updated Title Only',
      };

      const updatedPhoto = { ...mockPhoto, title: updateDto.title };

      mockRepository.findOne.mockResolvedValue(mockPhoto);
      mockRepository.save.mockResolvedValue(updatedPhoto);

      const result = await service.update(mockPhoto.id, updateDto);

      expect(result.title).toBe('Updated Title Only');
    });

    it('should throw NotFoundException when updating non-existent photo', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update('non-existent-id', { title: 'New Title' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove the photo successfully', async () => {
      mockRepository.findOne.mockResolvedValue(mockPhoto);
      mockRepository.remove.mockResolvedValue(mockPhoto);

      await expect(service.remove(mockPhoto.id)).resolves.not.toThrow();
      expect(mockRepository.remove).toHaveBeenCalledWith(mockPhoto);
    });

    it('should throw NotFoundException when removing non-existent photo', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('countByAlbum', () => {
    it('should return the count of photos in an album', async () => {
      mockRepository.count.mockResolvedValue(15);

      const result = await service.countByAlbum(mockPhoto.albumId);

      expect(result).toBe(15);
      expect(mockRepository.count).toHaveBeenCalledWith({
        where: { albumId: mockPhoto.albumId },
      });
    });

    it('should return 0 when album has no photos', async () => {
      mockRepository.count.mockResolvedValue(0);

      const result = await service.countByAlbum('empty-album-id');

      expect(result).toBe(0);
    });
  });
});
