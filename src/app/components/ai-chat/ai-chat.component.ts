import { AfterViewInit, Component, effect, ElementRef, inject, Input, ViewChild, WritableSignal } from '@angular/core';
import { Project } from '../../models/project';
import { HttpService } from '../../services/http.service';
import { AiConversation, chatMessage, ChatRequest, ChatResponse } from '../../models/aiModels';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AnimationsService } from '../../services/animations.service';
import { AiChatService } from '../../services/ai-chat.service';
import { User } from '../../models/user';
import { UserService } from '../../services/user.service';
import { AnimationOptions, LottieComponent } from 'ngx-lottie';
import { AuthenticationService } from '../../services/authentication.service';

@Component({
  selector: 'app-ai-chat',
  imports: [CommonModule, FormsModule, LottieComponent],
  templateUrl: './ai-chat.component.html',
  styleUrl: './ai-chat.component.scss'
})
export class AiChatComponent implements AfterViewInit {
  @Input() project!: WritableSignal<Project>;
  @ViewChild('conversationContainer') conversationContainer!: ElementRef;
  httpService = inject(HttpService);
  animationService = inject(AnimationsService);
  aiChatService = inject(AiChatService);
  userServcie = inject(UserService);
  authenticationService = inject(AuthenticationService);
  conversationId = "";
  conversation = new AiConversation();
  userMessageText = "";
  isConsentForAi: boolean | undefined = true;
  user?: User;
  isWaitingForChat = false;
  loadingOptions: AnimationOptions = {
    path: '/assets/animations/loader.json',
  };

  constructor() {
    this.conversationId = crypto.randomUUID();

    effect(() => {
      this.project();
      this.conversation = this.aiChatService.getConversation(this.project().id ?? "unKnown");
      this.isConsentForAi = this.user?.projectsConsentForAi?.includes(this.project().id ?? "") ?? false;
    });

  }

  ngAfterViewInit(): void {
    this.userServcie.getUser().subscribe(res => {
      this.user = res;
      this.isConsentForAi = this.user.projectsConsentForAi?.includes(this.project().id ?? "") ?? false;
    });
    this.scrollToBottom();
  }

  consent() {
    this.isConsentForAi = true;
    if (this.user) {
      if (!this.user.projectsConsentForAi) {
        this.user.projectsConsentForAi = [];
      }
      this.user.projectsConsentForAi?.push(this.project().id ?? "");
      this.httpService.updateUser(this.user).subscribe(res => {
        this.authenticationService.setProjectsConsentForAi(res.projectsConsentForAi ?? []);
      });
    }
  }

  sendMessage() {
    const userMessage = new chatMessage();
    userMessage.value = this.userMessageText;
    this.conversation.messages.push(userMessage);
    const request = new ChatRequest();
    request.message = this.userMessageText;
    request.projectId = this.project().id ?? "unKnown";
    request.ConversationId = this.conversationId;
    this.isWaitingForChat = true;
    this.httpService.sendAiMessage(request).subscribe((res: ChatResponse) => {
      this.isWaitingForChat = false;
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
    const container = this.conversationContainer?.nativeElement?.parentElement;
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
