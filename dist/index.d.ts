import mongoose from "mongoose";
interface MongoDBConfig {
    mode: string;
    username?: string;
    password?: string;
    hosts?: Array<Host>;
    database?: string;
    srv?: string;
    options?: {
        isDebug?: boolean;
    };
}
interface Host {
    hostname: string;
    port?: string | number;
}
export declare class MongoDBConnector {
    private client;
    database: any;
    uri: string;
    options: {
        dbName?: string;
        [x: string]: any;
    };
    constructor({ mode, username, password, hosts, database, srv, options }: MongoDBConfig);
    connect(): Promise<mongoose.Connection>;
}
export default MongoDBConnector;
