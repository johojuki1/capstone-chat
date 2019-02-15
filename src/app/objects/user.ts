export class User {
    //id given by socket.
    socketId: string;
    //id generated by room
    roomId: string;
    //rtc connection
    rtc: webkitRTCPeerConnection;
    //data channel
    datachannel: RTCDataChannel;
    //displayname of user
    username: string;
    //stores if correct password has been given
    passwordGiven: boolean;
}
