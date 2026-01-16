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
import { AlbumsService } from './albums.service';
import { CreateAlbumDto, UpdateAlbumDto, SetThumbnailDto } from './dto';
import { InternalAuthGuard } from '../auth/guards/internal-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../auth/decorators/current-user.decorator';

@Controller('albums')
export class AlbumsController {
  constructor(private readonly albumsService: AlbumsService) {}

  @Get()
  @UseGuards(InternalAuthGuard)
  async findAll(
    @CurrentUser() user: CurrentUserPayload,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.albumsService.findAllByUser(
      user.id,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
    );
  }

  @Post()
  @UseGuards(InternalAuthGuard)
  async create(
    @CurrentUser() user: CurrentUserPayload,
    @Body() createAlbumDto: CreateAlbumDto,
  ) {
    return this.albumsService.create(user.id, createAlbumDto);
  }

  @Get('shared/:token')
  async findByPublicToken(@Param('token') token: string) {
    return this.albumsService.findByPublicToken(token);
  }

  @Get(':id')
  @UseGuards(InternalAuthGuard)
  async findOne(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.albumsService.findOne(id, user.id);
  }

  @Patch(':id')
  @UseGuards(InternalAuthGuard)
  async update(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateAlbumDto: UpdateAlbumDto,
  ) {
    return this.albumsService.update(id, user.id, updateAlbumDto);
  }

  @Delete(':id')
  @UseGuards(InternalAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.albumsService.remove(id, user.id);
  }

  @Post(':id/share')
  @UseGuards(InternalAuthGuard)
  async share(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.albumsService.share(id, user.id);
  }

  @Delete(':id/share')
  @UseGuards(InternalAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async unshare(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.albumsService.unshare(id, user.id);
  }

  @Patch(':id/thumbnail')
  @UseGuards(InternalAuthGuard)
  async setThumbnail(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() setThumbnailDto: SetThumbnailDto,
  ) {
    return this.albumsService.setThumbnail(id, user.id, setThumbnailDto.thumbnailKey);
  }

  @Delete(':id/thumbnail')
  @UseGuards(InternalAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeThumbnail(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.albumsService.removeThumbnail(id, user.id);
  }
}
