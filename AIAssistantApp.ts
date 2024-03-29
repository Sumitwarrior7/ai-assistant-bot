import {
    IAppAccessors,
    IConfigurationExtend,
    IEnvironmentRead,
    IHttp,
    ILogger,
    IModify,
    IPersistence,
    IRead,
    IAppInstallationContext,
} from "@rocket.chat/apps-engine/definition/accessors";
import { IRoom, RoomType } from "@rocket.chat/apps-engine/definition/rooms";
import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { App } from "@rocket.chat/apps-engine/definition/App";
import { IAppInfo } from "@rocket.chat/apps-engine/definition/metadata";
import {
    IPostRoomUserJoined,
    IRoomUserJoinedContext,
} from "@rocket.chat/apps-engine/definition/rooms";
import {
    ApiSecurity,
    ApiVisibility,
} from "@rocket.chat/apps-engine/definition/api";
import { GetInfo } from "./slashcommands/GetInfo";
import { SettingType } from "@rocket.chat/apps-engine/definition/settings";
import { AIAssistantCommand } from "./slashcommands/AIAssistantCommand";
import {
    getDirect,
    sendDirectMessage,
    sendMessage,
    helperMessage,
    sendNotificationToRoom,
    sendNotificationToUser,
    sendMessageWithAttachment,
} from "./lib/messages";
import { AIAssistantEndpoint } from "./endpoints/endpoints";
import {
    IPostMessageSent,
    IMessage,
} from "@rocket.chat/apps-engine/definition/messages";

const getApiUrl = () => "http://mistral-7b/v1/chat/completions";
const getPayload = () => {
    const prompt = `Welcome New OpenSource Contributor named Sumit to RocketChat Community with welcome message,
    don't include any twitter like hashtags,gsoc2024 is the channel is used for introduction, channels having initials 
    as "idea" are google summer of code project ideas channel. Don't make message too long and instruct this contributor 
    to change their username in form: "firstname.lastname".`;

    const data = {
        messages: [
            {
                role: "user",
                content: prompt,
                user: 7,
            },
        ],
        model: "mistral",
    };
    const headers = {
        "Content-Type": "application/json",
    };

    return {
        data,
        headers,
    };
};

