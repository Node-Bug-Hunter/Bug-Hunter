import { JSON_Stringify, parseStack, wait } from "./utility";
import { Realtime, Rest, Types } from "ably/promises";
import { SKIP_STRING } from "./config.json";
import { compress } from "./packer";
import { ErrorInfo } from "ably";
import { Stack } from "./types";

const maxLogCount = 10;
const channelName = "info";
type Levels = "LOG" | "INFO" | "TABLE" | "WARN" | "ERROR";

type Log = {
    logValue: string;
    type: string;
}

type LogObject = {
    timeStamp: number;
    logLevel: Levels;
    data: Log[];
    at: Stack[];
};

export class LogPipe {
    private disposed = false;
    private queueActive = false;
    private userApiToken: string;
    private realtimeAbly: Types.RealtimePromise;
    private restAblyChannel: Types.ChannelPromise;
    private logsQueue: [Function, LogObject, AbortController][];

    constructor(token: string) {
        const log = console.log, info = console.info, warn = console.warn, table = console.table, error = console.error;
        const fnMaps: [Levels, Function][] = [["LOG", log], ["INFO", info],
            ["WARN", warn], ["TABLE", table], ["ERROR", error]];
        for (const fnMap of fnMaps) this.applyToConsole(fnMap);

        this.userApiToken = token;
        this.realtimeAbly = new Realtime.Promise(token);
        this.restAblyChannel = new Rest.Promise(token).channels.get(channelName);
    }

    async dispose() {
        if (this.disposed) return;
        this.disposed = true;
        
        for (const [,, controller] of this.logsQueue) {
            controller.abort();
        }

        this.logsQueue.length = 0;
        this.queueActive = false;
        this.realtimeAbly.close();

        await this.realtimeAbly
            .connection.once("closed");

        this.restAblyChannel = null;
        this.realtimeAbly = null;
    }

    private applyToConsole(map: [Levels, Function]) {
        const fnName = map[0].toLowerCase();
        const instance: LogPipe = this;

        console[fnName] = function() {
            const args = [...arguments];            

            if (args[0] === SKIP_STRING) {
                args.shift(); // remove first argument as it's a custom delimiter
                map[1].apply(console, args);
                return;
            }

            map[1].apply(console, args);
            if (instance.disposed) return;
            const loggedData = args.map(createLogPiece);
            const callStack = parseStack(new Error().stack, true);
            if (callStack.length > 5) callStack.length = 5;
            callStack.shift();

            const logObj = {
                timeStamp: Date.now(),
                data: loggedData,
                logLevel: map[0],
                at: callStack
            };

            instance.logsQueue.push([instance.dispatchLogs,
                logObj, new AbortController()]);
            instance.runDispatcher();

            if (instance.logsQueue.length > maxLogCount) {
                instance.logsQueue.shift()[2].abort();
            }
        }
    }

    private async runDispatcher() {
        if (!this.queueActive) return;
        const dispatchable = this.logsQueue[0];

        if (this.logsQueue.length === 0 || !dispatchable) {
            this.queueActive = false;
            return;
        }

        try {
            this.queueActive = true;
            const [dispatcher, logObj, logAborter] = dispatchable;
            await dispatcher(logObj, logAborter.signal);
        } catch { }

        this.queueActive = false;
        this.logsQueue.shift();
        this.runDispatcher();
    }

    private async dispatchLogs(logObj: LogObject, signal: AbortSignal) {
        (signal as any).addEventListener("abort",
            () => { throw new Error() });
        
        let chunksSent = 0;
        const LIMIT = 20_480;
        const transport = JSON_Stringify(logObj);
        const compressedStr = compress(transport, 15);
        const channel = await this.becomeDispatchable();
        const sendable = (compressedStr.length > transport.length) ? transport : compressedStr;
        let chunksLen = Number.parseInt(`${sendable.length / LIMIT}`);
        if (sendable.length % LIMIT > 0) chunksLen++;

        while (true) {
            try {
                if (sendable.length < LIMIT) {
                    await channel.publish("logs", compressedStr);
                    break;
                }
                
                for (let i = chunksSent; i < chunksLen; i++) { // Implemented fault tolerence to send chunks reliably
                    const chunk = sendable.slice(i * LIMIT, (i + 1) * LIMIT);

                    await channel.publish("logs", {
                        part: chunksSent + 1,
                        chunked: true,
                        chunk
                    });

                    chunksSent++;
                }
                
                if (chunksSent >= LIMIT) break;
            }
            catch (e) {
                if (e instanceof ErrorInfo) {
                    const ablyCode = e.code.toString();

                    if (ablyCode.startsWith("401")) {
                        console.log(SKIP_STRING, "Top-Level Authorization Failed");
                        return;
                    }
                }
            }
        }
    }

    private async becomeDispatchable() {
        while (true) {
            try {
                const channelStatus = (await this.restAblyChannel.status()).status;
                if (channelStatus.occupancy.metrics.subscribers > 0) break;
            } catch { }

            await wait(4000);
        }

        await this.realtimeAbly.connection.once("connected"); // This will get resolved immediately in most of the cases
        return this.realtimeAbly.channels.get(channelName);
    }
}

function createLogPiece(a: unknown): Log {
    let logValue: string = JSON_Stringify(a);

    if (typeof a === "function")
        logValue = JSON_Stringify({ name: a.name });
    
    return ({
        type: getTypeOf(a),
        logValue
    });
}

function getTypeOf(a: unknown): string {
    let typeStr = typeof a;

    switch (typeStr) {
        case "number": {
            if (!Number.isFinite(a)) return "<Infinite>";
            if (Number.isNaN(a)) return "<NaN>";
            return "<number>"; 
        }

        case "object": {
            if (a === null) return "<null>";
            if (Array.isArray(a)) return "<array>";
            return (a as Object).constructor.name; // Maybe a user defined Class object
        }
    
        default: return `<${typeStr}>`;
    }
}
