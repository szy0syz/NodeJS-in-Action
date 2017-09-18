function divEscapedContentElement(message) {
  return $('<div></div>').text(message);
}

function divSystemContentElement(message) {
  return $('<div></div>').html('<li>' + message + '</li>');
}

function processUserInput(chatApp, socket) {
  var message = $('#send-message').val();
  var systemMessage;
  if (message.charAt(0) === '/') {
    systemMessage = chatApp.processCommand(message);
    if (systemMessage) {
      $('#messages').append(divSystemContentElement(systemMessage));
    }
  } else {
    chatApp.sendMessage($('#room').text(), message);
    $('#messages').append(divEscapedContentElement(message));
    $('#messages').scrollTop($('#messages').prop('scrollHeight'));
  }
  $('#send-message').val(''); // 发送消息后清空输入栏
}

///////////////////////

// 客户端socket.io逻辑

var socket = io.connect();

$(document).ready(function () {
  var chatApp = new Chat(socket);

  socket.on('nameResult', function (reslut) {
    var message;
    if (reslut.success) {
      message = 'You are now known as ' + result.name + '.';
    } else {
      message = result.message;
    }
    $('#messages').append(divEscapedContentElement(message));
  });

  socket.on('joinResult', function (reslut) {
    $('#room').text(result.room);
    $('#messages').append(divSystemContentElement('Room changed.'));
  });

  socket.on('rooms', function (reslut) {
    $('#room-list').empty();

    for(var room in rooms) {
      room = room.substring(1, room.length);
      if (room != '') {
        $('#room-list').append(divEscapedContentElement(room));
      }
    };

    $('room-list div').click(function() {
      chatApp.processCommand('/join' + $(this).text());
      $('#send-message').focus();
    });
  });

  setInterval(function() {
    socket.emit('rooms');
  }, 5000);
  $('#send-message').focus();
  $('#send-form').submit(function() {
    processUserInput(chatApp, socket);
    return false;
  });
});