import { Card } from './Card';
import { Player } from './Player';
 export class Dealer {
  name: string;
  hand: Card[];
  constructor() {
    this.name = 'Dealer';
    this.hand = [];
  }
  clearHand() {
    this.hand = [];
  }
  addCardToHand(card: Card) {
    this.hand.push(card);
  }
  getHandValue() {
    let value = 0;
    let aces = 0;
    for (const card of this.hand) {
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

  isEnded() {
    const value = this.getHandValue();
    return value > 17;
  }

  isBlackjack(): boolean {
    if (this.hand.length !== 2) {
      return false;
    }
    // Check if the hand is a blackjack
    return this.getHandValue() === 21;
  }

  checkHandValueOut(): boolean {
    return this.getHandValue() >= 17;
  }

  mayHave21(): boolean {
    return this.hand[0].value == 11;
  }

  isBust(): boolean {
    return this.getHandValue() > 21;
  }

  // deleteLastCardFromHand(): void {
  //   const hand = this.hand;
  //   const index = hand.length - 1;
  //   if (index === -1) {
  //     throw new Error('Card not found');
  //   }
  //   hand.splice(index, 1);
  // }

  tryNextHand(player: Player): boolean {
    if(player.isBlackjack()){
      console.log('Dealer.tryNextHand: player is blackjack');
      return true;
    }
    if(this.hand.length === 2){
      if(player.isBust()){
        console.log('Dealer.tryNextHand: score = ', this.getHandValue());
        return true;
      }
      if(this.isBlackjack()){
        console.log('Dealer.tryNextHand: dealer is blackjack');
        return true;
      }
    }
    console.log('Dealer.tryNextHand: score = ', this.getHandValue());
    return this.checkHandValueOut();
  }
}