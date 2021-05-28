const express = require('express');
const socketio = require('socket.io');
const http = require('http')
const app = express();

const { addUser, removeUser, getUser, getUserInRoom } = require('./users');

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT,DELETE");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
 });

const router = require('./router');

const PORT = process.env.PORT || 5000

const server = http.createServer(app)
const io = socketio(server, {
    cors: {
      origin: '*',
    }
  })


io.on('connection',(socket)=>{
    console.log('We have a socket connection')


    socket.on('join',({name,room}, callback)=>{
        console.log(name,room);
        const { user, error} = addUser({id:socket.id, name, room});
        if(error) return callback(error);
        
        socket.emit('message', { user:'admin', text : `${user.name}, Welcome to the ${user.room}`, time:  new Date().getTime() / 1000})
        io.to(user.room).emit('roomData', {room:user.room, users:getUserInRoom(user.room)});

        socket.broadcast.to(user.room).emit('message' , { user: 'admin' , text: `${user.name} has joined`, time:  new Date().getTime() / 1000 });
        socket.join(user.room);
    })

    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id);
        io.to(user.room).emit('message', {user:user.name, text:message, time: new Date().getTime() / 1000});
        io.to(user.room).emit('roomData', {room:user.room, users:getUserInRoom(user.room)});

        callback();
    });

    socket.on('disconnect', () =>{
        const user = removeUser(socket.id);
        console.log(user);
        io.to(user.room).emit('message', { user: 'admin' , text: `${user.name} has left the room` , time:  new Date().getTime() / 1000});
    })
})


server.listen(PORT, () => console.log(`Server has started on port ${PORT}`));