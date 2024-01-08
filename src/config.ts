export const REDIS = {
    IS_CLUSTER: (process.env.REDIS_IS_CLUSTER === 'true'),
    HOST: process.env.REDIS_HOST || 'localhost',
    PORT: process.env.REDIS_PORT ? parseInt(String(process.env.REDIS_PORT), 10) : 6379,
    CLUSTER_ARRAY: process.env.REDIS_CLUSTER_ARRAY ? JSON.parse(decodeURI(String(process.env.REDIS_CLUSTER_ARRAY))) : undefined,
};

export const DB = {
    host: process.env.MYSQL_HOST || 'localhost',
    port: process.env.MYSQL_PORT ? parseInt(process.env.MYSQL_PORT) : 3306,
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || 'password',
    database: process.env.MYSQL_DATABASE || 'test',
    connectionLimit: process.env.MYSQL_CONNECTION_LIMIT ? parseInt(process.env.MYSQL_CONNECTION_LIMIT) : 10,
    charset: 'utf8mb4',
}

export const KAFKA_CONFIG = {
    KAFKA_HOST: process.env.KAFKA_HOST || 'localhost:9092',
    KAFKA_POST_TOPIC: process.env.KAFKA_POST_TOPIC || 'post',
    KAFKA_POST_CONSUMER_GROUP_ID: process.env.KAFKA_POST_CONSUMER_GROUP_ID || 'post-group',
    KAFKA_POST_CONSUMER_SWITCH: process.env.KAFKA_POST_CONSUMER_SWITCH === 'true',
    KAFKA_CLIENT_ID: process.env.KAFKA_CLIENT_ID || process.env.HOSTNAME || 'localhost',
    KAFKA_FROM_BEGINNING: process.env.KAFKA_FROM_BEGINNING === 'true',
    KAFKA_CONNECTION_TIMEOUT: process.env.KAFKA_CONNECTION_TIMEOUT ? parseInt(String(process.env.KAFKA_CONNECTION_TIMEOUT), 10) : 60000, // default 1000
    KAFKA_REQUEST_TIMEOUT: process.env.KAFKA_REQUEST_TIMEOUT ? parseInt(String(process.env.KAFKA_REQUEST_TIMEOUT), 10) : 60000,
    // KAFKA_COMMIT_INTERVAL: process.env.KAFKA_COMMIT_INTERVAL ? parseInt(String(process.env.KAFKA_COMMIT_INTERVAL), 10) : undefined, // default 5000
    // KAFKA_MAX_BYTES: process.env.KAFKA_MAX_BYTES ? parseInt(String(process.env.KAFKA_MAX_BYTES), 10) : undefined, // default 1048588
    // KAFKA_MAX_WAIT_TIME_IN_MS: parseInt(String(process.env.KAFKA_MAX_WAIT_TIME_IN_MS), 10),
    // KAFKA_MAX_RETRIES: parseInt(String(process.env.KAFKA_MAX_RETRIES), 10),
    // KAFKA_RETRY_FACTOR: parseInt(String(process.env.KAFKA_RETRY_FACTOR), 10),
    // KAFKA_RETRY_TIMEOUT: parseInt(String(process.env.KAFKA_RETRY_TIMEOUT), 10),
    // KAFKA_ENFORCE_REQUEST_TIMEOUT: process.env.KAFKA_ENFORCE_REQUEST_TIMEOUT === 'true',
    // KAFKA_METADATA_MAX_AGE: parseInt(String(process.env.KAFKA_METADATA_MAX_AGE), 10),
    // KAFKA_ALLOW_AUTO_CREATE_TOPICS: process.env.KAFKA_ALLOW_AUTO_CREATE_TOPICS === 'true',
    // KAFKA_IDEMPOTENCE: process.env.KAFKA_IDEMPOTENCE === 'true',
    // KAFKA_TRANSACTIONAL_ID: process.env.KAFKA_TRANSACTIONAL_ID,
    // KAFKA_TRANSACTION_TIMEOUT: parseInt(String(process.env.KAFKA_TRANSACTION_TIMEOUT), 10),
    // KAFKA_ISOLATION_LEVEL: process.env.KAFKA_ISOLATION_LEVEL,
    // KAFKA_ENABLE_IDEMPOTENCE: process.env.KAFKA_ENABLE_IDEMPOTENCE === 'true',
    // KAFKA_ENABLE_BATCH_PRODUCTION: process.env.KAFKA_ENABLE_BATCH_PRODUCTION === 'true',
    // KAFKA_PRODUCER_ACKS: process.env.KAFKA_PRODUCER_ACKS,
    // KAFKA_PRODUCER_COMPRESSION_TYPE: process.env.KAFKA_PRODUCER_COMPRESSION_TYPE,
    // KAFKA_PRODUCER_MAX_IN_FLIGHT_REQUESTS_PER_CONNECTION: parseInt(String(process.env.KAFKA_PRODUCER_MAX_IN_FLIGHT_REQUESTS_PER_CONNECTION)) || 1,
}