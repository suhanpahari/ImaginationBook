import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import rough from "roughjs/bundled/rough.esm";
import getStroke from "perfect-freehand";

const generator = rough.generator();

// Available colors for elements
const colorOptions = [
  { name: "Black", value: "#000000" },
  { name: "Red", value: "#FF3B30" },
  { name: "Orange", value: "#FF9500" },
  { name: "Yellow", value: "#FFCC00" },
  { name: "Green", value: "#34C759" },
  { name: "Blue", value: "#007AFF" },
  { name: "Purple", value: "#AF52DE" },
  { name: "Pink", value: "#FF2D55" }
];



// Thickness options
const thicknessOptions = [
  { name: "Thin", value: 2 },
  { name: "Medium", value: 4 },
  { name: "Thick", value: 6 },
  { name: "Extra Thick", value: 10 }
];




// Fill options for closed shapes
const fillOptions = [
  { name: "None", value: "none" },
  { name: "Solid", value: "solid" },
  { name: "Hachure", value: "hachure" },
  { name: "Zigzag", value: "zigzag" },
  { name: "Cross-hatch", value: "cross-hatch" }
];

const createElement = (id, x1, y1, x2, y2, type, options = {}) => {
  const { strokeColor = "#000000", strokeWidth = 2, fillStyle = "none", fill = "none" } = options;
  
  const roughOptions = {
    strokeWidth,
    stroke: strokeColor,
    fillStyle: fillStyle !== "none" ? fillStyle : undefined,
    fill: fill !== "none" ? fill : undefined
  };
  
  switch (type) 
  {
    case "line":
      const roughLine = generator.line(x1, y1, x2, y2, roughOptions);
      return { id, x1, y1, x2, y2, type, roughElement: roughLine, ...options };
      
    case "rectangle":
      const roughRect = generator.rectangle(x1, y1, x2 - x1, y2 - y1, roughOptions);
      return { id, x1, y1, x2, y2, type, roughElement: roughRect, ...options };
      
    case "pencil":
      return { id, type, points: [{ x: x1, y: y1 }], ...options };
      
    case "text":
      return { id, type, x1, y1, x2, y2, text: "", ...options };
      
    default:
      throw new Error(`Type not recognised: ${type}`);
  }
};

// Other utility functions remain the same
const nearPoint = (x, y, x1, y1, name) => {
  return Math.abs(x - x1) < 5 && Math.abs(y - y1) < 5 ? name : null;
};

const onLine = (x1, y1, x2, y2, x, y, maxDistance = 1) => {
  const a = { x: x1, y: y1 };
  const b = { x: x2, y: y2 };
  const c = { x, y };
  const offset = distance(a, b) - (distance(a, c) + distance(b, c));
  return Math.abs(offset) < maxDistance ? "inside" : null;
};

const positionWithinElement = (x, y, element) => 
  {
  const { type, x1, x2, y1, y2 } = element;
  switch (type) {
    case "line":
      const on = onLine(x1, y1, x2, y2, x, y);
      const start = nearPoint(x, y, x1, y1, "start");
      const end = nearPoint(x, y, x2, y2, "end");
      return start || end || on;
      
    case "rectangle":
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
    case "text":
      return x >= x1 && x <= x2 && y >= y1 && y <= y2 ? "inside" : null;
    default:
      throw new Error(`Type not recognised: ${type}`);
  }
};

const distance = (a, b) => Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));

const getElementAtPosition = (x, y, elements) => {
  return elements
    .map(element => ({ ...element, position: positionWithinElement(x, y, element) }))
    .find(element => element.position !== null);
};

const adjustElementCoordinates = element => {
  const { type, x1, y1, x2, y2 } = element;
  if (type === "rectangle") {
    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);
    const minY = Math.min(y1, y2);
    const maxY = Math.max(y1, y2);
    return { x1: minX, y1: minY, x2: maxX, y2: maxY };
  } else {
    if (x1 < x2 || (x1 === x2 && y1 < y2)) {
      return { x1, y1, x2, y2 };
    } else {
      return { x1: x2, y1: y2, x2: x1, y2: y1 };
    }
  }
};

const cursorForPosition = position => {
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

const useHistory = initialState => {
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
      setIndex(prevState => prevState + 1);
    }
  };

  const undo = () => index > 0 && setIndex(prevState => prevState - 1);
  const redo = () => index < history.length - 1 && setIndex(prevState => prevState + 1);

  return [history[index], setState, undo, redo];
};

