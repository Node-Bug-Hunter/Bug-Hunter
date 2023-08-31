import { getCodeContext, parseStack } from "./utility";
import { HunterConfig, RequestData } from "./types";
import { Worker } from "./sender";

/**
 * The `Hunter` class is responsible for handling uncaught exceptions and unhandled rejections in a Node.js application.
 * It provides methods to start and stop hunting for these errors, and handles them by reporting or logging the error information.
*/
export class Hunter {
    config: HunterConfig;
    private ueHandler: (e: Error) => {};
    private urHandler: (r: {}, p: Promise<any>) => {};

    /**
     * Initializes a new instance of the `Hunter` class with an optional configuration.
     * If no configuration is provided, the default configuration is used.
     * @param conf - Optional configuration for the `Hunter` instance.
    */
    constructor(conf?: HunterConfig) {
        this.config = conf ?? getDefaultConfig();
        this.ueHandler = this.handleUncaughtException.bind(this);
        this.urHandler = this.handleUnhandledRejection.bind(this);
    }

    /**
     * Starts hunting for uncaught exceptions and unhandled rejections by attaching event listeners to the `process` object.
    */
    startHunting() {
        process.on("uncaughtException", this.ueHandler);
        process.on("unhandledRejection", this.urHandler);
    }

    /**
     * Stops hunting for errors by removing the event listeners from the `process` object.
    */
    stopHunting() {
        process.off("uncaughtException", this.ueHandler);
        process.off("unhandledRejection", this.urHandler);
    }

    /**
     * Handles an uncaught exception by parsing the error stack, building the error data, and sending it for reporting or logging.
     * @param err - The uncaught exception error object.
    */
    private async handleUncaughtException(err: Error) {
        console.log('[Error-Detected]: Trying to report it...');
        const erStack = parseStack(err.stack ?? "", this.config.cwdFilter);
        const exepData = Worker.buildExepData(this.config, err.message, erStack,
            this.config.includeCodeContext ? await getCodeContext(erStack[0],
                this.config.reportingType !== 'email') : []);
        exepData.status = this.config.quitOnError ? "Ended" : "Running";

        if (this.config.reportingType === 'email') {
            const rqData: RequestData = {
                format: this.config.format,
                type: "exception",
                data: exepData
            }

            Worker.sendHuntedData(rqData);
        }
        else {
            // ToDo: Implement logging functionality
        }

        if (this.config.quitOnError) process.exit(1);
    }

    /**
     * Handles an unhandled rejection. Currently, it does not perform any action.
     * ToDo: Logic needs to be implemented
     * @param reason - The reason for the unhandled rejection.
     * @param rejPromise - The rejected promise.
    */
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
