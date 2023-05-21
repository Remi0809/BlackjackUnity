import { checkBalance } from '../socket';
import { Card } from './Card';
import { SplitState } from './types';
export class Player {
  id: string;
  hands: Card[][];
  splitHand: number;
  splitState: SplitState;
  constructor(id: string) {
    this.id = id;
    this.hands = [[]];
    this.splitHand = 0; // Default hand is the first one
    this.splitHand
  }

  clearHands() {
    this.hands = [[]];
    this.splitHand = 0;
  }

  addCardToHand(card: Card) {
    this.hands[this.splitHand].push(card);
  }

  getHandValue(handIndex: number = this.splitHand) {
    if(this.getSplitState() === SplitState.none && handIndex ===1){
      return 0;
    }
    let value = 0;
    let aces = 0;
    const hand = this.hands[handIndex];
    for (const card of hand) {
      if (card.rank === 'ace') {
        aces++;
      }
      value += card.value;
    }
    while (value > 21 && aces > 0) {
      value -= 10;
      aces--;
    }
    return value;
  }

  shouldHit(): boolean {
    const value = this.getHandValue();
    return value < 17 || value < 21;
  }

  checkHandValueOut(): boolean {
    return this.getHandValue() >= 21;
  }

  getSplitState() {
    if (this.hands.length === 1 || this.hands.length === 0) {
      return SplitState.none;
    } 

    if (this.splitHand === 0) {
      return SplitState.firstHand;
    } else if (this.splitHand === 1) {
      return SplitState.secondHand;
    } else {
      return SplitState.none;
    }
  }

  isBlackjack(handIndex: number = this.splitHand): boolean {
    if (this.hands[handIndex].length !== 2) {
      return false;
    }
    // Check if the hand is a blackjack
    if (this.getHandValue() === 21) {
      return true;
    }
    return false;
  }

  tryNextHand(isDoubleDown: boolean = false): boolean {
    if(isDoubleDown){
      console.log('Player.tryNextHand: next turn( double down ), playerScore = ', this.getHandValue());
      return true;
    }
    const isBlackjackOrValueOut = this.isBlackjack() || this.checkHandValueOut();
    if (this.getSplitState() === SplitState.firstHand && isBlackjackOrValueOut) {
      this.splitHand = 1;
      console.log('Player.tryNextHand: from SplitState.firstHand to second hand, playerScore = ', this.getHandValue());
      return false;
    } else if (this.getSplitState() === SplitState.secondHand && isBlackjackOrValueOut) {
      console.log('Player.tryNextHand: from SplitState.secondHand to dealer turn, playerScore = ', this.getHandValue());
      return true;
    } else if (this.getSplitState() === SplitState.none && isBlackjackOrValueOut) {
      console.log('Player.tryNextHand: from SplitState.none to dealer turn, playerScore = ', this.getHandValue());
      return true;
    } else {
      console.log(`Player.tryNextHand: splitStatus: ${this.getSplitState()}, current hand score: ${this.getHandValue()}`)
      return false;
    }
  }

  nextHand(): boolean {
    console.log(`Player.nextHand: splitStatus: ${this.getSplitState()}, current hand score: ${this.getHandValue()}`)
    if (this.getSplitState() === SplitState.none || this.getSplitState() === SplitState.secondHand) {
      return true;
    } else if (this.getSplitState() === SplitState.firstHand) {
      this.splitHand = 1;
      return false;
    }
    
  }

  canDoubleDown(): boolean {
    if(this.getHandValue() > 7 && this.getHandValue() < 15 && this.hands[this.splitHand].length === 2){
      return true;
    }
    return false;
  }

  split() {
    const handToSplit = this.hands[this.splitHand];
    if (handToSplit.length !== 2 || !handToSplit[0].equals(handToSplit[1])) {
      // Invalid split
      return false;
    }
    // Add new hand to the list of hands
    this.hands.push([handToSplit.pop()!]);
    return true;
  }

  stand() {
    if (this.getSplitState() == SplitState.none) {
      return true;
    } else if (this.getSplitState() == SplitState.firstHand) {
      this.splitHand = 1;
      return false;
    } else if (this.getSplitState() == SplitState.secondHand) {
      return true;
    }
  }

  // deleteLastCardFromHand(): void {
  //   const hand = this.hands[this.splitHand];
  //   const index = hand.length - 1;
  //   if (index === -1) {
  //     throw new Error('Card not found');
  //   }
  //   hand.splice(index, 1);
  // }

  isBust(handIndex: number = this.splitHand): boolean {
    return this.getHandValue(handIndex) > 21;
  }
}