var socketio = require('socket.io');
var io;
var guestNumber = 1;
var nickNames = {};
var namesUsed = [];
var currentRoom = {};

exports.listen = function (server) {
  // 启动Socket.IO服务器，允许它搭建在已有的HTTP服务器上
  io = socketio.listen(server);
  //console.log(io);
  // io.set()方法已经被替换为use()方法
  //io.set('log level', 1);

  // 定义每个用户连接上来时的逻辑层
  io.sockets.on('connection', function (socket) {
    console.log('assignGuestName');
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

function joinRoom(socket, room) {
  socket.join(room);
  currentRoom[socket.id] = room;
  socket.emit('joinResult', { room: room });
  socket.broadcast.to(room).emit('message', { text: nickNames[socket.id] + ' has joined ' + room + '.' });

  // 用api获取所有在该聊天室的用户 对象数组
  var usersInRoom = io.sockets.clients(room);
  if (usersInRoom.length > 1) { // 如果用户数大于1就循环拼接
    // 初始化给所有客户端拼接的字符串
    var usersInRoomSummary = 'Users currently in ' + room + ' : ';
    for (var index in usersInRoom) {
      // 从api获取的对象数组拿到单个用户socket.id
      var userSocketId = usersInRoom[index].id;
      // 过滤掉当前用户本身
      if (userSocketId != socket.id) {
        if (index > 0) {
          usersInRoomSummary += ', ';
        }
        // 将除本身用户以外的都拼接
        usersInRoomSummary += nickNames[userSocketId];
      }
    }
    usersInRoomSummary += '.'; // 结束拼接加个句号
    // 群发信息
    socket.emit('message', { text: usersInRoomSummary });
  }
}

// 处理广播消息的逻辑
function handleMessageBoradcasting(socket, nickNames) {
  socket.on('message', function (message) {
    socket.broadcast.to(message.room).emit('message', { text: nickNames[socket.id] + ': ' + message.text });
  });
}

// 处理用户更名的逻辑
function handleNameChageAttempts(socket, nickNames, namesUsed) {
  // 参数name就是客户端发来的新匿名
  socket.on('nameAttempt', function (name) {
    if (name.indexOf('Guest') === 0) {
      socket.emit('nameResult', { success: false, message: 'Name cannot begin with "Guest".' })
    } else {
      if (namesUsed.indexOf(name) === -1) { // 数组用indexOf方法666
        var previousName = nickNames[socket.id];
        var previousNameIndex = namesUsed.indexOf(previousName);
        namesUsed.push(name);
        nickNames[socket.id] = name;
        delete namesUsed[previousNameIndex];
        socket.emit('nameResult', { success: true, name: name });
        socket.broadcast.to(currentRoom[socket.id]).emit('message', {
          text: previousName + ' is now known as ' + name + '.'
        });
      } else {
        socket.emit('nameResult', { success: false, message: 'That name is already in use.' });
      }
    }
  });
}

// 处理聊天室的创建和变更(加入)
function handleRoomJoining(socket) {
  socket.on('join', function (room) {
    socket.leave(currentRoom(socket.id));
    joinRoom(socket, room.newRoom);
  });
}

// 定义用户断开连接后的清除逻辑
function handleClientDisconnection(socket, nickNames, namesUsed) {
  socket.on('disconnect', function () {
    var nameIndex = namesUsed.indexOf(nickNames[socket.id]);
    delete namesUsed[nameIndex];
    delete nickNames[socket.io];
  });
}