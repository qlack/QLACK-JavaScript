
// Type definitions for QPubSub library
// Definitions by: European Dynamics SA.

export class QPubSub {
  serverWindowOrigin: string;

  init(instaceID: string, server: boolean, allowedOrigins?: string[]): void;

  publish(topic: string, msg: string): void;

  setLogActive(bool: boolean): void;

  subscribe(topic: string, callback: (msg: QPubSub.Message) => void): void;

  unsubscribe(topic: string): void;
}

export namespace QPubSub {
  export interface Message {
    topic: string;
    clientID: string;
    originalClientID: string;
    msgType: MessageType;
    msg: string;
  }

  export enum MessageType {
    CONTROL = 1,  // A control message, to initiate the PING/PONG sequence.
    PUB = 2,      // A request to publish.
    SUB = 3,      // A request to subscribe.
    CALLBACK = 4, // A callback to a client.
    UNSUB = 5// A request to unsubscribe.
  }

  export enum ControlMessage {
    PING = 'ping',  // A ping message to initiate the PING/PONG sequence between a client and the server.
    PONG = 'pong', // A pong message to confirm the server instance and communication with the client.
  }
}



