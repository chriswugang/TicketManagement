'use strict';
var router = require('express').Router();
var AV = require('leanengine');

// `AV.Object.extend` ����һ��Ҫ����ȫ�ֱ������������ɶ�ջ�����
// ����� https://leancloud.cn/docs/js_guide.html#����
var TicketUser = AV.Object.extend('TicketUser');

var promotionId = null;

router.get('/', function (req, res, next) {
    console.log('current page:login.ejs');
    console.log('p1:' + req.query.p1);
    promotionId = req.query.p1;    
    res.render('login', null);
});

router.post('/', function (req, res, next) {
    console.log('current page:login.ejs');
    console.log('req:' + req.body);
    console.log('req.body.inputCellphoneNum:' + req.body.inputCellphoneNum);
    console.log('req.body.inputPassword:' + req.body.inputPassword);
    console.log('promotionId:' + promotionId);
           
    var vote = req.body.btnVote;
    if (vote == 'login') {
        var cellphoneNum = req.body.inputCellphoneNum;
        var userPassword = req.body.inputPassword;

        if (cellphoneNum == 'admin') {

        }

    }
    else {
        res.redirect('/register?p1=' + promotionId);
    }
    
});

module.exports = router;