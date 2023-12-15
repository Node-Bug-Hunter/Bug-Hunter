import { HunterConfig, HunterLogConfig, MachineData, RequestPayload } from "./types";
import { getCodeContext, getSetIdConfig, parseStack } from "./utility";
import { SKIP_STRING } from "./config.json";
import EventEmitter = require("events");
import { LogPipe } from "./logpipe";
import { writeLog } from "./logger";
import { Agent } from "./agent";

/**
 * The `Hunter` class is responsible for handling uncaught exceptions and unhandled rejections in a Node.js application.
 * It provides methods to start and stop hunting for these errors, and handles them by reporting or logging the error information.
*/
export class Hunter extends EventEmitter {
    config: HunterConfig;
    logConfig: HunterLogConfig;

    static working: boolean = false;
    static isKeyValid: boolean = false;

    private ueHandler: (e: Error) => {};
    private urHandler: (r: {}, p: Promise<any>) => {};
    private logsEnabled: boolean = false;
    private machineData: MachineData;
    private logPiper: LogPipe;

    /**
     * Initializes a new instance of the `Hunter` class with an optional configuration.
     * If no configuration is provided, the default configuration is used.
     * @param conf - Configuration for the `Hunter` instance.
    */
    constructor(conf: HunterConfig) {
        super();

        // raise exception for invalid user inputs
        if (!conf) this.raise("No configuaration provided");
        if (!conf.apiKey) this.raise("Provide a valid API key");
        if (!conf.appName) this.raise("App name should not be null");
        if (!conf.email) this.raise("Email is required and it can't be null");

        // Consolidate for wrong configuaration & set back to default values
        if (!conf.format || !["html", "text"].includes(conf.format)) conf.format = "html";
        if (typeof conf.includeCodeContext === "undefined") conf.includeCodeContext = true;
        if (typeof conf.enableRemoteMonitoring === "undefined") conf.enableRemoteMonitoring = true;

        this.config = conf; // We're good to go now!
        this.ueHandler = this.handleUncaughtException.bind(this);
        this.urHandler = this.handleUnhandledRejection.bind(this);
        this.machineData = getSetIdConfig(this.config.appName, conf.enableRemoteMonitoring);
        this.validateAPIKey().then((msgResp) => (!Hunter.isKeyValid) && console.log(SKIP_STRING, msgResp));
    }

    /**
     * Starts hunting for uncaught exceptions and unhandled rejections by attaching event listeners to the `process` object.
     * @returns A boolean value indicating whether the hunting process was successfully started.
     * *Returns `false` if  API-Key is not yet validated or if the process is already running!*
    */
    startHunting(): boolean {
        if (Hunter.working) return false;

        if (this.config.enableRemoteMonitoring)
            this.logPiper = new LogPipe(this.config.apiKey, this.machineData);
        process.on("unhandledRejection", this.urHandler);
        process.on("uncaughtException", this.ueHandler);
        Hunter.working = true; // Set the flag

        return true;
    }

    /**
     * Stops hunting for errors by removing the event listeners from the `process` object and disposes off active resources being used.
    */
    stopHunting() {
        if (!Hunter.working) return;

        Hunter.working = false;
        this.setLogging(false);
        this.logPiper?.dispose().then();
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

    // Should return error message if token validation failed as returned by the server
    private async validateAPIKey(): Promise<string> {
        const payload: RequestPayload = {
            machineData: this.machineData,
            email: this.config.email,
            auth: this.config.apiKey,
            type: "authcheck"
        }

        const [ok, resp] = await Agent
            .sendRequest(payload);
        Hunter.isKeyValid = ok < 300;
        this.emit("key-status", ok < 300);
        if (ok >= 400 && ok < 500 && resp) this.raise(resp.msg);

        return "Unable to validate api-key, check your network connection";
    }

    /**
     * Handles uncaught exception by parsing the error stack, building the error data, and sending it to server,
     * for email reporting purpose, also stores log if local logging is enabled via `setLogging(true, options)`
     * @param err - The uncaught exception error object.
    */
    private async handleUncaughtException(err: Error) {
        if (!Hunter.isKeyValid) return console.log(SKIP_STRING, "[Error-Detected]: API key not yet validated, skipping...");
        console.log(SKIP_STRING, '[Error-Detected]: Trying to report it...');
        const erStack = parseStack(err.stack ?? "", this.config.cwdFilter);
        const encodable = this.config.format === 'html';

        const exepData = Agent.buildExepData(this.config, err.message, erStack, this.config
            .includeCodeContext ? await getCodeContext(erStack[0], encodable) : []);

        exepData.status = this.config.quitOnError ? "Ended" : "Running";

        const payload: RequestPayload = {
            machineData: this.machineData,
            format: this.config.format,
            email: this.config.email,
            auth: this.config.apiKey,
            type: "exception",
            ...exepData
        }

        if (this.logsEnabled) writeLog({
            config: this.logConfig,
            ...exepData
        });

        await Agent.sendRequest(payload);
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
        console.log(SKIP_STRING, "");
        this.stopHunting();
        throw new Error(e);
    }
}
