'use strict';
var express = require('express');
var timeout = require('connect-timeout');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var multer = require('multer');
var dateutils = require('date-utils');

var todos = require('./routes/todos');
var login = require('./routes/login');
var register = require('./routes/register');
var promotiondetail = require('./routes/promotiondetail');
var usersmanagement = require('./routes/usersmanagement');
var ticketinfo = require('./routes/ticketinfo');
var ticketlist = require('./routes/ticketlist');
var tickethistory = require('./routes/tickethistory');


var AV = require('leanengine');

var app = express();

// 设置模板引擎
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.static('css'));//JQueryMobile css
app.use(express.static('js'));//JQueryMobile javascript

// 设置默认超时时间
app.use(timeout('15s'));

// 加载云函数定义
require('./cloud');
// 加载云引擎中间件
app.use(AV.express());

// 加载 cookieSession 以支持 AV.User 的会话状态
app.use(AV.Cloud.CookieSession({ secret: '05XgTktKPMkU', maxAge: 3600000, fetchUser: true }));

// 强制使用 https
app.enable('trust proxy');
app.use(AV.Cloud.HttpsRedirect());

app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(multer());


// 加载 cookieSession 以支持 AV.User 的会话状态
//app.use(AV.Cloud.CookieSession({ secret: 'cloud secret', maxAge: 3600000, fetchUser: true }));

/*
        * 功能: 为一位数的正整数前面添加0，如果是可以转成非NaN数字的字符串也可以实现
        * 参数: 参数表示准备再前面添加0的数字或可以转换成数字的字符串
        * 返回值: 如果符合条件，返回添加0后的字条串类型，否则返回自身的字符串
        */

function addZero(num) {
    if (Number(num).toString() != 'NaN' && num >= 0 && num < 10) {
        return '0' + Math.floor(num);
    } else {
        return num.toString();
    }
};
var date = new Date();
var ActivationCodeObject = AV.Object.extend('ActivationCode');

app.get('/', function (req, res) {
    res.locals.currentTime = new Date();
    res.locals.masonryContentId = date.getFullYear()
                        + addZero(date.getMonth() + 1)
                        + addZero(date.getDay())
                        + addZero(date.getHours())
                        + addZero(date.getMinutes())
                        + addZero(date.getSeconds())
                        + addZero((parseInt(date.getMilliseconds() / 10)));



    //Get all ticket info
    var tickets = null;
    var arr = [];
    var ownTickets = [];
    var isLogin = false;
    var query = new AV.Query('TicketInfo');
    // 查询 TicketStatus 是true的券
    query.equalTo('TicketStatus', true);
    query.find().then(function (results) {
        tickets = results;
        console.log('results.length:' + results.length);
        arr = [results.length];
        for (var i = 0; i < tickets.length; i++) {
            console.log('tickets[i].id:' + tickets[i].id);
            console.log('tickets[i].get(\'TicketImage\').url():' + tickets[i].get('TicketImage').url());
            arr[i] = { 'id': tickets[i].id, 'imageUrl': tickets[i].get('TicketImage').url() };
            console.log('arr[' + i + ']:' + arr[i]);
        }

        if (req.currentUser) {
            isLogin = true;
            console.log('isLogin:' + isLogin);

            ////已订购的优惠券码
            console.log("next is user");
            var curUser = req.currentUser;
            console.log('curUser:' + curUser);

            var currentUserActivationCodesRelation = curUser.relation('ActivationCodes');
            console.log('currentUserActivationCodesRelation:' + currentUserActivationCodesRelation);
            var currentUserActivationCodesQuery = currentUserActivationCodesRelation.query();

            currentUserActivationCodesQuery.find().then(function (resultAllActivationCodes) {
                // results 是一个 AV.Object 的数组，它包含所有当前 user 的 ActivationCode
                for (var i = 0; i < resultAllActivationCodes.length; i++) {
                    var acId = resultAllActivationCodes[i].Id;
                    ownTickets[i] = { 'id': acId };
                    console.log('ownTickets[i]:' + ownTickets[i]);
                }
            }, function (error) {
            });

        }
        
        console.log('ownTickets[0]:' + ownTickets[0]);
        res.render('index', { userTickets: arr, ownTickets: ownTickets, isLogin: isLogin });
    }, function (error) { });
    

});

