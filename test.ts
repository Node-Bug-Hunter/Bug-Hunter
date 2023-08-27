import { HunterConfig } from "./src/types";
import { Hunter } from "./src";

function triggerTest() {
    console.log('Triggering custom error in four seconds....');
    setTimeout(() => generateTestError(), 4000);

    const testConf: HunterConfig = {
        includeCodeContext: true,
        enableSourceMap: true,
        reportingType: 'email',
        appName: "Test-App",
        cwdFilter: true,
        format: 'html',
        address: [
            {
                name: "Rishabh Kumar",
                email: "rishabh.kumar.pro@gmail.com"
            },
            {   // This is a test email
                name: "John Doe",
                email: "test_0860@email.com"
            },
            {   // This is a test email
                name: "Person Tester",
                email: "test_0860@outlook.com"
            },
            {   // This is a temporary test email
                name: "Temporary Name",
                email: "daknenulte@gufum.com"
            }
        ]
    }

    let testHunter = new Hunter(testConf);
    testHunter.startHunting();
}

function generateTestError() {
    const testErrMsg = `Error occured due to testing: ${Date.now()}`;
    throw new Error(testErrMsg); // Stimulate potential error
}

triggerTest();
// This  is    a spaced      comment
// <This is demo evenly-spaced comment>
