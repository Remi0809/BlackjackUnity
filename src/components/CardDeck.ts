import { Card } from './Card';
export class CardDeck {
  private cards: Card[];
  // Constructor function
  constructor() {
    console.log('card deck constructor');
    this.cards = [];
    // Suit and rank values for the cards
    const suits = [0, 1, 2, 3];
    const ranks = [
      { index: 0, name: 'ace', value: 11 },
      { index: 1, name: '2', value: 2 },
      { index: 2, name: '3', value: 3 },
      { index: 3, name: '4', value: 4 },
      { index: 4, name: '5', value: 5 },
      { index: 5, name: '6', value: 6 },
      { index: 6, name: '7', value: 7 },
      { index: 7, name: '8', value: 8 },
      { index: 8, name: '9', value: 9 },
      { index: 9, name: '10', value: 10 },
      { index: 10, name: 'jack', value: 10 },
      { index: 11, name: 'queen', value: 10 },
      { index: 12, name: 'king', value: 10 },
    ];
    // Create 54 cards (including two jokers)
    for (const suit of suits) {
      for (const rank of ranks) {
        const card: Card = {
          index: rank.index,
          suit: suit,
          rank: rank.name,
          value: rank.value,
          equals: function (other: Card): boolean {
            return this.index === other.index;
          }
        };
        this.cards.push(card);
      }
    }
    // Shuffle the cards
    this.shuffle();

    const card1: Card = {
      index: 2,
      suit: 1,
      rank: '3',
      value: 3,
      equals: function (other: Card): boolean {
        return this.index === other.index;
      }
    };

    const card2: Card = {
      index: 0,
      suit: 1,
      rank: 'ace',
      value: 11,
      equals: function (other: Card): boolean {
        return this.index === other.index;
      }
    };;
    const card3: Card = {
      index: 2,
      suit: 2,
      rank: '3',
      value: 3,
      equals: function (other: Card): boolean {
        return this.index === other.index;
      }
    };

    // this.cards.push(card1);
    // this.cards.push(card2);
    // this.cards.push(card3);

  }
  // Shuffle the cards randomly
  private shuffle(): void {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = this.cards[i];
      this.cards[i] = this.cards[j];
      this.cards[j] = temp;
    }
  }
  // Draw one card from the top of the deck and return it
  drawCard(): Card {
    if (this.cards.length === 0) {
      // If there are no more cards, create a new deck and shuffle it
      this.cards = new CardDeck().cards;
    }
    return this.cards.pop();
  }
}