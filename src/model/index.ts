import { MongoClient } from 'mongodb';

import config from '../config.json'
import { currentTime, currentDate, setlog } from '../helper';

const client = new MongoClient('mongodb://127.0.0.1:27017');
const db = client.db(config.database);
export const DEFAULT_GAMEID = 1

export const DUsers = db.collection<SchemaUser>('users');
export const DRounds = db.collection<SchemaRoundHistory>('rounds');
export const DHistories = db.collection<SchemaHistory>('histories');

const lastIds = {
    lastHistoryId: 0,
    lastUserId: 0
}

export const connect = async () => {
    try {
        await client.connect();
        await DUsers.createIndex({ name: 1 }, { unique: true, name: 'users-name' });
        await DHistories.createIndex({ name: 1 }, { unique: false, name: 'logs-name' });
        await DHistories.createIndex({ date: 1 }, { unique: false, name: 'logs-date' });

        const d = await DHistories.aggregate([{ $group: { _id: null, max: { $max: "$_id" } } }]).toArray();
        lastIds.lastHistoryId = d?.[0]?.max || 0
        const d1 = await DUsers.aggregate([{ $group: { _id: null, max: { $max: "$_id" } } }]).toArray();
        lastIds.lastUserId = d1?.[0]?.max || 0

        return true
    } catch (error) {
        setlog('mongodb-initialization', error)
        return error
    }
}

export const getBettingAmounts = async () => {
    return { minBetAmount: config.betting.min, maxBetAmount: config.betting.max }
}

export const addHistory = async (roundId: number, userName: string, betAmount: number, betScores: Array<number>) => {
    try {
        await DHistories.insertOne({
            _id: ++lastIds.lastHistoryId,
            roundId,
            userName,
            betAmount,
            betScores,
            winAmount: 0,
            date: currentTime()
        });
        return true;
    } catch (error) {
        setlog('addHistory', error);
        return false;
    }
}

export const updateHistory = async (roundId: number, userName: string, winAmount: number) => {
    try {
        await DHistories.updateOne({ $and: [{ roundId: roundId }, { userName: userName }] }, { $set: { winAmount } });
        return true;
    } catch (err) {
        setlog('updateHistory', err);
        return false;
    }
}

export const addUser = async (name: string, user_id: string, balance: number, img: string) => {
    try {
        await DUsers.insertOne({
            _id: ++lastIds.lastUserId,
            userId: user_id,
            name,
            balance,
            img,
        })
        return true
    } catch (error) {
        setlog('addUser', error)
        return false
    }
}

export const updateUserBalance = async (userId: string, balance: number) => {
    try {
        await DUsers.updateOne({ userId }, { $set: { balance } })
        return true
    } catch (error) {
        setlog('updateUserBalance', error)
        return false
    }
}

export const insertNewRound = async (betId: number) => {
    try {
        await DRounds.insertOne({
            _id: betId,
            roundResult: 0,
            date: currentDate()
        });
        return true;
    } catch (err) {
        setlog('insetNewRound', err);
        return false;
    }
}

export const updateRound = async (betId: number, roundResult: number) => {
    try {
        await DRounds.updateOne({ _id: betId }, { $set: { roundResult } });
        return true;
    } catch (err) {
        setlog('updateRound', err);
        return false;
    }
}