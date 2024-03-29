import { IRoom } from "@rocket.chat/apps-engine/definition/rooms";
import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { SlashCommandContext } from "@rocket.chat/apps-engine/definition/slashcommands";
import {
    IHttp,
    IModify,
    IPersistence,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import { AIAssistantApp } from "../AIAssistantApp";
import { ExecutorProps } from "../definitions/ExecutorProps";

import {
    sendNotificationToRoom,
    sendNotificationToUser,
} from "../lib/messages";
import { helperMessage, sendDirectMessage, sendMessage } from "../lib/messages";
import { AIAssistantEndpoint } from "../endpoints/endpoints";

export interface AiAssistantSlashCommandContext {
    app: AIAssistantApp;
    context: SlashCommandContext;
    read: IRead;
    modify: IModify;
    http: IHttp;
    persistence: IPersistence;
}

export class CommandUtility implements ExecutorProps {
    sender: IUser;
    room: IRoom;
    command: string[];
    context: SlashCommandContext;
    read: IRead;
    modify: IModify;
    http: IHttp;
    persistence: IPersistence;
    app: AIAssistantApp;

    constructor(props: ExecutorProps) {
        this.sender = props.sender;
        this.room = props.room;
        this.command = props.command;
        this.context = props.context;
        this.read = props.read;
        this.modify = props.modify;
        this.http = props.http;
        this.persistence = props.persistence;
        this.app = props.app;
    }

    // Handle settings command
    private async handleAssistantSettings({
        app,
        context,
        read,
        modify,
        http,
        persistence,
    }: AiAssistantSlashCommandContext) {
        let query = "";
        if (this.command && this.command.length > 0) {
            let startIndex = 1; // Start from the second element
            this.command.forEach((element, index) => {
                if (index >= startIndex) {
                    query += element + " ";
                }
            });
            query = query.trim(); // Remove trailing space if any
        } else {
            console.warn(
                "'this.command' is empty or undefined. Query string remains empty."
            );
        } // Call userQueryResponse function and handle the response
        let apiAssistantEndpoint = new AIAssistantEndpoint(this.app);
        const response = await apiAssistantEndpoint.getData(
            this.http,
            this.persistence
        );
        console.log("Resp  :", JSON.stringify(response, null, 2));

        await sendNotificationToUser(
            this.read,
            this.modify,
            this.sender,
            this.room,
            `Fact hai yo ${response}`
        );
    }

    // Handle user query
    private async handleQuery({
        app,
        context,
        read,
        modify,
        http,
        persistence,
    }: AiAssistantSlashCommandContext) {
        const appSender: IUser = (await this.read
            .getUserReader()
            .getAppUser()) as IUser;
        let query = "";
        if (this.command && this.command.length > 0) {
            let startIndex = 1; // Start from the second element
            this.command.forEach((element, index) => {
                if (index >= startIndex) {
                    query += element + " ";
                }
            });
            query = query.trim();
            try {
                // Call userQueryResponse function and handle the response
                let apiAssistantEndpoint = new AIAssistantEndpoint(this.app);
                const response = await apiAssistantEndpoint.userQueryResponse(
                    this.http,
                    this.persistence,
                    appSender.name,
                    query
                );
                console.log("Resp  :", JSON.stringify(response, null, 2));

                if (response instanceof Error) {
                    console.error("Error occurred:", response.message);
                } else {
                    console.log(`Respnse :${response}`);
                    await sendMessage(
                        this.modify,
                        this.room,
                        appSender,
                        response.data.title
                    );
                }
            } catch (error) {
                console.error("Error occurred:", error);
            }
        } else {
            console.warn(
                "'this.command' is empty or undefined. Query string remains empty."
            );
        }
    }

    // Handle default command
    public async resolveCommand(context: AiAssistantSlashCommandContext) {
        switch (this.command[0]) {
            case "settings":
                await this.handleAssistantSettings(context);
                break;
            case "query":
                await this.handleQuery(context);
                break;
            case "help":
                await Promise.all([
                    helperMessage(
                        this.read,
                        this.modify,
                        this.room,
                        this.sender
                    ),
                ]);
                break;
            default:
                console.log(`command chala diya  ${this.command}`);
                await Promise.all([
                    sendNotificationToUser(
                        this.read,
                        this.modify,
                        this.sender,
                        this.room,
                        `Please enter a valid command!!!
                        \To get help, use ai-assistant help command.`
                    ),
                ]);
                break;
        }
    }
}
