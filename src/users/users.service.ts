import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { Video } from '../videos/entities/video.entity';
import { AgeBucket } from '../common/enums/schema.enums';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Video)
    private videosRepository: Repository<Video>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const user = this.usersRepository.create(createUserDto);
    return this.usersRepository.save(user);
  }

  async findOneByAppleId(appleId: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { appleId } });
  }

  async findOrCreate(appleId: string, email?: string): Promise<User> {
    let user = await this.findOneByAppleId(appleId);
    if (!user) {
      user = this.usersRepository.create({
        appleId,
        email,
      });
      await this.usersRepository.save(user);
    }
    return user;
  }

  async setAgeBucket(userId: string, bucket: string): Promise<User> {
    const user = await this.usersRepository.findOneBy({ id: userId });
    if (user) {
      user.ageBucket = bucket as AgeBucket;
      return this.usersRepository.save(user);
    }
    throw new Error('User not found');
  }

  async update(id: string, updates: Partial<User>): Promise<User> {
    await this.usersRepository.update(id, updates);
    const user = await this.usersRepository.findOneBy({ id });
    if (!user) throw new Error('User not found');
    return user;
  }

  findAll() {
    return this.usersRepository.find();
  }

  findOne(id: number) {
    return `This action returns a #${id} user`; // Legacy placeholder, keeping to avoid breaking if used refs exist
  }

  remove(id: number) {
    return `This action removes a #${id} user`; // Legacy placeholder
  }

  // Saved Videos Logic
  async saveVideo(userId: string, videoId: string) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['savedVideos'],
    });
    const video = await this.videosRepository.findOneBy({ id: videoId });

    if (user && video) {
      // Avoid duplicates
      if (!user.savedVideos.some((v) => v.id === video.id)) {
        user.savedVideos.push(video);
        await this.usersRepository.save(user);
      }
    }
    return user;
  }

  async unsaveVideo(userId: string, videoId: string) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['savedVideos'],
    });

    if (user) {
      user.savedVideos = user.savedVideos.filter((v) => v.id !== videoId);
      await this.usersRepository.save(user);
    }
    return user;
  }

  async getSavedVideos(userId: string) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['savedVideos', 'savedVideos.user'], // Also load creator of saved video
    });
    return user ? user.savedVideos : [];
  }

  async search(query: string): Promise<User[]> {
    if (!query) return [];
    return this.usersRepository.find({
      where: [
        { displayName: Like(`%${query}%`) },
        { bio: Like(`%${query}%`) }, // Search bio too? Why not.
      ],
      take: 20,
    });
  }

  async delete(id: string) {
    return this.usersRepository.delete(id);
  }
}
