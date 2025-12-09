import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Group } from './entities/group.entity';
import { GroupMember } from './entities/group-member.entity';
import { CreateGroupDto } from './dto/create-group.dto';
import { User } from '../users/entities/user.entity';
import { GroupRole } from '../common/enums/schema.enums';

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(Group)
    private groupsRepository: Repository<Group>,
    @InjectRepository(GroupMember)
    private membersRepository: Repository<GroupMember>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(createGroupDto: CreateGroupDto) {
    // 1. Create Group
    const group = this.groupsRepository.create(createGroupDto);
    const savedGroup = await this.groupsRepository.save(group);

    // 2. Add Owner as Member with OWNER role
    const member = this.membersRepository.create({
      groupId: savedGroup.id,
      userId: createGroupDto.ownerId,
      role: GroupRole.OWNER,
    });
    await this.membersRepository.save(member);

    return savedGroup;
  }

  async findAllForUser(userId: string) {
    // Find memberships first
    const memberships = await this.membersRepository.find({
      where: { userId },
      relations: ['group', 'group.owner'],
    });
    return memberships.map((m) => m.group);
  }

  async findAll() {
    return this.groupsRepository.find({
      relations: ['owner'],
    });
  }

  async join(groupId: string, userId: string) {
    // Check validation...
    const exists = await this.membersRepository.findOneBy({ groupId, userId });
    if (exists) return exists;

    const member = this.membersRepository.create({
      groupId,
      userId,
      role: GroupRole.MEMBER,
    });
    return this.membersRepository.save(member);
  }

  async leave(groupId: string, userId: string) {
    return this.membersRepository.delete({ groupId, userId });
  }
}
