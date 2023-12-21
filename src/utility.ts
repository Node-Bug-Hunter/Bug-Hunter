import { createReadStream, existsSync, fstat, mkdirSync, readFileSync, writeFileSync } from "fs";
import { Code, MachineData, Stack } from "./types";
import { createInterface } from "readline";
import path = require("path");
import { encode } from "he";
import os = require("os");
import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

/**
 * Parses the stack trace data to extract relevant information such as the function name, file name, line number, and column number.
 * @param stackData - The stack trace data to be parsed.
 * @param filter - An optional flag indicating whether to filter out stack trace entries that do not start with the current working directory.
 * @returns An array of `Stack` objects containing the extracted information from the stack trace data.
*/
function parseStack(stackData: string, filter?: boolean): Stack[] {
    const stackRegExp: RegExp = /(?:\s*at\s+)?(?:([^()]+)\s+\()?(?:(.*?):(\d+):(\d+)|([^\s]+))\)?/;
    const stackArray = stackData.split('\n').slice(1);
    const goodStack: Stack[] = [];
    const cwd = process.cwd();

    for (let i = 0; i < stackArray.length; i++) {
        const stackMatches = stackArray[i].match(stackRegExp);

        if (stackMatches && stackMatches.length > 4) {
            let [, fn, nm, ln, cn] = stackMatches;
            if (typeof nm !== "string" || typeof ln !==
                "string" || typeof cn !== "string") continue;
            nm = nm.replace(/^file:\/\/\//, "").replace(/\//g, "\\");

            if (filter) {
                if (!nm.startsWith(cwd)) continue;
                nm = "." + nm.replace(cwd, "");
            }

            const stackInfo: Stack = {
                column: parseInt(cn),
                line: parseInt(ln),
                function: fn ?? "",
                file: nm
            }

            goodStack.push(stackInfo);
        }
    }

    return goodStack.filter(s => s !== null);
}

function getAppDataFolder(...app: string[]) {
    let appData: string;
    
    function prependDot(...app) {
        return app.map((item, i) => {
            if (i === 0) return `.${item}`;
            return item;
        });
    }

    if (process.platform === 'win32') appData = path.join(process.env.APPDATA, ...app);
    else if (process.platform === 'darwin') appData = path.join(process.env.HOME, 'Library', 'Application Support', ...app);
    else appData = path.join(process.env.HOME, ...prependDot(...app));

    return appData;
}

function generateMachineId(): string {
    function getMacAddress() {
        const networkInterfaces = os.networkInterfaces();
        // Find the first non-internal MAC address
        for (const interfaceName of Object.keys(networkInterfaces))
            for (const interfaceInfo of networkInterfaces[interfaceName])
                if (!interfaceInfo.internal && interfaceInfo.mac)
                    // Remove colons to get a continuous string
                    return interfaceInfo.mac.replace(/:/g, '');

        return null;
    }

    function secureRandomNumber(min: number, max: number) {
        const range = max - min + 1;
        if (range <= 0) return Math.random() * max;

        // Generate random bytes
        // Calculate the number of bytes needed to represent the range
        const byteSize = Math.ceil(Math.log2(range) / 8);      
        const randomBytes = crypto.randomBytes(byteSize);
        const random = randomBytes.readUIntBE(0, byteSize) % range;

        return min + random;
    }

    // Combine machine-specific information, UUID, and randomness
    const combinedInfo = `${os.hostname()}${os.arch()}${os.platform()}
        ${getMacAddress()}${uuidv4()}${crypto.randomBytes(16).toString('hex')}`;
    const machineId = crypto.createHash('sha256').update(combinedInfo).digest('hex');
    const rndLen = secureRandomNumber(10, 15), rndStart = secureRandomNumber
        (0, 64 - (rndLen + 1)), rndSuffix = secureRandomNumber(-55, 55);
    const newIdHash = machineId.substring(rndStart, rndStart + rndLen);

    return `${newIdHash};${rndSuffix}`;
}

export function getSetIdConfig(name: string, active: boolean): MachineData {
    const adf = getAppDataFolder("bug-hunter");
    const idPath = `${adf}/id.txt`;

    if (existsSync(adf)) {
        const idStr = readFileSync(idPath, { encoding: "utf-8" });
        return ({ name, id: idStr, monitoring: active });
    }

    const id = generateMachineId();
    mkdirSync(adf, { recursive: true });
    const appConfig = { name, id, monitoring: active };
    writeFileSync(idPath, appConfig.id, { encoding: "utf-8" });

    return appConfig;
}

/**
 * Retrieves a context of code lines surrounding a specific line in a file.
 * @param fromStack - The stack object containing information about the line to retrieve the code context for.
 * @param toEncode - A flag indicating whether to encode the code lines for UI/UX safety.
 * @returns An array of `Code` objects representing the code context. Each object contains the code line, line number, and a flag indicating if it is the line which caused error.
*/
async function getCodeContext(fromStack: Stack, toEncode: boolean): Promise<Code[]> {
    if (!existsSync(fromStack.file) || !fromStack) return null;
    let start = fromStack.line - 5;
    let end = fromStack.line + 5;
    let context: Code[] = [];
    let lineNo = 1;
    let i = start;

    const readableFS = createReadStream(fromStack.file);
    const reader = createInterface({
        crlfDelay: Infinity,
        input: readableFS
    });

    for await (const line of reader) {
        if (lineNo >= start && lineNo <= end) {
            const buggy = (lineNo === fromStack.line);
            const UISafeLine = toEncode ? encode(line).replace(/ /g, "&nbsp;") : line;
            
            const code: Code = {
                code: UISafeLine,
                isBuggy: buggy,
                lineNo: i++
            }

            context.push(code);
        }

        if (++lineNo > end) break;
    }

    reader.close();
    return context;
}

function getDateTimeInIST(): string {
    return (new Date()).toLocaleString('en-US', {
        timeZone: 'Asia/Kolkata',
        second: 'numeric',
        minute: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        month: 'short',
        day: 'numeric',
        hour12: true
    });
}

function JSON_Stringify(o: any) {
    return (JSON.stringify(o, (_, v) => {
        if (typeof v === "bigint")
            return `BigInt(${v}n)`;
        if (typeof v === "symbol")
            return v.toString();
        return v;
    }));
}

function JSON_Parse(s: string) {
    return (JSON.parse(s, (_, v) => {
        if (typeof v === "string") {
            const bigIntMatch = v.match(/BigInt\((\d+)n\)/);
            if (bigIntMatch && bigIntMatch[1])
                return BigInt(bigIntMatch[1]);

            const symbolMatch = v.match(/Symbol\(([^)]+)\)/);
            if (symbolMatch && symbolMatch[1])
                return Symbol(symbolMatch[1]);
        }

        return v;
    }));
}

function wait(delayMS: number) {
    return new Promise((resolve) => setTimeout(resolve, delayMS));
}

export {
    getDateTimeInIST,
    getCodeContext,
    JSON_Stringify,
    JSON_Parse,
    parseStack,
    wait
};