// IAppInfo: This object contains fundamental information about your application, such as its name, version, description, etc. It is private to the App class, but its properties are accessible through multiple GET methods.
// IAppAccessors: This object contains all app accessors. This can be accessed via the getAccessors() method in the child class.
export class AIAssistantApp
    extends App
    implements IPostRoomUserJoined, IPostMessageSent
{
    constructor(info: IAppInfo, logger: ILogger, accessors: IAppAccessors) {
        super(info, logger, accessors);
    }
    async executePostRoomUserJoined(
        context: IRoomUserJoinedContext,
        read: IRead,
        http: IHttp,
        persistence: IPersistence,
        modify?: IModify | undefined
    ): Promise<void> {
        const roomsStr = await read
            .getEnvironmentReader()
            .getSettings()
            .getValueById("welcome_rooms");

        if (!roomsStr) {
            return;
        }

        const rooms: string[] = roomsStr.split(",").map((room) => room.trim());
        if (!rooms.includes(context.room.slugifiedName)) {
            return;
        }

        const { name, id } = context.joiningUser;

        try {
            const response = await http.post(getApiUrl(), getPayload());

            const welcomeMessage =
                response?.data?.choices[0]?.message?.content ??
                `Welcome ${name}! to RocketChat Let's make great things happen 🌟`;

            this.getLogger().log(response);

            if (modify) {
                const message = await modify
                    .getCreator()
                    .startMessage()
                    .setRoom(context.room)
                    .setText(welcomeMessage);

                await modify.getCreator().finish(message);
            }
        } catch (err) {
            this.getLogger().error("Error While User Joining!");
        }
    }

    // public async executePostMessageSent(
    //     message: IMessage,
    //     read: IRead,
    //     http: IHttp,
    //     persistence: IPersistence,
    //     modify: IModify
    // ): Promise<void> {
    //     const appUser = (await read.getUserReader().getAppUser()) as IUser;
    //     const targetRoom = (await getDirect(
    //         read,
    //         modify,
    //         appUser,
    //         message.sender.username
    //     )) as IRoom;
    //     const sentMessageIds = new Set<string | undefined>();

    //     if (
    //         typeof message.id === "undefined" ||
    //         sentMessageIds.has(message.id)
    //     ) {
    //         return; // Message already responded to, skip sending
    //     }

    //     // Construct the thank you message
    //     const thankYouMessage = `Thank you for the message: ${message.text}`;

    //     const aiAssistantApp = new AIAssistantEndpoint(this);
    //     try {
    //         const apiResponse = await aiAssistantApp.llamaResponse(
    //             http,
    //             persistence,
    //             message.sender.username,
    //             message.text
    //         );
    //         if (modify) {
    //             const modifiedMessage = await modify
    //                 .getCreator()
    //                 .startMessage()
    //                 .setRoom(targetRoom) // Assuming the room information is available in the message object
    //                 .setText(apiResponse);
    //             await modify.getCreator().finish(modifiedMessage);
    //         }
    //     } catch (error) {
    //         console.error(`Error calling llamaResponse: ${error}`);
    //         if (modify) {
    //             const modifiedMessage = await modify
    //                 .getCreator()
    //                 .startMessage()
    //                 .setRoom(targetRoom) // Assuming the room information is available in the message object
    //                 .setText(`Sorry Error occured :${error}`);
    //             await modify.getCreator().finish(modifiedMessage);
    //         }
    //     }
    // }

    async executePostMessageSent(
        message: IMessage,
        read: IRead,
        http: IHttp,
        persistence: IPersistence,
        modify: IModify
    ): Promise<void> {
        const appUser = (await read.getUserReader().getAppUser()) as IUser;
        const targetRoom = (await getDirect(
            read,
            modify,
            appUser,
            message.sender.username
        )) as IRoom;
        console.log(`Hello World executePostMessageSent`);
        const aiAssistantApp = new AIAssistantEndpoint(this);
        try {
            const response = await aiAssistantApp.hfApiResponse(
                http,
                persistence,
                message.text
            );
            const resp = JSON.parse(response["content"]);
            const answer = resp[0]["generated_text"];
            console.log(`response 2 :${resp[0]["generated_text"]}`);

            if (typeof answer === "string" && modify) {
                if (message.room.id === targetRoom.id) {
                    console.log("Chalo Chalte Hai");
                    await sendNotificationToRoom(
                        read,
                        modify,
                        appUser,
                        targetRoom,
                        answer
                    );

                    // sendMessage(
                    //     modify,
                    //     targetRoom,
                    //     appUser,
                    //     "Hello Sumit! I love you."
                    // );
                }
            }
        } catch (error) {
            // Handle errors
            console.error(error);
        }
    }

    public async initialize(
        configuration: IConfigurationExtend
    ): Promise<void> {
        const aiAssistantCommand: AIAssistantCommand = new AIAssistantCommand(
            this
        );

        await configuration.slashCommands.provideSlashCommand(
            aiAssistantCommand
        );

        await configuration.api.provideApi({
            visibility: ApiVisibility.PUBLIC,
            security: ApiSecurity.UNSECURE,
            endpoints: [new AIAssistantEndpoint(this)],
        });
    }

    public async onInstall(
        context: IAppInstallationContext,
        read: IRead,
        http: IHttp,
        persistence: IPersistence,
        modify: IModify
    ): Promise<void> {
        const appUser = (await read.getUserReader().getAppUser()) as IUser;
        const targetRoom = (await getDirect(
            read,
            modify,
            appUser,
            context.user.username
        )) as IRoom;

        try {
            const response = await http.post(getApiUrl(), getPayload());
            console.log(`Resp :${response}`);

            const welcomeMessage =
                response?.data?.choices[0]?.message?.content ??
                `Welcome Sumit! to RocketChat Let's make great things happen 🌟`;

            this.getLogger().log(response);

            if (modify) {
                const message = await modify
                    .getCreator()
                    .startMessage()
                    .setRoom(targetRoom)
                    .setText(welcomeMessage);

                await modify.getCreator().finish(message);
            }
        } catch (err) {
            this.getLogger().error("Error While User Joining!");
        }

        // const aiAssistantApp = new AIAssistantEndpoint(this);
        // try {
        //     const apiResponse = await aiAssistantApp.llamaResponse(
        //         http,
        //         persistence,
        //         context.user.username,
        //         "Why Rocket.Chat is better than other chat platforms"
        //     );
        //     if (typeof apiResponse === "string" && modify) {
        //         const modifiedMessage = await modify
        //             .getCreator()
        //             .startMessage()
        //             .setRoom(targetRoom) // Assuming the room information is available in the message object
        //             .setText(apiResponse);
        //         await modify.getCreator().finish(modifiedMessage);
        //     }
        // } catch (error) {
        //     console.error(`Error calling llamaResponse: ${error}`);
        //     if (modify) {
        //         const modifiedMessage = await modify
        //             .getCreator()
        //             .startMessage()
        //             .setRoom(targetRoom) // Assuming the room information is available in the message object
        //             .setText(`Sorry Error occured :${error}`);
        //         await modify.getCreator().finish(modifiedMessage);
        //     }
        // }

        // sendDirectMessage(
        //     read,
        //     modify,
        //     context.user,
        //     `AI Assistant installed Successfully 🎉 \n *AI Assistant Commands*
        //     \`/ai-assistant help \` - Display helper message
        //     \`/ai-assistant setllm <llm name>\` - sets new llm
        //     Refer https://github.com/Sumitwarrior7 for more details 🚀`,
        //     persistence
        // );
    }

    // protected async extendConfiguration(
    //     configuration: IConfigurationExtend,
    //     environmentRead: IEnvironmentRead
    // ): Promise<void> {
    //     await configuration.slashCommands.provideSlashCommand(new GetInfo());
    //     await configuration.settings.provideSetting({
    //         id: "welcome_rooms",
    //         type: SettingType.STRING,
    //         packageValue: "",
    //         required: false,
    //         public: false,
    //         i18nLabel: "Allowed Rooms (Comma Separated)",
    //         i18nDescription: "Only welcome users in these rooms.",
    //     });
    // }
}
