export class ChatRequest {
    ConversationId?: string;
    message = "";
    projectId = "";
}

export class ChatResponse {
    conversationId = "";
    reply = "";
}

export class chatMessage {
    content = "";
    role = "";
}

export class AiConversation {
    id?: string;
    messages: chatMessage[] = [];
    projectId = "";
    lastDate: Date;

    constructor() {
        this.lastDate = new Date();
    }
}