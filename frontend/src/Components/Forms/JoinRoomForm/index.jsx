import { useState } from "react";
import { useNavigate } from "react-router-dom";

const JoinRoomForm = ({ socket, setUser }) => {
  const [roomId, setRoomId] = useState("");
  const [name, setName] = useState("");
  const navigate = useNavigate();

  const handleRoomJoin = (e) => {
    e.preventDefault();
    if (!name.trim() || !roomId.trim()) return;

    const roomData = {
      name,
      roomId,
      userId: Date.now().toString(), // Using timestamp as dummy unique ID
      host: false,
      presenter: false,
    };

    setUser(roomData);
    socket.emit("userJoined", roomData);
    navigate(`/${roomId}`);
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
