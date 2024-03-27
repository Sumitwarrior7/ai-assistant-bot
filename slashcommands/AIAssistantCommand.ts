import {
    ISlashCommand,
    SlashCommandContext,
} from "@rocket.chat/apps-engine/definition/slashcommands";
import {
    IHttp,
    IModify,
    IPersistence,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import { AIAssistantApp } from "../AIAssistantApp";
import { CommandUtility } from "./CommandUtility";

export interface AIAssistantSlashCommandContext {
    app: AIAssistantApp;
    context: SlashCommandContext;
    read: IRead;
    modify: IModify;
    http: IHttp;
    persistence: IPersistence;
}

export class AIAssistantCommand implements ISlashCommand {
    public constructor(private readonly app: AIAssistantApp) {}
    public command = "ai-assistant";
    public i18nDescription = "";
    public providesPreview = false;
    public i18nParamsExample = "";

    public async executor(
        context: SlashCommandContext,
        read: IRead,
        modify: IModify,
        http: IHttp,
        persistence: IPersistence
    ): Promise<void> {
        const command = context.getArguments();
        const sender = context.getSender();
        const room = context.getRoom();

        if (!Array.isArray(command)) {
            return;
        }

        const commandUtility = new CommandUtility({
            sender,
            room,
            command: command,
            context,
            read,
            modify,
            http,
            persistence,
            app: this.app,
        });

        await commandUtility.resolveCommand({
            app: this.app,
            context,
            read,
            modify,
            http,
            persistence,
        });
    }
}
