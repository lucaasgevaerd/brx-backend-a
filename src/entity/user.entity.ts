import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Repository } from './repository.entity';

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ nullable: true })
    login: string;

    @Column({ nullable: true })
    avatar_url: string;

    @Column({ nullable: true })
    name: string;

    @Column({ nullable: true })
    location: string;

    @OneToMany(() => Repository, repository => repository.owner)
    repos: Repository[];
}