import { Card } from './Card';
import { CardDeck } from './CardDeck';
import { Player } from './Player';
import { Dealer } from './Dealer';
import { initSocket } from '../socket/index';
import { GameStatus, SplitState } from './types';
import { checkBalance, changeUserBalance } from '../socket/index';
// Define the default bet amount
const DEFAULT_BET_AMOUNT = 10;
// Define the number of cards to deal out at the start of the game
const INITIAL_CARD_COUNT = 2;
// Define the maximum score before a player busts
const MAX_SCORE = 21;
// Define the minimum dealer score to hit
const DEALER_MIN_SCORE = 17;
export class Room {
  public cardDeck: CardDeck;
  public betAmount: number;
  public player: Player;
  public dealer: Dealer;
  public roomId: string;
  public gameStatus: GameStatus;
  private isEvenMoney: boolean;
  private isInsurance: boolean;
  public isDoubleDown = [false, false];

  constructor(roomId: string, betAmount?: number) {
    this.gameStatus = GameStatus.Idle;
    this.roomId = roomId;
    this.cardDeck = new CardDeck();
    this.betAmount = betAmount || DEFAULT_BET_AMOUNT;
    this.player = new Player(roomId);
    // Create a new Dealer and assign one card
    this.dealer = new Dealer();
  }
  // Helper function to determine if the game can be ended
  canEndGame(): boolean {
    // The game can be ended if the player's score is greater than or equal to the dealer's score,
    // or if the player's score is greater than MAX_SCORE
    const playerScore = this.player.getHandValue();
    const dealerScore = this.dealer.getHandValue();
    return playerScore >= dealerScore || playerScore > MAX_SCORE;
  }

  addCardToHand(card: Card, isDealer: boolean = false): void {
    if(isDealer){
      this.dealer.addCardToHand(card);
      return;
    }
    if (this.gameStatus === GameStatus.Idle) {
      if (this.player.hands[0].length === 0) {
        this.player.addCardToHand(card);
      } else if (this.player.hands[0].length === 1 && this.dealer.hand.length === 0) {
        this.dealer.addCardToHand(card);
      } else if (this.player.hands[0].length === 1 && this.dealer.hand.length === 1) {
        this.player.addCardToHand(card);
        this.gameStatus = GameStatus.PlayerTurn;
      }
    } else if (this.gameStatus === GameStatus.PlayerTurn) {
      this.player.addCardToHand(card);
    } else if (this.gameStatus === GameStatus.Reward) {
      this.dealer.addCardToHand(card);
    }
  }
  // Helper function to get the winner of the game

  // Helper function to simulate the dealer's turn
  simulateDealerTurn(): void {
    let dealerScore = this.dealer.getHandValue();
    // The dealer must hit until their score reaches at least DEALER_MIN_SCORE
    while (dealerScore < DEALER_MIN_SCORE) {
      const card = this.cardDeck.drawCard();
      this.dealer.addCardToHand(card);
      dealerScore = this.dealer.getHandValue();
    }
  }
  // Helper function to get the final game state
  getFinalGameState(): any {
    return {

    };
  }

  insurance(): boolean {
    if (this.player.hands[0].length !== 2 || this.dealer.hand.length !== 1) {
      // Dealer has no hand, cannot offer insurance
      return false;
    }
    const dealerUpCard = this.dealer.hand[0];
    const dealerUpCardValue = dealerUpCard.value;
    const insuranceBalance = this.betAmount / 2;
    if (dealerUpCardValue !== 11) {
      // Dealer's up card is not an ace, so insurance is not offered
      return false;
    }
    if (this.player.getSplitState() != SplitState.none) {
      return false;
    }

    if (!checkBalance(this.roomId, insuranceBalance)) {
      return false;
    };

    if(changeUserBalance(this.roomId, insuranceBalance)){
      this.isInsurance = true;
      return true;
    }
  }

  split(): boolean {
    if (!checkBalance(this.roomId, this.betAmount)) {
      return false;
    }
    if (this.gameStatus != GameStatus.PlayerTurn) {
      return false;
    }
    if (this.player.split()) {
      return changeUserBalance(this.roomId, -this.betAmount);
    }
  }

  doubleDown(): boolean {
    if (this.gameStatus != GameStatus.PlayerTurn) {
      return false;
    }
    if (!this.player.canDoubleDown()) {
      return false;
    }
    if (!checkBalance(this.roomId, this.betAmount)) {
      return false;
    }
    this.isDoubleDown[this.player.splitHand] = true;
    return changeUserBalance(this.roomId, this.betAmount);
  }

  stand(): boolean {
    if (this.gameStatus === GameStatus.PlayerTurn && this.player.stand()) {
      this.gameStatus = GameStatus.Reward;
      return true;
    }
    return false;
  }

  hit(): boolean {
    if (this.gameStatus === GameStatus.PlayerTurn) {
      return true;
    }
    return false;
  }

  endGame(): number {
    const dealerBlackjack = this.dealer.isBlackjack();
    const playerBlackjack = this.player.isBlackjack();
    const dealerScore = this.dealer.getHandValue();
    const playerScore = [this.player.getHandValue(0), this.player.getHandValue(1)];
    let earnScore = 0;
    for (let playerHand = 0; playerHand < this.player.hands.length; playerHand++) {
      let won = playerScore[playerHand] > dealerScore || this.dealer.isBust() || playerBlackjack && !dealerBlackjack;
      won &&= !this.player.isBust(playerHand);
      if(won){
        earnScore += this.betAmount;
        if(playerBlackjack){
          earnScore += this.betAmount / 2;
        }
      }
    }
    if(dealerBlackjack && this.isInsurance){
      earnScore += this.betAmount/2;
    }
    return earnScore;
  }

}