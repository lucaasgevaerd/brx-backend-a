import { Controller, Post, Body, OnModuleInit, Delete, Param } from '@nestjs/common';
import { RabbitMQService } from './rabbitmq.service';
import * as amqp from 'amqplib';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository as TypeOrmRepository } from 'typeorm';
import { User } from './entity/user.entity';
import { Repository } from './entity/repository.entity';
import { getIo } from './main';

@Controller()
export class AppController implements OnModuleInit {
  private connection: amqp.Connection;
  private channel: amqp.Channel;

  constructor(
    private readonly rabbitMQService: RabbitMQService,
    @InjectRepository(User)
    private usersRepository: TypeOrmRepository<User>,
    @InjectRepository(Repository)
    private reposRepository: TypeOrmRepository<Repository>,
  ) { }

  async onModuleInit() {
    console.log('Connecting to RabbitMQ...');
    this.connection = await amqp.connect('amqp://guest:guest@localhost:5672');
    console.log('Connected to RabbitMQ');
    this.channel = await this.connection.createChannel();
    console.log('Channel created');
    await this.channel.assertQueue('responseQueue');
    console.log('Queue asserted');
    this.receiveFromBackendB();
  }

  @Post()
  async create(@Body('username') username: string) {
    console.log(`Received username: ${username}`);
    await this.rabbitMQService.send('userQueue', username);
    return { status: 'User request sent to Backend-b' };
  }

  @Delete(':id')
  async deleteRepository(@Param('id') id: string) {
    try {
      const result = await this.reposRepository.delete(id);
      if (result.affected === 1) {
        return { message: 'Repository deleted successfully' };
      } else {
        throw new Error('Repository not found');
      }
    } catch (error) {
      throw new Error(`Failed to delete repository: ${error.message}`);
    }
  }

  async receiveFromBackendB() {
    console.log('Starting to consume messages from responseQueue');
    this.channel.consume('responseQueue', async (msg) => {
      if (msg !== null) {
        const message = JSON.parse(msg.content.toString());
        console.log(message);

        if (message.data.id && message.data.login && message.data.avatar_url && message.data.name && message.data.location) {
          const queryRunner = this.usersRepository.manager.connection.createQueryRunner();
          await queryRunner.connect();
          await queryRunner.startTransaction();

          try {
            await queryRunner.query('SET FOREIGN_KEY_CHECKS = 0');

            await this.reposRepository.delete({});
            await this.usersRepository.delete({});

            await queryRunner.query('SET FOREIGN_KEY_CHECKS = 1');

            const savedUser = this.usersRepository.create({
              id: message.data.id,
              login: message.data.login,
              avatar_url: message.data.avatar_url,
              name: message.data.name,
              location: message.data.location,
            });
            await this.usersRepository.save(savedUser);

            const savedRepos = message.data.repos.map(repo => {
              return {
                id: repo.id || null,
                name: repo.name || null,
                full_name: repo.full_name || null,
                html_url: repo.html_url || null,
                description: repo.description || null,
                fork: repo.fork || null,
                url: repo.url || null,
                created_at: repo.created_at || null,
                updated_at: repo.updated_at || null,
                pushed_at: repo.pushed_at || null,
                language: repo.language || null,
                forks_count: repo.forks_count || null,
                open_issues_count: repo.open_issues_count || null,
                owner: savedUser,
              };
            });
            await this.reposRepository.save(savedRepos);

            await queryRunner.commitTransaction();

            const io = getIo();
            io.emit('dataSaved', { user: { ...savedUser, repos: savedRepos } });

            this.channel.ack(msg);
          } catch (err) {
            await queryRunner.rollbackTransaction();
            console.error('Error during database operation:', err);
          } finally {
            await queryRunner.release();
          }
        }
      }
    });
  }
}
