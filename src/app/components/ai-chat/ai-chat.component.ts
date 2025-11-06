import { Component, effect, ElementRef, inject, Input, OnInit, ViewChild, viewChild, WritableSignal } from '@angular/core';
import { Project } from '../../models/project';
import { HttpService } from '../../services/http.service';
import { AiConversation, chatMessage, ChatRequest, ChatResponse } from '../../models/aiModels';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AnimationsService } from '../../services/animations.service';
import { AiChatService } from '../../services/ai-chat.service';

@Component({
  selector: 'app-ai-chat',
  imports: [CommonModule, FormsModule],
  templateUrl: './ai-chat.component.html',
  styleUrl: './ai-chat.component.scss'
})
export class AiChatComponent {
  @Input() project!: WritableSignal<Project>;
  @ViewChild('conversationContainer') conversationContainer!: ElementRef;
  httpService = inject(HttpService);
  animationService = inject(AnimationsService);
  aiChatService = inject(AiChatService);
  chatId = "";
  conversation = new AiConversation();
  userMessageText = "";

  constructor() {
    this.chatId = crypto.randomUUID();

    effect(() => {
      this.project();
      this.conversation = this.aiChatService.getConversation(this.project().id ?? "unKnown");
    });
  }

  sendMessage() {
    const userMessage = new chatMessage();
    userMessage.value = this.userMessageText;
    this.conversation.messages.push(userMessage);
    const request = new ChatRequest();
    request.message = this.userMessageText;
    request.projectId = this.project().id ?? "unKnown";
    request.chatId = this.chatId;
    this.animationService.changeIsloading(true);
    this.httpService.sendAiMessage(request).subscribe((res: ChatResponse) => {
      this.animationService.changeIsloading(false);
      this.userMessageText = '';
      const reply = new chatMessage;
      reply.sentByUser = false;
      reply.value = res.reply;
      this.conversation.messages.push(reply);
      this.aiChatService.setConversation(this.conversation);
      this.scrollToBottom();
    });
  }

  scrollToBottom() {
    const container = this.conversationContainer?.nativeElement;
    setTimeout(() => {
      container.scrollTop = container.scrollHeight;
    }, 1);
  }

  resetConversation() {
    this.conversation = new AiConversation();
    this.userMessageText = '';
    this.aiChatService.setConversation(this.conversation);
  }
}
