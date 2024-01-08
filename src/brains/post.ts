import { Pool, PoolConnection } from "mysql";
import { Post, PostDB, PostStat, PostStatDB } from "post"; //post.d.ts

import moment from 'moment';

import { getDbConnectionFromPool } from "../utils/mysqldb";
import { insertMultipleObjs, selectByColumns } from "../daos/dao";
import PostProducer, { getPostPartitionKey } from "../asynchronous/producer/postProducer";
import rc from "../utils/redis";
import { EXTENDED_EXPIRY, MYSQL_TIME_FORMAT, POPULARITY_THRESHOLD, POST_STATUS, STANDARD_EXPIRY, EXCLUDED_CHARACTERS } from "../constants";

const POST_TABLE_NAME = 'post';
const POST_STAT_TABLE_NAME = 'post_stat';

/**
 * Inserts a new post into db and push message to kafka for analysis
 * @param {String} postId 
 * @param {String} postBody 
 * @returns {Promise<Post>}
 */
export async function createPost(postId: string, postBody: string): Promise<Post> {
    const post: PostDB = {
        id: postId,
        body: postBody,
        status: POST_STATUS.ACTIVE,
        created_at: moment().format(MYSQL_TIME_FORMAT),
        updated_at: moment().format(MYSQL_TIME_FORMAT),
    }
    PostService.validatePost(post); // this throw error if post is invalid
    const dbConnection: PoolConnection = await getDbConnectionFromPool();
    try {
        // Insert post into db
        await PostService.bulkInsertPostDB({ dbConnection, posts: [post] });

        // Push message to kafka for analysis
        await PostProducer.sendBatch({ messages: [{ key: getPostPartitionKey(postId), value: JSON.stringify(post) }] });
    } catch (error: any) {
        throw error.code === 'ER_DUP_ENTRY' ? Object.assign(error, { status: 409, message: 'Post already exists' }) :
            { status: 400, name: 'Bad Request', message: 'Invalid post' };
    } finally {
        dbConnection.release();
    }
    return post;
}

/**
 * Analyses the post body and counts the number of words and average word length and stores it in db and cache.
 * @param {String} postJson The payload of the message from kafka
 */
export async function processPost(postJson: string) {
    const dbConnection: PoolConnection = await getDbConnectionFromPool();
    try {
        const post = JSON.parse(postJson);
        if (!post || typeof post.body !== 'string') {
            throw { status: 404, name: 'Not Found', message: 'Post not found' };
        }
        
        const words = PostService.getValidWordsFromPostBody(post.body); // Sanitize post body and get valid words
        const wordCount: number = words.length;
        const totalWordLength: number = words.reduce((acc, word) => acc + word.length, 0);
        const avgWordLength: number = totalWordLength / wordCount;

        const postStat: PostStatDB = {
            post_id: post.id,
            word_count: wordCount,
            avg_word_length: avgWordLength,
            created_at: moment().format(MYSQL_TIME_FORMAT),
            updated_at: moment().format(MYSQL_TIME_FORMAT),
        }
        await PostStatService.bulkInsertPostStats(dbConnection, [postStat]);
        PostStatService.setPostStatCache(postStat);
    } catch (error) {
        throw error;
    } finally {
        dbConnection.release();
    }
}

export class PostService {

    public static bulkInsertPostDB({
        dbConnection,
        posts,
    }: {
        dbConnection: PoolConnection;
        posts: PostDB[];
    }) {
        if (posts && posts.length > 0) {
            return insertMultipleObjs({
                db: dbConnection,
                columnNames: ['id', 'body', 'status', 'created_at', 'updated_at'],
                multiRowsColValuesList: posts.map((post) => Object.values(post)),
                tableName: POST_TABLE_NAME,
                ignore: false,
            });
        }
    }

    public static validatePost(post: PostDB) {
        if (typeof post.id !== 'string') {
            throw { status: 400, name: 'Bad Request', message: 'Invalid post id' };
        }
        if (typeof post.body !== 'string') {
            throw { status: 400, name: 'Bad Request', message: 'Invalid post body' };
        }
        if (post.body.length > 1000) {
            throw { status: 400, name: 'Bad Request', message: 'Post body is too long' };
        }
        if (post.body.replace(' ', '').length === 0) {
            throw { status: 400, name: 'Bad Request', message: 'Post body is empty' };
        }
        let allExcludedCharacter = true;
        for (const char of post.body) {
            if (!EXCLUDED_CHARACTERS.includes(char)) {
                allExcludedCharacter = false;
                break;
            }
        }
        if (allExcludedCharacter) {
            throw { status: 400, name: 'Bad Request', message: 'Post body contains only excluded characters' };
        }

        if (PostService.getValidWordsFromPostBody(post.body).length === 0) {
            throw { status: 400, name: 'Bad Request', message: 'Post body contains only excluded characters' };
        }

        return true;
    }

    public static getValidWordsFromPostBody(postBody: string) {
        const words: string[] = postBody.split(' ').filter((word: string) => !EXCLUDED_CHARACTERS.includes(word)).map((word: string) => {
            EXCLUDED_CHARACTERS.forEach((char) => word.replace(char, '').trim());
            return word;
        });
        return words;
    }

