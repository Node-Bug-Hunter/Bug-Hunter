import { JSON_Stringify, parseStack, wait } from "./utility";
import { LogMSGEvent, Stack } from "./types";
import { Transceiver } from "./transceiver";
import { SKIP_STRING } from "./config.json";
import EventEmitter = require("events");
import { compress } from "./packer";
import { createHash } from "crypto";
import { ErrorInfo } from "ably";

const maxLogCount = 10;
type Level = "LOG" | "INFO" | "TABLE" | "WARN" | "ERROR";
const feedbackMSGS = ["logs-monitor-pause", "logs-monitor-resume"];

type Log = {
    logValue: any;
    type: string;
}

type LogObject = {
    timeStamp: number;
    logLevel: Level;
    data: Log[];
    at: Stack;
};

class Notifier extends EventEmitter {
    private webObserverPresent = false;
    private isReadyToListen = false;

    constructor() { super(); }

    setListenState(state: boolean) {
        this.isReadyToListen = state;
        this.emit("listen");
    }

    setObserverState(state: boolean) {
        this.webObserverPresent = state;
        this.emit("observer");
    }

    onFulfilled(signal: any) {
        return new Promise((resolve) => {
            const tryResolve = () => {
                if (!this.isReadyToListen || !this.webObserverPresent) return;
                disposeListeners.call(this);
                resolve("");
            };

            function disposeListeners(this: Notifier) {
                this.off("observer", tryResolve);
                this.off("listen", tryResolve);
            }

            signal.addEventListener("abort", disposeListeners.bind(this));
            this.on("observer", tryResolve);
            this.on("listen", tryResolve);
            tryResolve();
        });
    }
}

export class LogPipe {
    private disposed = false;
    private queueActive = false;
    private transceiver: Transceiver;
    private notifier = new Notifier();
    private logsQueue: [Function, LogObject, AbortController][] = [];

    constructor(_tscv: Transceiver) {
        const log = console.log, info = console.info, warn = console.warn, table = console.table, error = console.error;
        const fnMaps: [Level, Function][] = [["LOG", log], ["INFO", info],
            ["WARN", warn], ["TABLE", table], ["ERROR", error]];
        for (const fnMap of fnMaps) this.applyToConsole(fnMap);

        this.transceiver = _tscv;
        this.transceiver.on("msg", (name, data) => this.handleMessages(name, data));
        this.transceiver.on("state", (active) => this.notifier.setObserverState(active));
    }

    async dispose() {
        if (this.disposed) return;
        this.disposed = true;

        for (const [,, controller] of this.logsQueue)
            controller.abort(); // Interrupt queued logs

        this.logsQueue.length = 0;
        this.queueActive = false;
    }

    private applyToConsole(map: [Level, Function]) {
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

            const { stack } = new Error();
            const loggedData = args.map(createLogPiece);
            const callStack = parseStack(stack, true);
            if (callStack.length === 0) return;

            const logObj = {
                timeStamp: Date.now(),
                data: loggedData,
                logLevel: map[0],
                at: callStack[0]
            };

            instance.logsQueue.push([instance.dispatchLogs,
                logObj, new AbortController()]);
            instance.runDispatcher();

            if (instance.logsQueue.length > maxLogCount) {
                instance.logsQueue.shift()[2].abort();
            }
        }
    }

    private async handleMessages(name: string, data: any) {
        switch (name as LogMSGEvent) {
            case "logs-monitor-resume": this.notifier.setListenState(true); break;
            case "logs-monitor-pause": this.notifier.setListenState(false); break;

            default: break;
        }

        if (feedbackMSGS.includes(name))
            await this.transceiver?.pub("feedback", data);
    }

    private async runDispatcher() {
        if (this.queueActive) return;
        const dispatchable = this.logsQueue[0];

        if (this.logsQueue.length === 0 || !dispatchable) {
            this.queueActive = false;
            return;
        }

        try {
            this.queueActive = true;
            const [dispatcher, logObj, logAborter] = dispatchable;
            await dispatcher.bind(this, logObj, logAborter.signal)();
        } catch { }

        this.queueActive = false;
        this.logsQueue.shift();
        this.runDispatcher();
    }

    private async dispatchLogs(logObj: LogObject, signal: any) {
        // I don't know but for some reason in TS signal when typed as 'AbortSignal' doesn't supports 'addEventListener'
        const aborter = new Promise((_, reject) => signal.addEventListener("abort", () => reject()));
        
        async function becomeDispatchable(this: LogPipe) {
            await this.transceiver.ensureConnected();
            await this.notifier.onFulfilled(signal);
        }

        await Promise.race([becomeDispatchable.call(this), aborter]);

        let chunksSent = 0;
        const LIMIT = 20_480;
        const transport = JSON_Stringify(logObj);
        const compressedStr = compress(transport, 15);
        const msgId = createHash('md5').update(transport).digest('hex');
        const sendable = (compressedStr.length > transport.length) ? transport : compressedStr;
        let chunksLen = Math.trunc(sendable.length / LIMIT);
        if (sendable.length % LIMIT > 0) chunksLen++;

        while (true) {
            try {
                if (sendable.length < LIMIT) {
                    await Promise.race([this.transceiver
                        .pub("logs", compressedStr), aborter]);
                    return;
                }
                
                for (let i = chunksSent; i < chunksLen; i++) { // Implemented fault tolerence to send chunks reliably
                    const chunk = sendable.slice(i * LIMIT, (i + 1) * LIMIT);
                    const tobeId = i + 1;

                    await Promise.race([this.transceiver.pub("logs", {
                        final: tobeId >= chunksLen,
                        chunkId: msgId,
                        part: tobeId,
                        chunk
                    }), aborter]);

                    chunksSent++;
                }

                if (chunksSent >= chunksLen) return;
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

            // Allow for some cool down period before retrying!
            await Promise.race([wait(10 * 1000), aborter]);
        }
    }
}

function createLogPiece(a: unknown): Log {
    let logValue: any = a;

    if (typeof a === "function")
        logValue = { name: a.name };
    
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
