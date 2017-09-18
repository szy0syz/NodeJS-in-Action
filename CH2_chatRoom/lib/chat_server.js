var socketio = require('socket.io');
var io;
var guestNumber = 1;
var nickNames = {};
var namesUsed = {};
var currentRoom = {};

exports.listen = function (server) {
  // 启动Socket.IO服务器，允许它搭建在已有的HTTP服务器上
  io = socketio.listen(server);
  io = set('log level', 1);

  // 定义每个用户连接上来时的逻辑层
  io.sockets.on('connection', function (socket) {
    // 分配个随机访客名
    guestNumber = assignGuestName(socket, guestNumber, nickNames, namesUsed);
    // 在用户连接上来时把它放入聊天室Lobby中
    joinRoom(socket, 'Lobby');

    handleMessageBoradcasting(socket, nickNames);
    handleNameChageAttempts(socket, nickNames, namesUsed);
    handleRoomJoining(socket);

    // 用户发出请求时，向其提供已经被占用的聊天室列表
    socket.on('rooms', function () {
      socket.emit('rooms', io.sockets.manager.rooms);
    });

    handleClientDisconnection(socket, nickNames, namesUsed);
  });
}

// 当用户连接上来时分配一个访客名
function assignGuestName(socket, guestNumber, nickNames, namesUsed) {
  var name = 'Guest' + guestNumber;  // 生成新匿名
  nickNames[socket.id] = name;       // 把用户匿名和客户端连接socket.id用键值对存储
  socket.emit('nameResult', {        // 发射事件：让用户知道他们的匿名
    success: true,
    name: name
  });
  namesUsed.push(name);              // 把已被占用的匿名存起来
  return guestNumber + 1;            // 返回最新的在线人数
}

// 处理用户的消息
function handleMessageBoradcasting(socket, nickNames) {

}

// 处理用户更名
function handleNameChageAttempts(socket, nickNames, namesUsed) {

}

// 处理聊天室的创建和变更(加入)
function handleRoomJoining(socket) {

}

// 定义用户断开连接后的清除逻辑
function handleClientDisconnection(socket, nickNames, namesUsed) {

}