import { Code, ExceptionTemplate, HunterConfig, RequestData, Stack } from "./types";
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
            phishingPhrase: cnf.antiPhishingPhrase,
            hasCode: cnf.includeCodeContext,
            address: cnf.address,
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
     * Sends the provided `RequestData` object to the server using the axios library.
     * Handles both successful and failed requests and logs the response or error message accordingly.
     * 
     * @param data - The data object to be sent to the server.
    */
    static async sendHuntedData(data: RequestData) {
        if (!data) return;

        try {
            await axios.post(SERVER_URL, data);
        }
        catch (e) {
            console.log(SKIP_STRING, "Something went wrong!",
                e?.response?.data);
        }
    }
}
