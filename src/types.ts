type Address = { name: string, email: string };
type MaxAddress = [Address, Address?, Address?, Address?, Address?];

// #region Hunter Configuration Typings

type HunterEmailConfig = {
    antiPhishingPhrase?: string
    format?: "html" | "text"
    address: MaxAddress
}

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
 * Represents the configuration options for a hunter, which can be used for reporting either via email or log.
*/
export type HunterConfig = {
    includeCodeContext?: boolean
    enableSourceMap?: boolean
    quitOnError?: boolean
    cwdFilter?: boolean
    appName: string
} & HunterEmailConfig

// #endregion

//#region Template Typings

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
	phishingPhrase?: string
	errorMessage: string
    address: MaxAddress
	stack: Stack[]
	status: string
	app: string
} & ({
	code?: Code[]
	hasCode: true
} | { hasCode: false })

export type RejectionTemplate = {
}

// #endregion

/**
 * Represents outgoing request data to the hunter-server
*/
export type RequestData = {
	format: "html" | "text"
} & ({
	type: "exception"
	data: ExceptionTemplate
} | {
	type: "rejection"
	data: RejectionTemplate
})

/**
 * Represents loggable data
*/
export type LoggableData = Omit<ExceptionTemplate,
	"phishingPhrase" | "address" | "app"> & {
	config: HunterLogConfig
}
