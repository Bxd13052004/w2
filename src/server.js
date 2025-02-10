require('dotenv').config({ path: "./src/.env" }); // path from pakage.json (when run command npm start)
const express = require("express");
const { connection } = require("./database/connection.js");
const configServer = require("./config/configServer.js");
const api = require("./api/api.js");
const axios = require("axios")
const Services = require("./controler/services.js")

const services = new Services()




//global
globalThis.queueScanUserId = []
globalThis.queueRefundUserId = []
globalThis.Cookie = "ASP.NET_SessionId=xwddn02tofe03enla2mzqbhk; __Host-UqZBpD3n=v1Uh+GSQ__YGU; onehauisv=791AC6E4A5D148AAB0963093251F269B8C38C9B14FDE82AA38F2141A89F0B3FC81480160DE26CA4BC25F237D5BE3A65407B8DC019D2BE2376C3F507ADE3F02FBDAC5666FDCDAC1654F00583AB6469805FF8E1AF9D1D65D0323291AA13CD854630804ECA698362999C1878497245D7387C0C98B85B466152338F9D06F6D233089278D4262AD88A4770F8606A269440077F95FF3CB0AB1F19E7D6FB936826D14288AB6D742C79858296526CE1B2147B0512538BB038990D62384EDB4360905070D10A08AFF74CCE8E792D20611C32AB9322B6F73BA6FDED7932B6B67173BCC0EBA21E456E537B6ADAE85D3AE92D37AF20A6E724D14DA6FDBE757EEBC0089182E9F66CCB008A5A1003408ED0185AAFC7E3079104131591F2862F0A799DEDA54AB789B6940590A6C7A974283520AA3356709DCFB96DCDE977C4260DACBA8BF00347435F189F699E4DE8A6B4A78DCE05824EA1E8094E924FFE3B79CD54BB3F6BFD543EAD020D540784D58DC79E535E76C625E; kVisit=439001b1-2669-458b-961f-1863f24a5783"
globalThis.kverify = "7567423626A9B656928EB35AEBAC55DE"
globalThis.userNameHaui = "2021608619"
globalThis.passWordHaui = "Anhlam123@"
globalThis.waiterQueue = new Map()
globalThis.countOfWaiter = 0


//refesh queue waiter


setInterval(
    async () => {
        await services.refreshWaiterQueue(globalThis.waiterQueue)
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
        console.log("mainbackend response:", response.data);
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