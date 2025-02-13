require('dotenv').config({ path: "./src/.env" }); // path from pakage.json (when run command npm start)
const express = require("express");
const { connection } = require("./database/connection.js");
const configServer = require("./config/configServer.js");
const api = require("./api/api.js");
const axios = require("axios")
const Services = require("./controler/services.js")

const services = new Services()


//global
globalThis.waiterQueue = new Map()

globalThis.SpamerQueue = new Map()

globalThis.countOfSpamer = 0

globalThis.countOfWaiter = 0

globalThis.classesOfModuleId = new Map()

globalThis.moduleIdNotFound = new Map()



//refesh queue waiter

setInterval(
    async () => {
        await services.refreshWaiterQueue(globalThis.SpamerQueue)
    }, 1000 * 60 * 20)


setInterval(
    async () => {
        await services.refreshWaiterQueue(globalThis.waiterQueue)
    }, 1000 * 60 * 20)

setInterval(
    async () => {
        await services.refreshModuleIdNotFound(globalThis.moduleIdNotFound)
    }, 1000 * 60 * 20)


//init app
const app = express();


//config server
configServer(app);

//skip cerificate ssl
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'


//connect database
connection.connect()
    .then((res) => {
        // console.log("connected to database")
        console.log(res);
    })
    .catch((e) => {
        console.log(e)
    });




//use router
app.use("/api", api);


//ping server
setInterval(async () => {
    try {
        const response1 = await axios.get(process.env.OTHER_WAITER_URL + "/ping");
        console.log("mainbackend response:", response1.data);
        const response = await axios.get(process.env.MAIN_BACKEND_URL + "/ping");
        console.log("mainbackend response:", response.data);
    } catch (error) {
        console.error("Error fetching from backend:", error.message);
    }
}, Math.floor(Math.random() * 300000) + 100000);





//run server
const PORT = Number(process.env.PORT) || 4444;

app.listen(PORT, () => {
    console.log("backend is running on port", PORT);
})