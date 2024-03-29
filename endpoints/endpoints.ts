import {
    HttpStatusCode,
    IHttp,
    IModify,
    IPersistence,
    IRead,
    ILogger,
    IHttpResponse,
} from "@rocket.chat/apps-engine/definition/accessors";
import {
    ApiEndpoint,
    IApiEndpointInfo,
    IApiRequest,
    IApiResponse,
} from "@rocket.chat/apps-engine/definition/api";
import { IRoom } from "@rocket.chat/apps-engine/definition/rooms";
import { URL } from "url";
// import LlamaAI from "llamaai";

export class AIAssistantEndpoint extends ApiEndpoint {
    public path: string = "webhook";
    public getApiUrl = () => "https://jsonplaceholder.typicode.com/posts";
    public hfModelUrl = (model: string) =>
        `https://api-inference.huggingface.co/models/${model}`;
    public modelNames = () => {
        let models = ["mistralai/Mistral-7B-Instruct-v0.2", "google/gemma-7b"];
        return models;
    };

    public formattedQuery = (query: string) => {
        let prompt = `You are a chatbot designed to provide concise answers without restating the question. Your responses should be contained within a 250-word limit. Here is your query: ${query}`;
        return prompt;
    };

    public getPayload = (query: string) => {
        const API_TOKEN = "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";
        let payload = {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${API_TOKEN}`,
            },
            params: {
                method: "POST",
                max_new_tokens: "250",
            },
            data: {
                inputs: this.formattedQuery(query),
            },
        };
        return payload;
    };

    public async getData(http: IHttp, persis: IPersistence): Promise<any> {
        try {
            const response = await http.get("https://catfact.ninja/fact");
            return response;
        } catch (err) {
            return err;
        }
    }

    public async hfApiResponse(
        http: IHttp,
        persis: IPersistence,
        query: any
    ): Promise<any> {
        console.log(`Under User Query Response: ${query}`);
        const url = this.hfModelUrl("mistralai/Mistral-7B-Instruct-v0.2");
        const payload = this.getPayload(query);
        try {
            const response = await http.post(url, payload);

            // console.log(`Response: ${response.content}`);
            return response;
        } catch (err) {
            console.error(`Error: ${err}`);
            return err;
        }
    }

    public async userQueryResponse(
        http: IHttp,
        persis: IPersistence,
        username: string,
        query: any
    ): Promise<any | Error> {
        console.log(`Under User Query Resonse   :${query}`);
        // let { headers, data } = this.getPayload(username, query);

        // try {
        //     const response = await http.post(
        //         this.getApiUrl(),
        //         this.getPayload(username, query)
        //     );
        //     console.log(`Resposne hai yo :${response}`);
        //     return response;
        // } catch (err) {
        //     return err;
        // }
    }
}
