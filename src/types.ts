// #region Hunter Configuration Typings

/**
 * Represents the config options to enable logging
 * @property `logType` - "json": use when structured logs are needed; "text": use when human-readable format is required
 * @property `logDir` - Directory where logs would be saved (directory will be created if doesn't exists)
 * @property `maxFileSize` - Maximum size of a single log file (in Mega-Bytes)
*/
export type HunterLogConfig = {
    logType?: "json" | "text"
    maxFileSizeMB?: number
    logDir: string
}

/**
 * Represents the configuration options for a hunter, which can be used for reporting.
*/
export type HunterConfig = {
    enableRemoteMonitoring?: boolean
    includeCodeContext?: boolean
    enableSourceMap?: boolean
    format?: "html" | "text"
    quitOnError?: boolean
    cwdFilter?: boolean
    appName: string
	apiKey: string
	email: string
}

// #endregion

// #region Template Typings

export type Stack = {
	function: string
	column: number
	file: string
	line: number
}

export type Code = {
	isBuggy: boolean
	lineNo: number
	code: string
}

/**
 * Represents an exception or rejection template.
*/
export type ExceptionTemplate = {
	errorMessage: string
	stack: Stack[]
	status: string
	app: string
} & ({
	code?: Code[]
	hasCode: true
} | { hasCode: false })

// #endregion

// #region Request Payloads Typing

type AuthCheckPayload = {
	type: "authcheck"
}

type ExceptionPayload = ExceptionTemplate & {
	format: "html" | "text"
	type: "exception"
}

export type MachineData = {
	monitoring: boolean
	name: string,
	id: string
}

/**
 * Represents outgoing request data to the hunter-server
*/
export type RequestPayload = {
	machineData: MachineData
	email: string
	auth: string
} & (ExceptionPayload | AuthCheckPayload);

// #endregion

/**
 * Represents loggable data
*/
export type LoggableData = Omit<ExceptionTemplate, "app"> & { config: HunterLogConfig }

export type LogMSGEvent = "logs-monitor-pause" | "logs-monitor-resume";
