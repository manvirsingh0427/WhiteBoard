import { useState, useRef, useEffect } from "react";
import "./index.css";
import WhiteBoard from "../../components/WhiteBoard";
import Chat from "../../components/ChatBar";
import { toast } from "react-toastify";

const RoomPage = ({ user, socket, users, setUsers }) => {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);

  const [tool, setTool] = useState("pencil");
  const [color, setColor] = useState("black");
  const [elements, setElements] = useState([]);
  const [history, setHistory] = useState([]);
  const [openedUserTab, setOpenedUserTab] = useState(false);
  const [openedChatTab, setOpenedChatTab] = useState(false);

  const handleClearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "white";
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setElements([]);
  };

  const undo = () => {
    setHistory((prev) => [...prev, elements[elements.length - 1]]);
    setElements((prev) => prev.slice(0, prev.length - 1));
  };

  const redo = () => {
    setElements((prev) => [...prev, history[history.length - 1]]);
    setHistory((prev) => prev.slice(0, prev.length - 1));
  };

  useEffect(() => {
    const handleUserJoined = ({ name, userId, users: updatedUsers }) => {
      setUsers(updatedUsers);
      toast.info(`${name} joined the room`);
    };

    const handleUserLeft = ({ userId, name }) => {
      toast.info(`${name} left the room`);
      setUsers((prevUsers) => prevUsers.filter((usr) => usr.userId !== userId));
    };

    socket.on("userJoinedMessageBroadcasted", handleUserJoined);
    socket.on("userLeftMessageBroadcasted", handleUserLeft);

    return () => {
      socket.off("userJoinedMessageBroadcasted", handleUserJoined);
      socket.off("userLeftMessageBroadcasted", handleUserLeft);
    };
  }, [socket]);

  return (
    <div className="container-fluid p-0">
      {/* User and Chat Buttons */}
      <div className="d-flex justify-content-start gap-2 p-3">
        <button
          type="button"
          className="btn btn-dark"
          onClick={() => setOpenedUserTab(true)}
        >
          Users 👥
        </button>

        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setOpenedChatTab(true)}
        >
          Chats 💬
        </button>
      </div>

      {/* Sidebar: User Tab */}
      {openedUserTab && (
        <div className="position-fixed top-0 h-100 text-white bg-dark" style={{ width: "250px", left: "0%", zIndex: 1050 }}>
          <button
            type="button"
            onClick={() => setOpenedUserTab(false)}
            className="btn btn-light btn-block w-100 mt-5"
          >
            Close
          </button>
          <div className="w-100 mt-5 pt-5">
            {users.map((usr) => (
              <p key={usr.userId} className="my-2 text-center w-100">
                {usr.name} {user?.userId === usr.userId && "(You)"}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Sidebar: Chat Tab */}
      {openedChatTab && <Chat setOpenedChatTab={setOpenedChatTab} socket={socket} />}

      {/* Heading */}
      <h1 className="text-center py-3 px-2">
        CollabCanvas{" "}
        <span className="text-success">(Online Users : {users.length})</span>
      </h1>

      {/* Tool Panel (Presenter Only) */}
      {user?.presenter && (
        <div className="container px-3 px-md-5 mb-3">
          <div className="row g-3 justify-content-center">
            {/* Tool Selector */}
            <div className="col-12 col-md-3">
              <label htmlFor="tool" className="form-label fw-bold">Tool ᝰ.ᐟ :</label>
              <select
                id="tool"
                className="form-select"
                value={tool}
                onChange={(e) => setTool(e.target.value)}
              >
                <option value="pencil">Pencil</option>
                <option value="line">Line</option>
                <option value="rect">Rectangle</option>
                <option value="triangle">Triangle</option>
                <option value="circle">Circle</option>
                <option value="text">Text</option>
                <option value="eraser">Eraser</option>
              </select>
            </div>

            {/* Color Picker */}
            <div className="col-12 col-md-3">
              <label htmlFor="color" className="form-label fw-bold">Color 🎨 : </label>
              <input
                type="color"
                id="color"
                className="form-control form-control-color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
              />
            </div>

            {/* Undo / Redo */}
            <div className="col-12 col-md-3 d-flex align-items-end justify-content-between">
              <button
                className="btn btn-primary w-100 me-2"
                disabled={elements.length === 0}
                onClick={undo}
              >
                Undo
              </button>
              <button
                className="btn btn-outline-success w-100"
                disabled={history.length < 1}
                onClick={redo}
              >
                Redo
              </button>
            </div>

            {/* Clear */}
            <div className="col-12 col-md-2 d-flex align-items-end">
              <button className="btn btn-danger w-100" onClick={handleClearCanvas}>
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Canvas */}
      <div className="col-12 col-md-10 mx-auto mt-3 canvas-box px-2 px-md-0">
        <WhiteBoard
          canvasRef={canvasRef}
          ctxRef={ctxRef}
          elements={elements}
          setElements={setElements}
          color={color}
          tool={tool}
          user={user}
          socket={socket}
        />
      </div>
    </div>
  );
};

export default RoomPage;
