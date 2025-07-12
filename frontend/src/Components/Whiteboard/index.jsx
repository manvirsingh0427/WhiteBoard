import { useEffect, useState, useLayoutEffect } from "react";
import rough from "roughjs";

const roughGenerator = rough.generator();

const WhiteBoard = ({
  canvasRef,
  ctxRef,
  elements,
  setElements,
  tool,
  color,
  user,
  socket,
}) => {
  const [img, setImg] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);

  // Receive updates from server
  useEffect(() => {
    socket.on("whiteBoardDataResponse", (data) => {
      setImg(data.imgURL);
    });

    socket.on("toggleDarkMode", (mode) => {
      setDarkMode(mode);
    });
  }, []);

  // Send toggle event
  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    socket.emit("toggleDarkMode", newMode);
  };

  // View-only user display
  if (!user?.presenter) {
    return (
      <div
        className={`border border-3 h-full w-full overflow-hidden ${
          darkMode ? "bg-black" : "bg-white"
        }`}
      >
        <img
          src={img}
          alt="Real time white board image shared by presenter"
          className="w-full h-full object-contain"
        />
      </div>
    );
  }

  // Setup canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = window.innerWidth * 2;
    canvas.height = window.innerHeight * 2;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctxRef.current = ctx;
  }, [canvasRef, ctxRef]);

  // Update stroke color
  useEffect(() => {
    if (ctxRef.current) {
      ctxRef.current.strokeStyle = color;
    }
  }, [color]);

  // Draw all elements
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;

    if (!canvas || !ctx) return;

    const roughCanvas = rough.canvas(canvas);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    elements.forEach((element) => {
      const opts = {
        stroke: element.stroke,
        strokeWidth: 5,
        roughness: 0,
      };

      if (element.type === "rect") {
        roughCanvas.draw(
          roughGenerator.rectangle(
            element.offsetX,
            element.offsetY,
            element.width,
            element.height,
            opts
          )
        );
      } else if (element.type === "line") {
        roughCanvas.draw(
          roughGenerator.line(
            element.offsetX,
            element.offsetY,
            element.width,
            element.height,
            opts
          )
        );
      } else if (element.type === "pencil") {
        roughCanvas.linearPath(element.path, opts);
      }
    });

    const canvasImage = canvas.toDataURL();
    socket.emit("whiteboardData", canvasImage);
  }, [elements]);

  // Drawing handlers
  const handleMouseDown = (e) => {
    const { offsetX, offsetY } = e.nativeEvent;

    const base = {
      offsetX,
      offsetY,
      stroke: color,
    };

    if (tool === "pencil") {
      setElements((prev) => [
        ...prev,
        { ...base, type: "pencil", path: [[offsetX, offsetY]] },
      ]);
    } else if (tool === "line") {
      setElements((prev) => [
        ...prev,
        { ...base, type: "line", width: offsetX, height: offsetY },
      ]);
    } else if (tool === "rect") {
      setElements((prev) => [
        ...prev,
        { ...base, type: "rect", width: 0, height: 0 },
      ]);
    }

    setIsDrawing(true);
  };

  const handleMouseMove = (e) => {
    if (!isDrawing) return;
    const { offsetX, offsetY } = e.nativeEvent;

    setElements((prevElements) =>
      prevElements.map((ele, index) => {
        if (index !== prevElements.length - 1) return ele;

        if (tool === "pencil") {
          return {
            ...ele,
            path: [...ele.path, [offsetX, offsetY]],
          };
        } else if (tool === "line") {
          return {
            ...ele,
            width: offsetX,
            height: offsetY,
          };
        } else if (tool === "rect") {
          return {
            ...ele,
            width: offsetX - ele.offsetX,
            height: offsetY - ele.offsetY,
          };
        }

        return ele;
      })
    );
  };

  const handleMouseUp = () => setIsDrawing(false);

  return (
    <div
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      className={`relative border border-3 h-full w-full overflow-hidden ${
        darkMode ? "bg-black" : "bg-white"
      }`}
    >
      {/* Toggle Button */}
      {user?.presenter && (
        <div
          className="absolute top-4 right-4 z-20"
          onMouseDown={(e) => e.stopPropagation()}
          onMouseUp={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="px-3 py-1 bg-gray-300 dark:bg-gray-800 text-sm rounded shadow"
            onClick={toggleDarkMode}
          >
            {darkMode ? "Light Mode" : "Dark Mode"}
          </button>
        </div>
      )}

      {/* Canvas */}
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
};

export default WhiteBoard;
