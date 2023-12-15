import { Code, ExceptionTemplate, HunterConfig, RequestPayload, Stack } from "./types";
import { SERVER_URL, SKIP_STRING } from "./config.json";
import axios from 'axios';

export class Agent {
    /**
     * Constructs an ExceptionTemplate object based on the provided inputs.
     * 
     * @param cnf - The configuration object that contains information about how the exception data should be reported.
     * @param erMsg - The error message associated with the exception.
     * @param stacks - An array of stack objects that represent the call stack at the time of the exception.
     * @param codes - An array of code objects that provide additional context for the exception.
     * @returns An ExceptionTemplate object that represents the exception data.
    */
    static buildExepData(cnf: HunterConfig, erMsg: string, stacks: Stack[], codes: Code[]): ExceptionTemplate {
        let reqData: ExceptionTemplate = {
            hasCode: cnf.includeCodeContext,
            errorMessage: erMsg,
            status: "Normal",
            app: cnf.appName,
            stack: stacks
        }

        if (reqData.hasCode)
            reqData.code = codes;
        return reqData;
    }

    /**
     * Sends the provided `RequestPayload` to the server using the axios library.
     * Handles both successful and failed requests and logs the response or error message accordingly.
     * 
     * @param data - The data payload to be sent to the server.
    */
    static async sendRequest(data: RequestPayload): Promise<[number, { data?: any; msg: string; ok: boolean; code: number; } | null]> {
        if (!data) return [1000, null];

        try {
            const response = await axios.post(SERVER_URL, data);
            return [response.status, response.data];
        }
        catch (e) {
            console.log(SKIP_STRING, "Something went wrong!",
                e?.response?.data);
        }

        return [1000, null];
    }
}
