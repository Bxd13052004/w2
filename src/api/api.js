const api = require("express").Router()
const Controler = require("../controler/controler.js")
const MiddleWare = require("../middleware/middleware.js")

//create a instance
let controler = new Controler()
let middleware = new MiddleWare()

//test api
api.get("/ping", (req, res) => {
    res.cookie("ping", "ok", {
        httpOnly: true
    });

    res.status(200).json({
        message: "ok from backend!"
    });
})



//use middleware

//check ip black list
// api.use("*", middleware.checkIpAdress)



// middle ware for /auth api
api.use("/auth", middleware.checkInforAccessToken)



//auth_api
api.post("/getCountOfWaiter", controler.getCountOfWaiter) // login haui sv

api.post("/runningWaiter", controler.runningWaiter)



module.exports = api