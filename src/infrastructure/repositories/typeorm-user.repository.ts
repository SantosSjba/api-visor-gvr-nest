import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../domain/entities/user.entity';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';

@Injectable()
export class TypeOrmUserRepository implements IUserRepository {
    constructor(
        @InjectRepository(User)
        private readonly repository: Repository<User>,
    ) { }

    async findAll(): Promise<User[]> {
        return await this.repository.find();
    }

    async findById(id: string): Promise<User | null> {
        return await this.repository.findOne({ where: { id } });
    }

    async findByEmail(email: string): Promise<User | null> {
        return await this.repository.findOne({ where: { email } });
    }

    async create(user: Partial<User>): Promise<User> {
        const newUser = this.repository.create(user);
        return await this.repository.save(newUser);
    }

    async update(id: string, user: Partial<User>): Promise<User> {
        await this.repository.update(id, user);
        const updatedUser = await this.findById(id);
        if (!updatedUser) {
            throw new Error('User not found');
        }
        return updatedUser;
    }

    async delete(id: string): Promise<void> {
        await this.repository.delete(id);
    }
}
