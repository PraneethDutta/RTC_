const express = require('express');

const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

const port = process.env.PORT || 3000;


app.use(express.static('public'));

http.listen(port, () => console.log('app started'))

io.on('connection', socket => {
  console.log('a user connected with id:'+socket.id);
  setTimeout(function(){
    socket.emit('sending_socket_id',{description:socket.id})
  },1)
  var name;
  socket.on('sending_name_to_server',function(data){
    console.log("socket id: "+socket.id+"      name: "+(data.description));
    name=data.description;
    socket.broadcast.emit('new_client_name',{description:name})
  })
  socket.on('sending_message',function(data){
    socket.broadcast.emit('broadcasting_sent_message',{description:data.description})
  })
  socket.on('asking_download',function(data){
    socket.emit
  })


  //when anyone disconnects:
  socket.on('disconnect',function(){
    console.log('a user has disconnected:'+socket.id)
  })
  console.log('user connected');
  socket.on('create or join', room => {
    console.log('create or join room', room)
    room = room.trim();
    const myRoom = io.sockets.adapter.rooms.get(room) || { size: 0 };
    const numClients = myRoom.size;
    console.log(room, 'has', numClients, 'clients');

    if (numClients === 0) {
      socket.join(room);
      socket.emit(`created`, room);
    } else if (numClients === 1) {
      socket.join(room);
      socket.emit(`joined`, room);
    } else {
      socket.emit(`full`, room);
    }
  });

  socket.on('ready', room => {
    socket.broadcast.to(room).emit('ready');
  })

  socket.on('candidate', event => {
    socket.broadcast.to(event.room).emit('candidate', event);
  })

  socket.on('offer', event => {
    socket.broadcast.to(event.room).emit('offer', event.sdp);
  })

  socket.on('answer', event => {
    socket.broadcast.to(event.room).emit('answer', event.sdp);
  })
});
