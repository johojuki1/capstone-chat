import { Injectable } from '@angular/core';
import { ChatSocketService } from './chatSocket.service';
import { SettingsService } from '../common/settings.service'
import { RtcService } from '../common/rtc.service';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { User } from '../../objects/user'

//Stores values that is retrived by subscribed functions.
var messagesOut: Subject<string> = new Subject<string>();

//Stores users usd by software. 
var users: Array<User> = [];

@Injectable({
  providedIn: 'root'
})
export class RtcChatAdminService {

  eventCallback$ = messagesOut.asObservable(); // Stream

  constructor(
    private chatSocketService: ChatSocketService,
    private rtcService: RtcService,
    private router: Router,
    private settingsService: SettingsService,
  ) {
  }

  //initiates the settings on the service.
  public initiateService() {
    //subscribe to chat socket. 
    try {
      this.subscribeToSocket();
    } catch (err) {
      //if socket does't exist, go back to choose chat screen.
      this.router.navigate(['chat']);
    }
  }

  //subscribes to the messages value in chatService
  subscribeToSocket() {
    this.chatSocketService.messages.subscribe(msg => {
      var message = JSON.parse(JSON.stringify(msg.message))
      //determine what to do with the replying message.
      switch (message.type) {
        case "offer":
          this.onOffer(message.offer, message.userId);
          break;
        case "candidate":
          this.onCandidate(message.candidate, message.roomId);
          break;
        default:
          console.log("Message not recognised.");
      }
    });
  }

  //determines what happens when a user wants to call the administrator.
  async onOffer(offer, socketId) {
    //setup new user.
    let newUser: User;
    newUser = this.initiateUser(socketId);
    newUser = this.setupDataChannel(newUser);
    newUser.rtc.setRemoteDescription(new RTCSessionDescription(offer));
    newUser.rtc.setLocalDescription(
      await newUser.rtc.createAnswer()
        .then(function (answer) {
          return answer;
        }))
    //add to list of users
    users[newUser.roomId] = newUser;
    console.log("Admin - Added user with id: " + newUser.roomId);
    //send answer.
    this.socketMessage({
      type: "answer",
      answer: newUser.rtc.localDescription,
      roomId: newUser.roomId,
    }, socketId);
  }

  //Generates a new id for the user. Used for RTC communication.
  private assignId(): string {
    var newId;
    do {
      newId = Math.floor(Math.random() * 90000) + 10000;
    } while (users[newId])
    return <string>newId;
  }

  //determines what happens when candidates are recieved.
  private onCandidate(candidate, roomId) {
    if (users[roomId]) {
      users[roomId].rtc.addIceCandidate(new RTCIceCandidate(candidate));
    }
  }

  //send message through websocket.
  private socketMessage(message, socketId) {
    message.name = socketId;
    this.chatSocketService.messages.next(message);
  }

  //Initiates a user object.
  initiateUser(socketId: string): User {
    var newUser = new User();
    //setup user object.
    newUser.rtc = this.rtcService.setupConnection();
    newUser.socketId = socketId;
    newUser.roomId = this.assignId();
    //setup ice handling
    newUser.rtc.onicecandidate = event => {
      if (event.candidate) {
        this.socketMessage({
          type: "candidate",
          candidate: event.candidate
        }, socketId);
      }
    }
    //detects if user has disconnected and deletes user.
    newUser.rtc.oniceconnectionstatechange = event => {
      if (newUser.rtc.iceConnectionState == 'disconnected') {
        this.removeUser(newUser.roomId)
      }
    }
    return newUser;
  }

  private removeUser(roomId) {
    //close all socket connections.
    users[roomId].rtc.close;
    users[roomId].datachannel.close;
    //delete user.
    users.splice(users.indexOf(users[roomId]), 1);
    console.log("Admin - User removed with id: " + roomId);
  }

  //Setup Data Channel.
  setupDataChannel(user: User): User {
    //create datachannel
    user.datachannel = user.rtc.createDataChannel(user.roomId, this.settingsService.getDataChannelOptions());

    //setup channel
    user.rtc.ondatachannel = function (event) {
      event.channel.onopen = function () {
        event.channel.onmessage = event => {
          messagesOut.next(event.data);
        }
      }
    }
    return user;
  }

  //Instructions

  //when a user clicks the send message button 
  broadcast() {
    users.forEach(function (value) {
      console.log("Sending message to: " + value.roomId);
      var val = 'Test message from admin: ' + value.roomId;
      value.datachannel.send(val);
    })
  }

  connectionState() {
    users.forEach(function (value) {
      console.log(value.rtc.iceConnectionState);
      console.log(value.rtc.iceGatheringState);
      console.log(value.rtc.signalingState);
      console.log(value.datachannel.readyState);
      console.log(" ");
    })
  }
}