import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./user.entity";

@Entity()
export class Repository {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ nullable: true })
    name: string;

    @Column({ nullable: true })
    full_name: string;

    @Column({ nullable: true })
    html_url: string;

    @Column({ type: 'text', charset: 'utf8mb4', collation: 'utf8mb4_unicode_ci', nullable: true })
    description: string;

    @Column({ nullable: true })
    fork: boolean;

    @Column({ nullable: true })
    url: string;

    @Column({ nullable: true })
    created_at: Date;

    @Column({ nullable: true })
    updated_at: Date;

    @Column({ nullable: true })
    pushed_at: Date;

    @Column({ nullable: true })
    language: string;

    @Column({ nullable: true })
    forks_count: number;

    @Column({ nullable: true })
    open_issues_count: number;

    @ManyToOne(() => User, user => user.repos)
    owner: User;
}