    public static async getPostDB(id: string) {
        const dbConnection: PoolConnection = await getDbConnectionFromPool();
        let post: Post | undefined;
        try {
            post = await selectByColumns(dbConnection, {
                byColNameValues: { id },
                firstResultOnly: true,
                tableName: POST_TABLE_NAME,
            })
        } catch (error: any) {
            throw error.code === 'ER_DUP_ENTRY' ? Object.assign(error, { status: 409, message: 'Post already exists' }) :
                { status: 400, name: 'Bad Request', message: 'Invalid post' };
        } finally {
            dbConnection.release();
        }
        return post;
    }

}

export class PostStatService {

    /**
     * Returns the post by Id. If the post is not found in cache, it will be fetched from db and stored in cache.
     * If the post is found in cache, the access count will be incremented and if the access count reaches the threshold,
     * the expiry time of the post will be extended.
     * This way we are able to keep the popular posts in cache for longer time.
     * 
     * Note: Since Redis is a single threaded application, the increment operation is atomic.
     * @param {String} postId id of the post
     * @returns {Promise<PostStatDB>}
     */
    public static async getPostStatById(postId: string): Promise<PostStatDB> {
        const postStatCacheKey = this.getPostStatCacheKey(postId);
        const accessCountCacheKey = this.getPostStatAccessCountCacheKey(postId);
        let postStat: PostStatDB | undefined | string = await this.getPostStatCache(postId);
        if (postStat) {
            const accessCount: number = await rc.incr(accessCountCacheKey);
            if (accessCount && accessCount === POPULARITY_THRESHOLD) {
                await rc.expire(postStatCacheKey, EXTENDED_EXPIRY);
                await rc.expire(accessCountCacheKey, EXTENDED_EXPIRY);
            }
            return postStat;
        }
        if (!postStat) {
            postStat = await this.refreshPostStatById(postId);
            if (postStat) {
                return postStat;
            }
        }
        throw { status: 404, name: 'Not Found', message: 'Post Stat not found' };
    }

    /**
     * Refreshes the post stat by fetching it from db and storing it in cache.
     * 
     * TODO: Give the PostStatAccessCountCacheKey and PostStatCacheKey near slots so that they are stored in the same node.
     * @param {String} postId 
     * @returns {Promise<PostStatDB>}
     */
    public static async refreshPostStatById(postId: string) : Promise<PostStatDB> {
        const postStat: PostStatDB | undefined = await this.getPostStatDB(postId);
        if (postStat) {
            this.setPostStatCache(postStat);
            return postStat;
        } else {
            throw { status: 404, name: 'Not Found', message: 'Post Stat not found' };
        }
    }

    /**
     * Returns the Redis key for storing the access count of the post
     * @param postId 
     * @returns 
     */
    public static getPostStatAccessCountCacheKey(postId: string) {
        return `access_count:${postId}`;
    }

    public static getPostStatCacheKey(postId: string) {
        return `post_stat:${postId}`;
    }

    public static calculatePostCacheTTL(post: any) {
        return STANDARD_EXPIRY;
    }

    public static setPostStatCache(postStat: PostStatDB) {
        const postStatCacheKey = this.getPostStatCacheKey(postStat.post_id);
        rc.set(postStatCacheKey, JSON.stringify(postStat), 'EX', this.calculatePostCacheTTL(postStat));
    }

    public static async getPostStatCache(postId: string) {
        let postStat: PostStatDB | undefined | string = await rc.get(this.getPostStatCacheKey(postId));
        if (postStat) {
            postStat = JSON.parse(String(postStat)) as PostStatDB;
            return postStat;
        }
        return undefined;
    }

    public static bulkInsertPostStats(db: Pool | PoolConnection, stats: PostStatDB[]) {
        const columnNames = ['post_id', 'word_count', 'avg_word_length', 'created_at', 'updated_at'];
        const multiRowsColValuesList = stats.map((stat) => Object.values(stat));
        // TODO Make it upsert
        return insertMultipleObjs({
            db,
            columnNames,
            multiRowsColValuesList,
            tableName: POST_STAT_TABLE_NAME,
            ignore: false,
        });
    }

    public static async getPostStatDB(id: string): Promise<PostStatDB | undefined> {
        const dbConnection: PoolConnection = await getDbConnectionFromPool();
        let postStat: PostStatDB | undefined;
        try {
            postStat = await selectByColumns(dbConnection, {
                byColNameValues: { post_id: id },
                firstResultOnly: true,
                tableName: POST_STAT_TABLE_NAME,
            })
            if (postStat) {
                postStat.created_at = moment(postStat.created_at).format(MYSQL_TIME_FORMAT);
                postStat.updated_at = moment(postStat.updated_at).format(MYSQL_TIME_FORMAT);
            }
        } catch (error: any) {
            throw error.code === 'ER_DUP_ENTRY' ? Object.assign(error, { status: 409, message: 'Post already exists' }) :
                { status: 400, name: 'Bad Request', message: 'Invalid post' };
        } finally {
            dbConnection.release();
        }
        return postStat;
    }

}