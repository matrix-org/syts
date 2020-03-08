/* tslint:disable */
/**
 * This file was automatically generated by json-schema-to-typescript.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,
 * and run json-schema-to-typescript to regenerate this file.
 */

export interface Blueprint {
  homeservers?: Homeserver[];
  [k: string]: any;
}
export interface Homeserver {
  name: string;
  users?: User[];
  rooms?: Room[];
  [k: string]: any;
}
export interface User {
  localpart: string;
  display_name?: string;
  avatar_url?: string;
  account_data?: {
    type?: string;
    value?: {
      [k: string]: any;
    };
    [k: string]: any;
  }[];
}
export interface Room {
  creator: string;
  createRoom?: {
    [k: string]: any;
  };
  events?: Event[];
  [k: string]: any;
}
export interface Event {
  type: string;
  sender: string;
  state_key?: string;
  content?: {
    [k: string]: any;
  };
  [k: string]: any;
}
