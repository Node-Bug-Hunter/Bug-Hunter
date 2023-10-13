import { SERVER_URL, DEBUG_STRING } from "./config.json";
import { parseStack } from "./utility";
import * as Ably from "ably/promises";
import { Stack } from "./types";
import axios from 'axios';

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
    private enabled = true;
    private userApiToken: string;
    private logsQueue: LogObject[];
    private debounceID: NodeJS.Timeout;

    constructor(token: string) {
        const log = console.log, info = console.info, warn = console.warn, table = console.table, error = console.error;
        const fnMaps: [Levels, Function][] = [["LOG", log], ["INFO", info],
            ["WARN", warn], ["TABLE", table], ["ERROR", error]];
        for (const fnMap of fnMaps) this.applyToConsole(fnMap);
        this.userApiToken = token;
    }

    dispose() {
        this.enabled = false;
        // ToDo: cleanup Ably instances
    }

    private applyToConsole(map: [Levels, Function]) {
        const fnName = map[0].toLowerCase();
        const instance: LogPipe = this;

        console[fnName] = function() {
            const args = [...arguments];
            map[1].apply(console, args);
            if (!instance.enabled) return;
            if (args[0] === DEBUG_STRING) return;
            const loggedData = args.map(anyToStrMapper);
            const callStack = parseStack(new Error().stack, true);
            callStack.shift();

            instance.logsQueue.unshift({
                timeStamp: Date.now(),
                data: loggedData,
                logLevel: map[0],
                at: callStack
            });

            // Store last 10 logs at most
            if (instance.logsQueue.length > 10)
                instance.logsQueue.length = 10;
            instance.dispatchLogs();
        }
    }

    private dispatchLogs() {
        clearTimeout(this.debounceID);
        // Used debouncing to send aggregated logs if generated in given interval of time

        this.debounceID = setTimeout(async () => {
            try {
                const putResp = await axios.put(SERVER_URL, {
                    payload: this.logsQueue
                }, {
                    headers: {
                        "Authorization": `bearer ${this.userApiToken}`
                    }
                });

                if (putResp.status === 200) {
                    // Clear all logs as it has been successfully recorded by the server
                    this.logsQueue.length = 0;
                }
            }
            catch {
                // 
            }
        }, 1000);
    }
}

function anyToStrMapper(a: any): Log {
    let retStr: string = "<dim>unknown</dim>";

    if (typeof a === "function") {
        const aFn = a as Function;
        retStr = `<func>${aFn.name}() {...}</func>`;
    }
    else {
        const argStr = JSON.stringify(a);

        if (a === undefined || argStr === undefined) retStr = "<dim>undefined</dim>";
        else if (argStr === '""') retStr = "<dim>Empty</dim>"
        else if (argStr === "null") {
            if (isNaN(a)) retStr = "<dim>NaN</dim>";
            else if (a === Infinity) retStr = "<dim>Infinity</dim>";
            else if (a === -Infinity) retStr = "<dim>-Infinity</dim>";
            else retStr = "<dim>null</dim>";
        }
        else retStr = argStr;
    }

    return ({
        type: getTypeOf(a),
        logValue: retStr
    });
}

function getTypeOf(a: any): string {
    if (!a) return "falsy";
    else if (typeof a === "object") {
        if (Array.isArray(a)) return "Array";
        return `${a?.constructor.name}`;
    }

    return (typeof a);
}
