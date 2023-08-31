type Address = { name: string, email: string };
type MaxAddress = [Address, Address?, Address?, Address?, Address?];

// #region Hunter Configuration Typings

type HunterEmailConfig = {
    antiPhishingPhrase?: string
    format: "html" | "text"
    reportingType: "email"
    address: MaxAddress
}

type HunterLogConfig = {
    logType: "json" | "text"
    reportingType: "log"
    maxFileSize: number
    logDir: string
}

/**
 * Represents the configuration options for a hunter, which can be used for reporting either via email or log. 
*/
export type HunterConfig = {
    reportingType: "email" | "log"
    includeCodeContext: boolean
    enableSourceMap?: boolean
    quitOnError?: boolean
    cwdFilter?: boolean
    appName: string
} & (HunterEmailConfig | HunterLogConfig)

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
 * Represents an exception template.
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
