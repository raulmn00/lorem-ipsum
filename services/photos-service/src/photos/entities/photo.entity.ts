import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('photos')
export class Photo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'album_id' })
  albumId: string;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'file_key', length: 500 })
  fileKey: string;

  @Column({ name: 'thumbnail_key', length: 500, nullable: true })
  thumbnailKey: string | null;

  @Column({ name: 'size_bytes', type: 'bigint' })
  sizeBytes: number;

  @Column({ name: 'mime_type', length: 100 })
  mimeType: string;

  @Column({ name: 'dominant_color', length: 7 })
  dominantColor: string;

  @Column({ name: 'acquired_at' })
  acquiredAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
