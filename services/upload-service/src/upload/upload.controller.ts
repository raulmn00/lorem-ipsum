import {
  Controller,
  Post,
  Get,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  ParseUUIDPipe,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../auth/decorators/current-user.decorator';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('photo/:albumId')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_FILE_SIZE },
    }),
  )
  async uploadPhoto(
    @CurrentUser() user: CurrentUserPayload,
    @Param('albumId', ParseUUIDPipe) albumId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Arquivo é obrigatório');
    }

    const result = await this.uploadService.uploadPhoto(
      { id: user.id, email: user.email },
      albumId,
      file.buffer,
    );

    return {
      message: 'Foto enviada com sucesso',
      ...result,
    };
  }

  @Post('photos/:albumId')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FilesInterceptor('files', 50, {
      limits: { fileSize: MAX_FILE_SIZE },
    }),
  )
  async uploadPhotos(
    @CurrentUser() user: CurrentUserPayload,
    @Param('albumId', ParseUUIDPipe) albumId: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('Pelo menos um arquivo é obrigatório');
    }

    const results = await Promise.all(
      files.map((file) =>
        this.uploadService.uploadPhoto({ id: user.id, email: user.email }, albumId, file.buffer),
      ),
    );

    return {
      message: `${results.length} fotos enviadas com sucesso`,
      photos: results,
    };
  }

  @Get('presigned/:key(*)')
  @UseGuards(JwtAuthGuard)
  async getPresignedUrl(@Param('key') key: string) {
    const url = await this.uploadService.getPresignedUrl(key);
    return { url };
  }

  // Public endpoint for shared albums (presigned URLs are time-limited anyway)
  @Get('public/presigned/:key(*)')
  async getPublicPresignedUrl(@Param('key') key: string) {
    const url = await this.uploadService.getPresignedUrl(key);
    return { url };
  }
}
