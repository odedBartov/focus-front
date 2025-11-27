export class ChatRequest {
    ConversationId? = "";
    message = "";
    projectId = "";
}

export class ChatResponse {
    conversationId = "";
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
        this.lastDate = new Date();
    }
}