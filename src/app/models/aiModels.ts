export class ChatRequest {
    ConversationId = "";
    message = "";
    projectId = "";
}

export class ChatResponse {
    chatId = "";
    reply = "";
}

export class chatMessage {
    value = "";
    sentByUser = true;
}

export class AiConversation {
    messages: chatMessage[] = [];
    chatId = "";
    projectId = "";
    lastDate!: Date;

    constructor() {
        this.chatId = crypto.randomUUID();
        this.lastDate = new Date();
    }
}