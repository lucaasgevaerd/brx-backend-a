import { Injectable } from '@nestjs/common';
import { ClientProxyFactory, Transport, ClientOptions } from '@nestjs/microservices';

@Injectable()
export class RabbitMQService {
    private client;

    constructor() {
        const options: ClientOptions = {
            transport: Transport.RMQ,
            options: {
                urls: ['amqp://guest:guest@localhost:5672'],
                queue: 'userQueue',
                queueOptions: {
                    durable: true
                },
            },
        };
        this.client = ClientProxyFactory.create(options);
    }

    async send(pattern: string, data: any) {
        return this.client.send(pattern, data).toPromise();
    }
}