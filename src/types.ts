// #region Hunter Configuration Types

type HunterEmailConfig = {
    antiPhishingPhrase?: string
    format: "html" | "plain"
    reportingType: "email"
    address: string
}

type HunterLogConfig = {
    logType: "json" | "text"
    reportingType: "log"
    maxFileSize: number
    logDir: string
}

export type HunterConfig = {
    reportingType: "email" | "log"
    includeCodeContext: boolean
    enableSourceMap?: boolean
    quitOnError?: boolean
    cwdFilter?: boolean
} & (HunterEmailConfig | HunterLogConfig)

// #endregion

// #region Stack Types

export type TrackedStack = {
    function: string,
    column: number,
    file: string,
    line: number
}

// #endregion
