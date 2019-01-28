import { Injectable } from '@angular/core';
import { SocketService } from '../common/socket.service';
import { SettingsService } from '../common/settings.service';
import { Observable, Subject } from 'rxjs';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import { MESSAGES_CONTAINER_ID } from '@angular/cdk/a11y';

export interface Message {
  message: string;
}

@Injectable()
export class ChatSocketService {
  public messages: Subject<Message>;

  constructor(
    private socketService: SocketService,
    private settingsService: SettingsService
  ) {
  }

  //connect to websocket.
  public connect() {
    this.messages = <Subject<Message>>this.socketService
      .connect(this.settingsService.getChatWebsocketURL())
      .map((response: MessageEvent): Message => {
        let data = JSON.parse(response.data);
        return {
          message: data
        }
      });
  }

  public disconnect() {
    this.socketService.disconnect();
  }
}