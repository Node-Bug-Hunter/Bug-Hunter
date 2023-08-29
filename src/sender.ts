import { Code, ExceptionTemplate, HunterConfig, RequestData, Stack } from "./types";
import axios from 'axios';

export class Worker {
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
