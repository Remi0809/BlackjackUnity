import { Server, Socket } from 'socket.io'
import { Room } from '../components/Room';
import { getTime } from "../math"
import { setlog } from '../helper'
import { CardPayload, GameStatus, SplitState, UserInfo } from '../components/types';
import { Card } from '../components/Card';
import { getUserInfoFromService } from '../controllers/client';

let mysocketIo: Server;

// Define a list of active rooms
const activeRooms: { [roomId: string]: Room } = {};
let users: { [key: string]: UserInfo } = {}
let sockets: { [key: string]: Socket } = {}
const MAX_BET = 1000;
const TEST_MODE = false;

export const initSocket = (io: Server) => {
    io.on('connection', (socket: Socket) => {
        console.log(">> new user connected: socketId = " + socket.id);
        addSocket(socket.id, socket);
        //sendUserInfo(socket.id);
        socket.on('user-info', async (payload) => {
            const data = payload.str;
            console.log('>> get-user-info', data);
            const res = await getUserInfoFromService(data);
            console.log('userInfo form service', res);
            let user: UserInfo;
            if (res.status) {
                user = {
                    avatarUrl: res.data.userId,
                    nickname: res.data.name,
                    balance: parseFloat(res.data.balance)
                }     
            }else{
                user = {
                    avatarUrl: 'none',
                    nickname: 'none',
                    balance: 1200
                }
            }
            users[socket.id] = user;
            sendUserInfo(socket.id);
        });

        socket.on('bet', (payload) => {
            const data = payload.str;
            const user: UserInfo = getUserInfo(socket.id);
            if (!user) {
                return socket.emit('error', 'user not found!');
            }
            console.log('>> bet', data);
            let betAmount: number = parseInt(data);
            if (!checkBalance(socket.id, betAmount)) {
                return socket.emit('error', { err: "lack of balance" });
            }
            const roomId = socket.id;
            const room = new Room(roomId, betAmount);
            activeRooms[roomId] = room;
            console.log('created room, room count = ', Object.keys(activeRooms).length);
            changeUserBalance(socket.id, -betAmount);
            return socket.emit('deal');
        });

        socket.on('get-card', (payload) => {
            const data = payload.str;
            console.log('>> get card: ', data);
            const room = getRoom(socket.id);
            if (!room) {
                return socket.emit('error', "no room");
            }

            const card = room.cardDeck.drawCard();
            const cardPayload: CardPayload = {
                suit: card.suit,
                rank: card.index
            }
            if (TEST_MODE) {
                return socket.emit('get-card', cardPayload);
            }

            if (data === "isDoubleDown") {
                if (!checkBalance(socket.id, room.betAmount)) {
                    return socket.emit('error', 'lack balance!');
                }
                if (room.player.canDoubleDown()) {
                    room.addCardToHand(card, true);
                    room.isDoubleDown[room.player.splitHand] = true;
                    changeUserBalance(socket.id, -room.betAmount);
                    return socket.emit('get-card', cardPayload);
                } else {
                    return socket.emit('error', 'can not doubleDown')
                }
            }

            if (data !== "isDoubleDown") {
                room.addCardToHand(card);
            }
            if (room.gameStatus === GameStatus.PlayerTurn && room.player.tryNextHand(room.isDoubleDown[room.player.splitHand])) {
                console.log('loss player turn');
                room.gameStatus = GameStatus.Reward;
                if (room.isDoubleDown && room.dealer.tryNextHand(room.player)) {
                    endGame(room);
                }
            } else if (room.gameStatus === GameStatus.Reward && room.dealer.tryNextHand(room.player)) {
                endGame(room);
            }
            return socket.emit('get-card', cardPayload);



        });

        socket.on('error', (err) => {
            console.error('Socket Error:', err);
        });

        socket.on('stand', () => {
            console.log('>> stand');
            if (TEST_MODE) {
                return socket.emit('stand');
            }


            const room = getRoom(socket.id);
            if (room == undefined) {
                return socket.emit('error', "no room");
            }
            if (room.gameStatus !== GameStatus.PlayerTurn) {
                return socket.emit('error', 'no player turn!')
            }

            if (room.player.stand()) {
                console.log('player stand, loss turn');
                room.gameStatus = GameStatus.Reward;
            }
            return socket.emit('stand');

        });

        socket.on('split', () => {
            console.log('>> split');
            if (TEST_MODE) {
                return socket.emit('split');
            }

            const room = getRoom(socket.id);
            if (room == undefined) {
                return socket.emit('error', "no room")
            }
            if (room.gameStatus !== GameStatus.PlayerTurn) {
                return socket.emit('error', 'no player turn!')
            }

            if (room.split()) {
                return socket.emit('split');
            } else {
                return socket.emit('error', 'can not split')
            }
        });

        socket.on('hit', () => {
            console.log('>> hit');
            if (TEST_MODE) {
                return socket.emit('hit');
            }

            const room = getRoom(socket.id);
            if (room == undefined) {
                socket.emit('error', "no room")
            }
            if (room.gameStatus !== GameStatus.PlayerTurn) {
                return socket.emit('error', 'no player turn!')
            }

            if (room.hit()) {
                socket.emit('hit');
            } else {
                socket.emit('error', 'can not hit(no GameStatus.PlayerTurn)')
            }
        });

        socket.on('insurance', () => {

        });

        socket.on('even', () => {

        });

        socket.on('disconnect', () => {

        });

        socket.on('disconnect', () => {
            console.log("socket disconnected " + socket.id);
            const roomId = socket.id;
            if (roomId) {
                delete activeRooms[roomId];
                delete users[roomId];
                deleteSocket(socket.id);
            }
            console.log('deleted room, room count = ', Object.keys(activeRooms).length)
        });
    });
}

