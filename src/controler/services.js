const jwt = require("jsonwebtoken")
const fs = require("fs")
const crypto = require("crypto")
const axios = require('axios');
const qs = require('qs');
const { CookieJar } = require('tough-cookie');
const { wrapper } = require('axios-cookiejar-support');
const cheerio = require('cheerio');
const { connect } = require("http2");
const { connection } = require("../database/connection");


class Services {




    sha256(string, typeHash = "hex") { // base64 base64url binary hex
        try {
            let sha256 = crypto.createHash("sha256")
            return sha256.update(string).digest(typeHash)
        } catch (error) {
            console.log("err when sha256 : ", error);
            // this.appendError500("err when sha256 : ", error)
        }
    }


    encodeRSA(data) {

        try {

            try {
                const publicKey = fs.readFileSync('./src/public.pem', 'utf8');
                const bufferData = Buffer.from(data, 'utf8');
                const encryptedData = crypto.publicEncrypt(
                    {
                        key: publicKey,
                        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
                        oaepHash: 'sha256',
                    },
                    bufferData
                );
                return encryptedData.toString('base64');
            } catch (err) {
                throw new Error(err)
            }



        } catch (error) {
            console.log("encode RSA false" + error);
            return "encode RSA false" + error
        }


    }

    decodeRSA(encryptedData) {
        try {
            const privateKey = fs.readFileSync('./src/private.pem', 'utf8');

            try {
                // Giải mã dữ liệu sử dụng private key
                const decryptedData = crypto.privateDecrypt(
                    {
                        key: privateKey,
                        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING, // Sử dụng OAEP padding
                        oaepHash: 'sha256', // Đảm bảo sử dụng SHA-256 cho OAEP
                    },
                    Buffer.from(encryptedData, 'base64') // Convert dữ liệu mã hóa về Buffer
                );

                // Trả về dữ liệu đã giải mã
                return decryptedData.toString()
            } catch (err) {
                throw new Error(err)
            }



        } catch (error) {
            console.log("decode RSA false" + error);
            return "decode RSA false" + error
        }
    }

