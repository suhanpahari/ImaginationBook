"use client";

import { useState, useRef, useEffect } from "react";
import { RoughCanvas } from "roughjs/bin/canvas";
import {
  Pencil,
  Square,
  Circle,
  Type,
  Trash2,
  Download,
  ZoomIn,
  ZoomOut,
  Undo,
  Redo,
  ImageIcon,
} from "lucide-react";

// Cartoon figures for kids
const cartoonFigures = [
  { id: "cat", name: "Kitty", src: "/placeholder.svg?height=100&width=100" },
  { id: "dog", name: "Puppy", src: "/placeholder.svg?height=100&width=100" },
  { id: "bird", name: "Birdie", src: "/placeholder.svg?height=100&width=100" },
];

// Bright colors for kids
const kidColors = ["#FF0000", "#FF9900", "#FFFF00", "#33CC33", "#3366FF", "#9933FF", "#FF66CC", "#000000"];

const ThirdBoard = () => {
  const canvasRef = useRef(null);
  const roughCanvasRef = useRef(null);
  const textInputRef = useRef(null);

  const [elements, setElements] = useState([]);
  const [tool, setTool] = useState("pencil");
  const [selectedElement, setSelectedElement] = useState(null);
  const [color, setColor] = useState("#FF0000");
  const [strokeWidth, setStrokeWidth] = useState(5);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [startPanPosition, setStartPanPosition] = useState({ x: 0, y: 0 });
  const [showCartoonMenu, setShowCartoonMenu] = useState(false);
  const [selectedCartoon, setSelectedCartoon] = useState(null);
  const [cartoonImages, setCartoonImages] = useState({});
  const [textInput, setTextInput] = useState("");
  const [showTextInput, setShowTextInput] = useState(false);
  const [textPosition, setTextPosition] = useState({ x: 0, y: 0 });

  // Load cartoon images
  useEffect(() => {
    const images = {};
    cartoonFigures.forEach((figure) => {
      const img = new Image();
      img.src = figure.src;
      img.crossOrigin = "anonymous";
      images[figure.id] = img;
    });
    setCartoonImages(images);
  }, []);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      roughCanvasRef.current = new RoughCanvas(canvas);
      const resizeCanvas = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight - 120; // Space for toolbar
      };
      resizeCanvas();
      window.addEventListener("resize", resizeCanvas);
      redrawCanvas();
      return () => window.removeEventListener("resize", resizeCanvas);
    }
  }, []);

  // Redraw when elements, scale, or pan change
  useEffect(() => {
    redrawCanvas();
  }, [elements, scale, panOffset]);

  // Focus text input
  useEffect(() => {
    if (showTextInput && textInputRef.current) textInputRef.current.focus();
  }, [showTextInput]);

  // Generate unique ID
  const generateId = () => Math.random().toString(36).substr(2, 9);

  // Update history
  const updateHistory = (newElements) => {
    const newHistory = history.slice(0, historyIndex + 1);
    setHistory([...newHistory, [...newElements]]);
    setHistoryIndex(newHistory.length);
  };

  // Undo/Redo
  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setElements([...history[historyIndex - 1]]);
    }
  };
  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setElements([...history[historyIndex + 1]]);
    }
  };

  // Get element at position
  const getElementAtPosition = (x, y) => {
    const adjustedX = (x - panOffset.x) / scale;
    const adjustedY = (y - panOffset.y) / scale;

    return elements
      .slice()
      .reverse()
      .find((element) => {
        if (element.type === "rectangle" || element.type === "circle") {
          const { x1, y1, x2, y2 } = element;
          const minX = Math.min(x1, x2);
          const maxX = Math.max(x1, x2);
          const minY = Math.min(y1, y2);
          const maxY = Math.max(y1, y2);
          return adjustedX >= minX && adjustedX <= maxX && adjustedY >= minY && adjustedY <= maxY;
        } else if (element.type === "cartoon") {
          return (
            adjustedX >= element.x &&
            adjustedX <= element.x + element.width &&
            adjustedY >= element.y &&
            adjustedY <= element.y + element.height
          );
        } else if (element.type === "text") {
          const ctx = canvasRef.current.getContext("2d");
          ctx.font = `${element.fontSize || 24}px Comic Sans MS`;
          const textWidth = ctx.measureText(element.text).width;
          return (
            adjustedX >= element.x &&
            adjustedX <= element.x + textWidth &&
            adjustedY >= element.y - (element.fontSize || 24) &&
            adjustedY <= element.y
          );
        }
        return false; // Skip pencil for eraser simplicity
      });
  };

  // Create rough element
  const createElement = (id, x1, y1, x2, y2, type) => {
    const roughOptions = { strokeWidth, stroke: color, roughness: 2 };
    let roughElement = null;
    if (roughCanvasRef.current) {
      if (type === "rectangle") {
        roughElement = roughCanvasRef.current.generator.rectangle(
          x1,
          y1,
          x2 - x1,
          y2 - y1,
          roughOptions
        );
      } else if (type === "circle") {
        const radius = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
        roughElement = roughCanvasRef.current.generator.circle(x1, y1, radius * 2, roughOptions);
      }
    }
    return { id, type, roughElement, x1, y1, x2, y2, color, strokeWidth };
  };

  // Mouse events
  const handleMouseDown = (event) => {
    const { clientX, clientY, button } = event;
    const adjustedX = (clientX - panOffset.x) / scale;
    const adjustedY = (clientY - panOffset.y) / scale;

    if (button === 1 || (event.altKey && button === 0)) { // Middle click or Alt + left click for panning
      setIsPanning(true);
      setStartPanPosition({ x: clientX, y: clientY });
      return;
    }

    if (tool === "eraser") {
      const element = getElementAtPosition(clientX, clientY);
      if (element) {
        setElements((prev) => prev.filter((el) => el.id !== element.id));
        updateHistory(elements.filter((el) => el.id !== element.id));
      }
      return;
    }

    if (tool === "pencil") {
      const newElement = {
        id: generateId(),
        type: "pencil",
        points: [{ x: adjustedX, y: adjustedY }],
        color,
        strokeWidth,
      };
      setElements((prev) => [...prev, newElement]);
      setSelectedElement(newElement);
    } else if (tool === "rectangle" || tool === "circle") {
      const id = generateId();
      const newElement = createElement(id, adjustedX, adjustedY, adjustedX, adjustedY, tool);
      setElements((prev) => [...prev, newElement]);
      setSelectedElement(newElement);
    } else if (tool === "text") {
      setTextPosition({ x: adjustedX, y: adjustedY });
      setShowTextInput(true);
    } else if (tool === "cartoon" && selectedCartoon) {
      const newElement = {
        id: generateId(),
        type: "cartoon",
        cartoonType: selectedCartoon,
        x: adjustedX,
        y: adjustedY,
        width: 100,
        height: 100,
      };
      setElements((prev) => [...prev, newElement]);
      updateHistory([...elements, newElement]);
    }
  };

  const handleMouseMove = (event) => {
    const { clientX, clientY } = event;
    const adjustedX = (clientX - panOffset.x) / scale;
    const adjustedY = (clientY - panOffset.y) / scale;

    if (isPanning) {
      const dx = clientX - startPanPosition.x;
      const dy = clientY - startPanPosition.y;
      setPanOffset({ x: panOffset.x + dx, y: panOffset.y + dy });
      setStartPanPosition({ x: clientX, y: clientY });
      return;
    }

    if (selectedElement) {
      if (tool === "pencil") {
        const newPoints = [...selectedElement.points, { x: adjustedX, y: adjustedY }];
        const updatedElement = { ...selectedElement, points: newPoints };
        setElements((prev) =>
          prev.map((el) => (el.id === selectedElement.id ? updatedElement : el))
        );
        setSelectedElement(updatedElement);
      } else if (tool === "rectangle" || tool === "circle") {
        const updatedElement = createElement(
          selectedElement.id,
          selectedElement.x1,
          selectedElement.y1,
          adjustedX,
          adjustedY,
          tool
        );
        setElements((prev) =>
          prev.map((el) => (el.id === selectedElement.id ? updatedElement : el))
        );
        setSelectedElement(updatedElement);
      }
    } else if (tool === "eraser") {
      const element = getElementAtPosition(clientX, clientY);
      if (element) {
        setElements((prev) => prev.filter((el) => el.id !== element.id));
      }
    }
  };

  const handleMouseUp = () => {
    if (selectedElement) {
      updateHistory([...elements]);
      setSelectedElement(null);
    }
    setIsPanning(false);
  };

  // Touch events for mobile
  const handleTouchStart = (e) => handleMouseDown({ clientX: e.touches[0].clientX, clientY: e.touches[0].clientY, button: 0 });
  const handleTouchMove = (e) => handleMouseMove({ clientX: e.touches[0].clientX, clientY: e.touches[0].clientY });
  const handleTouchEnd = () => handleMouseUp();

  // Wheel event for zooming
  const handleWheel = (event) => {
    event.preventDefault();
    const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.min(Math.max(scale * zoomFactor, 0.1), 5);
    const mouseX = event.clientX;
    const mouseY = event.clientY;
    const newPanX = mouseX - (mouseX - panOffset.x) * (newScale / scale);
    const newPanY = mouseY - (mouseY - panOffset.y) * (newScale / scale);
    setScale(newScale);
    setPanOffset({ x: newPanX, y: newPanY });
  };

  // Add text
  const addText = () => {
    if (!textInput.trim()) return;
    const newElement = {
      id: generateId(),
      type: "text",
      text: textInput,
      x: textPosition.x,
      y: textPosition.y,
      color,
      fontSize: 24,
    };
    setElements((prev) => [...prev, newElement]);
    updateHistory([...elements, newElement]);
    setTextInput("");
    setShowTextInput(false);
  };

  // Redraw canvas
  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !roughCanvasRef.current) return;

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#FFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(panOffset.x, panOffset.y);
    ctx.scale(scale, scale);

    elements.forEach((element) => {
      if (element.type === "pencil") {
        ctx.beginPath();
        ctx.moveTo(element.points[0].x, element.points[0].y);
        element.points.forEach((point) => ctx.lineTo(point.x, point.y));
        ctx.strokeStyle = element.color;
        ctx.lineWidth = element.strokeWidth;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.stroke();
      } else if (element.type === "rectangle" || element.type === "circle") {
        roughCanvasRef.current.draw(element.roughElement);
      } else if (element.type === "text") {
        ctx.font = `${element.fontSize}px Comic Sans MS`;
        ctx.fillStyle = element.color;
        ctx.fillText(element.text, element.x, element.y);
      } else if (element.type === "cartoon") {
        const img = cartoonImages[element.cartoonType];
        if (img) ctx.drawImage(img, element.x, element.y, element.width, element.height);
      }
    });

    ctx.restore();
  };

  // Zoom and reset
  const zoomIn = () => setScale((prev) => Math.min(prev * 1.2, 5));
  const zoomOut = () => setScale((prev) => Math.max(prev / 1.2, 0.1));
  const resetView = () => {
    setScale(1);
    setPanOffset({ x: 0, y: 0 });
  };

  // Clear and save
  const clearCanvas = () => {
    setElements([]);
    updateHistory([]);
  };
  const saveAsImage = () => {
    const canvas = canvasRef.current;
    const link = document.createElement("a");
    link.download = "drawing.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  // Toolbar helpers
  const increaseStrokeWidth = () => setStrokeWidth((prev) => Math.min(prev + 2, 10));
  const decreaseStrokeWidth = () => setStrokeWidth((prev) => Math.max(prev - 2, 2));

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gray-100">
      {/* Toolbar */}
      <div className="flex flex-wrap justify-center gap-3 p-4 bg-yellow-200 shadow-lg">
        <button
          className={`p-4 rounded-full ${tool === "pencil" ? "bg-green-400" : "bg-white"}`}
          onClick={() => setTool("pencil")}
        >
          <Pencil size={32} />
          <span className="block text-sm font-bold">Draw</span>
        </button>
        <button
          className={`p-4 rounded-full ${tool === "eraser" ? "bg-red-400" : "bg-white"}`}
          onClick={() => setTool("eraser")}
        >
          <Trash2 size={32} color={tool === "eraser" ? "#fff" : "#333"} />
          <span className="block text-sm font-bold">Erase</span>
        </button>
        <button
          className={`p-4 rounded-full ${tool === "circle" ? "bg-blue-400" : "bg-white"}`}
          onClick={() => setTool("circle")}
        >
          <Circle size={32} />
          <span className="block text-sm font-bold">Circle</span>
        </button>
        <button
          className={`p-4 rounded-full ${tool === "rectangle" ? "bg-purple-400" : "bg-white"}`}
          onClick={() => setTool("rectangle")}
        >
          <Square size={32} />
          <span className="block text-sm font-bold">Square</span>
        </button>
        <button
          className={`p-4 rounded-full ${tool === "text" ? "bg-orange-400" : "bg-white"}`}
          onClick={() => setTool("text")}
        >
          <Type size={32} />
          <span className="block text-sm font-bold">Words</span>
        </button>
        <button
          className={`p-4 rounded-full ${tool === "cartoon" ? "bg-pink-400" : "bg-white"}`}
          onClick={() => setShowCartoonMenu(true)}
        >
          <ImageIcon size={32} />
          <span className="block text-sm font-bold">Stickers</span>
        </button>
        <div className="flex items-center p-2 bg-white rounded-lg">
          <button className="p-2 bg-blue-200 rounded-full" onClick={decreaseStrokeWidth}>-</button>
          <span className="mx-2 text-lg font-bold">{strokeWidth}</span>
          <button className="p-2 bg-blue-200 rounded-full" onClick={increaseStrokeWidth}>+</button>
          <span className="ml-2 text-sm font-bold">Size</span>
        </div>
        <div className="grid grid-cols-4 gap-2 p-2 bg-white rounded-lg">
          {kidColors.map((c) => (
            <button
              key={c}
              className={`w-8 h-8 rounded-full border-2 ${color === c ? "border-black" : "border-gray-200"}`}
              style={{ backgroundColor: c }}
              onClick={() => setColor(c)}
            />
          ))}
          <span className="col-span-4 text-sm font-bold text-center">Colors</span>
        </div>
        <button className="p-4 bg-white rounded-full" onClick={undo} disabled={historyIndex <= 0}>
          <Undo size={32} color={historyIndex <= 0 ? "#ccc" : "#333"} />
          <span className="block text-sm font-bold">Undo</span>
        </button>
        <button className="p-4 bg-white rounded-full" onClick={redo} disabled={historyIndex >= history.length - 1}>
          <Redo size={32} color={historyIndex >= history.length - 1 ? "#ccc" : "#333"} />
          <span className="block text-sm font-bold">Redo</span>
        </button>
        <button className="p-4 bg-white rounded-full" onClick={saveAsImage}>
          <Download size={32} />
          <span className="block text-sm font-bold">Save</span>
        </button>
        <button className="p-4 bg-red-400 rounded-full" onClick={clearCanvas}>
          <Trash2 size={32} color="#fff" />
          <span className="block text-sm font-bold">Clear</span>
        </button>
      </div>

      {/* Canvas */}
      <div className="flex-grow">
        <canvas
          ref={canvasRef}
          className={`w-full h-full ${tool === "eraser" ? "cursor-pointer" : "cursor-crosshair"}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onWheel={handleWheel}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        />

        {/* Text Input */}
        {showTextInput && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
            <div className="p-6 bg-white rounded-lg shadow-xl">
              <input
                ref={textInputRef}
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                className="w-full p-3 text-lg border rounded-lg"
                placeholder="Type something fun!"
              />
              <div className="flex gap-3 mt-3">
                <button className="p-2 bg-gray-200 rounded-lg" onClick={() => setShowTextInput(false)}>
                  Cancel
                </button>
                <button className="p-2 text-white bg-blue-400 rounded-lg" onClick={addText}>
                  Add
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Cartoon Menu */}
        {showCartoonMenu && (
          <div className="absolute p-6 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl top-1/2 left-1/2">
            <h3 className="mb-4 text-xl font-bold">Pick a Sticker!</h3>
            <div className="grid grid-cols-3 gap-4">
              {cartoonFigures.map((figure) => (
                <button
                  key={figure.id}
                  className="flex flex-col items-center p-2 rounded-lg hover:bg-pink-100"
                  onClick={() => {
                    setSelectedCartoon(figure.id);
                    setTool("cartoon");
                    setShowCartoonMenu(false);
                  }}
                >
                  <img src={figure.src} alt={figure.name} className="w-16 h-16" />
                  <span className="text-sm font-bold">{figure.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Zoom Controls */}
      <div className="absolute flex gap-2 p-2 bg-white rounded-lg shadow-md bottom-4 right-4">
        <button className="p-2" onClick={zoomIn}><ZoomIn size={24} /></button>
        <button className="p-2" onClick={zoomOut}><ZoomOut size={24} /></button>
        <button className="p-2 text-sm font-bold" onClick={resetView}>Reset</button>
      </div>

      {/* Status */}
      <div className="absolute p-2 bg-white rounded-lg shadow-md bottom-4 left-4">
        Zoom: {Math.round(scale * 100)}%
      </div>
    </div>
  );
};

export default ThirdBoard;