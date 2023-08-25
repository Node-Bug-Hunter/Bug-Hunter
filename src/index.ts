import { getCodeContext, parseStack } from "./utility";
import { HunterConfig } from "./types";

export class Hunter {
    config: HunterConfig;
    private ueHandler: (e: Error) => {};
    private urHandler: (r: {}, p: Promise<any>) => {};

    constructor(conf?: HunterConfig) {
        this.config = conf ?? getDefaultConfig();
        this.ueHandler = this.handleUncaughtException.bind(this);
        this.urHandler = this.handleUnhandledRejection.bind(this);
    }

    startHunting() {
        process.on("uncaughtException", this.ueHandler);
        process.on("unhandledRejection", this.urHandler);
    }

    stopHunting() {
        process.off("uncaughtException", this.ueHandler);
        process.off("unhandledRejection", this.urHandler);
    }

    private async handleUncaughtException(err: Error) {
        const erStack = parseStack(err.stack, this.config.cwdFilter);
        console.log(erStack, '\n\n');

        if (this.config.includeCodeContext)
            console.log(await getCodeContext(erStack[0]));

        console.log("QOE:", this.config.quitOnError);
        if (this.config.quitOnError) process.exit(1);
    }

    private async handleUnhandledRejection(reason: {}, rejPromise: Promise<any>) {
        if (this.config.quitOnError) process.exit(1);
    }
}

function getDefaultConfig(): HunterConfig {
    const defaultConfig: HunterConfig = {
        includeCodeContext: false,
        logDir: "./hunted-logs/",
        enableSourceMap: false,
        reportingType: 'log',
        logType: "json",
        maxFileSize: 5
    };

    return defaultConfig;
}
