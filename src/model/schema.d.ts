declare interface SchemaUser {
    _id:          number
    userId:       string
    name:         string
    balance:      number
    img:          string
}

declare interface SchemaHistory {
    _id:          number
    roundId:      number
    userName:     string
    betAmount:    number
    winAmount:    number
    betScores:    Array<number>
    date:         number
}

declare interface SchemaRoundHistory {
    _id:          number
    roundResult:  number
    date:         string
}