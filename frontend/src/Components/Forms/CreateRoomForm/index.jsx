import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Peer from "peerjs";

const CreateRoomForm = ({ uuid, socket, setUser, setMyPeer }) => {
  const [roomId, setRoomId] = useState(uuid());
  const [name, setName] = useState("");

  const navigate = useNavigate();

  const handleCreateRoom = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    const myPeer = new Peer(undefined, {
      host: "/",
      port: 5001,
      path: "/",
      secure: false,
    });

    setMyPeer(myPeer);

    myPeer.on("open", (id) => {
      const roomData = {
        name,
        roomId,
        userId: id,
        host: true,
        presenter: true,
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

  const handleCopy = () => {
    navigator.clipboard.writeText(roomId);
    alert("Room code copied!");
  };

  return (
    <form onSubmit={handleCreateRoom}>
      <input
        type="text"
        className="form-control mb-3"
        placeholder="Your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />

      <div className="input-group mb-3">
        <input
          type="text"
          className="form-control"
          value={roomId}
          disabled
        />
        <button
          className="btn btn-outline-secondary"
          type="button"
          onClick={() => setRoomId(uuid())}
        >
          Generate
        </button>
        <button
          className="btn btn-outline-primary"
          type="button"
          onClick={handleCopy}
        >
          Copy
        </button>
      </div>

      <button type="submit" className="btn btn-primary w-100">
        Create Room
      </button>
    </form>
  );
};

export default CreateRoomForm;
