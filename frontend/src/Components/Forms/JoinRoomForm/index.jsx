import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Peer from "peerjs";

const JoinRoomForm = ({ uuid, socket, setUser, setMyPeer }) => {
  const [roomId, setRoomId] = useState("");
  const [name, setName] = useState("");
  const navigate = useNavigate();

  const handleRoomJoin = (e) => {
    e.preventDefault();
    if (!name.trim() || !roomId.trim()) return;

    const myPeer = new Peer(undefined, {
      host: "localhost",
      port: 5001,
      path: "/",
    });

    setMyPeer(myPeer);

    myPeer.on("open", (id) => {
      const roomData = {
        name,
        roomId,
        userId: id,
        host: false,
        presenter: false,
      };
      setUser(roomData);
      navigate(`/${roomId}`);
      socket.emit("userJoined", roomData);
    });

    myPeer.on("error", (err) => {
      console.error("peer connection error", err);
      myPeer.reconnect();
    });
  };

  return (
    <form onSubmit={handleRoomJoin}>
      <input
        type="text"
        className="form-control mb-3"
        placeholder="Your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <input
        type="text"
        className="form-control mb-3"
        placeholder="Room code"
        value={roomId}
        onChange={(e) => setRoomId(e.target.value)}
        required
      />
      <button type="submit" className="btn btn-success w-100">
        Join Room
      </button>
    </form>
  );
};

export default JoinRoomForm;
