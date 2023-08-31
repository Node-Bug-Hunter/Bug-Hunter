import { Code, ExceptionTemplate, HunterConfig, RequestData, Stack } from "./types";
import axios from 'axios';

export class Worker {
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
        if (cnf.reportingType === 'log') return;
    
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
            reqData.code = codes
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
            const SERVER_URL = 'https://hunter-server.040203.xyz';
            const response = await axios.post(SERVER_URL, data);
            console.log("Response: ", response.data);
            return;
        }
        catch (e) {
            console.log("Something went wrong!",
                e?.response?.data);
        }
    }
}
