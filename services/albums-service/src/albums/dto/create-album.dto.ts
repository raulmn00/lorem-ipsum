import { IsString, MaxLength, IsOptional } from 'class-validator';

export class CreateAlbumDto {
  @IsString()
  @MaxLength(255)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
}
