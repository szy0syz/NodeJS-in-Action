var http = require('http');
var fs = require('fs');
var path = require('path');
var mime = require('mime');
process.chdir(__dirname);
var cache = {};

// 辅助函数：发送404错误到客户端
function send404(res) {
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.write('Error 404: resource not found.');
  res.end();
}

// 辅助函数：提供文件数据服务
function sendFile(res, filePath, fileContents) {
  res.writeHead(200, { 'Content-Type': mime.lookup(path.basename(filePath)) });
  res.end(fileContents);
}

// 提供静态文件服务
function serveStatic(res, cache, absPath) {
  if (cache[absPath]) {
    sendFile(res, absPath, cache(absPath));
  } else {
    fs.exists(absPath, function (exists) {
      if (exists) {
        fs.readFile(absPath, function (err, data) {
          if (err) {
            send404(res);
          } else {
            cache[absPath] = data;
            sendFile(res, absPath, data);
          }
        });
      } else {
        send404(res);
      }
    });
  }
} // 这算一个回调地狱吗

//////////////////////

// 创建HTTP服务器的逻辑
var server = http.createServer(function (req, res) {
  var filePath = false;
  
  if (req.url == '/') {
    filePath = 'public/index.html';
  } else {
    filePath = 'public' + req.url;
  }
  var absPath = './' + filePath;
  serveStatic(res, cache, absPath);
});

// 启动HTTP服务器
server.listen(3000, function() {
  console.log('Server listening on port 3000.');
});

// node server.js