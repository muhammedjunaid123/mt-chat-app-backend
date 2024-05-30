const express = require('express')
const app = express()
const mongoose = require('mongoose')
mongoose.connect('mongodb://127.0.0.1:27017/InIT-Solutions')
const user = require('./model/user_schema')
const chat = require('./model/chat_schema')
const jwt = require('jsonwebtoken')
require('dotenv').config()
const cors = require('cors')
const http = require('http')
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
const httpServer = http.createServer(app);

const checkJwt = (socket, next) => {
    const token = socket.handshake.query.token
    if (!token) {
        next(new Error('Access denied. No token provided.'));
    }
    jwt.verify(token, process.env.jwt_secret, (err, decoded) => {
        if (err) {
            next(new Error('Invalid token.'));
        }
        socket.user = decoded;
        next();
    });
};

const { Server } = require('socket.io')
const { ObjectId } = require('mongodb')
const io = new Server(httpServer, {
    cors: {
        origin: "http://localhost:4200",
        methods: ["GET", "POST"],
        credentials: true
    }
});
const corsOptions = {
    origin: 'http://localhost:4200',
    METHODS: ['GET', 'POST', 'PUT', 'PATCH']
};

app.use(cors(corsOptions))

io.use(checkJwt);
io.on('connection', (socket) => {
    try {


        console.log('a user connected');

        socket.on('message', async(data) => {
            console.log(data);
            const{_id,message,userid}=data
            let newMessage={id:userid,message:message}
            data=await chat.findOneAndUpdate({_id:_id},{ $push: { message: newMessage } },{ new: true, useFindAndModify: false }).populate('message.id')
            console.log(data);
            io.emit('message', data); 
        });

        socket.on('disconnect', () => {
            console.log('a user disconnected!');
        });
    } catch (error) {
        res.status(500).json({ error: error });
    }
});

app.get('/user', async (req, res) => {
    let token = req.headers['authorization']
    token = token.split(' ')[1]
    let jwt_decode = jwt.verify(token, process.env.jwt_secret)
    return res.status(200).json(await user.find({ email: { $ne: jwt_decode['email'] } }))
})
app.get('/user_chat', async (req, res) => {
    let token = req.headers['authorization']
    token = token.split(' ')[1]
    let jwt_decode = jwt.verify(token, process.env.jwt_secret)

    let user1 = await user.findOne({ email: jwt_decode['email'] })

    let data = await chat.findOne({
           $and: [
        {
            $or: [
                { senderId: req.query['id'] },
                { recipientId: req.query['id'] }
            ]
        },
        {
            $or: [
                { senderId: user1._id },
                { recipientId: user1._id }
            ]
        }
    ]
}).populate('senderId')
  .populate('recipientId')
  .populate('message.id');

  
    if (!data) {
      
        let chatdata = new chat({
            senderId: user1._id,
            recipientId: req.query['id']
        })
        data = await chatdata.save()
        data = await chat.findOne({
            $or: [
                { senderId: req.query['id'] },
                { recipientId: req.query['id'] }
            ]
        }).populate('senderId').populate('recipientId').populate('message.id')
        return res.status(200).json({data:data,email:jwt_decode['email']})
    }
    
    return res.status(200).json({data:data,email:jwt_decode['email']})
})
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body
        const user_data = await user.findOne({ email: email })
        if (!user_data) {
            return res.status(404).json({
                "message": "User not found"
            })
        }
        if (user_data['password'] != password) {
            return res.status(401).json({
                "message": "password is incorrect"
            })

        }
        const payload = {
            name: user_data['name'],
            email: user_data['email'],
            role: 'user'
        };

        const token = jwt.sign(payload, process.env.jwt_secret, {})
        return res.status(200).json({ token });
    } catch (error) {
        res.status(500).json({ error: 'Login failed' });
    }

})

httpServer.listen(3000, () => console.log('server is running on port 3000'))