    encodeAES(data, key = process.env.KEY_AES, iv = process.env.IV_AES) {
        key = Buffer.from(key.padEnd(32, '0').slice(0, 32)); // Đảm bảo khóa 32 byte
        iv = Buffer.from(iv.padEnd(16, '0').slice(0, 16));
        const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
        let encrypted = cipher.update(data, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return encrypted;
    }

    decodeAES(encryptedData, key = process.env.KEY_AES, iv = process.env.IV_AES) {
        key = Buffer.from(key.padEnd(32, '0').slice(0, 32)); // Đảm bảo khóa 32 byte
        iv = Buffer.from(iv.padEnd(16, '0').slice(0, 16));
        const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
        let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }


    async getTokenUrlHaui(userNameHaui, passWordHaui) {
        try {

            let cookie1 = 'onehauii=';
            let cookie2 = 'TrxL4TX2mjqMQ1pKsA7y4inFGqk_=';
            const url = 'https://one.haui.edu.vn/loginapi/sv';

            // Dữ liệu POST
            const data = {
                '__VIEWSTATE': '/wEPDwUKLTU5NDQwMzI4Mw9kFgJmDxYCHgZhY3Rpb24FDC9sb2dpbmFwaS9zdmRkLUQPG6EM9UmIcR2BbVVHKFcrpMPq+5jLkhNeQ7F2IUo=',
                '__VIEWSTATEGENERATOR': 'C2EE9ABB',
                '__EVENTVALIDATION': '/wEdAAS5z3MTDMAIrXv9EuOCbfKV5nBuGc9m+5LxaP9y8LjuWbIOqgbU3uDqsEyVllp/jwNkBC2CEAipMbZPtKd79PAx5foOw1a7snIeIlNlqcQMoCcgW0aE55vl9Kb0YUvX8wg=',
                'ctl00$inpUserName': userNameHaui, // Thay bằng tên người dùng thực tế
                'ctl00$inpPassword': passWordHaui, // Thay bằng mật khẩu thực tế
                'ctl00$butLogin': 'Đăng nhập'
            };

            // Khởi tạo axios instance với cấu hình tùy chỉnh
            const axiosInstance = axios.create({
                headers: {
                    'Referer': 'https://one.haui.edu.vn/loginapi/sv',
                },
                maxRedirects: 0 // Ngăn chặn axios tự động làm theo chuyển hướng
            });

            // Gửi yêu cầu POST
            await axiosInstance.post(url, qs.stringify(data), {
                headers: {
                    'Cookie': '_ga=GA1.1.1318348922.1727412945; _ga_S8WJEW3D2H=GS1.1.1727412944.1.0.1727412946.0.0.0; TrxL4TX2mjqMQ1pKsA7y4inFGqk_=v1Th+GSQSDnT2; ASP.NET_SessionId=kx30vsngytypguotuscihujf; kVisit=f940684f-b4ff-4bd1-8ad9-9432e33033f9'
                }
            })
                .catch(error => {
                    if (error.response) {
                        let cks = error.response.headers["set-cookie"]
                        cookie1 += cks[1].split("=")[1].slice(0, cks[1].split("=")[1].indexOf(";"))
                        cookie2 += cks[2].split("=")[1].slice(0, cks[2].split("=")[1].indexOf(";"))


                    } else if (error.request) {
                        console.error('Error Request:', error.request);
                    } else {
                        console.error('Error Message:', error.message);
                    }
                });


            let token_url = ''

            // Gửi request với cookies
            await axios.get('https://one.haui.edu.vn/loginapi/sv', {
                headers: {
                    'Cookie': `${cookie1}; ${cookie2}`
                }
            })
                .then(response => {
                    let res = response.data
                    token_url = res.slice(res.indexOf("https"), res.indexOf("'</"))
                })
                .catch(error => {
                    console.error('Error:', error);
                });
            return token_url

        } catch (error) {
            console.log("get getTokenUrlHaui false" + error);
            return "get getTokenUrlHaui false" + error
        }


    }


    async capsolver(site_key, site_url, api_key = process.env.API_KEY_CAP_SOLVER) {
        const payload = {
            clientKey: api_key,
            task: {
                type: 'ReCaptchaV2TaskProxyLess',
                websiteKey: site_key,
                websiteURL: site_url
            }
        };

        try {
            const res = await axios.post("https://api.capsolver.com/createTask", payload);
            const task_id = res.data.taskId;

            if (!task_id) {
                console.error("Failed to create task:", res.data);
                return { state: false, captchaResponse: "" };
            }

            console.log("Created task with ID:", task_id);

            let attempts = 0;
            const maxAttempts = 20; // Giới hạn số lần thử
            const initialDelay = 3000; // Chờ 3 giây trước lần kiểm tra đầu tiên
            const retryDelay = 5000; // Chờ 5 giây giữa mỗi lần kiểm tra

            await new Promise(resolve => setTimeout(resolve, initialDelay));

            while (attempts < maxAttempts) {
                attempts++;
                const getResultPayload = { clientKey: api_key, taskId: task_id };
                const resp = await axios.post("https://api.capsolver.com/getTaskResult", getResultPayload);
                const status = resp.data.status;

                if (status === "ready") {
                    // console.log("Captcha solved:", resp.data.solution.gRecaptchaResponse);
                    return { state: true, captchaResponse: resp.data.solution.gRecaptchaResponse };
                }

                if (status === "failed" || resp.data.errorId) {
                    console.error("Solve failed! Response:", resp.data);
                    return { state: false, captchaResponse: "" };
                }

                console.log(`Waiting... Attempt ${attempts}/${maxAttempts}`);
                await new Promise(resolve => setTimeout(resolve, retryDelay));
            }

            console.error("Captcha solving timeout!");
            return { state: false, captchaResponse: "" };

        } catch (error) {
            console.error("Error:", error);
            return { state: false, captchaResponse: "" };
        }
    }




    async dataFomTokenUrl(token_url, userId) {
        try {
            if (!token_url.includes("token=")) {
                return {
                    state: false,
                    message: "Tài khoản mật khẩu haui chưa chính xác"
                }
            }
            const jar = new CookieJar();
            const axiosInstance = wrapper(
                axios.create({
                    jar,
                    withCredentials: true,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 9_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/9.0 Mobile/15E148 Safari/604.1'
                    }
                })
            );

            // Bước 1: Gửi yêu cầu đầu tiên với token
            const initialResponse = await axiosInstance.get(token_url)
                .then((res) => {
                    return res.data
                })

            const $ = cheerio.load(initialResponse);
            const viewState = $('#__VIEWSTATE').val();
            const viewStateGenerator = $('#__VIEWSTATEGENERATOR').val();
            const siteKey = $('.g-recaptcha').attr('data-sitekey');
            const eventValidation = $('#__EVENTVALIDATION').val();
            let token = token_url.split("?token=")[1]

            // console.log({ viewState, viewStateGenerator, siteKey, eventValidation, token_url });


            let user = await connection.excuteQuery(`select * from user where userId = ${userId}`)
                .then((data) => {
                    return data[0]
                })
                .catch((err) => {
                    throw new Error(err)
                })
            let balance = user?.balance;

            if (!balance) {
                return {
                    state: false,
                    message: "Số dư không hợp lệ!"
                }
            }
            if (balance < .5) {
                return {
                    state: false,
                    message: "Cần ít nhất 0.5 xu để thực hiện chức năng này!"
                }
            }


            let solver = await this.capsolver(siteKey, token_url).then(token => {
                return token
            });
            // console.log(solver);


            if (!solver.state) {
                return {
                    state: false,
                    message: "Gặp sự cố về mạng! Vui lòng đăng nhập lại.(Không trừ tiền)"//captcha fasle
                }
            }
            // console.log(token_url);



            const url = `https://sv.haui.edu.vn/sso?token=${token}`;

            // Các tham số cần gửi đi trong body
            const data1 = qs.stringify({
                __VIEWSTATE: viewState,
                __VIEWSTATEGENERATOR: viewStateGenerator,
                __EVENTVALIDATION: eventValidation,
                'g-recaptcha-response': solver.captchaResponse,
                ctl00$butLogin: "Xác thực"
            });
            // console.log(data1);


            // Cấu hình headers
            const headers = {
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                'Accept-Encoding': 'gzip, deflate, br, zstd',
                'Accept-Language': 'en-US,en;q=0.9',
                'Cache-Control': 'max-age=0',
                'Content-Type': 'application/x-www-form-urlencoded',
                'Origin': 'https://sv.haui.edu.vn',
                'Referer': token_url,
                'Sec-CH-UA': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
                'Sec-CH-UA-Mobile': '?0',
                'Sec-CH-UA-Platform': '"Windows"',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'same-origin',
                'Sec-Fetch-User': '?1',
                'Upgrade-Insecure-Requests': '1',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
            };

            // Bước 1: Gửi yêu cầu POST để đăng nhập
            const loginResponse = await axiosInstance.post(url, data1, { headers });
            console.log('Login successful.');

            // console.log(loginResponse);


            // Bước 2: Thực hiện chuyển hướng thủ công đến "/"
            const redirectResponse = await axiosInstance.get('https://sv.haui.edu.vn/');

            // console.log(redirectResponse.data);

            // Lấy cookie từ jar nếu cần sử dụng trong các bước tiếp theo
            const finalCookies = jar.toJSON();
            const Cookie = finalCookies.cookies
                .map(({ key, value }) => `${key}=${value}`)
                .join('; ');

            // Bước 3: Load HTML vào Cheerio để trích xuất dữ liệu
            const $1 = cheerio.load(redirectResponse.data);



            // Trích xuất tên người dùng từ `.user-name`
            let nameHaui = $1('.user-name').text().trim();
            nameHaui = nameHaui.slice(0, Math.floor(nameHaui.length / 2)); // Lấy nửa đầu của tên

            // Trích xuất kverify từ script
            const kverifyMatch = redirectResponse.data.match(/var kverify = '(.*?)';/);
            const kverify = kverifyMatch ? kverifyMatch[1] : '';

            // Bước 4: Cập nhật số dư trong cơ sở dữ liệu
            await connection
                .excuteQuery(`UPDATE user SET balance = balance - 0.5 WHERE userId = ${userId}`)
                .then(() => console.log(`Balance updated for userId ${userId}`))
                .catch((e) => console.error('Database update error:', e));



            // Bước 5: Trả về dữ liệu cuối cùng
            return { nameHaui, kverify, Cookie, state: true, message: 'ok' };

        } catch (error) {
            console.error('Có lỗi xảy ra:', error);
            return {
                state: false,
                message: "unknown error!"
            }
        }


    }


