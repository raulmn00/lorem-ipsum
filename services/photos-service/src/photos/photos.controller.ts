import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PhotosService } from './photos.service';
import { CreatePhotoDto, UpdatePhotoDto } from './dto';
import { InternalAuthGuard } from '../auth/guards/internal-auth.guard';

@Controller('photos')
export class PhotosController {
  constructor(private readonly photosService: PhotosService) {}

  @Post()
  @UseGuards(InternalAuthGuard)
  async create(@Body() createPhotoDto: CreatePhotoDto) {
    return this.photosService.create(createPhotoDto);
  }

  @Get('album/:albumId')
  @UseGuards(InternalAuthGuard)
  async findByAlbum(
    @Param('albumId', ParseUUIDPipe) albumId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sort') sort?: string,
    @Query('order') order?: string,
  ) {
    return this.photosService.findByAlbum(
      albumId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
      sort === 'created_at' ? 'created_at' : 'acquired_at',
      order?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC',
    );
  }

  // Public endpoint for shared albums
  @Get('shared/:token')
  async findBySharedToken(
    @Param('token') token: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.photosService.findBySharedAlbum(
      token,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Get(':id')
  @UseGuards(InternalAuthGuard)
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.photosService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(InternalAuthGuard)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePhotoDto: UpdatePhotoDto,
  ) {
    return this.photosService.update(id, updatePhotoDto);
  }

  @Delete(':id')
  @UseGuards(InternalAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.photosService.remove(id);
  }
}
