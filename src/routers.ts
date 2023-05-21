import express from 'express'
import { Request, Response } from "express";
import { getGameInfo, myInfo } from './controllers/client';
import { totalHistory, totalUsers } from './controllers/admin';

const router = express.Router();

// admin router
router.get('/get-total-history', totalHistory);
router.get('/get-total-users', totalUsers);

// client router
router.post('/my-info', myInfo);
router.get('/test', async (req: Request, res: Response) => {
    res.send('Hello world!')
})

export default router