    async dataFomTokenUrl2(token_url) {
        try {
            if (!token_url.includes("token=")) {
                return {
                    state: false,
                    message: "Tài khoản mật khẩu haui chưa chính xác"
                }
            }
            const jar = new CookieJar();
            const axiosInstance = wrapper(
                axios.create({
                    jar,
                    withCredentials: true,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 9_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/9.0 Mobile/15E148 Safari/604.1'
                    }
                })
            );

            // Bước 1: Gửi yêu cầu đầu tiên với token
            const initialResponse = await axiosInstance.get(token_url)
                .then((res) => {
                    return res.data
                })

            const $ = cheerio.load(initialResponse);
            const viewState = $('#__VIEWSTATE').val();
            const viewStateGenerator = $('#__VIEWSTATEGENERATOR').val();
            const siteKey = $('.g-recaptcha').attr('data-sitekey');
            const eventValidation = $('#__EVENTVALIDATION').val();
            let token = token_url.split("?token=")[1]

            // console.log({ viewState, viewStateGenerator, siteKey, eventValidation, token_url });


            let solver = await this.capsolver(siteKey, token_url).then(token => {
                return token
            });
            // console.log(solver);


            if (!solver.state) {
                return {
                    state: false,
                    message: "Gặp sự cố về mạng! Vui lòng đăng nhập lại.(Không trừ tiền)"//captcha fasle
                }
            }
            // console.log(token_url);



            const url = `https://sv.haui.edu.vn/sso?token=${token}`;

            // Các tham số cần gửi đi trong body
            const data1 = qs.stringify({
                __VIEWSTATE: viewState,
                __VIEWSTATEGENERATOR: viewStateGenerator,
                __EVENTVALIDATION: eventValidation,
                'g-recaptcha-response': solver.captchaResponse,
                ctl00$butLogin: "Xác thực"
            });
            // console.log(data1);


            // Cấu hình headers
            const headers = {
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                'Accept-Encoding': 'gzip, deflate, br, zstd',
                'Accept-Language': 'en-US,en;q=0.9',
                'Cache-Control': 'max-age=0',
                'Content-Type': 'application/x-www-form-urlencoded',
                'Origin': 'https://sv.haui.edu.vn',
                'Referer': token_url,
                'Sec-CH-UA': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
                'Sec-CH-UA-Mobile': '?0',
                'Sec-CH-UA-Platform': '"Windows"',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'same-origin',
                'Sec-Fetch-User': '?1',
                'Upgrade-Insecure-Requests': '1',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
            };

            // Bước 1: Gửi yêu cầu POST để đăng nhập
            const loginResponse = await axiosInstance.post(url, data1, { headers });
            console.log('Login successful.');

            // console.log(loginResponse);


            // Bước 2: Thực hiện chuyển hướng thủ công đến "/"
            const redirectResponse = await axiosInstance.get('https://sv.haui.edu.vn/');

            // console.log(redirectResponse.data);

            // Lấy cookie từ jar nếu cần sử dụng trong các bước tiếp theo
            const finalCookies = jar.toJSON();
            const Cookie = finalCookies.cookies
                .map(({ key, value }) => `${key}=${value}`)
                .join('; ');

            // Bước 3: Load HTML vào Cheerio để trích xuất dữ liệu
            const $1 = cheerio.load(redirectResponse.data);



            // Trích xuất tên người dùng từ `.user-name`
            let nameHaui = $1('.user-name').text().trim();
            nameHaui = nameHaui.slice(0, Math.floor(nameHaui.length / 2)); // Lấy nửa đầu của tên

            // Trích xuất kverify từ script
            const kverifyMatch = redirectResponse.data.match(/var kverify = '(.*?)';/);
            const kverify = kverifyMatch ? kverifyMatch[1] : '';

            if (!nameHaui) {
                return {
                    state: false,
                }
            }

            // Bước 5: Trả về dữ liệu cuối cùng
            return { nameHaui, kverify, Cookie, state: true, message: 'ok' };

        } catch (error) {
            console.error('Có lỗi xảy ra:', error);
            return {
                state: false,
                message: "unknown error!"
            }
        }


    }


    async listOrdered(kverify, Cookie) {

        return new Promise(async (reslove, reject) => {
            const url = `https://sv.haui.edu.vn/ajax/register/action.htm?cmd=listorder&v=${kverify}`;
            const payload = qs.stringify({
                fid: "a"
            });

            // Cấu hình request
            const config = {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'Accept': 'application/json, text/javascript, */*; q=0.01',
                    'Accept-Encoding': 'gzip, deflate, br, zstd',
                    'Accept-Language': 'en,vi-VN;q=0.9,vi;q=0.8,fr-FR;q=0.7,fr;q=0.6,en-US;q=0.5',
                    'Cookie': Cookie,
                    'Origin': 'https://sv.haui.edu.vn',
                    'Referer': 'https://sv.haui.edu.vn/register/',
                    'Sec-CH-UA': '"Not)A;Brand";v="99", "Google Chrome";v="127", "Chromium";v="127"',
                    'Sec-CH-UA-Mobile': '?0',
                    'Sec-CH-UA-Platform': '"Windows"',
                    'Sec-Fetch-Dest': 'empty',
                    'Sec-Fetch-Mode': 'cors',
                    'Sec-Fetch-Site': 'same-origin',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            };

            await axios.post(url, payload, config)
                .then(response => {
                    reslove(response.data)
                })
                .catch(error => {
                    reject(error)
                });
        })


    }


    async removeClass(kverify, Cookie, classCode) {
        return new Promise(async (reslove, resject) => {
            const url = `https://sv.haui.edu.vn/ajax/register/action.htm?cmd=removeclass&v=${kverify}`;
            const payload = qs.stringify({
                class: classCode,
                ctdk: 863,
            });


            const config = {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'Accept': 'application/json, text/javascript, */*; q=0.01',
                    'Accept-Encoding': 'gzip, deflate, br, zstd',
                    'Accept-Language': 'en,vi-VN;q=0.9,vi;q=0.8,fr-FR;q=0.7,fr;q=0.6,en-US;q=0.5',
                    'Cookie': Cookie,
                    'Origin': 'https://sv.haui.edu.vn',
                    'Referer': 'https://sv.haui.edu.vn/register/',
                    'Sec-CH-UA': '"Not)A;Brand";v="99", "Google Chrome";v="127", "Chromium";v="127"',
                    'Sec-CH-UA-Mobile': '?0',
                    'Sec-CH-UA-Platform': '"Windows"',
                    'Sec-Fetch-Dest': 'empty',
                    'Sec-Fetch-Mode': 'cors',
                    'Sec-Fetch-Site': 'same-origin',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            };

            await axios.post(url, payload, config)
                .then(response => {
                    // console.log(response);

                    reslove(response.data)
                })
                .catch(error => {
                    console.error('Lỗi:', error);
                    resject(error)
                });
        })
    }


    async addClass(kverify, Cookie, classCode) {
        return new Promise(async (reslove, resject) => {
            const url = `https://sv.haui.edu.vn/ajax/register/action.htm?cmd=addclass&v=${kverify}`;
            const payload = qs.stringify({
                class: classCode,
                ctdk: 863,
            });


            const config = {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'Accept': 'application/json, text/javascript, */*; q=0.01',
                    'Accept-Encoding': 'gzip, deflate, br, zstd',
                    'Accept-Language': 'en,vi-VN;q=0.9,vi;q=0.8,fr-FR;q=0.7,fr;q=0.6,en-US;q=0.5',
                    'Cookie': Cookie,
                    'Origin': 'https://sv.haui.edu.vn',
                    'Referer': 'https://sv.haui.edu.vn/register/',
                    'Sec-CH-UA': '"Not)A;Brand";v="99", "Google Chrome";v="127", "Chromium";v="127"',
                    'Sec-CH-UA-Mobile': '?0',
                    'Sec-CH-UA-Platform': '"Windows"',
                    'Sec-Fetch-Dest': 'empty',
                    'Sec-Fetch-Mode': 'cors',
                    'Sec-Fetch-Site': 'same-origin',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            };

            await axios.post(url, payload, config)
                .then(response => {
                    // console.log(response.data);
                    reslove(response.data)

                })
                .catch(error => {
                    console.error('Lỗi:', error);
                    resject(error)
                });
        })

    }


    async getInforClass(kverify, Cookie, id) {

        return new Promise(async (reslove, reject) => {



            let captchaResponse = ""


            const url = `https://sv.haui.edu.vn/ajax/register/action.htm?cmd=classbymodulesid&v=${kverify}`;


            await this.capsolver("6LdPnAUaAAAAABC-5dwvcjM0_RPdC9s3ldQlHmd8", url, "CAP-98FD5A795C8B28185FA47ECBD14D7E70").then(result => {
                if (result.state) {
                    captchaResponse = result.captchaResponse;
                    // console.log("Solved Captcha Token:", result.captchaResponse);
                } else {
                    console.log("Failed to solve Captcha!");
                }
            });

            const payload = qs.stringify({
                fid: id, "g-recaptcha-response": captchaResponse
            });

            const config = {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'Accept': 'application/json, text/javascript, */*; q=0.01',
                    'Accept-Encoding': 'gzip, deflate, br, zstd',
                    'Accept-Language': 'en,vi-VN;q=0.9,vi;q=0.8,fr-FR;q=0.7,fr;q=0.6,en-US;q=0.5',
                    'Cookie': Cookie,
                    'Origin': 'https://sv.haui.edu.vn',
                    'Referer': 'https://sv.haui.edu.vn/register/',
                    'Sec-CH-UA': '"Not)A;Brand";v="99", "Google Chrome";v="127", "Chromium";v="127"',
                    'Sec-CH-UA-Mobile': '?0',
                    'Sec-CH-UA-Platform': '"Windows"',
                    'Sec-Fetch-Dest': 'empty',
                    'Sec-Fetch-Mode': 'cors',
                    'Sec-Fetch-Site': 'same-origin',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            };



            // Thực hiện request POST
            await axios.post(url, payload, config)
                .then(response => {

                    if (response.data.err != 0) {
                        reject(response.data)
                    }

                    reslove(response.data)
                })
                .catch(error => {
                    reject(error)
                });
        })
    }


    //transaction


    getInforFromTotal(toTal, arrValue0) {
        let arrValue = arrValue0.map((e) => { return e.toTal })
        if (Number(toTal) == NaN || toTal < 0) {
            return {
                curentLevel: -1,
                curBonus: 0,
            }
        }
        for (let i = 0; i < arrValue.length - 1; i++) {
            if (toTal >= arrValue[i] && toTal < arrValue[i + 1]) {
                return {
                    curentLevel: i,
                    curBonus: arrValue0[i].curBonus,
                }
            }
        }
        return {
            curentLevel: arrValue.length,
            curBonus: 1,
        }

    }
    formatDate(date) {
        date = new Date(date)
        let day = String(date.getDate()).padStart(2, '0');
        let month = String(date.getMonth() + 1).padStart(2, '0'); // Tháng bắt đầu từ 0
        let year = date.getFullYear();
        let hours = String(date.getHours()).padStart(2, '0');
        let minutes = String(date.getMinutes()).padStart(2, '0');
        let seconds = String(date.getSeconds()).padStart(2, '0');

        return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
    }

    convertStringToDateNow(s) {
        // Chuyển đổi chuỗi sang định dạng Date
        let dateParts = s.split(' ')[0].split('-');
        let timeParts = s.split(' ')[1].split(':');

        let date = new Date(Date.UTC(dateParts[2], dateParts[1] - 1, dateParts[0], timeParts[0], timeParts[1], timeParts[2]));

        // Việt Nam là UTC+7
        let vietnamTime = new Date(date.getTime() + (7 * 60 * 60 * 1000));

        // Lấy giá trị theo mili giây
        let timestamp = vietnamTime.getTime();
        return timestamp
    }


    async runningWaiter(time, userNameHaui, classCode) {
        let runningTimeMap = {
            1: 1000 * 60 * 5,  // 5 phút
            2: 1000 * 60 * 15, // 15 phút
            3: 1000 * 60 * 30,  // 30 phút 
            4: 1000 * 60 * 60  // 60 phút 
        };

        let runningTime = runningTimeMap[time] || 10000;

        if (!globalThis.waiterQueue?.has(userNameHaui)) {
            console.log(`User ${userNameHaui} không tồn tại trong hàng đợi.`);
            return;
        }

        let runningObj = globalThis.waiterQueue.get(userNameHaui);
        runningObj.lastTimeUse = Date.now()

        try {
            let endRun; // Khai báo trước để tránh lỗi khi clearTimeout
            let running = setInterval(async () => {
                try {
                    let submit = await this.addClass(runningObj?.kverify, runningObj?.Cookie, classCode);
                    console.log(`${runningObj.nameHaui} ---- ${classCode}`, submit);

                    // Nếu không có lỗi, dừng vòng lặp và clear timeout
                    if (!submit?.err) {
                        clearInterval(running);
                        if (endRun) clearTimeout(endRun); // Kiểm tra nếu endRun tồn tại trước khi clear
                        console.log(`Dừng chạy sớm cho user ${runningObj.nameHaui}, lớp ${classCode}.`);
                    }
                } catch (e) {
                    console.log("Lỗi khi gọi addClass:", e);
                }
            }, 2000);

            // Hủy interval sau thời gian tối đa
            try {
                endRun = setTimeout(() => {
                    clearInterval(running);
                    console.log(`Hết thời gian chạy cho user ${userNameHaui}, lớp ${classCode}.`);
                }, runningTime);
            } catch (error) {
                console.log("Đã clear trước đó!");
            }

        } catch (error) {
            console.log("Lỗi khi chạy runningWaiter:", error);
        }
    }



    async addWaiterToQueue(userNameHaui, passwordHaui) {
        try {
            if (!globalThis.waiterQueue) {
                globalThis.waiterQueue = new Map();
            }

            if (!globalThis.waiterQueue.has(userNameHaui)) {
                let stop = false, Cookie, kverify, nameHaui;
                let attempts = 0, maxAttempts = 10;

                while (!stop && attempts < maxAttempts) {
                    attempts++;
                    let token_url = await this.getTokenUrlHaui(userNameHaui, passwordHaui);
                    let dataLoginHaui = await this.dataFomTokenUrl2(token_url);

                    stop = dataLoginHaui?.state || false;
                    Cookie = dataLoginHaui?.Cookie || "zzz";
                    kverify = dataLoginHaui?.kverify || "zzz";
                    nameHaui = dataLoginHaui?.nameHaui || "nameHaui";
                }

                if (attempts === maxAttempts) {
                    console.log("Exceeded max login attempts.");
                }

                globalThis.waiterQueue.set(userNameHaui, {
                    nameHaui,
                    passwordHaui,
                    Cookie,
                    kverify,
                    lastTimeUse: Date.now()
                });
            }
            console.log("time : " + Date.now() + " queue : ", globalThis.waiterQueue);

        } catch (error) {
            console.log("Lỗi khi thêm vào hàng đợi:", error);
        }
    }


    async refreshWaiterQueue(waiterQueue) {
        try {
            for (let [userNameHaui, waiterObj] of waiterQueue) {

                if ((Date.now() - waiterObj.lastTimeUse) > 1000 * 60 * 30) {
                    waiterQueue.delete(userNameHaui)
                    continue
                }

                let pingData

                await this.listOrdered(waiterObj.kverify, waiterObj.Cookie)
                    .then((res) => {
                        return pingData = res
                    })
                    .catch(() => {
                        console.log("cookie hết hạn!!!");
                    })

                if (typeof (pingData) == "object") {
                    continue
                }

                let stop = false

                while (!stop) {
                    let token_url = await this.getTokenUrlHaui(userNameHaui, waiterObj.passWordHaui);

                    let dataLoginHaui = await this.dataFomTokenUrl2(token_url);

                    // console.log(dataLoginHaui);

                    stop = dataLoginHaui?.state || false

                    if (stop) {
                        waiterObj.Cookie = dataLoginHaui?.Cookie || "zzz";
                        waiterObj.kverify = dataLoginHaui?.kverify || "zzz";
                    }
                }

            }
        } catch (error) {
            console.error(error);
        }
    }



    async sleep(ms) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve()
            }, ms);
        })

    }


}




module.exports = Services