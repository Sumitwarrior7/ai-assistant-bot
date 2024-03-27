import {
    IModify,
    IPersistence,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import { IRoom, RoomType } from "@rocket.chat/apps-engine/definition/rooms";
import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { Block } from "@rocket.chat/ui-kit";
import { IMessageAttachment } from "@rocket.chat/apps-engine/definition/messages";
import { IMessage } from "@rocket.chat/apps-engine/definition/messages";
import {
    RocketChatAssociationModel,
    RocketChatAssociationRecord,
} from "@rocket.chat/apps-engine/definition/metadata";
import { UIKitBlockInteractionContext } from "@rocket.chat/apps-engine/definition/uikit";
import { NotificationsController } from "./notifications";

// getDirect is used to get the direct room between the app user and the user
export async function getDirect(
    read: IRead,
    modify: IModify,
    appUser: IUser,
    username: string
): Promise<IRoom | undefined> {
    const usernames = [appUser.username, username];
    let room: IRoom;
    try {
        room = await read.getRoomReader().getDirectByUsernames(usernames);
    } catch (error) {
        console.error(error);
        return;
    }
    if (room) {
        return room;
    } else {
        let roomId: string;
        const newRoom = modify
            .getCreator()
            .startRoom()
            .setType(RoomType.DIRECT_MESSAGE)
            .setCreator(appUser)
            .setMembersToBeAddedByUsernames(usernames);
        roomId = await modify.getCreator().finish(newRoom);
        return await read.getRoomReader().getById(roomId);
    }
}

// sendMessage is used to send a message to a room
export async function sendMessage(
    modify: IModify,
    room: IRoom,
    sender: IUser,
    message: string,
    blocks?: Array<Block>
): Promise<string> {
    const msg = modify
        .getCreator()
        .startMessage()
        .setSender(sender)
        .setRoom(room)
        .setParseUrls(true)
        .setText(message);

    if (blocks !== undefined) {
        msg.setBlocks(blocks);
    }

    return await modify.getCreator().finish(msg);
}

// sendMessageWithAttachment is used to send a message with attachments to a room
export async function sendMessageWithAttachment(
    modify: IModify,
    room: IRoom,
    sender: IUser,
    message: string,
    attachments?: Array<IMessageAttachment>,
    blocks?: Array<Block>
): Promise<string> {
    const msg = modify
        .getCreator()
        .startMessage()
        .setSender(sender)
        .setUsernameAlias("app_name")
        .setRoom(room)
        .setParseUrls(true)
        .setText(message);

    if (attachments !== undefined) {
        const modifiedAttachments = attachments.map((attachment) => ({
            ...attachment,
            collapsed: false,
        }));
        msg.setAttachments(modifiedAttachments);
    }
    if (blocks !== undefined) {
        msg.setBlocks(blocks);
    }

    return await modify.getCreator().finish(msg);
}

export async function shouldSendMessage(
    read: IRead,
    user: IUser,
    persistence: IPersistence
): Promise<boolean> {
    const notificationsController = new NotificationsController(
        read,
        persistence,
        user
    );
    const notificationsStatus =
        await notificationsController.getNotificationsStatus();
    return notificationsStatus ? notificationsStatus.status : true;
}

// sendNotification is used to send a notification to a user,notification is a message which is not visible to other users
export async function sendNotification(
    read: IRead,
    modify: IModify,
    user: IUser,
    room: IRoom,
    message: string
): Promise<void> {
    const appUser = (await read.getUserReader().getAppUser()) as IUser;

    const msg = modify
        .getCreator()
        .startMessage()
        .setSender(appUser)
        .setRoom(room)
        .setText(message);

    return read.getNotifier().notifyUser(user, msg.getMessage());
}

// sendDirectMessage is used to send a direct message to a user
export async function sendDirectMessage(
    read: IRead,
    modify: IModify,
    user: IUser,
    message: string,
    persistence: IPersistence
): Promise<string> {
    const appUser = (await read.getUserReader().getAppUser()) as IUser;
    const targetRoom = (await getDirect(
        read,
        modify,
        appUser,
        user.username
    )) as IRoom;

    const shouldSend = await shouldSendMessage(read, user, persistence);

    if (!shouldSend) {
        return "";
    }

    return await sendMessage(modify, targetRoom, appUser, message);
}

export function isUserHighHierarchy(user: IUser): boolean {
    const clearanceList = ["admin", "owner", "moderator"];
    return user.roles.some((role) => clearanceList.includes(role));
}

export async function helperMessage(
    read: IRead,
    modify: IModify,
    room: IRoom,
    user: IUser
) {
    const text = `🎉 Welcome to the AI Assistant! Here are the commands you can use:
    🤖 *AI Assistant Commands*
    \`/ai-assistant help\` - Display this helper message
    \`/ai-assistant setllm <llm name>\` - Set a new llm
    
    Feel free to explore and enjoy the assistance!`;

    return await sendNotification(read, modify, user, room, text);
}

// Function to delete a message
export async function deleteMessage(
    modify: IModify,
    sender: IUser,
    message: IMessage
): Promise<void> {
    try {
        // Call the deleteMessage method from IModifyDeleter
        await modify.getDeleter().deleteMessage(message, sender);
        console.log(`Message deleted successfully`);
    } catch (error) {
        console.error(`Error deleting message: ${error}`);
    }
}
