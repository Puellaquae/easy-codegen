import sqlite3 from 'sqlite3';
import { rm } from 'fs/promises';
import { existsSync } from 'fs';
import { config } from '../config/config.js';

class DB {
    /**
     *
     * @param {string} path
     */
    constructor(path) {
        this.db = new sqlite3.Database(path);
    }

    /**
     *
     * @param {string} sql
     * @param {object} param
     * @returns {Promise<void>}
     */
    async run(sql, param) {
        /** @type {Promise<void>} */
        let p = new Promise((res, rej) => {
            this.db.run(sql, param, function (err) {
                if (err != null) {
                    rej(err);
                } else {
                    res();
                }
            });
        });
        return p;
    }

    /**
     *
     * @param {string} sql
     * @param {object} param
     * @returns {Promise<any[]>}
     */
    async query(sql, param) {
        /** @type {Promise<any[]>} */
        let p = new Promise((res, rej) => {
            this.db.all(sql, param, function (err, rows) {
                if (err != null) {
                    rej(err);
                } else {
                    res(rows);
                }
            });
        });
        return p;
    }

    /**
     *
     * @param {string} sql
     * @param {object} param
     * @returns {Promise<any>}
     */
    async queryOne(sql, param) {
        /** @type {Promise<any[]>} */
        let p = new Promise((res, rej) => {
            this.db.all(sql, param, function (err, rows) {
                if (err != null) {
                    rej(err);
                } else {
                    res(rows[0] ?? null);
                }
            });
        });
        return p;
    }

    /**
     *
     * @param {string} sql
     * @param {object} param
     * @returns {Promise<any>}
     */
    async queryOneElem(sql, param) {
        /** @type {Promise<any[]>} */
        let p = new Promise((res, rej) => {
            this.db.all(sql, param, function (err, rows) {
                if (err != null) {
                    rej(err);
                } else {
                    let first = rows[0];
                    if (first === undefined) {
                        res(null);
                        return;
                    }
                    let key = Object.keys(first)[0];
                    if (key === undefined) {
                        res(null);
                        return;
                    }
                    res(first[key]);
                }
            });
        });
        return p;
    }

    /**
     *
     * @param {string} sql
     * @param {object} param
     * @returns {Promise<any>}
     */
    async queryElem(sql, param) {
        /** @type {Promise<any[]>} */
        let p = new Promise((res, rej) => {
            this.db.all(sql, param, function (err, rows) {
                if (err != null) {
                    rej(err);
                } else {
                    res(rows.map(r => {
                        let key = Object.keys(r)[0];
                        return r[key];
                    }));
                }
            });
        });
        return p;
    }

    /**
     *
     * @returns {Promise<void>}
     */
    async close() {
        return new Promise((res, rej) => {
            this.db.close((err) => {
                if (err != null) {
                    rej(err);
                } else {
                    res();
                }
            });
        });
    }
}

async function initDB() {
    if (existsSync(config.dbPath)) {
        await rm(config.dbPath);
    }
    let db = new DB(config.dbPath);
    await db.run(config.createTableSql);
}

export { DB, initDB };