app.post('/', function (req, res) {
    var ticketId = req.query.ticketId;
    console.log('ticketId:' + ticketId);

    var query = new AV.Query('TicketInfo');
    query.get(ticketId).then(function (ticketInfoData) {
        // 成功获得实例
        // ticketInfoData 就是 id 为 xxxxxxx 的 TicketInfo 对象实例
        var numberOfTimes = ticketInfoData.get('NumberOfTimes');
        var ticketStartDate = ticketInfoData.get('TicketStartDate');
        var ticketEndDate = ticketInfoData.get('TicketEndDate');
        var ticketDuration = ticketInfoData.get('TicketDuration');
        console.log('numberOfTimes:' + numberOfTimes);
        console.log('ticketDuration:' + ticketDuration);
        if ((ticketEndDate == null || ticketEndDate == 'undefined') && ticketDuration != null) {
            console.log('(ticketEndDate == null || ticketEndDate == \'\') && ticketDuration != null');
            var myDate = new Date();
            ticketStartDate = myDate.clone();
            myDate.add({
                milliseconds: 0,
                minutes: 0,
                hours: 0,
                seconds: 0,
                days: ticketDuration,
                weeks: 0,
                months: 0,
                years: 0
            });
            ticketEndDate = myDate;
        }
        console.log('ticketStartDate:' + ticketStartDate);
        console.log('ticketEndDate:' + ticketEndDate);


        var rNum = Math.floor(Math.random() * 1000000000000);
        console.log('rNum:' + rNum);
        //store the activationcode
        var activationCodeObject = new ActivationCodeObject();
        activationCodeObject.set('CodeStatus', true);
        activationCodeObject.set('ResidueTimes', numberOfTimes);
        activationCodeObject.set('ActivationCodeContent', '' + rNum);
        activationCodeObject.set('ActivationStartDate', ticketStartDate);
        activationCodeObject.set('ActivationEndDate', ticketEndDate);
        activationCodeObject.set('TicketInfoId', ticketId);

        activationCodeObject.save().then(function (activationCodeObject) {
            console.log('activationCodeObject save successfully.');
            // 成功
            var ticketInfoRelation = ticketInfoData.relation('ActivationCodes');
            ticketInfoRelation.add(activationCodeObject);
            ticketInfoData.save();

            var currentUser = AV.User.current();
            var cellNumber = currentUser.getUsername();
            console.log('cellNumber:' + cellNumber);
            try {
                var currentUserRelation = currentUser.relation('ActivationCodes');
                currentUserRelation.add(activationCodeObject);
                currentUser.save().then(function (data) {
                    console.log('currentUser save successfully.');
                    //send sms
                    AV.Cloud.requestSmsCode({
                        mobilePhoneNumber: cellNumber,
                        template: '优惠券码',
                        ticket: rNum,
                        date: ticketEndDate.toFormat('YYYY-MM-DD')
                    }).then(function () {
                        //发送成功
                        console.log('sms was sent successfully.');
                    }, function (err) {
                        //发送失败
                        console.log('sms was sent failed.(' + err.code + ':' + err.message + ')');
                    });
                }, function (error) {
                    console.log('save currentUser failed.(' + error.code + ':' + error.message + ')');
                });
            } catch (ex) {
                console.log('Exception:' + err.code + ':' + err.message);
            }

        }, function (error) {
            // save activationCodeObject 失败
            console.log('save activationCodeObject failed.(' + error.code + ':' + error.message + ')');
        });
    }, function (error) {
        // 失败了
        console.log('query ticketinfo failed.(' + error.code + ':' + error.message + ')');
    });



    res.send('1');



}, function (error) { });


// 可以将一类的路由单独保存在一个文件中
app.use('/todos', todos);
app.use('/login', login);
app.use('/register', register);
app.use('/promotiondetail', promotiondetail);
app.use('/usersmanagement', usersmanagement);
app.use('/ticketinfo', ticketinfo);
app.use('/ticketlist', ticketlist);
app.use('/tickethistory', tickethistory);

app.use(function (req, res, next) {
    // 如果任何一个路由都没有返回响应，则抛出一个 404 异常给后续的异常处理器
    if (!res.headersSent) {
        var err = new Error('Not Found');
        err.status = 404;
        next(err);
    }
});

// error handlers
app.use(function (err, req, res, next) { // jshint ignore:line
    var statusCode = err.status || 500;
    if (statusCode === 500) {
        console.error(err.stack || err);
    }
    if (req.timedout) {
        console.error('请求超时: url=%s, timeout=%d, 请确认方法执行耗时很长，或没有正确的 response 回调。', req.originalUrl, err.timeout);
    }
    res.status(statusCode);
    // 默认不输出异常详情
    var error = {}
    if (app.get('env') === 'development') {
        // 如果是开发环境，则将异常堆栈输出到页面，方便开发调试
        error = err;
    }
    res.render('error', {
        message: err.message,
        error: error
    });
});

module.exports = app;
