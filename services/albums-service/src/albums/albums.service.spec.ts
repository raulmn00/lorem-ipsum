import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { AlbumsService } from './albums.service';
import { Album } from './entities/album.entity';

describe('AlbumsService', () => {
  let service: AlbumsService;

  const mockAlbumRepository = {
    findAndCount: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  const mockUserId = 'user-123';
  const mockAlbumId = 'album-456';

  const mockAlbum: Album = {
    id: mockAlbumId,
    userId: mockUserId,
    title: 'Test Album',
    description: 'A test album',
    isPublic: false,
    publicToken: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AlbumsService,
        { provide: getRepositoryToken(Album), useValue: mockAlbumRepository },
      ],
    }).compile();

    service = module.get<AlbumsService>(AlbumsService);
    jest.clearAllMocks();
  });

  describe('findAllByUser', () => {
    it('should return paginated albums for a user', async () => {
      const albums = [mockAlbum];
      mockAlbumRepository.findAndCount.mockResolvedValue([albums, 1]);

      const result = await service.findAllByUser(mockUserId, 1, 10);

      expect(result).toEqual({
        data: albums,
        meta: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      });
      expect(mockAlbumRepository.findAndCount).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        order: { createdAt: 'DESC' },
        skip: 0,
        take: 10,
      });
    });

    it('should calculate correct pagination for multiple pages', async () => {
      const albums = Array(10).fill(mockAlbum);
      mockAlbumRepository.findAndCount.mockResolvedValue([albums, 25]);

      const result = await service.findAllByUser(mockUserId, 2, 10);

      expect(result.meta).toEqual({
        total: 25,
        page: 2,
        limit: 10,
        totalPages: 3,
      });
      expect(mockAlbumRepository.findAndCount).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        order: { createdAt: 'DESC' },
        skip: 10,
        take: 10,
      });
    });

    it('should use default pagination values', async () => {
      mockAlbumRepository.findAndCount.mockResolvedValue([[], 0]);

      await service.findAllByUser(mockUserId);

      expect(mockAlbumRepository.findAndCount).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        order: { createdAt: 'DESC' },
        skip: 0,
        take: 10,
      });
    });
  });

  describe('findOne', () => {
    it('should return an album for valid id and userId', async () => {
      mockAlbumRepository.findOne.mockResolvedValue(mockAlbum);

      const result = await service.findOne(mockAlbumId, mockUserId);

      expect(result).toEqual(mockAlbum);
      expect(mockAlbumRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockAlbumId, userId: mockUserId },
      });
    });

    it('should throw NotFoundException when album not found', async () => {
      mockAlbumRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(mockAlbumId, mockUserId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne(mockAlbumId, mockUserId)).rejects.toThrow(
        'Álbum não encontrado',
      );
    });

    it('should not return album for different userId (authorization)', async () => {
      mockAlbumRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(mockAlbumId, 'different-user')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('should create a new album', async () => {
      const createAlbumDto = {
        title: 'New Album',
        description: 'New album description',
      };

      mockAlbumRepository.create.mockReturnValue({
        ...createAlbumDto,
        userId: mockUserId,
      });
      mockAlbumRepository.save.mockResolvedValue({
        id: 'new-album-id',
        ...createAlbumDto,
        userId: mockUserId,
        isPublic: false,
        publicToken: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.create(mockUserId, createAlbumDto);

      expect(result).toHaveProperty('id');
      expect(result.title).toBe(createAlbumDto.title);
      expect(result.description).toBe(createAlbumDto.description);
      expect(result.userId).toBe(mockUserId);
      expect(mockAlbumRepository.create).toHaveBeenCalledWith({
        ...createAlbumDto,
        userId: mockUserId,
      });
      expect(mockAlbumRepository.save).toHaveBeenCalled();
    });

    it('should create album without description', async () => {
      const createAlbumDto = {
        title: 'Album Without Description',
      };

      mockAlbumRepository.create.mockReturnValue({
        ...createAlbumDto,
        userId: mockUserId,
      });
      mockAlbumRepository.save.mockResolvedValue({
        id: 'new-album-id',
        ...createAlbumDto,
        description: null,
        userId: mockUserId,
        isPublic: false,
        publicToken: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.create(mockUserId, createAlbumDto);

      expect(result.title).toBe(createAlbumDto.title);
    });
  });

  describe('update', () => {
    it('should update album title', async () => {
      const updateAlbumDto = { title: 'Updated Title' };
      const updatedAlbum = { ...mockAlbum, ...updateAlbumDto };

      mockAlbumRepository.findOne.mockResolvedValue(mockAlbum);
      mockAlbumRepository.save.mockResolvedValue(updatedAlbum);

      const result = await service.update(mockAlbumId, mockUserId, updateAlbumDto);

      expect(result.title).toBe(updateAlbumDto.title);
      expect(mockAlbumRepository.save).toHaveBeenCalled();
    });

    it('should update album description', async () => {
      const updateAlbumDto = { description: 'Updated Description' };
      const updatedAlbum = { ...mockAlbum, ...updateAlbumDto };

      mockAlbumRepository.findOne.mockResolvedValue(mockAlbum);
      mockAlbumRepository.save.mockResolvedValue(updatedAlbum);

      const result = await service.update(mockAlbumId, mockUserId, updateAlbumDto);

      expect(result.description).toBe(updateAlbumDto.description);
    });

    it('should throw NotFoundException when updating non-existent album', async () => {
      mockAlbumRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update(mockAlbumId, mockUserId, { title: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should not update album owned by different user', async () => {
      mockAlbumRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update(mockAlbumId, 'different-user', { title: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove an album', async () => {
      mockAlbumRepository.findOne.mockResolvedValue(mockAlbum);
      mockAlbumRepository.remove.mockResolvedValue(mockAlbum);

      await service.remove(mockAlbumId, mockUserId);

      expect(mockAlbumRepository.remove).toHaveBeenCalledWith(mockAlbum);
    });

    it('should throw NotFoundException when removing non-existent album', async () => {
      mockAlbumRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(mockAlbumId, mockUserId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should not remove album owned by different user', async () => {
      mockAlbumRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(mockAlbumId, 'different-user')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('share', () => {
    it('should generate a public token and return sharing info', async () => {
      mockAlbumRepository.findOne.mockResolvedValue({ ...mockAlbum });
      mockAlbumRepository.save.mockImplementation((album) => Promise.resolve(album));

      const result = await service.share(mockAlbumId, mockUserId);

      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('url');
      expect(result.token).toHaveLength(64); // 32 bytes = 64 hex characters
      expect(result.url).toBe(`/shared/${result.token}`);
      expect(mockAlbumRepository.save).toHaveBeenCalled();
    });

    it('should return existing token if album is already shared', async () => {
      const existingToken = 'existing-token-12345678901234567890123456789012';
      const sharedAlbum = {
        ...mockAlbum,
        isPublic: true,
        publicToken: existingToken,
      };
      mockAlbumRepository.findOne.mockResolvedValue(sharedAlbum);

      const result = await service.share(mockAlbumId, mockUserId);

      expect(result.token).toBe(existingToken);
      expect(mockAlbumRepository.save).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when sharing non-existent album', async () => {
      mockAlbumRepository.findOne.mockResolvedValue(null);

      await expect(service.share(mockAlbumId, mockUserId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('unshare', () => {
    it('should revoke public sharing', async () => {
      const sharedAlbum = {
        ...mockAlbum,
        isPublic: true,
        publicToken: 'some-token',
      };
      mockAlbumRepository.findOne.mockResolvedValue(sharedAlbum);
      mockAlbumRepository.save.mockImplementation((album) => Promise.resolve(album));

      await service.unshare(mockAlbumId, mockUserId);

      expect(mockAlbumRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          isPublic: false,
          publicToken: null,
        }),
      );
    });

    it('should throw NotFoundException when unsharing non-existent album', async () => {
      mockAlbumRepository.findOne.mockResolvedValue(null);

      await expect(service.unshare(mockAlbumId, mockUserId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should not unshare album owned by different user', async () => {
      mockAlbumRepository.findOne.mockResolvedValue(null);

      await expect(service.unshare(mockAlbumId, 'different-user')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByPublicToken', () => {
    it('should return album for valid public token', async () => {
      const publicToken = 'valid-public-token';
      const publicAlbum = {
        ...mockAlbum,
        isPublic: true,
        publicToken,
      };
      mockAlbumRepository.findOne.mockResolvedValue(publicAlbum);

      const result = await service.findByPublicToken(publicToken);

      expect(result).toEqual(publicAlbum);
      expect(mockAlbumRepository.findOne).toHaveBeenCalledWith({
        where: { publicToken, isPublic: true },
      });
    });

    it('should throw NotFoundException for invalid token', async () => {
      mockAlbumRepository.findOne.mockResolvedValue(null);

      await expect(service.findByPublicToken('invalid-token')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findByPublicToken('invalid-token')).rejects.toThrow(
        'Álbum não encontrado ou não está compartilhado',
      );
    });

    it('should throw NotFoundException for private album with token', async () => {
      // Simulates the case where isPublic is false even if token exists
      mockAlbumRepository.findOne.mockResolvedValue(null);

      await expect(service.findByPublicToken('token-for-private')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
