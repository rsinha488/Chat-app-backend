import React from "react";
import io from "socket.io-client";

function useSocket() {
  var socket = {}

  const subscribeIO = () => {
    return io.connect("http://localhost:5000")
  }

  return { socket, subscribeIO };
}

export default useSocket;
