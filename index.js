
const path = require('path');
const http = require('http');
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const socket = require('socket.io');
const formatMessage = require('./utils/messages'); 
const { userjoin, getCurrentUser, userLeave, getRoomUsers} = require('./utils/users'); 
const Chat = require('./model/chat')


const app = express();
const server = http.createServer(app);
const io = socket(server);
app.use(express.urlencoded({ extended: false}));


dotenv.config();

mongoose.connect('mongodb://localhost:27017/social_chat', { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false, useCreateIndex: true})
 .then(() => {
    console.log("Connection was successfull")
})
.catch(error => {
    console.error(error);
})

//Static folder
app.use(express.static(path.join(__dirname, 'client')));

const niceName = 'Clearance Chat bot';

io.on('connection', socket => {
    Chat.find().then(result => {
        socket.emit('output-messages', result)
    })
    console.log('Socket is connected.');

    
    socket.on('joinRoom', ({ username, room}) => {
        socket.emit('message', formatMessage(niceName, 'Welcome to chat box'))

        const user = userjoin(socket.id, username, room);


        socket.join(user.room);

        socket.broadcast.to(user.room).emit('message', formatMessage(niceName, `${user.username} has joined the group`));

        io.to(user.room).emit('roomUsers', { 
            room: user.room,
            users: getRoomUsers(user.room)
        });

        socket.on('disconnect', () => {
            const user = userLeave(socket.id);

            if(user) {
                io.to(user.room).emit('message', formatMessage(niceName, `${user.username} has left the group`));

                io.to(user.room).emit('roomUsers', { 
                    room: user.room,
                    users: getRoomUsers(user.room)
                });
         
            }

        });
    });


    app.use(express.static(__dirname));

    app.post('/chats', (req, res) => {
        console.log(req.body);
        Chat.create(req.body, (err) => {
            if (err) throw err;
            console.log('Chat saved successfully');
        })
    }) 
    
    app.get('/chats', (req, res) => {
        // console.log(reg.body);
        Chat.find((err, chats) => {
            if (err) throw err;
            res.send(chats);
        })
    }) 
    
    socket.on('chatMessage', msg => {

        const user = getCurrentUser(socket.id);

            const chat = new Chat({msg});
            chat.save().then(() => {
                io.to(user.room).emit('message', formatMessage(user.username, msg));
            })

    });
});



app.use(cors());
app.use(helmet());
app.use(morgan("common"));
app.use(express.json());


server.listen(8200, () => {
    console.log("Server is running on port 8200")
})