import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToMany,
  JoinTable,
  OneToMany,
  Index,
} from 'typeorm';
import { Video } from '../../videos/entities/video.entity';
import { ParentalConsent } from '../../parental-consent/parental-consent.entity';
import { AgeBucket } from '../../common/enums/schema.enums';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  @Index()
  appleId: string;

  @Column({ nullable: true, unique: true })
  email: string;

  @Column({ nullable: true })
  displayName: string;

  @Column({ nullable: true })
  bio: string;

  @Column({
    type: 'enum',
    enum: AgeBucket,
    nullable: true,
  })
  @Index() // Indexed for filtering by age
  ageBucket: AgeBucket;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt: Date;

  @ManyToMany(() => Video)
  @JoinTable({ name: 'user_saved_videos' })
  savedVideos: Video[];

  @OneToMany(() => ParentalConsent, (consent) => consent.child)
  consents: ParentalConsent[];
}
