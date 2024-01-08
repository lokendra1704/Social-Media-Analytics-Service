import Redis from 'ioredis';
import { REDIS } from '../config';
import L from './logger';

function initRedis(REDIS_CONF = REDIS) {
  if (REDIS_CONF.IS_CLUSTER) {
    return new Redis.Cluster(REDIS_CONF.CLUSTER_ARRAY, { enableReadyCheck: true });
  } else {
    return new Redis({
      host: REDIS_CONF.HOST,
      port: REDIS_CONF.PORT,
      db: 0,
    });
  }
}

export class RedisDao {
    private rc: any;
    private rOK: boolean;

    constructor() {
      this.rc = initRedis();
      this.rOK = false;
  
      this.rc.on('connect', () => {
        L.debug(`REDIS CONNECTION ===> CONNECT`);
        // this.rOK = true;
      });
  
      this.rc.on('error', (err: any) => {
        L.error(`REDIS CONNECTION ===> ERROR `, err);
        this.rOK = false;
      });
  
      this.rc.on('ready', () => {
        L.debug(`REDIS CONNECTION ===> READY`);
        this.rOK = true;
      });
  
      this.rc.on('close', () => {
        L.debug(`REDIS CONNECTION ===> CLOSE`);
        this.rOK = false;
      });
  
      this.rc.on('reconnecting', (time: any) => {
        L.error(`REDIS CONNECTION ===> RECONNECTING `, time);
        this.rOK = false;
      });
  
      this.rc.on('end', () => {
        L.error(`REDIS CONNECTION ===> END`);
        this.rOK = false;
      });
    };
    
    brpoplpush(source: string, destination: string) {
      return this.rOK ? this.rc.brpoplpush(source, destination, 0) : undefined
    }

    del(key: string) {
      return this.rOK ? this.rc.del(key) : undefined
    }

    exists(key: string) {
      return this.rOK ? this.rc.exists(key) : undefined
    }

    expire(key: string, expiry: number) {
      return this.rOK ? this.rc.expire(key, expiry) : undefined
    }

    get(key: string) {
      return this.rOK ? this.rc.get(key) : undefined
    }

    mget(keys: string[]) {
      return this.rOK && keys.length > 0 ? this.rc.mget(keys) : undefined
    }

    mset(keyValueMap: Map<string, string>) {
      return this.rOK && keyValueMap instanceof Map && keyValueMap.size > 0 ? this.rc.mset(keyValueMap) : undefined
    }

    hset(key: string, field: string, value: string) {
      return this.rOK ? this.rc.hset(key, field, value) : undefined
    }

    hmset(key: string, obj: string) {
      return this.rOK ? this.rc.hmset(key, obj) : undefined
    }

    hmsetObject(key: string, obj: any) {
      return this.rOK && (Object.keys(obj).length > 0) ? this.rc.hmset(key, obj) : undefined
    }

    hvals(key: string) {
      return this.rOK ? this.rc.hvals(key) : undefined
    } //returns array of all values in hashmap

    hgetall(key: string) {
      return this.rOK ? this.rc.hgetall(key) : undefined
    } //returns {field:value, ..}

    hlen(key: string) {
      return this.rOK ? this.rc.hlen(key) : undefined
    } //returns {field:value, ..}

    hdel(key: string, field: string) {
      return this.rOK ? this.rc.hdel(key, field) : undefined
    }

    hkeys(key: string) {
      return this.rOK ? this.rc.hkeys(key) : undefined
    }

    hget(key: string, field: string) {
      return this.rOK ? this.rc.hget(key, field) : undefined
    }

    hmget(key: string, fields: string) {
      return this.rOK ? this.rc.hmget(key, fields) : undefined
    }

    lpush(key: string, value: string) {
      return this.rOK ? this.rc.lpush(key, value) : undefined
    }

    lrem(key: string, value: string, count = 0) {
      return this.rOK ? this.rc.lrem(key, count, value) : undefined
    }

    rename(oldKey: string, newKey: string) {
      return this.rOK ? this.rc.rename(oldKey, newKey) : undefined
    }

    rpush(key: string, value: string) {
      return this.rOK ? this.rc.rpush(key, value) : undefined
    }

    sadd(key: string, ...values: string[]) {
      return this.rOK ? this.rc.sadd(key, values) : undefined
    }

    srem(key: string, ...values: string[]) {
      return this.rOK ? this.rc.srem(key, values) : undefined
    };

    smembers(key: string) {
      return this.rOK ? this.rc.smembers(key) : undefined
    };

    sismember(key: string, member: string) {
      return this.rOK ? this.rc.sismember(key, member) : undefined
    };

    scard(key: string) {
      return this.rOK ? this.rc.scard(key) : undefined
    };

    setex(key: string, expiry: number, value: string) {
      return this.rOK ? this.rc.setex(key, expiry, value) : undefined
    };

    set(key: string, value: string, expiryMode: string, time: number) {
      if (this.rOK) {
        if (expiryMode && time !== undefined)
          return this.rc.set(key, value, expiryMode, time);
        else
          return this.rc.set(key, value);
      } else {
        return undefined;
      }
    }

    ttl(key: string) {
      return this.rOK ? this.rc.ttl(key) : undefined
    }

    incr(key: string) {
      return this.rOK ? this.rc.incr(key) : undefined
    }

    decr(key: string) {
      return this.rOK ? this.rc.decr(key) : undefined
    }

    hexists(key: string, field: string) {
      return this.rOK ? this.rc.hexists(key, field) : undefined
    };

    getKey(prefix: string, id: string) {return prefix + id}
}

export default new RedisDao();