import http = require('http');
import fs = require('fs');
import path = require('path');

const server = http.createServer((req, res) => {
  switch (req.url) {
    case '/':
      res.writeHead(200, { 'Content-Type': 'text/html' });
      fs.createReadStream(path.join(__dirname, 'view', 'index.html')).pipe(res);
      break;
    case '/login':
      res.writeHead(200, { 'Content-Type': 'text/html' });
      fs.createReadStream(path.join(__dirname, 'view', 'login.html')).pipe(res);
      break;
    default:
      res.writeHead(404, { 'Content-Type': 'text/html' });
      fs.createReadStream(path.join(__dirname, 'view', 'error.html')).pipe(res);
  }
})

// Start server
server.listen(3000, () => {
  console.log("Server started");
})
