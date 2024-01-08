import mysql, { Pool, Connection, PoolConnection } from 'mysql';
import L from './logger';

const connTrackMap = new Map();
const CONNECTION_RELEASE_TIMEOUT = 240000; // 4 minutes

const DB = {
    host: process.env.MYSQL_HOST || 'localhost',
    port: process.env.MYSQL_PORT ? parseInt(process.env.MYSQL_PORT) : 3306,
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || 'password',
    database: process.env.MYSQL_DATABASE || 'test',
    connectionLimit: process.env.MYSQL_CONNECTION_LIMIT ? parseInt(process.env.MYSQL_CONNECTION_LIMIT) : 10,
    charset: 'utf8mb4',
}

const pool: Pool = mysql.createPool(DB);

export const formatQ : Function = mysql.format;

export function startMysqlTxn(db: Connection) {
    return new Promise<void>((resolve, reject) => {
        db.beginTransaction((err) => {
            if (err) {
                L.error('Txn begin error - ', err);
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

export function commitMysqlTxn(db: Connection) {
    return new Promise<void>((resolve, reject) => {
        db.commit((err) => {
            if (err) {
                L.error('Txn commit error - ', err);
                reject(err);
            }
            resolve();
        });
    });
}

export function rollbackMysqlTxn(db: Connection) {
    return new Promise<void>((resolve, reject) => {
        db.rollback((err) => {
            if (err) {
                L.error('Txn rollback error - ', err);
                reject(err);
            } else {
                L.info('Rolled back txn');
                resolve();
            }
        });
    });
}

export function getDbConnectionFromPool(): Promise<PoolConnection> {
    return new Promise<PoolConnection>((resolve, reject) => {
        pool.getConnection((err, connection: PoolConnection) => {
            if (err) return reject(err);
            // NOTE: if not attached to req/res this connection needs to be released
            return resolve(connection);
        });
    });
}

export function getDbPool(): Pool {
    if (pool) {
        // L.debug('Acquired from MySQL pool');
        // thePool.query('SELECT 1 AS solution;', (error, results) => {
        //   if (error) throw error;
        //   console.log('The solution is: ', results[0].solution);
        // });
        return pool;
    }
    L.error('MySQL pool is not initialized');
    throw new Error('MySQL pool is not initialized');
}

export function releaseConnection(conn: PoolConnection): void {
    if (conn && (typeof conn.release === 'function')) return conn.release();
    return;
}

function trackPoolConnections(pool: Pool, limit: number): void {
    pool.on('acquire', (conn: PoolConnection) => {
        // L.debug('Connection acquired. context = %s. --- ', conn.context, conn.threadId);
        connTrackMap.set(conn, setTimeout(() => {
            L.warn('Connection %d acquired past limit!, context = %s, Closing now.', conn.threadId);
            releaseConnection(conn);
        }, limit));
    });

    pool.on('release', (conn: PoolConnection) => {
        const connection = conn;
        clearTimeout(connTrackMap.get(conn));
        connTrackMap.delete(conn);
    });
}

trackPoolConnections(pool, CONNECTION_RELEASE_TIMEOUT);

export function runDbStatement({ db, query }: { db: PoolConnection, query: string }) {
    return new Promise((resolve, reject) => {
        db.query(query, (error, results) => {
            if (error) reject(error);
            resolve(results);
        });
    });
}
