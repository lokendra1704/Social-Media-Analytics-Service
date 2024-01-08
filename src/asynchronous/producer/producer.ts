import { Kafka, Producer, ProducerBatch, TopicMessages, CompressionTypes } from 'kafkajs';
import { KAFKA_CONFIG } from '../../config';
import L from '../../utils/logger';

export default class ProducerFactory {
    private producer: Producer
    private topic: string | undefined;

    constructor(topic?: string, config: any = KAFKA_CONFIG) {
        this.producer = this.createProducer(config)
        if (topic) {
            this.topic = topic;
        }
    }

    public async start(): Promise<void> {
        try {
            await this.producer.connect();
        } catch (error) {
            L.error('Error connecting the producer: ', error)
        }
    }

    public async shutdown(): Promise<void> {
        await this.producer.disconnect()
    }

    public async sendBatch({topic = undefined, messages}: {topic?: string, messages: any[]}): Promise<void> {
        topic = topic ? topic : this.topic;
        if (!topic) throw new Error('Topic is not defined');
        const topicMessages: TopicMessages = {
            topic: topic ? topic : this.topic || '',
            messages: messages,
        }

        const batch: ProducerBatch = {
            compression: CompressionTypes.GZIP,
            topicMessages: [topicMessages]
        }

        await this.producer.sendBatch(batch)
    }

    private createProducer(kafkaConfig: { KAFKA_HOST: string, KAFKA_CLIENT_ID: string, KAFKA_CONNECTION_TIMEOUT: number, KAFKA_REQUEST_TIMEOUT: number }): Producer {
        const kafka = new Kafka({
            clientId: kafkaConfig.KAFKA_CLIENT_ID,
            brokers: [kafkaConfig.KAFKA_HOST],
            connectionTimeout: kafkaConfig.KAFKA_CONNECTION_TIMEOUT,
            requestTimeout: kafkaConfig.KAFKA_REQUEST_TIMEOUT,
        });

        const producer = kafka.producer({ // TODO: add config
            createPartitioner: undefined,
            retry: undefined,
            metadataMaxAge: undefined,
            allowAutoTopicCreation: false,
            idempotent: true,
            transactionalId: undefined,
            transactionTimeout: undefined,
            maxInFlightRequests: undefined,
        });
        producer.on('producer.connect', () => {
            L.info('Producer connected!');
        });
        producer.on('producer.disconnect', () => {
            L.info('Producer disconnected!');
        });
        return producer;
    }
}