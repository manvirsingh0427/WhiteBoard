import CreateRoomForm from "./CreateRoomForm";
import JoinRoomForm from "./JoinRoomForm";
import "./index.css";

const Forms = ({ uuid, socket, setUser, setMyPeer }) => {
  return (
    <div className="container vh-100 d-flex justify-content-center align-items-start pt-5 gap-5 flex-wrap">
      <div className="form-box shadow p-5 border rounded-4 bg-white" style={{ minWidth: "350px" }}>
        <h2 className="text-primary text-center mb-4">Create Room</h2>
        <CreateRoomForm
          uuid={uuid}
          setMyPeer={setMyPeer}
          socket={socket}
          setUser={setUser}
        />
      </div>

      <div className="form-box shadow p-5 border rounded-4 bg-white" style={{ minWidth: "350px" }}>
        <h2 className="text-primary text-center mb-4">Join Room</h2>
        <JoinRoomForm
          uuid={uuid}
          setMyPeer={setMyPeer}
          socket={socket}
          setUser={setUser}
        />
      </div>
    </div>
  );
};

export default Forms;
