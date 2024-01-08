Prerequisite:
- Make sure you have mysql, redis, zookeeper and kafka installed and running
- Create the tables defined in tables.sql (Another method is to run this command in mysql shell after adjusting the path accordingly: `source path/to/tables.sql`)
- export path to kafka/bin in .bashrc / .zshrc / terminal configuration file
- Command to create the topic: `kafka-topics --bootstrap-server 127.0.0.1:9092 --create --topic post --partitions 10`

Steps to Run:
1. Run command `npm i`
2. Run command `npm run dev`

Curls:
1. Creating Post
```
curl --location 'http://127.0.0.1:3000/api/v1/posts/create_post' \
--header 'Content-Type: application/json' \
--data '{
    "post_id": "    10",
    "content": ",,,dwhuw dhuwhdihu wjfiej,,"
}'
```

2. Get Post Stat by ID
```
curl --location 'http://127.0.0.1:3000/api/v1/posts/stats?id=10'
```

Assumptions:
- Max Character limit for post body is 1000.
- Post Identifier (id) should have only Alphabets, digits, underscore and hyphen.
- Stats of the Post is not required at the same instant.

Infrastructure and Scaling Write up:
- Using kafka for asynchronous post processing to handle high throughput of events without impacting the performance for end users. These systems can efficiently manage sudden spikes in traffic if we configure HorizontalAutoScaler / VerticalAutoScaler basis on the resource usage or metrics like disk throughput in case of Kafka Brokers.
- In production scenario, Column Oriented Database should be used since it is optimized for Queries on few selected columns which suits our case.
- Post Identifier Creation logic can help us with better indexing in Database (based on User? Time? location ?).
- Producer, Consumer, Kafka Broker Pods can be distributed such that they could be across nodes, racks, data-centres and even zones and become highly available even in case of catastrophe.
- Configuring the right number of Partitions and replicas for Kafka-topic according to our estimated peak traffic will facilitate parallelism in data processing and consumption and fault tolerance.
- Load Balancing the traffic for Backend Services.
- Caching Strategy Can be refined. If the stats are being shown to user, Post Identifier can be used to calculate slot which have higher affinity to node nearer to user. If our usecase is for internal data analysis, recent posts across redis nodes should be well distributed across redis-nodes avoiding hot spots and skewed workload. Range of hash per partition combined with good hash function like MD5 or CRC-16. (like Redis Slots)