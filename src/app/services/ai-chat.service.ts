import { inject, Injectable } from '@angular/core';
import { AiConversation } from '../models/aiModels';
import { HttpService } from './http.service';

@Injectable({
  providedIn: 'root'
})
export class AiChatService {
  httpService = inject(HttpService);
  storageKey = "aiChat-";
  CONVERSATION_TTL = 8 * 60 * 60 * 1000; // 8 hours
  constructor() {
  }

  initProjectConversation(projectId?: string) {
    if (projectId) {
      const chat = localStorage.getItem(this.storageKey + projectId);
      if (!chat) {
        this.httpService.getConversationWithProjectId(projectId).subscribe((res: AiConversation) => {
          if (res) {
            this.setConversation(res);
          }
        });
      }
    }
  }

  setConversation(chat: AiConversation) {
    this.handleStaleChat(chat);
    chat.lastDate = new Date();
    localStorage.setItem(this.storageKey + chat.projectId, JSON.stringify(chat))
  }

  getConversation(projectId: string): AiConversation {
    const chat = localStorage.getItem(this.storageKey + projectId);
    if (chat) {
      const pasredChat = JSON.parse(chat);
      this.handleStaleChat(pasredChat);
      return pasredChat;
    }

    const newChat = new AiConversation();
    newChat.projectId = projectId;
    return newChat;
  }

  handleStaleChat(chat: AiConversation) {
    if (Date.now() - new Date(chat.lastDate).getTime() >= this.CONVERSATION_TTL) {
      chat.messages = [];
      chat.lastDate = new Date();
      this.setConversation(chat);
    }
  }
}
