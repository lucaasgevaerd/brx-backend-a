import { Module, OnModuleInit } from '@nestjs/common';
import { AppController } from './app.controller';
import { RabbitMQService } from './rabbitmq.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entity/user.entity';
import { Repository } from './entity/repository.entity';
import { TypeOrmOptionsFactory, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ConfigService implements TypeOrmOptionsFactory {
  createTypeOrmOptions(): TypeOrmModuleOptions {
    return {
      type: 'mysql',
      host: 'db',
      port: 3306,
      username: 'root',
      password: 'brx',
      database: 'brx-database',
      entities: [User, Repository],
      synchronize: true,
      autoLoadEntities: true,
      retryAttempts: 5, // the number of times to retry connection
      retryDelay: 3000, // delay between connection retries (ms)
    };
  }
}

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'RABBITMQ_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://guest:guest@localhost:5672'],
          queue: 'responseQueue',
          queueOptions: {
            durable: true
          },
        },
      },
    ]),
    TypeOrmModule.forRootAsync({
      useClass: ConfigService,
    }),
    TypeOrmModule.forFeature([User, Repository]),
  ],
  controllers: [AppController],
  providers: [RabbitMQService, ConfigService],
})
export class AppModule { }