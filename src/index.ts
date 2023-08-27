import { getCodeContext, parseStack } from "./utility";
import { HunterConfig, RequestData } from "./types";
import { Sender } from "./sender";

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
        const exepData = Sender.buildExepData(this.config, err.message, erStack,
            this.config.includeCodeContext ? await getCodeContext(erStack[0]) : null);

        const rqData: RequestData = {
            type: "exception",
            format: "html",
            data: exepData
        }

        Sender.sendHuntedData(rqData);
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
        appName: "Default",
        logType: "json",
        maxFileSize: 5
    };

    return defaultConfig;
}
