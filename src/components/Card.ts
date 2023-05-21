export class Card {
    index: number;
    suit: number;
    rank: string;
    value: number;

    constructor(index: number, suit: number, rank: string, value: number) {
      this.index = index;
      this.suit = suit;
      this.rank = rank;
      this.value = value;
    }

    equals(other: Card) {
      return this.index === other.index;
    }
  }