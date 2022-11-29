const config = require('../config/config.json');
const { createClient } = require('redis');
const { createAdapter } = require('@socket.io/redis-adapter');
const { Emitter } = require('@socket.io/redis-emitter');
const pubClient = createClient({ url: config.dev.redis });

class SocketService {
    constructor(server) {
        if (SocketService._instance) return SocketService._instance
        SocketService._instance = this;
        const io = require('socket.io')(server);
        (async () => {
            await pubClient.connect();
            const subClient = pubClient.duplicate();
            await subClient.connect();
            io.adapter(createAdapter(pubClient, subClient));
        })();
        let userIds = new Set();
        io.on("connection", socket => {
            const emitter = new Emitter(pubClient);
            userIds.add(socket.id);
            /** spin - will send message to some user */
            socket.on('spin', (message) => {
                io.serverSideEmit('users',(err,res) => {
                    if(err){
                        new Error(err)
                    } else {
                        res[0].map(data => userIds.add(data));
                        const users = Math.floor(Math.random() * userIds.size);
                        const test = Array.from(userIds);
                        const status = emitter.to(test[users]).emit('spin', "spin socket");
                        console.log(status)
                    }
                })
            })
            /** wild - send a message to X users, X = user choose */
            socket.on('wild', (data) => {
                io.serverSideEmit('users',(err,res) => {
                    if(err){
                        new Error(err)
                    } else {
                        const arrayUserPos = [];
                        res[0].map(data => userIds.add(data));
                        const test = Array.from(userIds);
                        console.log("data.userInt",data.userInt);
                        for (let index = 0; index < data.userInt; index++) {
                            arrayUserPos.push(Math.floor(Math.random() * userIds.size))
                        }
                        for (let index = 0; index < arrayUserPos.length; index++) {
                            const status = emitter.to(test[arrayUserPos[index]]).emit('wild', "wild socket");
                            console.log(status)
                        }
                    }
                })
            })
            /** blast - will send message to all users randomly */
            socket.on('blast', (message) => {
                const status = emitter.emit('blast', "all users")
                console.log(status)
            })
            socket.on("disconnect", (user) => userIds = userIds.delete(userIds));
        });
        io.on('users',async (cd) => {
            cd(Array.from(userIds))
        })
    }
}

module.exports = SocketService;