module.exports.Chatlistener = (socket, io) => {

    // Emoji Listener --
    socket.on("sentEmojiToRoom", data=>{
        console.log({data})
        socket.to(data.roomId).emit("message",{type: 1, ...data})
    });

    socket.on("getRoomUsersList", (data)=>{
        console.log({data},"hhgoin")
        const roomSockets = io.sockets.adapter.rooms.get(data.roomId);
        const activeSockets = Array.from(roomSockets || []);
        console.log(activeSockets, "comming::join room list");
    
        // socket.to(data.roomId).emit("message",{type: 4, ...data})
    });
    // socket.on("getAdvertisementWatch", (data)=>{
    //     console.log({data},"getAdvertisementWatch")
    //     const roomSockets = io.sockets.adapter.rooms.get(data.roomId);


    //     console.log(roomSockets, "comming::getAdvertisementWatch");
    
    // });

}