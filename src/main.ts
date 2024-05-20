import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as express from 'express';
import { Server } from 'socket.io';
import { ExpressAdapter } from '@nestjs/platform-express';

let io: Server;

async function bootstrap() {
  const server = express();
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server));
  app.enableCors();

  io = new Server(app.getHttpServer(), {
    cors: {
      origin: "http://localhost:3001",
      methods: ["GET", "POST"]
    }
  });

  await app.listen(3002);
}

export function getIo() {
  return io;
}

bootstrap();
