import { Injectable } from '@angular/core';
import { AiConversation } from '../models/aiModels';

@Injectable({
  providedIn: 'root'
})
export class AiChatService {
  storageKey = "aiChat-";
  constructor() { }

  setConversation(chat: AiConversation) {
    localStorage.setItem(this.storageKey + chat.projectId, JSON.stringify(chat))
  }

  getConversation(projectId: string): AiConversation {
    const chat = localStorage.getItem(this.storageKey + projectId);
    if (chat) {
      return JSON.parse(chat)
    }

    const newChat = new AiConversation();
    newChat.projectId = projectId;
    return newChat;
  }
}