const getSvgPathFromStroke = stroke => 
  {
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
      const stroke = getSvgPathFromStroke(getStroke(element.points, {
        size: element.strokeWidth || 2,
        thinning: 0.5,
        smoothing: 0.5,
        streamline: 0.5,
      }));
      context.save();
      context.fillStyle = element.strokeColor || "#000000";
      context.fill(new Path2D(stroke));
      context.restore();
      break;
    case "text":
      context.save();
      context.textBaseline = "top";
      context.font = `${element.strokeWidth || 24}px SF Pro, -apple-system, BlinkMacSystemFont, sans-serif`;
      context.fillStyle = element.strokeColor || "#000000";
      context.fillText(element.text, element.x1, element.y1);
      context.restore();
      break;
    default:
      throw new Error(`Type not recognised: ${element.type}`);
  }
};

const adjustmentRequired = type => ["line", "rectangle"].includes(type);

const usePressedKeys = () => {
  const [pressedKeys, setPressedKeys] = useState(new Set());

  useEffect(() => {
    const handleKeyDown = event => {
      setPressedKeys(prevKeys => new Set(prevKeys).add(event.key));
    };

    const handleKeyUp = event => {
      setPressedKeys(prevKeys => {
        const updatedKeys = new Set(prevKeys);
        updatedKeys.delete(event.key);
        return updatedKeys;
      });
    };

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
  const [tool, setTool] = useState("rectangle");
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
  const textAreaRef = useRef();
  const canvasRef = useRef();
  const pressedKeys = usePressedKeys();

  useLayoutEffect(() => {
    const canvas = document.getElementById("canvas");
    const context = canvas.getContext("2d");
    const roughCanvas = rough.canvas(canvas);

    context.clearRect(0, 0, canvas.width, canvas.height);

    context.save();
    context.translate(panOffset.x, panOffset.y);

    elements.forEach(element => {
      if (action === "writing" && selectedElement?.id === element.id) return;
      drawElement(roughCanvas, context, element);
    });
    context.restore();
  }, [elements, action, selectedElement, panOffset]);

  useEffect(() => {
    const undoRedoFunction = event => {
      if ((event.metaKey || event.ctrlKey) && event.key === "z") {
        if (event.shiftKey) {
          redo();
        } else {
          undo();
        }
      }
    };

    document.addEventListener("keydown", undoRedoFunction);
    return () => {
      document.removeEventListener("keydown", undoRedoFunction);
    };
  }, [undo, redo]);

  useEffect(() => {
    const panFunction = event => {
      setPanOffset(prevState => ({
        x: prevState.x - event.deltaX,
        y: prevState.y - event.deltaY,
      }));
    };

    document.addEventListener("wheel", panFunction);
    return () => {
      document.removeEventListener("wheel", panFunction);
    };
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
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
        const canvas = document.getElementById("canvas");
        const context = canvas.getContext("2d");
        const roughCanvas = rough.canvas(canvas);

        context.clearRect(0, 0, canvas.width, canvas.height);

        context.save();
        context.translate(panOffset.x, panOffset.y);

        elements.forEach(element => {
          drawElement(roughCanvas, context, element);
        });
        context.restore();
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [elements, panOffset]);

  const updateElement = (id, x1, y1, x2, y2, type, options) => {
    const elementsCopy = [...elements];
    const elementOptions = {
      strokeColor: selectedColor.value,
      strokeWidth: selectedThickness.value,
      fillStyle: selectedFillStyle.value,
      fill: selectedFillStyle.value !== "none" ? selectedFillColor.value : "none",
      ...options
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
        const textWidth = document
          .getElementById("canvas")
          .getContext("2d")
          .measureText(options?.text || "").width;
        const textHeight = options?.strokeWidth || 24;
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

  const getMouseCoordinates = event => {
    const clientX = event.clientX - panOffset.x;
    const clientY = event.clientY - panOffset.y;
    return { clientX, clientY };
  };

  const handleMouseDown = event => {
    if (action === "writing") return;

    const { clientX, clientY } = getMouseCoordinates(event);

    if (event.button === 1 || pressedKeys.has(" ")) {
      setAction("panning");
      setStartPanMousePosition({ x: clientX, y: clientY });
      return;
    }

    if (tool === "selection") {
      const element = getElementAtPosition(clientX, clientY, elements);
      if (element) {
        if (element.type === "pencil") {
          const xOffsets = element.points.map(point => clientX - point.x);
          const yOffsets = element.points.map(point => clientY - point.y);
          setSelectedElement({ ...element, xOffsets, yOffsets });
        } else {
          const offsetX = clientX - element.x1;
          const offsetY = clientY - element.y1;
          setSelectedElement({ ...element, offsetX, offsetY });
        }
        setElements(prevState => prevState);

        if (element.position === "inside") {
          setAction("moving");
        } else {
          setAction("resizing");
        }
      }
    } else {
      const id = elements.length;
      const element = createElement(
        id, 
        clientX, 
        clientY, 
        clientX, 
        clientY, 
        tool, 
        {
          strokeColor: selectedColor.value,
          strokeWidth: selectedThickness.value,
          fillStyle: selectedFillStyle.value,
          fill: selectedFillStyle.value !== "none" ? selectedFillColor.value : "none"
        }
      );
      setElements(prevState => [...prevState, element]);
      setSelectedElement(element);

      setAction(tool === "text" ? "writing" : "drawing");
    }
  };

  const handleMouseMove = event => {
    const { clientX, clientY } = getMouseCoordinates(event);

    if (action === "panning") {
      const deltaX = clientX - startPanMousePosition.x;
      const deltaY = clientY - startPanMousePosition.y;
      setPanOffset({
        x: panOffset.x + deltaX,
        y: panOffset.y + deltaY,
      });
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
        elementsCopy[selectedElement.id] = {
          ...elementsCopy[selectedElement.id],
          points: newPoints,
        };
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
          text: selectedElement.text
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
        text: selectedElement.text
      };
      updateElement(id, x1, y1, x2, y2, type, options);
    }
  };

  const handleMouseUp = event => {
    const { clientX, clientY } = getMouseCoordinates(event);
    if (selectedElement) {
      if (
        selectedElement.type === "text" &&
        clientX - selectedElement.offsetX === selectedElement.x1 &&
        clientY - selectedElement.offsetY === selectedElement.y1
      ) {
        setAction("writing");
        return;
      }

      const index = selectedElement.id;
      const { id, type } = elements[index];
      if ((action === "drawing" || action === "resizing") && adjustmentRequired(type)) {
        const { x1, y1, x2, y2 } = adjustElementCoordinates(elements[index]);
        const options = {
          strokeColor: elements[index].strokeColor,
          strokeWidth: elements[index].strokeWidth,
          fillStyle: elements[index].fillStyle,
          fill: elements[index].fill,
          text: elements[index].text
        };
        updateElement(id, x1, y1, x2, y2, type, options);
      }
    }

    if (action === "writing") return;

    setAction("none");
    setSelectedElement(null);
  };

  const handleBlur = event => {
    const { id, x1, y1, type, strokeColor, strokeWidth, fillStyle, fill } = selectedElement;
    setAction("none");
    setSelectedElement(null);
    updateElement(id, x1, y1, null, null, type, { 
      text: event.target.value,
      strokeColor,
      strokeWidth,
      fillStyle,
      fill
    });
  };

  const saveAsImage = () => {
    const canvas = document.getElementById("canvas");
    
    // Create a temporary canvas to render without the UI
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempContext = tempCanvas.getContext("2d");
    
    // Fill with white background
    tempContext.fillStyle = "#ffffff";
    tempContext.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    
    // Copy the drawing
    tempContext.drawImage(canvas, 0, 0);
    
    // Create download link
    const link = document.createElement("a");
    link.download = "drawing.png";
    link.href = tempCanvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div className="w-screen h-screen overflow-hidden font-sans bg-gray-50">
      {/* Top Toolbar */}
      <div className="fixed top-0 left-0 right-0 z-10 flex items-center justify-between p-2 bg-white shadow">
        <div className="flex space-x-2">
          {/* Drawing Tools */}
          <div className="flex space-x-1">
            <button
              onClick={() => setTool("selection")}
              className={`p-2 rounded-md transition-colors ${
                tool === "selection" ? "bg-blue-100 text-blue-600" : "hover:bg-gray-100"
              }`}
              title="Selection Tool"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6.672 1.911a1 1 0 10-1.932.518l.259.966a1 1 0 001.932-.518l-.26-.966zM2.429 4.74a1 1 0 10-.517 1.932l.966.259a1 1 0 00.517-1.932l-.966-.26zm8.814-.569a1 1 0 00-1.415-1.414l-.707.707a1 1 0 101.415 1.415l.707-.708zm-7.071 7.072l.707-.707A1 1 0 003.465 9.12l-.708.707a1 1 0 001.415 1.415zm3.2-5.171a1 1 0 00-1.3 1.3l4 10a1 1 0 001.823.075l1.38-2.759 3.018 3.02a1 1 0 001.414-1.415l-3.019-3.02 2.76-1.379a1 1 0 00-.076-1.822l-10-4z" clipRule="evenodd" />
              </svg>
            </button>
            
            <button
              onClick={() => setTool("pencil")}
              className={`p-2 rounded-md transition-colors ${
                tool === "pencil" ? "bg-blue-100 text-blue-600" : "hover:bg-gray-100"
              }`}
              title="Pencil Tool"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
            </button>
            
            <button
              onClick={() => setTool("line")}
              className={`p-2 rounded-md transition-colors ${
                tool === "line" ? "bg-blue-100 text-blue-600" : "hover:bg-gray-100"
              }`}
              title="Line Tool"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            </button>
            
            <button
              onClick={() => setTool("rectangle")}
              className={`p-2 rounded-md transition-colors ${
                tool === "rectangle" ? "bg-blue-100 text-blue-600" : "hover:bg-gray-100"
              }`}
              title="Rectangle Tool"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V5zm11 1H6v8h8V6z" clipRule="evenodd" />
              </svg>
            </button>
            
            <button
              onClick={() => setTool("text")}
              className={`p-2 rounded-md transition-colors ${
                tool === "text" ? "bg-blue-100 text-blue-600" : "hover:bg-gray-100"
              }`}
              title="Text Tool"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          
          {/* Style Controls */}
          <div className="h-8 mx-2 border-l"></div>
          
          <div className="flex space-x-1">
            <div className="relative">
              <button
                onClick={() => {
                  setShowColorPanel(!showColorPanel);
                  setShowThicknessPanel(false);
                  setShowFillPanel(false);
                }}
                className="flex items-center p-2 rounded-md hover:bg-gray-100"
                title="Color"
              >
                <div 
                  className="w-4 h-4 border border-gray-300 rounded-full"
                  style={{ backgroundColor: selectedColor.value }}
                ></div>
                <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {showColorPanel && (
                <div className="absolute left-0 z-20 w-56 p-3 mt-1 bg-white rounded-lg shadow-lg top-full">
                  <div className="grid grid-cols-4 gap-2">
                    {colorOptions.map((color) => (
                      <button
                        key={color.value}
                        onClick={() => {
                          setSelectedColor(color);
                          setShowColorPanel(false);
                        }}
                        className="flex items-center justify-center w-10 h-10 border border-gray-200 rounded-full"
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                      >
                        {selectedColor.value === color.value && (
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
          
          <div className="relative">
            <button
              onClick={() => {
                setShowThicknessPanel(!showThicknessPanel);
                setShowColorPanel(false);
                setShowFillPanel(false);
              }}
              className="flex items-center p-2 rounded-md hover:bg-gray-100"
              title="Thickness"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
              <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {showThicknessPanel && (
              <div className="absolute left-0 z-20 w-48 p-3 mt-1 bg-white rounded-lg shadow-lg top-full">
                {thicknessOptions.map((thickness) => (
                  <button
                    key={thickness.value}
                    onClick={() => {
                      setSelectedThickness(thickness);
                      setShowThicknessPanel(false);
                    }}
                    className="flex items-center w-full p-2 rounded hover:bg-gray-100"
                  >
                    <div 
                      className="w-12 mr-2 bg-gray-800 rounded-full"
                      style={{ height: `${thickness.value}px` }}
                    ></div>
                    <span>{thickness.name}</span>
                    {selectedThickness.value === thickness.value && (
                      <svg
                        className="w-5 h-5 ml-auto text-blue-500"
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
            )}
          </div>
          
          <div className="relative">
            <button
              onClick={() => {
                setShowFillPanel(!showFillPanel);
                setShowColorPanel(false);
                setShowThicknessPanel(false);
              }}
              className="flex items-center p-2 rounded-md hover:bg-gray-100"
              title="Fill Style"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 2a2 2 0 00-2 2v14l3.5-2 3.5 2 3.5-2 3.5 2V4a2 2 0 00-2-2H5zm4.707 3.707a1 1 0 00-1.414-1.414l-3 3a1 1 0 001.414 1.414l3-3zM11.293 9.707a1 1 0 011.414-1.414l3 3a1 1 0 01-1.414 1.414l-3-3z" clipRule="evenodd" />
              </svg>
              <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {showFillPanel && (
              <div className="absolute left-0 z-20 w-64 p-3 mt-1 bg-white rounded-lg shadow-lg top-full">
                <div className="mb-3">
                  <h4 className="mb-2 text-sm font-medium text-gray-600">Fill Style</h4>
                  <div className="space-y-2">
                    {fillOptions.map((fillStyle) => (
                      <button
                        key={fillStyle.value}
                        onClick={() => setSelectedFillStyle(fillStyle)}
                        className={`flex items-center w-full p-2 rounded ${
                          selectedFillStyle.value === fillStyle.value ? "bg-blue-50 text-blue-600" : "hover:bg-gray-100"
                        }`}
                      >
                        <span>{fillStyle.name}</span>
                        {selectedFillStyle.value === fillStyle.value && (
                          <svg
                            className="w-5 h-5 ml-auto text-blue-500"
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
                
                {selectedFillStyle.value !== "none" && (
                  <div>
                    <h4 className="mb-2 text-sm font-medium text-gray-600">Fill Color</h4>
                    <div className="grid grid-cols-4 gap-2">
                      {colorOptions.map((color) => (
                        <button
                          key={`fill-${color.value}`}
                          onClick={() => setSelectedFillColor(color)}
                          className="flex items-center justify-center w-10 h-10 border border-gray-200 rounded-full"
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
        </div>
      </div>
      
      <div className="flex space-x-2">
        <button
          onClick={undo}
          className="p-2 transition-colors rounded-md hover:bg-gray-100"
          title="Undo"
          disabled={elements.length === 0}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
        </button>
        
        <button
          onClick={redo}
          className="p-2 transition-colors rounded-md hover:bg-gray-100"
          title="Redo"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
        
        <div className="h-8 mx-1 border-l"></div>
        
        <button
          onClick={saveAsImage}
          className="flex items-center px-3 py-2 text-white transition-colors bg-blue-500 rounded-md hover:bg-blue-600"
          title="Save as Image"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          Save
        </button>
      </div>
    </div>

    {/* Text Area for Text Tool */}
    {action === "writing" ? (
      <textarea
        ref={textAreaRef}
        onBlur={handleBlur}
        style={{
          position: "fixed",
          top: selectedElement.y1 - 2 + panOffset.y,
          left: selectedElement.x1 + panOffset.x,
          font: `${selectedElement.strokeWidth || 24}px SF Pro, -apple-system, BlinkMacSystemFont, sans-serif`,
          color: selectedElement.strokeColor || "#000000",
          margin: 0,
          padding: 0,
          border: 0,
          outline: 0,
          resize: "auto",
          overflow: "hidden",
          whiteSpace: "pre",
          background: "transparent",
          zIndex: 20,
        }}
        className="min-w-[50px] min-h-[24px]"
      />
    ) : null}

    {/* Canvas */}
    <canvas
      id="canvas"
      ref={canvasRef}
      width={window.innerWidth}
      height={window.innerHeight}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      className="absolute top-0 left-0 z-0 touch-none"
    >
      Canvas
    </canvas>
    
    {/* Hint Dialog - initially shown */}
    <div className="fixed z-20 max-w-sm p-4 bg-white border border-gray-200 rounded-lg shadow-lg bottom-4 right-4 animate-fade-in">
      <div className="flex items-start">
        <div className="flex-shrink-0 text-blue-500">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        {/* <div className="ml-3">
          <h3 className="text-sm font-medium text-gray-900">Drawing Tools</h3>
          <div className="mt-2 text-sm text-gray-500">
            <ul className="pl-5 space-y-1 list-disc">
              <li>Use the selection tool to move and resize elements</li>
              <li>Press space while dragging to pan the canvas</li>
              <li>Customize color, thickness, and fill style from the toolbar</li>
              <li>Use undo/redo or Cmd+Z / Ctrl+Z for quick corrections</li>
            </ul>
          </div>
        </div> */}
      </div>
    </div>
  </div>
);
};

export default FirstBoard;