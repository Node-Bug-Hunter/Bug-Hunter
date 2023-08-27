import { createReadStream, existsSync } from "fs";
import { createInterface } from "readline";
import { Code, Stack } from "./types";

function parseStack(stackData: string, filter: boolean): Stack[] {
    const stackRegExp: RegExp = /at\s+(.*)\s+\((.*):(\d+):(\d+)\)/;
    const stackArray = stackData.split('\n').slice(1);
    const goodStack: Stack[] = [];

    for (let i = 0; i < stackArray.length; i++) {
        const stackMatches = stackArray[i].match(stackRegExp);
        if (stackMatches && stackMatches.length === 5) {
            let [_, fn, nm, ln, cn] = stackMatches;

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

async function getCodeContext(fromStack: Stack): Promise<Code[]> {
    if (!existsSync(fromStack.file) || !fromStack) return null;
    let start = fromStack.line - 5;
    let end = fromStack.line + 5;
    let context: Code[] = [];
    let lineNo = 1;
    let i = 0;

    const readableFS = createReadStream(fromStack.file);
    const reader = createInterface({
        crlfDelay: Infinity,
        input: readableFS
    });

    for await (const line of reader) {
        if (lineNo >= start && lineNo <= end) {
            const buggy = (lineNo === fromStack.line);
            
            const code: Code = {
                isBuggy: buggy,
                code: line,
                lineNo: ++i
            }

            context.push(code);
        }

        if (++lineNo > end) break;
    }

    reader.close();
    return context;
}

export {
    getCodeContext,
    parseStack
};
