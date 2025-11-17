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

    constructor() {
        this.chatId = crypto.randomUUID();
    }
}