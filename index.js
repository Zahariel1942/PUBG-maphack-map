var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io').listen(server);
var bodyParser = require('body-parser');

var port = 7890;

// 地图数据
var DUMPDATA = {};

// socket clients
var CLIENTS = [];

// 静态文件
app.use(express.static('static'));

//body-parser 解析json格式数据
app.use(bodyParser.json({
    limit: '1mb'
}));

//此项必须在 bodyParser.json 下面,为参数编码
app.use(bodyParser.urlencoded({
    extended: true
}));

//  POST 请求
app.post('/', function (req, res) {
    DUMPDATA = req.body;
    res.end('confirm');
    for (var index = 0; index < CLIENTS.length; index++) {
        var socket = CLIENTS[index];
        socket.emit('update', DUMPDATA);
    }
});

// websocket
io.on('connection', function (socket) {
    CLIENTS.push(socket);
    console.log(`a user connected, current users: [${CLIENTS.length}]`);
    socket.on('disconnect', function () {
        for (var index = 0; index < CLIENTS.length; index++) {
            if (CLIENTS[index] === socket) {
                CLIENTS.splice(index, 1);
            }
        }
        console.log(`a user disconnect, current users: [${CLIENTS.length}]`);
    });
});

server.listen(port, function () {
    var host = server.address().address;
    var port = server.address().port;
    console.log(`server running at localhost:${port}`);
});
