const { default: axios } = require('axios')
const { connection } = require('../database/connection.js')
const Services = require('./services.js')
const bcrypt = require("bcryptjs")
const fs = require("fs")
const { error } = require('console')

const cheerio = require('cheerio');

const services = new Services()


class Controler {

    constructor() {

    }

    async pingHaui(req, res) {

        try {

            //get decoded accesstoken
            let decodeAccessToken = req.decodeAccessToken;
            let userId = decodeAccessToken.userId; //get userId

            let enKC = req?.cookies?.enKC;

            if (!enKC) {
                res.status(400).json({
                    message: "can't find your Haui account , you should login Haui account again!"
                })
                return
            }

            let data = {}
            try {
                data = JSON.parse(services.decodeAES(enKC))
            } catch (error) {
                res.status(400).json({
                    message: "data not valid!"
                })
                return
            }

            let { Cookie, kverify } = data


            // console.log(Cookie);

            try {
                let data1 = await axios.get(`https://sv.haui.edu.vn/training/viewcourseindustry2/xem-chi-tiet-hoc-phan.htm?id=7335`, {
                    headers: {
                        'Cookie': Cookie
                    }
                });

                data1 = data1.data;

                // Tải nội dung HTML vào Cheerio
                const $ = cheerio.load(data1);

                // console.log(data1);


                // Lấy nội dung của phần tử theo selector
                const content = $('#frmMain > div.panel.panel-default.panel-border-color.panel-border-color-primary > div.k-panel-tl > div > div > div > span').text().trim();

                if (!content) {
                    throw new Error("Chưa đăng nhập")
                }


            } catch (error) {
                console.log(error);

                return res.status(400).json({
                    message: "Chưa login Haui"
                })
            }




            return res.status(200).json({
                message: "ok",
                nameHaui: data?.nameHaui,
                err: false
            })



        } catch (error) {
            console.log(error);

            res.status(500).json({
                message: "have wrong!!"
            })
            return
        }

    }


    async getWaiterOfUserId(req, res) {

        try {
            let decodeAccessToken = req.decodeAccessToken;
            let userId = decodeAccessToken.userId; //get userId

            let waiters = await connection.excuteQuery(`select * from waiter where userId = ${userId}`)
                .then((res) => {
                    return res
                })
                .catch((e) => {
                    console.log(e);
                })

            return res.status(200).json({
                message: "ok",
                waiters
            })

        } catch (error) {
            console.log("err when getWaiterOfUserId : ", error);
            res.status(500).json({
                message: "have wrong!!"
            })
        }
    }


    async deleteWaiter(req, res) {

        try {
            let decodeAccessToken = req.decodeAccessToken;
            let userId = decodeAccessToken.userId; //get userId

            let { waiterId } = req.body

            if (!waiterId) {
                res.status(400).json({
                    message: "missing data!"
                })
                return
            }

            await connection.excuteQuery(`delete from waiter where waiterId = ${waiterId}`)
                .catch((e) => {
                    console.log(e);
                })

            return res.status(200).json({
                message: "ok"
            })

        } catch (error) {
            console.log("err when deleteWaiter : ", error);
            res.status(500).json({
                message: "have wrong!!"
            })
        }



    }


    async addNewWaiter(req, res) {

        try {

            let decodeAccessToken = req.decodeAccessToken;
            let userId = decodeAccessToken.userId; //get userId


            let { userNameHaui, passwordHaui, classCode, time, note } = req.body

            // console.log({ userNameHaui, passwordHaui, classCode, time });


            if (!userNameHaui || !passwordHaui || !classCode || !time) {
                res.status(400).json({
                    message: "missing data!"
                })
                return
            }

            await connection.excuteQuery(`insert into waiter (userNameHaui, passwordHaui, classCode, timeWait,userId,note ) values ('${userNameHaui}' , '${passwordHaui}' , '${classCode}' , ${Number(time)} , '${userId}' , '${note}')`)
                .catch((e) => {
                    console.log(e);
                })

            return res.status(200).json({
                message: "add new waiter success!"
            })



        } catch (error) {

            console.log("error when addNewWaiter : ", error);
            return res.status(500).json({
                message: "have wrong!!"
            })
        }

    }

    async runningWaiter(req, res) {

        try {
            let { waiterId, userId } = req.body
            if (!waiterId || !userId) {
                return res.status(400).json({
                    message: "missing data!"
                })
            }


            let waiter = await connection.excuteQuery(`select * from waiter where waiterId = ${waiterId}`)
                .then((res) => {
                    return res[0]
                })
                .catch((e) => {
                    console.log(e);
                })

            if (!waiter) {
                return res.status(400).json({
                    message: "not found waiter!"
                })
            }

            let { userNameHaui, passWordHaui, classCode, timeWait, note } = waiter;

            let token_url = await services.getTokenUrlHaui(userNameHaui, passWordHaui);

            // console.log({ userNameHaui, passWordHaui, classCode, timeWait, note });

            // console.log(waiter);

            // console.log(token_url);


            if (!token_url.includes("token=")) {
                return res.status(400).json({
                    message: "Tài khoản mật khẩu haui chưa chính xác"
                })
            }

            let costMap = { 1: 15, 2: 30, 3: 50, 4: 100 };
            let cost = costMap[timeWait] || 10;


            let user = await connection.excuteQuery(`select * from user where userId = ${userId}`)
                .then((res) => {
                    return res[0]
                })
                .catch((e) => {
                    console.log(e);
                })

            if (user?.balance < cost || !user?.balance) {
                return res.status(400).json({
                    message: "balance not enought"
                })
            }

            await connection.excuteQuery(`delete from waiter where waiterId = ${waiterId}`)
                .catch((e) => {
                    console.log(e);
                })

            res.status(200).json({
                message: "start running!"
            })

            await connection
                .excuteQuery(`UPDATE user SET balance = balance - ${cost} WHERE userId = ${userId}`)
                .then(() => console.log(`Balance updated for userId ${userId}`))
                .catch((e) => console.error('Database update error:', e));

            globalThis.countOfWaiter++

            await services.addWaiterToQueue(userNameHaui, passWordHaui)


            await services.runningWaiter(timeWait, userNameHaui, classCode)

        } catch (error) {
            console.log("err when runningWaiter : ", error);
            return res.status(500).json({
                message: "have wrong!!"
            })
        }
    }

    getCountOfWaiter(req, res) {
        return res.status(200).json({
            message: "ok",
            countOfWaiter: globalThis.countOfWaiter
        })

    }

}


module.exports = Controler