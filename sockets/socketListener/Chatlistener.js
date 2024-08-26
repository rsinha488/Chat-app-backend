module.exports.Chatlistener = (socket) => {

    // Emoji Listener --
    socket.on("sentEmojiToRoom", data=>{
        console.log({data})
        socket.to(data.roomId).emit("message",{type: 1, ...data})
    });

}