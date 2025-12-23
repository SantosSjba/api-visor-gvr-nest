import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../shared/entities/base.entity';

@Entity('users')
export class User extends BaseEntity {
    @Column({ unique: true })
    email: string;

    @Column()
    name: string;

    @Column({ nullable: true })
    phone?: string;
}
