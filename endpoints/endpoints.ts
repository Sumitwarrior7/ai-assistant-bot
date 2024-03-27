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
// import LlamaAI from "llamaai"

export class AIAssistantEndpoint extends ApiEndpoint {
    public path: string = "webhook";
    // public getApiUrl = () => "http://mistral-7b/v1/chat/completions";
    // public getPayload = (username, query) => {
    //     const prompt = `Answer the query asked by user. The query is :${query} `;
    //     const headers = {
    //         "Content-Type": "application/json",
    //     };

    //     const data = {
    //         messages: [
    //             {
    //                 role: "user",
    //                 content: prompt,
    //                 user: username,
    //             },
    //         ],
    //         model: "mistral",
    //     };

    //     return {
    //         headers,
    //         data,
    //     };
    // };
    public getApiUrl = () => "https://jsonplaceholder.typicode.com/posts";

    public getPayload = (username, query) => {
        const data = {
            title: "Bakchodi",
            body: "bar",
            userId: 1,
        };

        const headers = {
            "Content-Type": "application/json; charset=UTF-8",
        };

        return {
            headers,
            data,
        };
    };

    public async getData(http: IHttp, persis: IPersistence): Promise<any> {
        try {
            const response = await http.get("https://catfact.ninja/fact");
            return response;
        } catch (err) {
            return err;
        }
    }

    public async userQueryResponse(
        http: IHttp,
        persis: IPersistence,
        username: string,
        query: any
    ): Promise<any | Error> {
        console.log(`Under User Query Response: ${query}`);

        const apiUrl = this.getApiUrl();
        const payload = this.getPayload(username, query);

        try {
            const response = await http.post(apiUrl, {
                headers: payload.headers,
                data: payload.data,
            });

            console.log(`Response: ${response.content}`);
            return response;
        } catch (err) {
            console.error(`Error: ${err}`);
            return err;
        }
    }

    // public async userQueryResponse(
    //     http: IHttp,
    //     persis: IPersistence,
    //     username: string,
    //     query: any
    // ): Promise<any | Error> {
    //     console.log(`Under User Query Resonse   :${query}`);
    //     // let { headers, data } = this.getPayload(username, query);

    //     try {
    //         const response = await http.post(
    //             this.getApiUrl(),
    //             this.getPayload(username, query)
    //         );
    //         console.log(`Resposne hai yo :${response}`);
    //         return response;
    //     } catch (err) {
    //         return err;
    //     }
    // }
}
