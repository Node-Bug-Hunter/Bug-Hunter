import { appendFileSync, existsSync, link, lstatSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "fs";
import { HunterLogConfig, LoggableData, Stack } from "./types";
import { getDateTimeInIST } from "./utility";

type JSONLog = {
    stackTrace: Stack[];
    timestamp: number;
    appStatus: string;
    message: string;
}

function buildTextLog(ld: LoggableData): string {
    let txtLogs: string[] = [];
    const p1 = `${getDateTimeInIST()} [!]`;
    const p2 = `"${ld.errorMessage}", "Program ${ld.status}"`;
    const erStarter = `${p1} - ${p2}`;
    txtLogs.push(erStarter);

    for (const stk of ld.stack) txtLogs.push(`\tat ${stk.function} (${stk.file}:${stk.line}:${stk.column})`);
    return `${"-".repeat(erStarter.length - 1)}\n${txtLogs.join('\n')}\n\n`;
}

function buildJsonLog(ld: LoggableData): JSONLog {
    return ({
        appStatus: ld.status,
        timestamp: Date.now(),
        message: ld.errorMessage,
        stackTrace: ld.stack
    });
}

function findNextFilePath(config: HunterLogConfig): string {
    const type = config.logType === "text" ? "txt" : "json";
    const eachSize = config.maxFileSizeMB;
    let logDir = config.logDir;

    if (logDir.endsWith('\\') || logDir.endsWith('/'))
        logDir = logDir.substring(0, logDir.length - 1);
    const initPath = `${logDir}/log-0.${type}`;
    
    if (!existsSync(logDir)) {
        mkdirSync(logDir, { recursive: true });
        return initPath;
    }

    const files = readdirSync(logDir).filter(f => f.split('.').pop() === type);
    const sorter = (a: number, b: number) => (a - b);
    if (files.length === 0) return initPath;
    const fileIds = files.map(f =>
        parseInt(f.split('.')[0]
        .split('-')[1]))
        .sort(sorter);
    
    const lastNumber = fileIds.pop();
    const lfpth = `${logDir}/log-${lastNumber}.${type}`;
    const fileSizeMB = lstatSync(lfpth).size / (1024 * 1024);
    if (fileSizeMB >= eachSize) return `${logDir}/log-${lastNumber + 1}.${type}`;
    return lfpth;
}

export function writeLog(logObj: LoggableData) {
    const isJSONType = logObj.config.logType === "json";
    const builder = isJSONType ? buildJsonLog : buildTextLog;
    const logFileDir = findNextFilePath(logObj.config);
    const logData = builder(logObj);
    const encoding = "utf-8";
    
    if (isJSONType) {
        let jsonLogArr: JSONLog[] = [];

        try {
            if (existsSync(logFileDir)) {
                jsonLogArr = JSON.parse(readFileSync(logFileDir, { encoding }));
                if (!Array.isArray(jsonLogArr)) jsonLogArr = [];
            }
        }
        catch { }

        jsonLogArr.push(logData as JSONLog);
        writeFileSync(logFileDir, JSON.stringify(jsonLogArr, null, 2), { encoding });
        return;
    }
    
    appendFileSync(logFileDir, logData as string, { encoding });
}
