import { Component, OnInit } from '@angular/core';
import { SocketService } from '../services/common/socket.service';
import { SettingsService } from '../services/common/settings.service'
import { RtcChatUserService } from '../services/chat/rtc-chat-user.service'
import { RtcChatAdminService } from '../services/chat/rtc-chat-admin.service'

@Component({
  selector: 'app-server-log',
  templateUrl: './server-log.component.html',
  styleUrls: ['./server-log.component.scss']
})
export class ServerLogComponent implements OnInit {

  serverLog: string = '';
  private ws: WebSocket;


  constructor(
    private socketService: SocketService,
    private settingsService: SettingsService,
    private chatUserService: RtcChatUserService,
    private chatAdminService: RtcChatAdminService,
  ) {
    this.connect(this.settingsService.getChatWebsocketURL());
  }

  ngOnInit() {
    //attempt to disconnect all RTC connections
    this.chatUserService.disconnectRtc();
    this.chatAdminService.disconnectRtc();
    this.socketService.disconnect();
  }

  //setup websocket.
  private connect(url) {
    this.ws = new WebSocket(url);
    this.ws.onopen = event => {
      var sentMessage =
      {
        type: 'get-server-logs',
      }
      this.ws.send(JSON.stringify(sentMessage));
    };
    this.ws.onclose = event => {
      this.serverLog = '->   Socket has disconnected.\n' + this.serverLog;
    };
    this.ws.onmessage = event => {
      this.serverLog = event.data + '\n' + this.serverLog;
    };
  }

  getTurnButtonColour(): string {
    if (this.settingsService.getTurn()) {
      return "green";
    } else {
      return "red";
    }
  }


  getTurnText(): string {
    if (this.settingsService.getTurn()) {
      return "On"
    } else {
      return "Off"
    }
  }

  toggleTurn() {
    if (this.settingsService.getTurn()) {
      this.settingsService.setTurn(false);
    } else {
      this.settingsService.setTurn(true);
    }
  }

}