export function checkBalance(id: string, balance: number): boolean {
    if (balance > MAX_BET) {
        return false;
    }
    // Retrieve the user information from the database using the ID
    const user = getUserInfo(id);
    // Check if the user's balance is equal to or greater than the given balance
    if (user && user.balance >= balance) {
        return true;
    } else {
        return false;
    }
}

function getUserInfo(socketId: string): UserInfo {
    const user = users[socketId];
    if (user != null) {
        return user;
    } 
    return undefined;
}

function endGame(room: Room) {
    const earnScore = room.endGame();
    changeUserBalance(room.roomId, earnScore);
    console.log(`${earnScore > 0 ? '[won:' + earnScore + ']' : '[lose]'}: dealer-${room.dealer.getHandValue()}:${room.player.getHandValue(0)}|${room.player.getHandValue(1)}`);
    delete activeRooms[room.roomId];
}

function getUserBalance(socketId: string): number | 0 {
    const user = users[socketId];
    if (user) {
        return user.balance;
    } else {
        console.log('User not found:', socketId);
        return 0;
    }
}

export function changeUserBalance(socketId: string, balance: number): boolean {
    const user = users[socketId];
    if (user) {
        user.balance += balance;
        user.balance = user.balance < 0 ? 0 : user.balance;
        sendUserInfo(socketId);
        return true;
    } else {
        console.log('User not found:', socketId);
        return false;
    }
}

function getRoom(roomId: string): Room {
    // Return the Room object from the activeRooms object with the matching ID, or false if it doesn't exist
    return activeRooms[roomId] || undefined;
}

function getSocket(socketId: string): Socket {
    // Retrieve the socket object with the given socketId from the sockets object
    const socket = sockets[socketId];
    if (socket) {
        return socket;
    } else {
        console.log('Socket not found:', socketId);
        return undefined;
    }
}

function deleteSocket(socketId: string): boolean {
    // Check if the socket object with the given socketId exists in the sockets object
    if (sockets[socketId]) {
        // Delete the socket object with the given socketId from the sockets object
        delete sockets[socketId];
        return true;
    } else {
        console.log('Socket not found:', socketId);
        return false;
    }
}

function addSocket(socketId: string, socket: Socket): void {
    sockets[socketId] = socket;
}

function sendUserInfo(socketId: string): void {
    try {
        const user: UserInfo = getUserInfo(socketId);
        users[socketId] = user;
        if (user) {
            getSocket(socketId).emit('user-info', user);
            console.log('<< ', user);
        }
    } catch (error) {
        console.log('[index.sendUserInfo]', error);
    }
}



