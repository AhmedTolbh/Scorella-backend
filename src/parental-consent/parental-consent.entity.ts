import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../users/entities/user.entity';
import { ParentalConsentStatus } from '../common/enums/schema.enums';

@Entity('parental_consents')
export class ParentalConsent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  childUserId: string;

  @ManyToOne(() => User, (user) => user.consents, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'childUserId' })
  child: User;

  @Column()
  parentContact: string; // Email or Phone

  @Column()
  verificationMethod: string; // BANK_ID, CREDIT_CARD

  @Column({
    type: 'enum',
    enum: ParentalConsentStatus,
    default: ParentalConsentStatus.PENDING,
  })
  status: ParentalConsentStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  revokedAt: Date;
}
