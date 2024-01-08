import ProducerFactory from "./producer";
import { KAFKA_CONFIG } from "../../config";

export function getPostPartitionKey(postId: string) {
    // TODO: Think of a clever partitioning strategy
    return postId;
}

const PostProducer = new ProducerFactory(KAFKA_CONFIG.KAFKA_POST_TOPIC);
PostProducer.start();
export default PostProducer;
