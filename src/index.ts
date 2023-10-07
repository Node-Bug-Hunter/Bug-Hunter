import { HunterConfig, HunterLogConfig, RequestData } from "./types";
import { getCodeContext, parseStack } from "./utility";
import { writeLog } from "./logger";
import { Agent } from "./agent";

/**
 * The `Hunter` class is responsible for handling uncaught exceptions and unhandled rejections in a Node.js application.
 * It provides methods to start and stop hunting for these errors, and handles them by reporting or logging the error information.
*/
export class Hunter {
    config: HunterConfig;
    logConfig: HunterLogConfig;

    private ueHandler: (e: Error) => {};
    private urHandler: (r: {}, p: Promise<any>) => {};
    private logsEnabled: boolean = false;

    /**
     * Initializes a new instance of the `Hunter` class with an optional configuration.
     * If no configuration is provided, the default configuration is used.
     * @param conf - Configuration for the `Hunter` instance.
    */
    constructor(conf: HunterConfig) {
        // raise exception for invalid user inputs
        if (!conf.address) this.raise("Address list can't be null");
        if (!conf.appName) this.raise("App name should not be null");
        if (!conf.address[0]) this.raise("Address should contain at least one entry");
        if (conf.address.length > 5) this.raise("Address list should not contain more than five entries");

        // Consolidate for wrong configuaration & set back to default values
        if (!conf.format || !["html", "text"].includes(conf.format)) conf.format = "html";
        if (!conf.includeCodeContext) conf.includeCodeContext = true;

        this.config = conf; // We're good to go now!
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
        this.setLogging(false);
        process.off("uncaughtException", this.ueHandler);
        process.off("unhandledRejection", this.urHandler);
    }

    /**
     * Enable or disable local logging functionality.
     * 
     * @param enable - A boolean value indicating whether logging should be enabled or disabled.
     * @param lconfig - An optional logging configuration object (Required if `enable === true`).
    */
    setLogging(enable: boolean, lconfig?: HunterLogConfig) {
        this.logsEnabled = enable;

        if (enable) {
            if (!lconfig) this.raise("Provide logging config to enable logging functionality");
            if (!lconfig.logDir) this.raise("`logDir` property can't be null");
            this.logConfig = lconfig;

            if (!lconfig.maxFileSizeMB || lconfig.maxFileSizeMB < 1) lconfig.maxFileSizeMB = 10;
            if (!lconfig.logType || !["json", "text"].includes(lconfig.logType)) lconfig.logType = "text";
        }
        else this.logConfig = null;
    }

    /**
     * Handles uncaught exception by parsing the error stack, building the error data, and sending it to server,
     * for email reporting purpose, also stores log if local logging is enabled via `setLogging(true, options)`
     * @param err - The uncaught exception error object.
    */
    private async handleUncaughtException(err: Error) {
        console.log('[Error-Detected]: Trying to report it...');
        const erStack = parseStack(err.stack ?? "", this.config.cwdFilter);
        const encodable = this.config.format === 'html';

        const exepData = Agent.buildExepData(this.config, err.message, erStack, this.config
            .includeCodeContext ? await getCodeContext(erStack[0], encodable) : []);

        exepData.status = this.config.quitOnError ? "Ended" : "Running";

        const rqData: RequestData = {
            format: this.config.format,
            type: "exception",
            data: exepData
        }
        
        if (this.logsEnabled) writeLog({
            config: this.logConfig,
            ...exepData
        });

        await Agent.sendHuntedData(rqData);
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

    private raise(e: string): never {
        console.log("");
        this.stopHunting();
        throw new Error(e);
    }
}
