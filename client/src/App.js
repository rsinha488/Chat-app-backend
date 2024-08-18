import logo from "./logo.svg";
import "./App.css";
import useSocket from "./hooks/useSocket";
import { useCallback, useEffect, useRef, useState } from "react";
import _ from "lodash";
import ChatInput from "./components/ChatInput";
import { getRoomsList, subscribeRoom } from "./API/ChatAPI";

function App() {
  const socketIO = useRef(false);
  const [roomsData, setRoomsData] = useState([]);

  const { socket, subscribeIO } = useSocket();
  const [sock, setsock] = useState({})

  const getRooms = async () => {
    try {
      const response = await getRoomsList();
      setRoomsData(response?.data);
      console.log("Rooms list successfully:", response);
    } catch (error) {
      console.error("Failed to get list:", error);
    }
  };
  useEffect(() => {
    // connectSocket();
    const d  = subscribeIO();
    setsock(d)
    getRooms();
  }, []);
  console.log("socketIO", socket);

  const onRoomChange = (data) => {
    console.log(data)
    // api call to join room
    subscribeRoom({ username: "ruchi", roomname: data.name });
  };

  useEffect(() => {
    console.log("socket",sock)
    if(sock?.on){
      sock.on("MemberAdded", (data) => {
        console.log("Member ADded", data);
      });
    }
  }, [sock]);

  return (
    <div className="App">
      <header className="App-header">
        <ul>
          {roomsData &&
            roomsData?.map((data, index) => (
              <li key={index} onClick={() => onRoomChange(data)}>
                {" "}
                {data.name}{" "}
              </li>
            ))}
        </ul>
        <ChatInput />
      </header>
    </div>
  );
}

export default App;
