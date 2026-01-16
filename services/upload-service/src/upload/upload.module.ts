import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { UploadService } from './upload.service';
import { UploadController } from './upload.controller';
import { StorageModule } from '../storage/storage.module';
import { ImageModule } from '../image/image.module';

@Module({
  imports: [StorageModule, ImageModule, HttpModule],
  controllers: [UploadController],
  providers: [UploadService],
  exports: [UploadService],
})
export class UploadModule {}
