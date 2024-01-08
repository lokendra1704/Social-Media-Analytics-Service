import { Connection, Pool, PoolConnection } from "mysql";
import { formatQ, getDbPool } from "../utils/mysqldb";
import L from '../utils/logger';


const DaoQ = {
    TIMEOUT: 5000, // 4 minutes, https://github.com/mysqljs/mysql#timeouts
    INSERT: 'INSERT INTO ?? SET ?',
    INSERT_IGNORE: 'INSERT IGNORE INTO ?? SET ?',
    INSERT_MULTIPLE: "INSERT INTO ?? (??) VALUES ?",
    INSERT_OR_UPDATE_MULTIPLE: "INSERT INTO ?? (??) VALUES ? ON DUPLICATE KEY UPDATE",
    INSERT_MULTIPLE_IGNORE: "INSERT IGNORE INTO ?? (??) VALUES ?",
    INSERT_OR_UPDATE: "INSERT INTO ?? SET ? ON DUPLICATE KEY UPDATE ?",
    UPDATE: "UPDATE ?? SET ? WHERE ?? = ?",
    UPDATE_BY_COLUMN_LIST: "UPDATE ?? SET ? WHERE ?? IN (?)",
    UPDATE_CASE_WHEN_THEN: "UPDATE ?? SET ?? = CASE %s ELSE ?? END WHERE ?? IN (?)",
    DELETE: "DELETE FROM ?? WHERE ?? = ?",
    DELETE_BY_COLUMN_LIST: "DELETE FROM ?? WHERE ?? IN (?)",
    GET_ALL_ROWS: "SELECT * FROM ??",
    GET_BY_COLUMN: "SELECT * FROM ?? WHERE ?? = ?",
    COUNT_BY_COLUMN: "SELECT count(*) as count FROM ?? WHERE ?? = ?",
    GET_MAX_ID: "SELECT max(??) as maxId FROM ??",
    GET_MAX_BY_COLUMN: "SELECT max(??) as maxId FROM ?? WHERE ?? = ?",
    GET_PARTIAL_BY_COLUMN: "SELECT ?? FROM ?? WHERE ?? = ?",
    GET_IN_COLUMN_LIST: "SELECT * FROM ?? WHERE ?? IN (?)",
    SELECT_BY_COLUMN_LIST: "SELECT %s FROM ?? WHERE ?? IN (?) %s",
    SELECT_BY_COLUMN_LIST_FOR_UPDATE: "SELECT %s FROM ?? WHERE ?? = ? FOR UPDATE",
    INCREMENT_FIELD_VALUE_BY_ID: "UPDATE ?? SET ?? = ?? + ? WHERE ?? = ?",
    INCREMENT_FIELDS_BY_CONDITIONS: "UPDATE ?? SET %s WHERE %s",
    RANGE_CHECK_ON_INCREMENT: " AND ?? >= ABS(?)",
    GET_PARTIAL_COLUMNS: "SELECT ?? FROM ??",
};

const COND_AND = " AND ?? = ?";

function logQuery({ sql_id: sqlId, sql, values = [] }: { sql_id: string, sql: string, values: any[] }) {
    L.debug({
        message: `SQL_QUERY_LOG: ${sqlId}`,
        sqlId,
        sql_with_values: formatQ(sql, values),
        sql,
        values: values,
    });
}

export function insertMultipleObjs({
    db = getDbPool(), columnNames, multiRowsColValuesList, tableName, ignore,
}: { db: Pool | PoolConnection, columnNames: string[], multiRowsColValuesList: any[], tableName: string, ignore: boolean }) {
    const sql = ignore ? DaoQ.INSERT_MULTIPLE_IGNORE : DaoQ.INSERT_MULTIPLE;
    const values = [tableName, columnNames, multiRowsColValuesList];

    logQuery({ sql_id: `INSERT_MULTIPLE_${tableName}`, sql, values });
    return new Promise((resolve, reject) => {
        db.query(
            { sql, values, timeout: DaoQ.TIMEOUT },
            (err, result) => (err ? reject(err) : resolve(result.insertId)),
        );
    });
}

export function selectByColumns(
    db: PoolConnection | Pool = getDbPool(),
    { byColNameValues, firstResultOnly, orderBy, selectColumnList, limit, pagenum, tableName, lock }: any) : any 
    {
    let query = selectColumnList ? DaoQ.GET_PARTIAL_BY_COLUMN : DaoQ.GET_BY_COLUMN;
    const values: any[] = [tableName];
    for (const [col_name, value] of Object.entries(byColNameValues)) {
        if (!value) continue;
        values.push(col_name, value);
        if (values.length > 3) {// for 2nd condition onwards
            query += COND_AND;
        }
    }
    if (lock) { // UPDATE / SHARE
        query += lock;
    }
    if (selectColumnList) values.unshift(selectColumnList);
    if (orderBy) query += ` ORDER BY ${orderBy}`;
    if (pagenum) {
        query += " LIMIT ?,?";
        values.push(pagenum * limit, limit);
    } else if (limit) {
        query += " LIMIT ?";
        values.push(limit);
    }
    logQuery({ sql_id: `SELECT_BY_COLUMNS_${tableName}`, sql: query, values });
    return new Promise((resolve, reject) => db.query(
        { sql: query, values, timeout: DaoQ.TIMEOUT },
        (err, rows) => (err ? reject(err) : resolve(firstResultOnly ? rows[0] : rows)),
    ));
}