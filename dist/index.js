"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongoDBConnector = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
mongoose_1.default.set("useNewUrlParser", true);
mongoose_1.default.set("useFindAndModify", false);
mongoose_1.default.set("useCreateIndex", true);
mongoose_1.default.set("useUnifiedTopology", true);
class MongoDBConnector {
    constructor({ mode, username, password, hosts, database, srv, options }) {
        this.database = "";
        this.uri = "mongodb://";
        if (options?.isDebug === true) {
            mongoose_1.default.set("debug", true);
        }
        switch (mode) {
            case "object": {
                if (username && password) {
                    this.uri += `${username}:${password}@`;
                }
                this.uri += hosts.reduce((preVal, { hostname, port }, ind, arr) => {
                    preVal += `${hostname}:${port ? port : "27017"}${ind < (arr.length - 1) ? "," : ""}`;
                    return preVal;
                }, "");
                this.uri += "/" + database;
                this.database = database;
                this.options = {
                    "dbName": database
                };
                break;
            }
            case "srv": {
                if (!srv) {
                    throw new Error("Invalid MongoDB SRV connection string");
                }
                this.uri = srv;
                this.database = database;
                this.options = {
                    "dbName": database
                };
                break;
            }
            case "env": {
                if (process.env["MONGODB_USER"] &&
                    process.env["MONGODB_PASSWORD"]) {
                    this.uri += `${process.env["MONGODB_USER"]}:${process.env["MONGODB_PASSWORD"]}@`;
                }
                this.uri += process.env["MONGODB_HOSTNAMES"]; // Replica set destinations as a string through one single environmental variable
                if (process.env["MONGODB_PORT"]) {
                    this.uri += `:${process.env["MONGODB_PORT"]}`;
                }
                this.uri += `/${process.env["MONGODB_DATABASE"]}`;
                this.database = process.env["MONGODB_DATABASE"];
                this.options = {
                    "dbName": process.env["MONGODB_DATABASE"]
                };
                break;
            }
        }
        if (!this.database) {
            throw new Error("A database has to be specified");
        }
    }
    async connect() {
        console.log(`[${new Date().toISOString()}] Connecting to database "${this.database}"`);
        try {
            if ([1, 2].includes(mongoose_1.default.connection.readyState)) {
                this.client = await mongoose_1.default.createConnection(this.uri, this.options);
            }
            else {
                await mongoose_1.default.connect(this.uri, this.options);
                this.client = mongoose_1.default.connection;
            }
            console.log(`[${new Date().toISOString()}] Connection to database "${this.database}" established.`);
        }
        catch (e) {
            console.error(`[${new Date().toISOString()}] Dumping database connection stack trace: ${e}`);
            console.error(`[${new Date().toISOString()}] Connection error: ${e.message}`);
            process.exit(1);
        }
        this.client.on("error", (e) => {
            console.error(`[${new Date().toISOString()}] Dumping database connection stack trace: ${e}`);
            throw new Error(`[${new Date().toISOString()}] Database connection error: ${e.message}`);
        });
        this.client.on("disconnected", (e) => {
            console.error(`[${new Date().toISOString()}] Dumping disconnection stack trace: ${e}`);
            console.error(`[${new Date().toISOString()}] Disconnected from database "${this.database}"`);
            process.exit(1);
        });
        return this.client;
    }
}
exports.MongoDBConnector = MongoDBConnector;
exports.default = MongoDBConnector;
