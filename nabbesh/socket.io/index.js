// requires
var config = require('./config');
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var nodeCouchDB = require('node-couchdb');
var s3 = require('s3');
var uuid = require('node-uuid');
var fs = require('fs');
var redis = require('redis');
var request = require('request');

// constructors
var couch = new nodeCouchDB(config.couchdb.host, config.couchdb.port);
var s3Client = s3.createClient({s3Options: { accessKeyId: config.s3.accessKeyId, secretAccessKey: config.s3.secretAccessKey }});
var redisClient = redis.createClient(config.redis.port, config.redis.host);

// begun!
var users = [];
var clients = [];

io.on('connection', function(socket){

  socket.on('join', function(user){

    if (user.type == 'freelancer') {
      joinUser(user, socket);
    } else {
      redisClient.select(2, function () { 

        redisClient.get(":1:nabbesh.sessions:" + user.sessionid, function(err, reply) {

          var session = JSON.parse(reply);
          var userSessionId = session._auth_user_id;

          request(config.api.base + 'client/info/' + userSessionId + '/', function(error, response, body) {

            if (error) return;

            var user = JSON.parse(body);

            joinUser(user, socket, userSessionId);
          });
       });
      });
    }    
  });

  socket.on('lastMessages', function(data) {
    
    var offset = data.offset;
    var conversation = data.conversation;
    var conversationFlow = generateConversationFlow(conversation[0], conversation[1]);

    var startKey = [conversationFlow];
    var endKey = [conversationFlow,{}];
    var viewUrl = "_design/dev_last_messages/_view/last_messages_from_conversation";
    var queryOptions = {
        startkey: startKey,
        endkey: endKey
    };

    couch.get("messages", viewUrl, queryOptions, function (err, resData) {
        if (err) return ;

        var messages = resData.data.rows;
        for (var i in messages) {
          var message = messages[i].value;
          socket.emit('onMessage', {created: message[0], from: message[1], to: message[2], text: message[3], file: message[4], file_type: message[5], file_name: message[6]});
        }
    });
  });

  socket.on('message', function(message) {

    var conversationFlow = generateConversationFlow(message.from, message.to);

    message.created = Date.now();
    message.conversation = conversationFlow;
    message._id = message.created + '_' + message.conversation;

    couch.insert("messages", message, function (err, resData) {});

    if (message.file) {
      var origFile = 'uploads/' + message.file_name;
      var extension = getFileExtension(message.file_name);
      var destFile = uuid.v4() + extension;
      var fileBuffer = decodeBase64File(message.file);

      message.file = destFile;

      fs.writeFile(origFile, fileBuffer.data, function(err) {

        uploadFile(origFile, destFile, message, socket);
      });
    } else {
      emitMessage(message, socket)
    }
    
  });

  socket.on('disconnect', function() {

    if (clients[socket.id]) {
      var clientId = clients[socket.id].id;

      for (var i in users) {
        var user = users[i];
        if (user.id == clientId){
          users.splice(i, 1);
        }
      }

      delete clients[socket.id];

      //io.emit('usersList', users);
    }
  });

});

function joinUser(user, socket, userSessionId) {

  users.push(user);
  clients[socket.id] = {id: user.id, socket: socket};

  if (user.type != 'freelancer') {
    socket.emit('onJoin', user);

    request(config.api.base + 'client/get-bids/' + userSessionId + '/', function(error, response, body){
      var usersList = JSON.parse(body);
      socket.emit('usersList', usersList);
    });
  }  
}

function emitMessage(message, socket) {
  var toSocket = getSocket(message.to);

  var date = new Date();
  message.created = date.getMilliseconds();

  if (toSocket) {
    toSocket.emit('onMessage', message);
  } else {
    sendMessageNotification(message);
  }

  socket.emit('onMessage', message);
}

function sendMessageNotification(message) {
  var toType = message.fromType == 'client' ? 'freelancer' : 'client';
  var url = config.api.base + 'notification/missed/';

  request.post(url, {form:{
    from_user_type: message.fromType,
    to_user_type: toType,
    from_user_id: message.from,
    to_user_id: message.to,
    project_id: message.projectId,
    message: message.file ? mountHTMLLink(message) : message.text
  }});
}

function mountHTMLLink(message) {
  var html = '';

  if (message.file) {
    if (message.file_type == 'image') {
      html = '<img src="' + config.s3.baseURL + config.s3.bucket + '/' + message.file + '"/>';
    } else {
      html = '<a href="' + config.s3.baseURL + config.s3.bucket + '/' + message.file + '">' + message.file_name + '</a>';
    }
  }

  return html;
}

function uploadFile(origFile, destFile, message, socket) {

  var params = {
    localFile: origFile,
    s3Params: {
      ACL: 'public-read',
      Bucket: config.s3.bucket,
      Key: destFile
    }
  };

  var uploader = s3Client.uploadFile(params);
  uploader.on('end', function(){
    fs.unlink(origFile);
    emitMessage(message, socket);
  })
}

function getFileExtension(filename) {
    var i = filename.lastIndexOf('.');
    return (i < 0) ? '' : filename.substr(i);
}

function generateConversationFlow(from, to) {
  var users = new Array(from, to);
  users.sort();

  return users[0] + '_' + users[1];
}

function getSocket(id){
  for (var clientId in clients) {
    var client = clients[clientId];
    if (client.id == id) {
      return client.socket;
    }
  }

  return false;
}

function decodeBase64File(dataString) {
  var matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/),
    response = {};

  if (matches.length !== 3) {
    return new Error('Invalid input string');
  }

  response.type = matches[1];
  response.data = new Buffer(matches[2], 'base64');

  return response;
}

http.listen(3000, function(){
  console.log('listening on *:3000');
});
