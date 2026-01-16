import { IsString, IsNotEmpty } from 'class-validator';

export class SetThumbnailDto {
  @IsString()
  @IsNotEmpty()
  thumbnailKey: string;
}
