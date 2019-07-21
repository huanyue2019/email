//引入superagent包，用于服务器发送http请求；
const request = require('superagent');
//导入cheerio包,把字符串解析成html。
const cheerio = require('cheerio');
//导入模板引擎，
const template = require('art-template');
//导入path模块处理路径
const path = require('path');
//导入Nodemailer包
const nodemailer = require("nodemailer");
//导入定时模块包
var schedule = require('node-schedule');


//计算认识的天数
function getDayData() {
    return new Promise((resolve, reject) => {
        //现在的时间
        const today = new Date();
        //认识的时间
        const meet = new Date('2019-7-20');
        //计算相识到今天的天数
        const count = Math.ceil((today - meet) / 1000 / 60 / 60 / 24);
        //今天日期格式化
        const format = today.getFullYear() + " / " + (today.getMonth() + 1) + " / " + today.getDate();
        const dayData = {
                count,
                format
            }
            // console.log(dayData);
        resolve(dayData);
    })

}
// getDayData();
//请求墨迹天气的数据
function getMojiData() {

    return new Promise((resolve, reject) => {
        request.get('https://tianqi.moji.com/weather/china/henan/xinyang').end((err, res) => {
            if (err) return console.log("数据请求失败~");
            // console.log(res.text);
            const $ = cheerio.load(res.text);
            //图标
            const icon = $('.wea_weather span img').attr('src');
            //天气
            const weather = $('.wea_weather b ').text();
            //温度
            const temperature = $('.wea_weather em').text();
            console.log(temperature);
            //提示
            const tips = $('.wea_tips em').text();

            const MojiData = {
                    icon,
                    weather,
                    temperature,
                    tips
                }
                // console.log(mojiData);
            resolve(MojiData);
        })
    })
}
// getMojiData();
//请求one页面抓取数据
function getOneData() {
    return new Promise((resolve, reject) => {
        request.get('http://wufazhuce.com/').end((err, res) => {
            if (err) return console.log("数据请求失败~");
            const $ = cheerio.load(res.text);
            // 爬取图片
            const img = $('.carousel-inner>.item>a>img').eq(2).attr('src');
            //爬取文字
            const text = $('.fp-one .fp-one-cita-wrapper .fp-one-cita a').eq(2).text();

            const OneData = {
                    img,
                    text
                }
                // console.log(OneData);
            resolve(OneData);
        })
    })
}
// getOneData();

// 通过模板引擎替换html的数据
async function renderTemplate() {
    //获取 日期
    const dayData = await getDayData();
    //获取 墨迹天气数据
    const MojiData = await getMojiData();
    //获取one网页数据
    const OneData = await getOneData();

    // console.log(dayData);
    // console.log(MojiData);
    // console.log(OneData);
    //当所有数据都获取成功的时候，进行模板引擎数据的替换
    return new Promise((resolve, reject) => {
        const html = template(path.join(__dirname, "./email.html"), {
            dayData,
            MojiData,
            OneData
        });
        resolve(html);
    })


}
// renderTemplate();
async function sendNodeMail() {
    const html = await renderTemplate();
    // const html = "<h1>哈哈哈啊</h1>";
    console.log(html);

    // create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
        host: "smtp.163.com",
        port: 465,
        secure: true, // true for 465, false for other ports
        auth: {
            user: "xuliang_yean@163.com", // generated ethereal user用户名
            pass: "Huanyue2019" // generated ethereal password
        }
    });

    // send mail with defined transport object
    let mailOptions = {
        from: '"缓月" <xuliang_yean@163.com>', // sender address发件人邮箱
        to: "xuliang_yean@163.com", // list of receivers收件人列表
        subject: "测试邮件~", // Subject line
        html: html // html body
    };

    transporter.sendMail(mailOptions, (error, info = {}) => {
        if (error) {
            console.log(error);
            sendNodeMail(); //再次发送
        }
        console.log("邮件发送成功", info.messageId);
        console.log("静等下一次发送~");
    })
}
var j = schedule.scheduleJob("******", function() {
    sendNodeMail();
    console.log("发送邮件成功~");
})