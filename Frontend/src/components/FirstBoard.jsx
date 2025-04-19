import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import rough from "roughjs/bundled/rough.esm";
import getStroke from "perfect-freehand";
import axios from "axios";
import YouTube from "react-youtube";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

const generator = rough.generator();

const colorOptions = [
  { name: "Black", value: "#000000" },
  { name: "Red", value: "#FF3B30" },
  { name: "Orange", value: "#FF9500" },
  { name: "Yellow", value: "#FFCC00" },
  { name: "Green", value: "#34C759" },
  { name: "Blue", value: "#007AFF" },
  { name: "Purple", value: "#AF52DE" },
  { name: "Pink", value: "#FF2D55" },
];

const thicknessOptions = [
  { name: "Thin", value: 2 },
  { name: "Medium", value: 4 },
  { name: "Thick", value: 6 },
  { name: "Big", value: 10 },
];

const fillOptions = [
  { name: "None", value: "none" },
  { name: "Solid", value: "solid" },
  { name: "Hachure", value: "hachure" },
  { name: "Zigzag", value: "zigzag" },
  { name: "Cross-hatch", value: "cross-hatch" },
];

const createElement = (id, x1, y1, x2, y2, type, options = {}) => {
  const { strokeColor = "#000000", strokeWidth = type === "text" ? 36 : 2, fillStyle = "none", fill = "none", text = "" } = options;
  const roughOptions = {
    strokeWidth,
    stroke: strokeColor,
    fillStyle: fillStyle !== "none" ? fillStyle : undefined,
    fill: fill !== "none" ? fill : undefined,
    roughness: 1.5,
  };

  switch (type) {
    case "line":
      const roughLine = generator.line(x1, y1, x2, y2, roughOptions);
      return { id, x1, y1, x2, y2, type, roughElement: roughLine, ...options };
    case "rectangle":
      const roughRect = generator.rectangle(x1, y1, x2 - x1, y2 - y1, roughOptions);
      return { id, x1, y1, x2, y2, type, roughElement: roughRect, ...options };
    case "pencil":
      return { id, type, points: [{ x: x1, y: y1 }], ...options };
    case "text":
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      context.font = `${strokeWidth}px 'Comic Sans MS', 'Chalkboard', sans-serif`;
      const textWidth = context.measureText(text).width;
      const textHeight = strokeWidth;
      return {
        id,
        type,
        x1,
        y1,
        x2: x1 + textWidth,
        y2: y1 + textHeight,
        text,
        strokeColor,
        strokeWidth,
      };
    default:
      throw new Error(`Type not recognised: ${type}`);
  }
};

const nearPoint = (x, y, x1, y1, name) => Math.abs(x - x1) < 5 && Math.abs(y - y1) < 5 ? name : null;
const onLine = (x1, y1, x2, y2, x, y, maxDistance = 1) => {
  const a = { x: x1, y: y1 };
  const b = { x: x2, y: y2 };
  const c = { x, y };
  const offset = distance(a, b) - (distance(a, c) + distance(b, c));
  return Math.abs(offset) < maxDistance ? "inside" : null;
};
const positionWithinElement = (x, y, element) => {
  const { type, x1, x2, y1, y2 } = element;
  switch (type) {
    case "line":
      const on = onLine(x1, y1, x2, y2, x, y);
      const start = nearPoint(x, y, x1, y1, "start");
      const end = nearPoint(x, y, x2, y2, "end");
      return start || end || on;
    case "rectangle":
    case "text":
      const topLeft = nearPoint(x, y, x1, y1, "tl");
      const topRight = nearPoint(x, y, x2, y1, "tr");
      const bottomLeft = nearPoint(x, y, x1, y2, "bl");
      const bottomRight = nearPoint(x, y, x2, y2, "br");
      const inside = x >= x1 && x <= x2 && y >= y1 && y <= y2 ? "inside" : null;
      return topLeft || topRight || bottomLeft || bottomRight || inside;
    case "pencil":
      const betweenAnyPoint = element.points.some((point, index) => {
        const nextPoint = element.points[index + 1];
        if (!nextPoint) return false;
        return onLine(point.x, point.y, nextPoint.x, nextPoint.y, x, y, 5) != null;
      });
      return betweenAnyPoint ? "inside" : null;
    default:
      throw new Error(`Type not recognised: ${type}`);
  }
};
const distance = (a, b) => Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
const getElementAtPosition = (x, y, elements) =>
  elements
    .map((element) => ({ ...element, position: positionWithinElement(x, y, element) }))
    .find((element) => element.position !== null);
