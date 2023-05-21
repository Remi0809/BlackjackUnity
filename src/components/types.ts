import { Card } from './Card';
export interface UserInfo {
  avatarUrl: string;
  nickname: string;
  balance: number;
}


export interface CardPayload {
  suit: number,
  rank: number
}

export interface UserInfo {
  avatarUrl: string,
  nickname: string,
  balance: number
}

export enum GameStatus {
  Idle,
  PlayerTurn,
  Reward
}

export enum SplitState {
  none,
  firstHand,
  secondHand
}