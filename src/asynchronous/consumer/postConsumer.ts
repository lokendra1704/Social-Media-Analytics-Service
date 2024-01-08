import { KAFKA_CONFIG } from '../../config';
import ConsumerFactory from './consumer';
import { processPost } from '../../brains/post';

async function initKafkaPostConsumer() {
    await new ConsumerFactory(
        KAFKA_CONFIG.KAFKA_POST_CONSUMER_GROUP_ID,
        {
            topics: [KAFKA_CONFIG.KAFKA_POST_TOPIC],
            fromBeginning: KAFKA_CONFIG.KAFKA_FROM_BEGINNING
        },
        processPost,
    ).startBatchConsumer(undefined);
}

export default initKafkaPostConsumer;
