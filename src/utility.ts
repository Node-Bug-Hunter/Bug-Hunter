import { createReadStream, existsSync } from "fs";
import { createInterface } from "readline";
import { Code, Stack } from "./types";
import { encode } from "he";

/**
 * Parses the stack trace data to extract relevant information such as the function name, file name, line number, and column number.
 * @param stackData - The stack trace data to be parsed.
 * @param filter - An optional flag indicating whether to filter out stack trace entries that do not start with the current working directory.
 * @returns An array of `Stack` objects containing the extracted information from the stack trace data.
*/
function parseStack(stackData: string, filter?: boolean): Stack[] {
    const stackRegExp: RegExp = /at\s+(.*)\s+\((.*):(\d+):(\d+)\)/;
    const stackArray = stackData.split('\n').slice(1);
    const goodStack: Stack[] = [];

    for (let i = 0; i < stackArray.length; i++) {
        const stackMatches = stackArray[i].match(stackRegExp);

        if (stackMatches && stackMatches.length > 4) {
            let [_, fn, nm, ln, cn] = stackMatches;
            nm = nm.replace(/^file:\/\/\//, "")
                .replace(/\//g, "\\");

            if (filter) {
                const cwd = process.cwd();
                if (!nm.startsWith(cwd)) break;
                nm = "." + nm.replace(cwd, "");
            }

            const stackInfo: Stack = {
                column: parseInt(cn),
                line: parseInt(ln),
                function: fn,
                file: nm
            }

            goodStack.push(stackInfo);
        }
    }

    return goodStack.filter(s => s !== null);
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
