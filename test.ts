import { HunterConfig } from "./src/types";
import { Hunter } from "./src";
import { encode } from "he";

function triggerTest() {
    setTimeout(() => fakeError(), 2000);
    setTimeout(() => Promise.reject("Sample rejection"), 4000);

    const testConf: HunterConfig = {
        includeCodeContext: true,
        logDir: "./hunted-logs/",
        enableSourceMap: true,
        reportingType: 'log',
        cwdFilter: true,
        logType: "json",
        maxFileSize: 10
    };

    setTimeout(() => {
        const myObj: any = {};
        // Let's trigger another error
        console.log(myObj.data.one);
    }, 5000);

    let p = new Hunter(testConf);
    p.startHunting();
}

function fakeError() {
    throw new Error("Fake Error");
}

triggerTest();
console.log(encode("     Hello '<What's Up?>'").replace(/ /g, "&nbsp;"));
setTimeout(() => { }, 60 * 60 * 1000);
