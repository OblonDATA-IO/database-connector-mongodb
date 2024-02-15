import mongoose, { Connection, Error, } from "mongoose";

interface MongoDBConfig {
    mode: string,
    username?: string,
    password?: string,
    hosts?: Array<Host>,
    database?: string,
    srv?: string,
    options?: {
        isDebug?: boolean,
    }
}

interface Host {
    hostname: string,
    port?: string | number,
}

export class MongoDBConnector {
    private client: null | Connection;
    database: any;
    uri: string;
    options: {
        dbName?: string;
        [x: string]: any;
    };

    constructor (
        {
            mode,
            username, password, hosts, database,
            srv,
            options
        }: MongoDBConfig,
    ) {
        this.client = null;
        this.database = "";
        this.uri = "mongodb://";
        this.options = {};

        if (options?.isDebug === true) {
            mongoose.set("debug", true);
        }

        switch (mode){
            case "object": {
                if (username && password){
                    this.uri += `${ username }:${ password }@`
                }

                this.uri += (hosts ?? []).reduce(
                    (preVal, { hostname, port }, ind, arr) => {
                        preVal += `${ hostname }:${ port ? port : "27017" }${ ind < (arr.length - 1) ? "," : "" }`;
                        return preVal;
                    },
                    ""
                );

                this.uri += "/" + database ?? "";
                this.database = database ?? "";
                this.options = {
                    "dbName": database ?? ""
                };
                break;
            }

            case "srv": {
                if (!srv) {
                    throw new Error("Invalid MongoDB SRV connection string");
                }
                this.uri = srv;
                this.database = database ?? "";
                this.options = {
                    "dbName": database ?? ""
                };
                break;
            }

            case "env": {
                if (process.env["MONGODB_USER"] && process.env["MONGODB_PASSWORD"]){
                    this.uri += `${ process.env["MONGODB_USER"] }:${ process.env["MONGODB_PASSWORD"] }@`
                }

                this.uri += process.env["MONGODB_HOSTNAMES"]; // Replica set destinations as a string through one single environmental variable

                if (process.env["MONGODB_PORT"]){
                    this.uri += `:${ process.env["MONGODB_PORT"] }`;
                }

                this.uri += `/${ process.env["MONGODB_DATABASE"] }`;
                this.database = process.env["MONGODB_DATABASE"];
                this.options = { "dbName": <string>process.env["MONGODB_DATABASE"] };
                break;
            }
        }

        if (!this.database) {
            throw new Error("A database has to be specified");
        }
    }

    async connect () {
        console.log(`[${ new Date().toISOString() }] Connecting to database "${ this.database }"`);

        try {
            if ([1, 2].includes(mongoose.connection.readyState)) {
                console.log(`[${ new Date().toISOString() }] Existing connection found. Opening as a separate connection... "`);
                this.client = await mongoose.createConnection(this.uri, this.options).asPromise();
            } else {
                console.log(`[${ new Date().toISOString() }] Opening as the default connection... "`);
                await mongoose.connect(this.uri, this.options);
                this.client = mongoose.connection;
            }
            console.log(`[${ new Date().toISOString() }] Connection to database "${ this.database }" established.`);
        } catch (e: any) {
            console.error(`[${ new Date().toISOString() }] Dumping database connection stack trace: ${ e }`);
            console.error(`[${ new Date().toISOString() }] Connection error: ${ e.message }`);
            process.exit(1);
        }

        this.client.on(
            "error",
            e => {
                console.error(`[${ new Date().toISOString() }] Dumping database connection stack trace: ${ e }`);
                throw new Error(`[${ new Date().toISOString() }] Database connection error: ${ e.message }`);
            }
        );

        this.client.on(
            "disconnected",
            (e: Error) => {
                console.error(`[${ new Date().toISOString() }] Dumping disconnection stack trace: ${ e }`);
                console.error(`[${ new Date().toISOString() }] Disconnected from database "${ this.database }"`);
                process.exit(1);
            }
        );

        return this.client;
    }
}

export default MongoDBConnector;
