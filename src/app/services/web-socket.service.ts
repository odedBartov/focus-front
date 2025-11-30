import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private ws!: WebSocket;
  wsUrl = environment.wsUrl;
  constructor() { }

  connect(userId: string) {
    this.ws = new WebSocket(`wss://${this.wsUrl}/ws?userId=${userId}`);
    this.ws.onmessage = (event) => {
      console.log("got message!");
      console.log(event.data);
      
      const message = JSON.parse(event.data);
      if (message.shouldRefresh) {
        window.location.reload();
      }
    };
  }
}
