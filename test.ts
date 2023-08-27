import { HunterConfig } from "./src/types";
import { Hunter } from "./src";
import { encode } from "he";

function triggerTest() {
    console.log('Triggering Test in 2s....');
    setTimeout(() => fakeError(), 2000);
    const testConf: HunterConfig = {
        includeCodeContext: true,
        enableSourceMap: true,
        reportingType: 'email',
        appName: "Test-App",
        cwdFilter: true,
        address: [
            {
                name: "Rishabh Kumar",
                email: "rishabh.kumar.pro@gmail.com"
            }
        ],
        format: 'html'
    };

    let p = new Hunter(testConf);
    p.startHunting();
}

function fakeError() {
    throw new Error("Fake Error");
}

triggerTest();
// console.log(encode("     Hello '<What's Up?>'").replace(/ /g, "&nbsp;"));
// setTimeout(() => { }, 60 * 60 * 1000);
