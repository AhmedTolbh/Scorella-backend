import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum EventType {
  VIEW_START = 'view_start',
  VIEW_PERCENT = 'view_percent',
  VIEW_COMPLETE = 'view_complete',
  SKIP = 'skip',
  LIKE = 'like',
  UNLIKE = 'unlike',
  SAVE = 'save',
  UNSAVE = 'unsave',
  SHARE = 'share',
  COMMENT = 'comment',
  REPORT = 'report',
}

@Entity('analytics_events')
@Index(['userId', 'createdAt'])
@Index(['videoId', 'createdAt'])
@Index(['eventType', 'createdAt'])
export class AnalyticsEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50 })
  eventType: EventType;

  @Column({ type: 'uuid', nullable: true })
  @Index()
  userId: string;

  @Column({ type: 'uuid', nullable: true })
  @Index()
  videoId: string;

  @Column({ type: 'uuid', nullable: true })
  sessionId: string;

  @Column({ type: 'jsonb', nullable: true })
  meta: {
    playDurationMs?: number;
    videoDurationMs?: number;
    percentWatched?: number;
    isScrubbing?: boolean;
    volumeLevel?: number;
  };

  @Column({ type: 'jsonb', nullable: true })
  context: {
    network?: string;
    deviceModel?: string;
    appVersion?: string;
    locale?: string;
  };

  @CreateDateColumn()
  @Index()
  createdAt: Date;
}
