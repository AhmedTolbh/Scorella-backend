import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('parental_settings')
@Unique(['childUserId'])
export class ParentalSettings {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  childUserId: string;

  @Column({ type: 'uuid', nullable: true })
  parentUserId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'childUserId' })
  child: User;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'parentUserId' })
  parent: User;

  // Screen time limits (FR-16, FR-17)
  @Column({ type: 'int', default: 60 })
  dailyLimitMinutes: number;

  @Column({ type: 'int', default: 0 })
  todayWatchedMinutes: number;

  @Column({ type: 'date', nullable: true })
  lastResetDate: Date;

  // Content restrictions
  @Column({ type: 'simple-array', nullable: true })
  blockedCategories: string[];

  @Column({ type: 'boolean', default: true })
  restrictedModeEnabled: boolean;

  @Column({ type: 'boolean', default: false })
  commentsDisabled: boolean;

  @Column({ type: 'boolean', default: false })
  sharingDisabled: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
