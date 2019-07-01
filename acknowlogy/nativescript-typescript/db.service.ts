import { Injectable } from "@angular/core";
import * as sqlite from "nativescript-sqlite";

import { DebugLog } from "./db.model";
import { DbTableColumnType, DbTableSchema, SCHEMAS } from "./db.schema";

let db: NSSQLite.Database;
const dbname = "acknowlogy.safety.v1";

export interface DbTable<T> extends DbView<T> {
    add(entity: T): Promise<T>;

    remove(entity: T): Promise<T>;

    update(entity: T): Promise<T>;
}

export interface DbView<T> {
    readonly name: string;

    all(): Promise<Array<T>>;
    all(orderBy: string): Promise<Array<T>>;

    query(where: string): Promise<Array<T>>;
    query(where: string, params: Array<any>): Promise<Array<T>>;
    query(
        where: string,
        params: Array<any>,
        orderBy: string
    ): Promise<Array<T>>;
    query(
        where: string,
        params: Array<any>,
        orderBy: string,
        limit: number,
        offset?: number
    ): Promise<Array<T>>;

    get(primaryKey: any): Promise<T | null>;

    exists(primaryKey: any): Promise<boolean>;
}

class SqliteDbTable<T> implements DbTable<T> {
    private _name: string;

    private _schema: DbTableSchema;
    private _insertableColumns: string;
    private _insertableColumnParameters: string;
    private _updatableColumns: string;

    constructor(name: string, schema: DbTableSchema) {
        this._name = name;
        this._schema = schema;

        const writableColumns = schema.columns;
        const writableColumNames = writableColumns.map(column => column.name);

        this._insertableColumns = writableColumNames
            .map(column => "[" + column + "]")
            .join(", ");
        this._insertableColumnParameters =
            "?, ".repeat(writableColumNames.length - 1) + "?";
        this._updatableColumns = writableColumNames.join(" = ?, ") + " = ?";
    }

    public get name() {
        return this._name;
    }

    public async add(entity: T) {
        const sql = `INSERT INTO [${this._schema.name}] (${
            this._insertableColumns
            }) VALUES (${this._insertableColumnParameters})`;
        const values = this._getAllValues(entity);

        await db.execSQL(sql, values);

        return entity;
    }

    public all(): Promise<Array<T>>;
    public all(orderBy: string): Promise<Array<T>>;
    public all(orderBy?: string): Promise<Array<T>> {
        const sql =
            `SELECT * FROM [${this._schema.name}]` +
            (orderBy ? " ORDER BY " + orderBy : "");

        return db.all<T>(sql);
    }

    public query(where: string): Promise<Array<T>>;
    public query(where: string, params: Array<any>): Promise<Array<T>>;
    public query(
        where: string,
        params: Array<any>,
        orderBy: string
    ): Promise<Array<T>>;
    public query(
        where: string,
        params: Array<any>,
        orderBy: string,
        limit: number,
        offset?: number
    ): Promise<Array<T>>;
    public query(
        where: string,
        params?: Array<any>,
        orderBy?: string,
        limit?: number,
        offset = 0
    ): Promise<Array<T>> {
        let sql =
            `SELECT * FROM [${this._schema.name}] WHERE ${where}` +
            (orderBy ? " ORDER BY " + orderBy : "");

        if (limit !== undefined) {
            sql = sql + ` LIMIT ${offset}, ${limit}`;
        }

        console.log("DB: " + sql);
        console.log("DB: " + JSON.stringify(params || []));

        return db.all<T>(sql, params);
    }

    public async remove(entity: T): Promise<T> {
        const sql = `DELETE FROM [${this._schema.name}] WHERE ${
            this._schema.primaryKey
            } = ?`;

        await db.execSQL(sql, [entity[this._schema.primaryKey]]);

        return entity;
    }

    public async update(entity: T): Promise<T> {
        const sql = `UPDATE [${this._schema.name}] SET ${
            this._updatableColumns
            } WHERE ${this._schema.primaryKey} = ?`;

        await db.execSQL(sql, [
            ...this._getAllValues(entity),
            entity[this._schema.primaryKey]
        ]);

        return entity;
    }

    public async get(primaryKey: any): Promise<T | null> {
        const sql = `SELECT * FROM [${this._schema.name}] WHERE ${
            this._schema.primaryKey
            } = ?`;

        return db.get<T>(sql, [primaryKey]);
    }

    public async exists(primaryKey: any): Promise<boolean> {
        return !!(await this.get(primaryKey));
    }

    private _getAllValues(entity: T) {
        const values: Array<any> = [];

        for (const column of this._schema.columns) {
            values.push(entity[column.name]);
        }

        return values;
    }
}

class SqliteDbView<T> implements DbView<T> {
    private _name: string;

    private _definition: string;
    private _primaryKeyColumn: string;

    constructor(name: string, definition: string, primaryKeyColumn: string) {
        this._name = name;
        this._definition = definition;
        this._primaryKeyColumn = primaryKeyColumn;
    }

    public get name() {
        return this._name;
    }

    public all(): Promise<Array<T>>;
    public all(orderBy: string): Promise<Array<T>>;
    public all(orderBy?: string): Promise<Array<T>> {
        const sql =
            `SELECT * FROM (${this._definition})` +
            (orderBy ? " ORDER BY " + orderBy : "");

        return db.all<T>(sql);
    }

    public query(where: string): Promise<Array<T>>;
    public query(where: string, params: Array<any>): Promise<Array<T>>;
    public query(
        where: string,
        params: Array<any>,
        orderBy: string
    ): Promise<Array<T>>;
    public query(
        where: string,
        params?: Array<any>,
        orderBy?: string
    ): Promise<Array<T>> {
        const sql =
            `SELECT * FROM (${this._definition}) WHERE ${where}` +
            (orderBy ? " ORDER BY " + orderBy : "");

        return db.all<T>(sql, params);
    }

    public async get(primaryKey: any): Promise<T | null> {
        const sql = `SELECT * FROM (${this._definition}) WHERE ${
            this._primaryKeyColumn
            } = ?`;

        return db.get<T>(sql, [primaryKey]);
    }

    public async exists(primaryKey: any): Promise<boolean> {
        return !!(await this.get(primaryKey));
    }
}

const debugLogs = new SqliteDbTable<DebugLog>("DebugLogs", SCHEMAS.debugLogs);

@Injectable()
export class DbService {
    public async init() {
        db = await new sqlite(dbname);

        db.resultType(sqlite.RESULTSASOBJECT);
        db.valueType(sqlite.VALUESARENATIVE);

        for (const key of Object.keys(SCHEMAS)) {
            const table = SCHEMAS[key];
            const columnDefinitions = table.columns
                .map(column => {
                    const nullable =
                        typeof column.isNullable === "undefined" ||
                        column.isNullable;

                    return `${column.name} ${DbTableColumnType[column.type]} ${
                        column.name === table.primaryKey ? "PRIMARY KEY" : ""
                        } ${nullable ? "NULL" : "NOT NULL"}`;
                })
                .join(", ");

            await db.execSQL(
                `CREATE TABLE IF NOT EXISTS [${
                table.name
                }] (${columnDefinitions});`
            );
        }
    }

    public get debugLogs(): DbTable<DebugLog> {
        return debugLogs;
    }

    public async query<T>(sql: string, params?: Array<any>) {
        if (!db) {
            throw new Error("DB has not been initialized");
        }

        return db.all<T>(sql, params);
    }

    public async execute(sql: string, params?: Array<any>) {
        if (!db) {
            throw new Error("DB has not been initialized");
        }

        return db.execSQL(sql, params);
    }
}