const adjustElementCoordinates = (element) => {
  const { type, x1, y1, x2, y2 } = element;
  if (type === "rectangle") {
    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);
    const minY = Math.min(y1, y2);
    const maxY = Math.max(y1, y2);
    return { x1: minX, y1: minY, x2: maxX, y2: maxY };
  } else {
    if (x1 < x2 || (x1 === x2 && y1 < y2)) return { x1, y1, x2, y2 };
    return { x1: x2, y1: y2, x2: x1, y2: y1 };
  }
};
const cursorForPosition = (position) => {
  switch (position) {
    case "tl":
    case "br":
    case "start":
    case "end":
      return "nwse-resize";
    case "tr":
    case "bl":
      return "nesw-resize";
    default:
      return "move";
  }
};
const resizedCoordinates = (clientX, clientY, position, coordinates) => {
  const { x1, y1, x2, y2 } = coordinates;
  switch (position) {
    case "tl":
    case "start":
      return { x1: clientX, y1: clientY, x2, y2 };
    case "tr":
      return { x1, y1: clientY, x2: clientX, y2 };
    case "bl":
      return { x1: clientX, y1, x2, y2: clientY };
    case "br":
    case "end":
      return { x1, y1, x2: clientX, y2: clientY };
    default:
      return null;
  }
};
const useHistory = (initialState) => {
  const [index, setIndex] = useState(0);
  const [history, setHistory] = useState([initialState]);
  const setState = (action, overwrite = false) => {
    const newState = typeof action === "function" ? action(history[index]) : action;
    if (overwrite) {
      const historyCopy = [...history];
      historyCopy[index] = newState;
      setHistory(historyCopy);
    } else {
      const updatedState = [...history].slice(0, index + 1);
      setHistory([...updatedState, newState]);
      setIndex((prevState) => prevState + 1);
    }
  };
  const undo = () => index > 0 && setIndex((prevState) => prevState - 1);
  const redo = () => index < history.length - 1 && setIndex((prevState) => prevState + 1);
  return [history[index], setState, undo, redo];
};
const getSvgPathFromStroke = (stroke) => {
  if (!stroke.length) return "";
  const d = stroke.reduce(
    (acc, [x0, y0], i, arr) => {
      const [x1, y1] = arr[(i + 1) % arr.length];
      acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
      return acc;
    },
    ["M", ...stroke[0], "Q"]
  );
  d.push("Z");
  return d.join(" ");
};
const drawElement = (roughCanvas, context, element) => {
  switch (element.type) {
    case "line":
    case "rectangle":
      roughCanvas.draw(element.roughElement);
      break;
    case "pencil":
      const stroke = getSvgPathFromStroke(
        getStroke(element.points, {
          size: element.strokeWidth || 2,
          thinning: 0.5,
          smoothing: 0.5,
          streamline: 0.5,
        })
      );
      context.fillStyle = element.strokeColor || "#000000";
      context.fill(new Path2D(stroke));
      break;
    case "text":
      context.textBaseline = "top";
      const fontSize = Math.max(element.strokeWidth || 36, 24);
      context.font = `${fontSize}px 'Comic Sans MS', 'Chalkboard', sans-serif`;
      context.fillStyle = element.strokeColor || "#000000";
      if (element.text) {
        context.fillText(element.text, element.x1, element.y1);
      }
      break;
    default:
      throw new Error(`Type not recognised: ${element.type}`);
  }
};
const adjustmentRequired = (type) => ["line", "rectangle"].includes(type);
const usePressedKeys = () => {
  const [pressedKeys, setPressedKeys] = useState(new Set());
  useEffect(() => {
    const handleKeyDown = (event) => setPressedKeys((prev) => new Set(prev).add(event.key));
    const handleKeyUp = (event) =>
      setPressedKeys((prev) => {
        const updated = new Set(prev);
        updated.delete(event.key);
        return updated;
      });
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);
  return pressedKeys;
};

const FirstBoard = () => {
  const [elements, setElements, undo, redo] = useHistory([]);
  const [action, setAction] = useState("none");
  const [tool, setTool] = useState("pencil");
  const [selectedElement, setSelectedElement] = useState(null);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [startPanMousePosition, setStartPanMousePosition] = useState({ x: 0, y: 0 });
  const [selectedColor, setSelectedColor] = useState(colorOptions[0]);
  const [selectedThickness, setSelectedThickness] = useState(thicknessOptions[1]);
  const [selectedFillStyle, setSelectedFillStyle] = useState(fillOptions[0]);
  const [selectedFillColor, setSelectedFillColor] = useState(colorOptions[0]);
  const [showColorPanel, setShowColorPanel] = useState(false);
  const [showThicknessPanel, setShowThicknessPanel] = useState(false);
  const [showFillPanel, setShowFillPanel] = useState(false);
  const [drawingId, setDrawingId] = useState(null);
  const [pageColor, setPageColor] = useState("");
  const [showGrid, setShowGrid] = useState(false);
  const [magicMenuOpen, setMagicMenuOpen] = useState(false);
  const [showVideoSection, setShowVideoSection] = useState(false);
  const [videos, setVideos] = useState([]);
  const [selectedVideoId, setSelectedVideoId] = useState(null);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("kids educational videos");
  const [processedImage, setProcessedImage] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [alertMessage, setAlertMessage] = useState(null);
  const textAreaRef = useRef();
  const canvasRef = useRef();
  const pressedKeys = usePressedKeys();
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const navigate = useNavigate();
  const email = useSelector((state) => state.user.userEmail);
  const password = useSelector((state) => state.user.userPassword);

  const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY
  const GROQ_API_URL = import.meta.env.VITE_GROQ_API_URL 
  

  
  let finalEmail = localStorage.getItem("email") || email;
  let finalPassword = localStorage.getItem("password") || password;

  console.log("Final Email:", finalEmail);
  console.log("Final Password:", finalPassword);

  if(!finalEmail && !finalPassword) { 
    navigate("/");
  }

  const showCanvasAlert = (message, duration = 3000) => {
    setAlertMessage(message);
    setTimeout(() => setAlertMessage(null), duration);
  };

  const fetchVideos = async (query = "Drawing video") => {
    try {
      setIsLoading(true);
      const response = await axios.get(
        "https://www.googleapis.com/youtube/v3/search",
        {
          params: {
            part: "snippet",
            q: query,
            type: "video",
            maxResults: 200,
            key: import.meta.env.VITE_YOUTUBE_API_KEY,
          },
        }
      );
      const videos = response.data.items.map((item) => ({
        id: item.id.videoId,
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails.default.url,
      }));
      setVideos(videos);
      setError(null);
    } catch (err) {
      console.error("Error fetching videos:", err);
      setError("Oops! Couldn't load videos. Try again later.");
      setVideos([]);
    } finally {
      setIsLoading(false);
    }
  };

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    const roughCanvas = rough.canvas(canvas);

    context.clearRect(0, 0, canvas.width, canvas.height);

    if (showGrid) {
      context.save();
      context.translate(panOffset.x, panOffset.y);
      context.strokeStyle = "#ccc";
      context.lineWidth = 0.5;
      const gridSize = 20;
      for (let x = 0; x < canvas.width; x += gridSize) {
        context.beginPath();
        context.moveTo(x, 0);
        context.lineTo(x, canvas.height);
        context.stroke();
      }
      for (let y = 0; y < canvas.height; y += gridSize) {
        context.beginPath();
        context.moveTo(0, y);
        context.lineTo(canvas.width, y);
        context.stroke();
      }
      context.restore();
    }

    context.save();
    context.translate(panOffset.x, panOffset.y);
    elements.forEach((element) => {
      if (action === "writing" && selectedElement?.id === element.id) return;
      drawElement(roughCanvas, context, element);
    });

    if (processedImage) {
      context.drawImage(
        processedImage.img,
        processedImage.x,
        processedImage.y,
        processedImage.width,
        processedImage.height
      );
    }

    if (alertMessage) {
      context.save();
      context.fillStyle = "rgba(0, 0, 0, 0.8)";
      context.fillRect(canvas.width / 2 - 150, canvas.height / 2 - 50, 300, 100);
      context.fillStyle = "#ffffff";
      context.font = "24px 'Comic Sans MS', 'Chalkboard', sans-serif";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(alertMessage, canvas.width / 2, canvas.height / 2);
      context.restore();
    }

    context.restore();
  }, [elements, action, selectedElement, panOffset, showGrid, processedImage, alertMessage]);

  useEffect(() => {
    const undoRedoFunction = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "z") {
        event.shiftKey ? redo() : undo();
      }
    };
    document.addEventListener("keydown", undoRedoFunction);
    return () => document.removeEventListener("keydown", undoRedoFunction);
  }, [undo, redo]);

  useEffect(() => {
    const panFunction = (event) => {
      setPanOffset((prev) => ({
        x: prev.x - event.deltaX,
        y: prev.y - event.deltaY,
      }));
    };
    document.addEventListener("wheel", panFunction);
    return () => document.removeEventListener("wheel", panFunction);
  }, []);

  useEffect(() => {
    const textArea = textAreaRef.current;
    if (action === "writing" && textArea) {
      setTimeout(() => {
        textArea.focus();
        textArea.value = selectedElement.text || "";
      }, 0);
    }
  }, [action, selectedElement]);

  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = showVideoSection ? window.innerWidth * 0.75 : window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, [showVideoSection]);

  const handleMouseDown = (event) => {
    if (!processedImage || action !== "none") return;

    const { clientX, clientY } = getCoordinates(event);
    const mouseX = clientX - panOffset.x;
    const mouseY = clientY - panOffset.y;

    if (
      mouseX >= processedImage.x &&
      mouseX <= processedImage.x + processedImage.width &&
      mouseY >= processedImage.y &&
      mouseY <= processedImage.y + processedImage.height
    ) {
      setIsDragging(true);
      setDragOffset({
        x: mouseX - processedImage.x,
        y: mouseY - processedImage.y,
      });
    }
  };

  const handleMouseMove = (event) => {
    if (!isDragging || !processedImage) return;

    const { clientX, clientY } = getCoordinates(event);
    const mouseX = clientX - panOffset.x;
    const mouseY = clientY - panOffset.y;

    setProcessedImage((prev) => ({
      ...prev,
      x: mouseX - dragOffset.x,
      y: mouseY - dragOffset.y,
    }));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseup", handleMouseUp);

    return () => {
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseup", handleMouseUp);
    };
  }, [processedImage, isDragging, dragOffset, panOffset]);

  const updateElement = (id, x1, y1, x2, y2, type, options) => {
    const elementsCopy = [...elements];
    const elementOptions = {
      strokeColor: selectedColor.value,
      strokeWidth: type === "text" ? 36 : selectedThickness.value,
      fillStyle: selectedFillStyle.value,
      fill: selectedFillStyle.value !== "none" ? selectedFillColor.value : "none",
      ...options,
    };

    switch (type) {
      case "line":
      case "rectangle":
        elementsCopy[id] = createElement(id, x1, y1, x2, y2, type, elementOptions);
        break;
      case "pencil":
        elementsCopy[id].points = [...elementsCopy[id].points, { x: x2, y: y2 }];
        break;
      case "text":
        const textWidth = canvasRef.current.getContext("2d").measureText(options?.text || "").width;
        const textHeight = elementOptions.strokeWidth || 36;
        elementsCopy[id] = {
          ...createElement(id, x1, y1, x1 + textWidth, y1 + textHeight, type, elementOptions),
          text: options?.text || "",
        };
        break;
      default:
        throw new Error(`Type not recognised: ${type}`);
    }
    setElements(elementsCopy, true);
  };

  const getCoordinates = (event) => ({
    clientX: event.clientX - panOffset.x,
    clientY: event.clientY - panOffset.y,
  });

  const handlePointerDown = (event) => {
    if (action === "writing") return;
    const { clientX, clientY } = getCoordinates(event);

    if (event.button === 1 || pressedKeys.has(" ")) {
      setAction("panning");
      setStartPanMousePosition({ x: clientX, y: clientY });
      return;
    }

    if (tool === "selection") {
      const element = getElementAtPosition(clientX, clientY, elements);
      if (element) {
        if (element.type === "pencil") {
          const xOffsets = element.points.map((point) => clientX - point.x);
          const yOffsets = element.points.map((point) => clientY - point.y);
          setSelectedElement({ ...element, xOffsets, yOffsets });
        } else {
          const offsetX = clientX - element.x1;
          const offsetY = clientY - element.y1;
          setSelectedElement({ ...element, offsetX, offsetY });
        }
        setElements((prev) => prev);
        setAction(element.position === "inside" ? "moving" : "resizing");
      }
    } else {
      const id = elements.length;
      const isStylus = event.pointerType === "pen";
      const element = createElement(id, clientX, clientY, clientX, clientY, tool, {
        strokeColor: selectedColor.value,
        strokeWidth: isStylus ? selectedThickness.value * 1.5 : (tool === "text" ? 36 : selectedThickness.value),
        fillStyle: selectedFillStyle.value,
        fill: selectedFillStyle.value !== "none" ? selectedFillColor.value : "none",
      });
      setElements((prev) => [...prev, element]);
      setSelectedElement(element);
      setAction(tool === "text" ? "writing" : "drawing");
    }
  };

  const handlePointerMove = (event) => {
    const { clientX, clientY } = getCoordinates(event);

    if (action === "panning") {
      const deltaX = clientX - startPanMousePosition.x;
      const deltaY = clientY - startPanMousePosition.y;
      setPanOffset({
        x: panOffset.x + deltaX,
        y: panOffset.y + deltaY,
      });
      setStartPanMousePosition({ x: clientX, y: clientY });
      return;
    }

    if (tool === "selection") {
      const element = getElementAtPosition(clientX, clientY, elements);
      event.target.style.cursor = element ? cursorForPosition(element.position) : "default";
    }

    if (action === "drawing") {
      const index = elements.length - 1;
      const { x1, y1 } = elements[index];
      updateElement(index, x1, y1, clientX, clientY, tool);
    } else if (action === "moving") {
      if (selectedElement.type === "pencil") {
        const newPoints = selectedElement.points.map((_, index) => ({
          x: clientX - selectedElement.xOffsets[index],
          y: clientY - selectedElement.yOffsets[index],
        }));
        const elementsCopy = [...elements];
        elementsCopy[selectedElement.id] = { ...elementsCopy[selectedElement.id], points: newPoints };
        setElements(elementsCopy, true);
      } else {
        const { id, x1, x2, y1, y2, type, offsetX, offsetY } = selectedElement;
        const width = x2 - x1;
        const height = y2 - y1;
        const newX1 = clientX - offsetX;
        const newY1 = clientY - offsetY;
        const options = {
          strokeColor: selectedElement.strokeColor,
          strokeWidth: selectedElement.strokeWidth,
          fillStyle: selectedElement.fillStyle,
          fill: selectedElement.fill,
          text: selectedElement.text,
        };
        updateElement(id, newX1, newY1, newX1 + width, newY1 + height, type, options);
      }
    } else if (action === "resizing") {
      const { id, type, position, ...coordinates } = selectedElement;
      const { x1, y1, x2, y2 } = resizedCoordinates(clientX, clientY, position, coordinates);
      const options = {
        strokeColor: selectedElement.strokeColor,
        strokeWidth: selectedElement.strokeWidth,
        fillStyle: selectedElement.fillStyle,
        fill: selectedElement.fill,
        text: selectedElement.text,
      };
      updateElement(id, x1, y1, x2, y2, type, options);
    }
  };

  const handlePointerUp = () => {
    if (selectedElement) {
      const index = selectedElement.id;
      const { id, type } = elements[index];
      if ((action === "drawing" || action === "resizing") && adjustmentRequired(type)) {
        const { x1, y1, x2, y2 } = adjustElementCoordinates(elements[index]);
        const options = {
          strokeColor: elements[index].strokeColor,
          strokeWidth: elements[index].strokeWidth,
          fillStyle: elements[index].fillStyle,
          fill: elements[index].fill,
          text: elements[index].text,
        };
        updateElement(id, x1, y1, x2, y2, type, options);
      }
    }
    if (action !== "writing") {
      setAction("none");
      setSelectedElement(null);
    }
  };

  const handleBlur = (event) => {
    const { id, x1, y1, type, strokeColor, strokeWidth, fillStyle, fill } = selectedElement;
    setAction("none");
    setSelectedElement(null);
    updateElement(id, x1, y1, null, null, type, {
      text: event.target.value,
      strokeColor,
      strokeWidth,
      fillStyle,
      fill,
    });
  };

  const saveAsImage = async () => {
    const canvas = canvasRef.current;
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempContext = tempCanvas.getContext("2d");

    tempContext.fillStyle = pageColor || "#ffffff";
    tempContext.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    tempContext.translate(panOffset.x, panOffset.y);
    elements.forEach((element) => {
      drawElement(rough.canvas(tempCanvas), tempContext, element);
    });
    if (processedImage) {
      tempContext.drawImage(
        processedImage.img,
        processedImage.x,
        processedImage.y,
        processedImage.width,
        processedImage.height
      );
    }
    tempContext.translate(-panOffset.x, -panOffset.y);

    const blob = await new Promise((resolve) => {
      tempCanvas.toBlob((blob) => resolve(blob), "image/png");
    });

    const formData = new FormData();
    formData.append("image", blob, "drawing.png");

    try {
      const url = import.meta.env.VITE_NGROK_ENDPOINT || "https://fbd9-34-125-87-16.ngrok-free.app/process";
      const response = await fetch(url, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        const img = new Image();
        img.src = `data:image/png;base64,${data.image}`;
        img.onload = () => {
          setProcessedImage({
            img,
            x: 0,
            y: 0,
            width: img.width / 2,
            height: img.height / 2,
          });
        };
      } else {
        console.error("Error from server:", data.error);
        showCanvasAlert("Failed to process image!");
      }
    } catch (error) {
      console.error("Network error:", error);
      showCanvasAlert("Network error while processing image!");
    }
  };

  const saveCanvasWithProcessedImage = () => {
    const canvas = canvasRef.current;
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempContext = tempCanvas.getContext("2d");

    tempContext.fillStyle = pageColor || "#ffffff";
    tempContext.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    tempContext.translate(panOffset.x, panOffset.y);
    elements.forEach((element) => {
      drawElement(rough.canvas(tempCanvas), tempContext, element);
    });
    if (processedImage) {
      tempContext.drawImage(
        processedImage.img,
        processedImage.x,
        processedImage.y,
        processedImage.width,
        processedImage.height
      );
    }
    tempContext.translate(-panOffset.x, -panOffset.y);

    const link = document.createElement("a");
    link.download = "drawing.png";
    link.href = tempCanvas.toDataURL("image/png");
    link.click();
  };

  const saveToDatabase = async () => {
    try {
      if (!finalEmail) {
        showCanvasAlert("No user email found. Please log in first!");
        return;
      }

      const drawingData = {
        elements: elements.map(({ roughElement, ...rest }) => rest),
        name: `KidsDrawing-${Date.now()}`,
        board: "Board1",
      };
      let url = `http://localhost:3000/api/drawings/${finalEmail}`;
      let method = "POST";
      if (drawingId) {
        url = `http://localhost:3000/api/drawings/${drawingId}/${finalEmail}`;
        method = "PUT";
      }
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(drawingData),
      });
      const result = await response.json();
      if (response.ok) {
        if (!drawingId) setDrawingId(result.id);
        showCanvasAlert("Yay! Your drawing is saved!");
      } else {
        throw new Error(result.error || "Failed to save drawing");
      }
    } catch (error) {
      console.error("Error saving drawing:", error);
      showCanvasAlert("Oops! Couldn't save your drawing!");
    }
  };

  // const loadFromDatabase = async (id = "67feafe97904e414cabecb3f") => {
  //   try {
  //     const response = await fetch(`http://localhost:3000/api/drawings/${id}/${email}`);
  //     const result = await response.json();
  //     if (response.ok) {
  //       setElements(result.elements);
  //       setDrawingId(result.id);
  //       showCanvasAlert("Cool! Your drawing is loaded!");
  //     } else {
  //       throw new Error(result.error || "Failed to load drawing");
  //     }
  //   } catch (error) {
  //     console.error("Error loading drawing:", error);
  //     showCanvasAlert("Oops! Couldn't load the drawing!");
  //   }
  // };

  const toggleMagicMenu = () => setMagicMenuOpen(!magicMenuOpen);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioBlob(audioBlob);
        processAudio(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error starting recording:", error);
      showCanvasAlert("Couldn't start recording. Please allow microphone access!");
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processAudio = async (audioBlob) => {
    if (!audioBlob) return;

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", audioBlob, "recording.webm");
      formData.append("model", "whisper-large-v3");
      formData.append("response_format", "json");

      const response = await axios.post(GROQ_API_URL, formData, {
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "multipart/form-data",
        },
      });

      console.log("API Response:", response.data);
      const transcription = response.data.text || response.data.transcription;
      if (transcription) {
        const id = elements.length;
        const x1 = 100 - panOffset.x;
        const y1 = 100 - panOffset.y;
        const textElement = createElement(id, x1, y1, x1, y1, "text", {
          strokeColor: selectedColor.value,
          strokeWidth: 36,
          text: transcription,
        });
        console.log("Text element:", textElement);
        setElements((prev) => {
          const newElements = [...prev, textElement];
          console.log("Updated elements:", newElements);
          return newElements;
        });
        setAction("none");
        setSelectedElement(null);
        showCanvasAlert("Yay! Your audio has been transcribed!");
      } else {
        throw new Error("No transcription returned");
      }
    } catch (error) {
      console.error("Error processing audio:", error);
      showCanvasAlert("Oops! Couldn't transcribe the audio!");
    } finally {
      setIsLoading(false);
      setAudioBlob(null);
    }
  };

  const handleMagicOption = (option) => {
    const timestamp = Date.now();
    let filename;

    switch (option) {
      case "Make Image":
        filename = `image-${timestamp}.png`;
        saveAsImage();
        break;
      case "Make Video":
        filename = `video-screenshot-${timestamp}.png`;
        break;
      case "Make Animation":
        filename = `animation-screenshot-${timestamp}.png`;
        break;
      case "Audio":
        filename = `audio-screenshot-${timestamp}.png`;
        if (!isRecording) {
          startRecording();
        } else {
          stopRecording();
        }
        break;
      default:
        filename = `screenshot-${timestamp}.png`;
    }

    setMagicMenuOpen(false);
    console.log(`Selected: ${option} -  saved as ${filename}`);
  };

  const playerOptions = {
    height: "100%",
    width: "100%",
    playerVars: {
      autoplay: 0,
      controls: 1,
      modestbranding: 1,
      rel: 0,
      fs: 1,
      origin: window.location.origin,
    },
  };

  const handleVideoSectionScroll = (e) => {
    e.stopPropagation();
  };

  return (
    <div
      className="w-screen h-screen overflow-hidden font-[Comic Sans MS]"
      style={{ background: pageColor || "linear-gradient(to-br, #fefcbf, #fed7aa, #f3e8ff)" }}
    >
      <div
        className="fixed z-10 flex items-center justify-between p-4 bg-yellow-200 shadow-lg top-4 left-4 rounded-xl"
        style={{
          right: showVideoSection ? `${window.innerWidth * 0.25 + 16}px` : "1rem",
        }}
      >
        <div className="flex space-x-2">
          <button
            onClick={() => setTool("selection")}
            className={`px-4 py-2 rounded-lg text-purple-800 font-bold ${
              tool === "selection" ? "bg-blue-300" : "bg-blue-100"
            } hover:bg-blue-200 transition`}
          >
            <svg className="inline-block w-6 h-6 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M6.672 1.911a1 1 0 10-1.932.518l.259.966a1 1 0 001.932-.518l-.26-.966zM2.429 4.74a1 1 0 10-.517 1.932l.966.259a1 1 0 00.517-1.932l-.966-.26zm8.814-.569a1 1 0 00-1.415-1.414l-.707.707a1 1 0 101.415 1.415l.707-.708zm-7.071 7.072l.707-.707A1 1 0 003.465 9.12l-.708.707a1 1 0 001.415 1.415zm3.2-5.171a1 1 0 00-1.3 1.3l4 10a1 1 0 001.823.075l1.38-2.759 3.018 3.02a1 1 0 001.414-1.415l-3.019-3.02 2.76-1.379a1 1 0 00-.076-1.822l-10-4z"
                clipRule="evenodd"
              />
            </svg>
            Move
          </button>
          <button
            onClick={() => setTool("pencil")}
            className={`px-4 py-2 rounded-lg text-purple-800 font-bold ${
              tool === "pencil" ? "bg-green-300" : "bg-green-100"
            } hover:bg-green-200 transition`}
          >
            <svg className="inline-block w-6 h-6 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793z" />
              <path d="M11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
            Draw
          </button>

          
          <button
            onClick={() => setTool("line")}
            className={`px-4 py-2 rounded-lg text-purple-800 font-bold ${
              tool === "line" ? "bg-orange-300" : "bg-orange-100"
            } hover:bg-orange-200 transition`}
          >
            <svg className="inline-block w-6 h-6 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
            Line
          </button>


          
          <button
            onClick={() => setTool("rectangle")}
            className={`px-4 py-2 rounded-lg text-purple-800 font-bold ${
              tool === "rectangle" ? "bg-purple-300" : "bg-purple-100"
            } hover:bg-purple-200 transition`}
          >
            <svg className="inline-block w-6 h-6 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M3 5a2 2 0 012-2h10a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V5zm11 1H6v8h8V6z"
                clipRule="evenodd"
              />
            </svg>
            Box
          </button>
          <button
            onClick={() => setTool("text")}
            className={`px-4 py-2 rounded-lg text-purple-800 font-bold ${
              tool === "text" ? "bg-pink-300" : "bg-pink-100"
            } hover:bg-pink-200 transition`}
          >
            <svg className="inline-block w-6 h-6 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"
                clipRule="evenodd"
              />
            </svg>
            Words
          </button>

          <div className="relative">
            <button
              onClick={() => {
                setShowColorPanel(!showColorPanel);
                setShowThicknessPanel(false);
                setShowFillPanel(false);
              }}
              className="px-4 py-2 font-bold text-purple-800 transition bg-yellow-100 rounded-lg hover:bg-yellow-200"
            >
              <div
                className="inline-block w-6 h-6 mr-1 border-2 border-purple-500 rounded-full"
                style={{ backgroundColor: selectedColor.value }}
              ></div>
              Color
            </button>
            {showColorPanel && (
              <div className="absolute left-0 z-20 p-4 mt-2 bg-white shadow-lg rounded-xl top-full">
                <div className="grid grid-cols-4 gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => {
                        setSelectedColor(color);
                        setShowColorPanel(false);
                      }}
                      className="w-8 h-8 border-2 border-purple-500 rounded-full"
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    >
                      {selectedColor.value === color.value && (
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => {
                setShowThicknessPanel(!showThicknessPanel);
                setShowColorPanel(false);
                setShowFillPanel(false);
              }}
              className="px-4 py-2 font-bold text-purple-800 transition bg-yellow-100 rounded-lg hover:bg-yellow-200"
            >
              <svg className="inline-block w-6 h-6 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
              Size
            </button>
            {showThicknessPanel && (
              <div className="absolute left-0 z-20 p-4 mt-2 bg-white shadow-lg rounded-xl top-full">
                {thicknessOptions.map((thickness) => (
                  <button
                    key={thickness.value}
                    onClick={() => {
                      setSelectedThickness(thickness);
                      setShowThicknessPanel(false);
                    }}
                    className="flex items-center w-full p-2 text-purple-800 rounded hover:bg-gray-100"
                  >
                    <div
                      className="w-12 mr-2 bg-gray-800 rounded-full"
                      style={{ height: `${thickness.value}px` }}
                    ></div>
                    <span>{thickness.name}</span>
                    {selectedThickness.value === thickness.value && (
                      <svg
                        className="w-5 h-5 ml-auto text-purple-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => {
                setShowFillPanel(!showFillPanel);
                setShowColorPanel(false);
                setShowThicknessPanel(false);
              }}
              className="px-4 py-2 font-bold text-purple-800 transition bg-yellow-100 rounded-lg hover:bg-yellow-200"
            >
              <svg className="inline-block w-6 h-6 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M5 2a2 2 0 00-2 2v14l3.5-2 3.5 2 3.5-2 3.5 2V4a2 2 0 00-2-2H5zm4.707 3.707a1 1 0 00-1.414-1.414l-3 3a1 1 0 001.414 1.414l3-3zM11.293 9.707a1 1 0 011.414-1.414l3 3a1 1 0 01-1.414 1.414l-3-3z"
                  clipRule="evenodd"
                />
              </svg>
              Fill
            </button>
            {showFillPanel && (
              <div className="absolute left-0 z-20 p-4 mt-2 bg-white shadow-lg rounded-xl top-full">
                <div className="mb-3">
                  <h4 className="mb-2 text-sm font-bold text-purple-800">Fill Style</h4>
                  {fillOptions.map((fillStyle) => (
                    <button
                      key={fillStyle.value}
                      onClick={() => setSelectedFillStyle(fillStyle)}
                      className={`flex items-center w-full p-2 rounded ${
                        selectedFillStyle.value === fillStyle.value
                          ? "bg-purple-100 text-purple-800"
                          : "hover:bg-gray-100"
                      }`}
                    >
                      <span>{fillStyle.name}</span>
                      {selectedFillStyle.value === fillStyle.value && (
                        <svg
                          className="w-5 h-5 ml-auto text-purple-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
                {selectedFillStyle.value !== "none" && (
                  <div>
                    <h4 className="mb-2 text-sm font-bold text-purple-800">Fill Color</h4>
                    <div className="grid grid-cols-4 gap-2">
                      {colorOptions.map((color) => (
                        <button
                          key={`fill-${color.value}`}
                          onClick={() => setSelectedFillColor(color)}
                          className="w-8 h-8 border-2 border-purple-500 rounded-full"
                          style={{ backgroundColor: color.value }}
                          title={color.name}
                        >
                          {selectedFillColor.value === color.value && (
                            <svg
                              className="w-6 h-6 text-white"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`px-4 py-2 rounded-lg text-purple-800 font-bold ${
              showGrid ? "bg-teal-300" : "bg-teal-100"
            } hover:bg-teal-200 transition`}
          >
            <svg className="inline-block w-6 h-6 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9v6m6-6v6m-3-9v12M5 5h14v14H5V5z" />
            </svg>
            Grid
          </button>

          <input
            type="color"
            value={pageColor || "#ffffff"}
            onChange={(e) => setPageColor(e.target.value === "#ffffff" ? "" : e.target.value)}
            className="w-10 h-10 border-2 border-purple-500 rounded-lg cursor-pointer"
            title="Page Color"
          />

          <button
            onClick={() => setShowVideoSection(!showVideoSection)}
            className={`px-4 py-2 rounded-lg text-purple-800 font-bold ${
              showVideoSection ? "bg-red-300" : "bg-red-100"
            } hover:bg-red-200 transition`}
          >
            <svg className="inline-block w-6 h-6 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                clipRule="evenodd"
              />
            </svg>
            Video
          </button>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={undo}
            className="px-4 py-2 font-bold text-purple-800 transition bg-red-100 rounded-lg hover:bg-red-200"
            disabled={elements.length === 0}
          >
            <svg className="inline-block w-6 h-6 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z"
                clipRule="evenodd"
              />
            </svg>
            Undo
          </button>
          <button
            onClick={redo}
            className="px-4 py-2 font-bold text-purple-800 transition bg-red-100 rounded-lg hover:bg-red-200"
          >
            <svg className="inline-block w-6 h-6 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
            Redo
          </button>


          
          <button
            onClick={saveCanvasWithProcessedImage}
            className="px-4 py-2 font-bold text-purple-800 transition bg-green-100 rounded-lg hover:bg-green-200"
          >
            <svg className="inline-block w-6 h-6 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
            Picture
          </button>


          
          <button
            onClick={saveToDatabase}
            className="px-4 py-2 font-bold text-purple-800 transition bg-blue-100 rounded-lg hover:bg-blue-200"
          >
            <svg className="inline-block w-6 h-6 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
            Save
          </button>
          {/* <button
            onClick={() => loadFromDatabase("67feafe97904e414cabecb3f")}
            className="px-4 py-2 font-bold text-purple-800 transition bg-purple-100 rounded-lg hover:bg-purple-200"
          >
            <svg className="inline-block w-6 h-6 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M3 3a1 1 0 011-1h12a1 1 0 011 1v14a1 1 0 01-1 1H4a1 1 0 01-1-1V3zm10.293 4.293a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L14.586 11H7a1 1 0 110-2h7.586l-1.293-1.293a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
            Load
          </button> */}
        </div>
      </div>

      {showVideoSection && (
        <div
          className="fixed top-0 right-0 z-30 bg-white shadow-2xl"
          style={{
            width: `${window.innerWidth * 0.35}px`,
            height: "120vh",
            top: "2.5vh",
          }}
        >
          <div className="relative flex flex-col h-full p-4" onScroll={handleVideoSectionScroll}>
            <button
              className="absolute text-purple-800 top-2 right-2 hover:text-purple-600"
              onClick={() => {
                setShowVideoSection(false);
                setSelectedVideoId(null);
              }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h3 className="mb-4 text-2xl font-bold text-purple-800">Fun Videos for Kids!</h3>

            <div className="flex mb-6">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    fetchVideos(searchQuery);
                  }
                }}
                placeholder="Search for kid-friendly videos..."
                className="flex-1 px-4 py-3 mr-2 text-lg border-2 border-purple-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                onClick={() => fetchVideos(searchQuery)}
                className="px-6 py-3 text-lg font-bold text-white transition bg-purple-500 rounded-lg hover:bg-purple-600"
              >
                Search
              </button>
            </div>

            {error && <p className="mb-4 text-lg text-red-600">{error}</p>}
            {selectedVideoId ? (
              <div className="flex-1">
                <div className="relative" style={{ paddingBottom: "75%", height: 0 }}>
                  <div className="absolute top-0 left-0 w-full h-full">
                    <YouTube videoId={selectedVideoId} opts={playerOptions} />
                  </div>
                </div>
                <button
                  onClick={() => setSelectedVideoId(null)}
                  className="w-full px-4 py-3 mt-4 text-lg font-bold text-purple-800 transition bg-yellow-100 rounded-lg hover:bg-yellow-200"
                >
                  Back to Videos
                </button>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto" onScroll={handleVideoSectionScroll}>
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center h-full">
                    <div className="relative w-16 h-16">
                      <div className="absolute w-16 h-16 border-4 border-purple-200 rounded-full"></div>
                      <div className="absolute w-16 h-16 border-4 border-purple-500 rounded-full border-t-transparent animate-spin"></div>
                    </div>
                    <p className="mt-4 text-lg font-semibold text-purple-800">Loading fun videos...</p>
                  </div>
                ) : videos.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4">
                    {videos.map((video) => (
                      <div
                        key={video.id}
                        className="flex flex-col p-4 transition bg-gray-100 rounded-lg cursor-pointer hover:bg-gray-200"
                        onClick={() => setSelectedVideoId(video.id)}
                      >
                        <div className="relative mb-3" style={{ paddingBottom: "75%" }}>
                          <img
                            src={video.thumbnail}
                            alt={video.title}
                            className="absolute top-0 left-0 object-cover w-full h-full rounded-lg"
                          />
                        </div>
                        <h4 className="text-lg font-semibold text-purple-800 line-clamp-2">{video.title}</h4>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full">
                    <p className="text-lg text-purple-800">No videos found. Try searching for something fun!</p>
                  </div>
                )}
              </div>
            )}
            <button
              onClick={() => window.open("https://www.youtubekids.com/", "_blank")}
              className="w-full px-4 py-3 mt-4 text-lg font-bold text-purple-800 transition bg-yellow-100 rounded-lg hover:bg-yellow-200"
            >
              Open YouTube Kids
            </button>
          </div>
        </div>
      )}

      {action === "writing" && (
        <textarea
          ref={textAreaRef}
          onBlur={handleBlur}
          style={{
            position: "fixed",
            top: selectedElement.y1 - 2 + panOffset.y,
            left: selectedElement.x1 + panOffset.x,
            font: `${selectedElement.strokeWidth || 36}px 'Comic Sans MS', 'Chalkboard', sans-serif`,
            color: selectedElement.strokeColor || "#000000",
            margin: 0,
            padding: "4px",
            border: "2px dashed #FFD700",
            outline: 0,
            resize: "auto",
            overflow: "hidden",
            whiteSpace: "pre",
            background: "rgba(255, 255, 255, 0.8)",
            zIndex: 20,
            borderRadius: "8px",
            maxWidth: showVideoSection ? `${window.innerWidth * 0.75 - selectedElement.x1 - 20}px` : "none",
          }}
          className="min-w-[50px] min-h-[24px]"
        />
      )}

      <canvas
        ref={canvasRef}
        id="canvas"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="absolute top-0 left-0 z-0 touch-none"
        style={{
          cursor: tool === "selection" ? "default" : "crosshair",
          width: showVideoSection ? `${window.innerWidth * 0.75}px` : "100%",
        }}
      />

      <div
        className="absolute bottom-10"
        style={{
          right: showVideoSection ? `${window.innerWidth * 0.25 + 40}px` : "2.5rem",
        }}
      >
        <button
          className="flex items-center justify-center w-16 h-16 transition rounded-full shadow-xl bg-gradient-to-r from-purple-400 to-pink-400 animate-bounce hover:scale-110"
          onClick={toggleMagicMenu}
          title="Magic Options"
        >
          <span className="text-2xl text-white">✨</span>
        </button>
        {magicMenuOpen && (
          <div className="absolute right-0 p-3 bg-white border-2 border-purple-500 rounded-lg shadow-xl bottom-20">
            <button
              className="block w-full px-4 py-2 font-bold text-purple-800 rounded-md hover:bg-yellow-100"
              onClick={() => handleMagicOption("Make Image")}
            >
              🖼️ Image
            </button>
            <button
              className="block w-full px-4 py-2 font-bold text-purple-800 rounded-md hover:bg-yellow-100"
              onClick={() => handleMagicOption("Make Video")}
            >
              🎥 Video
            </button>
            <button
              className="block w-full px-4 py-2 font-bold text-purple-800 rounded-md hover:bg-yellow-100"
              onClick={() => handleMagicOption("Make Animation")}
            >
              🎬 Animation
            </button>
            <button
              className="block w-full px-4 py-2 font-bold text-purple-800 rounded-md hover:bg-yellow-100"
              onClick={() => handleMagicOption("Audio")}
            >
              {isRecording ? "🎤 Stop Recording" : "🎵 Record Audio"}
            </button>
          </div>
        )}
      </div>

      {isRecording && (
        <div className="fixed z-50 flex flex-col items-center bottom-28 right-10">
          <div className="relative flex items-center justify-center w-20 h-20">
            <div className="absolute w-20 h-20 bg-red-200 rounded-full opacity-75 animate-ping"></div>
            <svg
              className="w-12 h-12 text-red-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm-1.5 4a4.5 4.5 0 019 0V8c0 2.485 2.015 4.5 4.5 4.5h.5a1 1 0 110 2h-.5A6.5 6.5 0 013 8V8a4.5 4.5 0 01-1.5-8z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <button
            onClick={stopRecording}
            className="px-4 py-2 mt-4 font-bold text-white transition bg-red-500 rounded-lg hover:bg-red-600"
          >
            Stop Recording
          </button>
        </div>
      )}

      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="flex flex-col items-center justify-center">
            <div className="relative w-16 h-16">
              <div className="absolute w-16 h-16 border-4 border-purple-200 rounded-full"></div>
              <div className="absolute w-16 h-16 border-4 border-purple-500 rounded-full border-t-transparent animate-spin"></div>
            </div>
            <p className="mt-4 text-lg font-semibold text-white">Processing your audio...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default FirstBoard;