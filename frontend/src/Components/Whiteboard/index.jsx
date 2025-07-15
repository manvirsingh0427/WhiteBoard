// Heart of Our App
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

    socket.on("draw-text", (textData) => {
      setElements((prev) => [...prev, textData]);
    });

    return () => {
      socket.off("whiteBoardDataResponse");
      socket.off("toggleDarkMode");
      socket.off("draw-text");
    };
  }, []);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    socket.emit("toggleDarkMode", newMode);
  };

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

  useEffect(() => {
    if (ctxRef.current) {
      ctxRef.current.strokeStyle = color;
    }
  }, [color]);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;

    if (!canvas || !ctx) return;

    const roughCanvas = rough.canvas(canvas);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    elements.forEach((element) => {
      const opts = {
        stroke: element.stroke,
        strokeWidth: 4,
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
      } 
      else if (element.type === "eraser") {
        ctx.save();
        ctx.globalCompositeOperation = "destination-out";
        ctx.beginPath();
        const [first, ...rest] = element.path;
        ctx.moveTo(...first);
        rest.forEach(([x, y]) => ctx.lineTo(x, y));
        ctx.lineWidth = 10;
        ctx.stroke();
        ctx.restore();
      }


      else if(element.type === "circle"){
        const radius = Math.sqrt(
          Math.pow(element.width, 2) + Math.pow(element.height, 2)
        );

        roughCanvas.draw(
          roughGenerator.circle(
            element.offsetX,
            element.offsetY,
            radius*2,
            opts
          )
        )
      }

      else if (element.type === "triangle") {
      const { offsetX, offsetY, width, height } = element;
      const x1 = offsetX;
      const y1 = offsetY;
      const x2 = offsetX + width;
      const y2 = offsetY + height;
      const x3 = offsetX - width;
      const y3 = offsetY + height;

      roughCanvas.draw(
        roughGenerator.polygon(
          [
            [x1, y1],
            [x2, y2],
            [x3, y3],
          ],
          opts
        )
      );
    }
      
      else if (element.type === "pencil") {
        roughCanvas.linearPath(element.path, opts);
      } else if (element.type === "text") {
        ctx.fillStyle = element.stroke;
        ctx.font = "24px sans-serif";
        ctx.fillText(element.text, element.offsetX, element.offsetY);
      }
    });

    const canvasImage = canvas.toDataURL();
    socket.emit("whiteboardData", canvasImage);
  }, [elements]);

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
    } else if (tool === "eraser") {
      setElements((prev) => [
        ...prev,
        {
          ...base,
          type: "eraser",
          path: [[offsetX, offsetY]],
        },
      ]);
    }
    else if (tool === "line") {
      setElements((prev) => [
        ...prev,
        { ...base, type: "line", width: offsetX, height: offsetY },
      ]);
    } else if (tool === "rect") {
      setElements((prev) => [
        ...prev,
        { ...base, type: "rect", width: 0, height: 0 },
      ]);
    } else if(tool === "circle"){
      setElements((prev)=>[
        ...prev, 
        {...base, type:"circle", width:0, height:0},
      ]);
    } else if(tool === "triangle"){
      setElements((prev)=>[
        ...prev, 
        {...base, type:"triangle", width:0, height:0},
      ]);
    } else if (tool === "text") {
      const input = prompt("Enter text:");
      if (input) {
        const textElement = {
          ...base,
          type: "text",
          text: input,
        };
        setElements((prev) => [...prev, textElement]);
        socket.emit("draw-text", textElement);
      }
    }

    if (tool !== "text") setIsDrawing(true);
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
        } 
        else if (tool === "eraser") {
        return {
          ...ele,
          path: [...ele.path, [offsetX, offsetY]],
        };
      }
      else if (tool === "line") {
          return {
            ...ele,
            width: offsetX,
            height: offsetY,
          };
        } else if (tool === "rect" || tool === "circle" || tool === "triangle") {
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
      className={`relative border border-3 h-screen w-full overflow-hidden ${
        darkMode ? "bg-black" : "bg-white"
      }`}
    >
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
            {darkMode ? "WhiteBoard" : "BlackBoard"}
          </button>
        </div>
      )}

      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
};

export default WhiteBoard;
