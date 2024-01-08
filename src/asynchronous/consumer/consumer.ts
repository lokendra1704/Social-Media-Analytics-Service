import { Consumer, ConsumerSubscribeTopics, EachBatchPayload, Kafka, EachMessagePayload } from 'kafkajs';
import { KAFKA_CONFIG } from '../../config';
import L from '../../utils/logger';

type MessageProcessor = (message: string) => void;

export default class ConsumerFactory {
    private kafkaConsumer: Consumer
    private messageProcessor: MessageProcessor
    private topics: ConsumerSubscribeTopics[];

    public constructor(consumerGroupId: string, topic: ConsumerSubscribeTopics, messageProcessor: MessageProcessor, kafkaConfig: any = KAFKA_CONFIG) {
        this.messageProcessor = messageProcessor
        this.kafkaConsumer = this.createKafkaConsumer(kafkaConfig, consumerGroupId)
        this.topics = [];
        if (topic) {
            this.topics.push(topic);
        }
    }

    public async startConsumer(topic: ConsumerSubscribeTopics | undefined): Promise<void> {
        topic = topic ? topic : (this.topics.length > 0 ? this.topics[0] : undefined);
        if (!topic) throw new Error('Topic is not defined');
        try {
            await this.kafkaConsumer.connect()
            await this.kafkaConsumer.subscribe(topic)

            await this.kafkaConsumer.run({
                eachMessage: async (messagePayload: EachMessagePayload) => {
                    const { topic, partition, message } = messagePayload
                    const prefix = `${topic}[${partition} | ${message.offset}] / ${message.timestamp}`
                    L.debug(`- ${prefix} ${message.key}#${message.value}`);
                    if (message.value)
                        await this.messageProcessor(message.value.toString());
                }
            })
        } catch (error) {
            L.error('Error: ', error)
        }
    }

    public async startBatchConsumer(topic: ConsumerSubscribeTopics | undefined): Promise<void> {
        topic = topic ? topic : (this.topics.length > 0 ? this.topics[0] : undefined);
        if (!topic) throw new Error('Topic is not defined');
        try {
            await this.kafkaConsumer.connect()
            await this.kafkaConsumer.subscribe(topic)
            await this.kafkaConsumer.run({
                eachBatch: async (eachBatchPayload: EachBatchPayload) => {
                    const { batch, isRunning, isStale, resolveOffset, heartbeat } = eachBatchPayload;
                    for (const message of batch.messages) {
                        if (!isRunning() || isStale()) break;
                        const prefix = `${batch.topic}[${batch.partition} | ${message.offset}] / ${message.timestamp}`
                        L.debug(`- ${prefix} ${message.key}#${message.value}`);
                        if (message.value)
                            await this.messageProcessor(message.value.toString());
                        resolveOffset(message.offset);
                        await heartbeat();
                    }
                }
            })
        } catch (error) {
            L.error('Error: ', error)
        }
    }

    public async shutdown(): Promise<void> {
        await this.kafkaConsumer.disconnect()
    }

    private createKafkaConsumer(kafkaConfig: any, consumerGroupId: string): Consumer {
        const kafka = new Kafka({
            clientId: kafkaConfig.KAFKA_CLIENT_ID,
            brokers: [kafkaConfig.KAFKA_HOST],
            connectionTimeout: kafkaConfig.KAFKA_CONNECTION_TIMEOUT,
            requestTimeout: kafkaConfig.KAFKA_REQUEST_TIMEOUT,
        })
        const consumer = kafka.consumer({ groupId: consumerGroupId });
        consumer.on('consumer.connect', () => {
            L.info('Consumer connected!');
        });
        consumer.on('consumer.disconnect', () => {
            L.info('Consumer disconnected!');
        });
        return consumer
    }
}