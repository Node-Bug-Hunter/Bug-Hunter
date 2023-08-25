import { createReadStream, existsSync } from "fs";
import { createInterface } from "readline";
import { TrackedStack } from "./types";

function parseStack(stackData: string, filter: boolean): TrackedStack[] {
    const stackRegExp: RegExp = /at\s+(.*)\s+\((.*):(\d+):(\d+)\)/;
    const stackArray = stackData.split('\n').slice(1);
    const goodStack: TrackedStack[] = [];

    for (let i = 0; i < stackArray.length; i++) {
        const stackMatches = stackArray[i].match(stackRegExp);
        if (stackMatches && stackMatches.length === 5) {
            let [_, fn, nm, ln, cn] = stackMatches;

            if (filter) {
                const cwd = process.cwd();
                if (!nm.startsWith(cwd)) break;
                nm = "." + nm.replace(cwd, "");
            }

            const stackInfo: TrackedStack = {
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

async function getCodeContext(fromStack: TrackedStack): Promise<[number, string[]]> {
    if (!existsSync(fromStack.file) || !fromStack) return null;
    let start = fromStack.line - 5;
    let end = fromStack.line + 5;
    let context = [];
    let lineNo = 1;
    let where = 0;
    let i = 0;

    const readableFS = createReadStream(fromStack.file);
    const reader = createInterface({
        crlfDelay: Infinity,
        input: readableFS
    });

    for await (const line of reader) {
        if (lineNo >= start && lineNo <= end) {
            if (lineNo === fromStack.line) where = i;
            context.push(line);
            i++;
        }

        if (++lineNo > end) break;
    }

    reader.close();
    return [where, context];
}

async function getMachineIP(): Promise<string> {
    return "0.0.0.0";
}

export {
    getCodeContext,
    getMachineIP,
    parseStack
};
