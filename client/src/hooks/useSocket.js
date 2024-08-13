import React from "react";
import io from "socket.io-client";

function useSocket() {
  var socket = io.connect("http://localhost:5000")

  return { socket };
}

export default useSocket;
