import { Request, Response } from "express";
import Axios from 'axios';

import { DHistories, getBettingAmounts } from "../model";
import { setlog } from "../helper";
import * as Models from '../model';

const server_url = 'http://annie.ihk.vipnps.vip';

export const getGameInfo = async (req: Request, res: Response) => {
    try {
        const data = await getBettingAmounts();
        res.json({ status: true, data });
    } catch (error) {
        setlog("getGameInfo", error);
        res.send({ status: false });
    }
}

export const getUserInfoFromService = async (token: string) => {
    try {
        const resData = await Axios.post(`${server_url}/iGaming/igaming/getUserToken`, {
            token: token
        })
        const _data = resData.data.data;

        const resData1 = await Axios.post(`${server_url}/iGaming/igaming/debit`, {
            userId: _data.userId,
            token: _data.userToken,
        }, {
            headers: {
                'Content-Type': 'application/json',
                'packageId': _data.packageId,
                'gamecode': 'Penalty'
            }
        })

        const userData = await Models.DUsers.findOne({ "userId": _data.userId });
        if (!userData) {
            Models.addUser(_data.userName, _data.userId, resData1.data.data.balance, _data.avatar)
        } else {
            Models.updateUserBalance(_data.userId, Number(resData1.data.data.balance));
        }

        return {
            status: true,
            data: {
                name: _data.userName,
                userId: _data.userId,
                balance: resData1.data.data.balance,
            }
        };

    } catch (err) {
        return { status: false, data: {} };
    }
}

export const myInfo = async (req: Request, res: Response) => {
    try {
        let { name } = req.body as { name: string };
        name = String(name).trim();

        if (name === '') {
            return res.status(404).send("invalid parameters");
        }
        const data = await DHistories.find({ name }).sort({ date: -1 }).limit(20).toArray();
        res.json({ status: true, data });
    } catch (error) {
        setlog('myInfo', error);
        res.json({ status: false });
    }
}