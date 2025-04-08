"use client"

import React from "react"
import { useEffect, useRef, useState } from "react"
import { RoughCanvas } from "roughjs/bin/canvas"
import {
  Pencil,
  Square,
  Circle,
  Move,
  Trash2,
  Download,
  ZoomIn,
  ZoomOut,
  Undo,
  Redo,
  ImageIcon,
  Minus,
  Plus,
} from "lucide-react"

// Cartoon figures data
const cartoonFigures = [
  {
    id: "cartoon-1",
    name: "Cartoon Cat",
    src: "https://th.bing.com/th/id/OIP.DLVD0nvNcdOSWCj9ui22ZwHaGm?w=860&h=767&rs=1&pid=ImgDetMain",
  },
  {
    id: "cartoon-2",
    name: "Cartoon Dog",
    src: "https://static.vecteezy.com/system/resources/previews/022/938/540/non_2x/cute-cat-line-art-for-drawing-free-vector.jpg",
  },
  {
    id: "cartoon-3",
    name: "Cartoon Bird",
    src: "https://th.bing.com/th/id/OIP.CEG8SXa4gpQQSCvK-13wOQHaIg?rs=1&pid=ImgDetMain?height=100&width=100",
  },
]

export default function InfiniteCanvas() {
  const canvasRef = useRef(null)
  const roughCanvasRef = useRef(null)
  const [elements, setElements] = useState([])
  const [action, setAction] = useState("none")
  const [tool, setTool] = useState("pencil")
  const [selectedElement, setSelectedElement] = useState(null)
  const [strokeColor, setStrokeColor] = useState("#000000")
  const [fillColor, setFillColor] = useState("")
  const [strokeWidth, setStrokeWidth] = useState(2)
  const [history, setHistory] = useState([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })
  const [startPanMousePosition, setStartPanMousePosition] = useState({ x: 0, y: 0 })
  const [scale, setScale] = useState(1)
  const [cartoonMenuOpen, setCartoonMenuOpen] = useState(false)
  const [selectedCartoon, setSelectedCartoon] = useState(null)
  const [cartoonImages, setCartoonImages] = useState({})

  // Load cartoon images
  useEffect(() => {
    const images = {}

    cartoonFigures.forEach((figure) => {
      const img = new Image()
      img.src = figure.src
      img.crossOrigin = "anonymous"
      images[figure.id] = img
    })

    setCartoonImages(images)
  }, [])

  // Initialize rough canvas
  useEffect(() => {
    if (canvasRef.current) {
      roughCanvasRef.current = new RoughCanvas(canvasRef.current)
    }
  }, [])

  // Resize canvas to fit window
  useEffect(() => {
    const resizeCanvas = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth
        canvasRef.current.height = window.innerHeight
        redrawCanvas()
      }
    }

    window.addEventListener("resize", resizeCanvas)
    resizeCanvas()

    return () => window.removeEventListener("resize", resizeCanvas)
  }, [])

  // Redraw canvas whenever elements, pan offset, or scale changes
  useEffect(() => {
    redrawCanvas()
  }, [elements, panOffset, scale])

  // Generate a unique ID
  const generateId = () => {
    return Math.random().toString(36).substr(2, 9)
  }

  // Add to history when elements change
  const updateHistory = (newElements) => {
    // Remove any future history if we're not at the end
    const newHistory = history.slice(0, historyIndex + 1)
    setHistory([...newHistory, [...newElements]])
    setHistoryIndex(newHistory.length)
  }

  // Undo action
  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1)
      setElements([...history[historyIndex - 1]])
    }
  }

  // Redo action
  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1)
      setElements([...history[historyIndex + 1]])
    }
  }

  // Get element at position
  const getElementAtPosition = (x, y) => {
    // Adjust for pan and scale
    const adjustedX = (x - panOffset.x) / scale
    const adjustedY = (y - panOffset.y) / scale

    // Check in reverse order (top elements first)
    for (let i = elements.length - 1; i >= 0; i--) {
      const element = elements[i]

      if (element.type === "cartoon") {
        // For cartoon elements
        const [x1, y1] = [element.points[0].x, element.points[0].y]
        const width = element.width || 100
        const height = element.height || 100

        if (adjustedX >= x1 && adjustedX <= x1 + width && adjustedY >= y1 && adjustedY <= y1 + height) {
          return { element, position: "inside" }
        }
      } else if (element.type === "rectangle") {
        // For rectangle elements
        const [x1, y1] = [element.points[0].x, element.points[0].y]
        const [x2, y2] = [element.points[1].x, element.points[1].y]

        if (
          adjustedX >= Math.min(x1, x2) &&
          adjustedX <= Math.max(x1, x2) &&
          adjustedY >= Math.min(y1, y2) &&
          adjustedY <= Math.max(y1, y2)
        ) {
          return { element, position: "inside" }
        }
      } else if (element.type === "circle") {
        // For circle elements
        const [x1, y1] = [element.points[0].x, element.points[0].y]
        const [x2, y2] = [element.points[1].x, element.points[1].y]
        const radius = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))

        if (Math.sqrt(Math.pow(adjustedX - x1, 2) + Math.pow(adjustedY - y1, 2)) <= radius) {
          return { element, position: "inside" }
        }
      } else if (element.type === "pencil") {
        // For pencil elements, check if point is near any line segment
        for (let i = 0; i < element.points.length - 1; i++) {
          const p1 = element.points[i]
          const p2 = element.points[i + 1]
          
          // Calculate distance from point to line segment
          const distance = distanceToLineSegment(adjustedX, adjustedY, p1.x, p1.y, p2.x, p2.y)
          
          if (distance < 10) { // 10px threshold for selection
            return { element, position: "inside" }
          }
        }
      }
    }

    return null
  }

  // Helper function to calculate distance from point to line segment
  const distanceToLineSegment = (x, y, x1, y1, x2, y2) => {
    const A = x - x1
    const B = y - y1
    const C = x2 - x1
    const D = y2 - y1

    const dot = A * C + B * D
    const lenSq = C * C + D * D
    let param = -1

    if (lenSq !== 0) param = dot / lenSq

    let xx, yy

    if (param < 0) {
      xx = x1
      yy = y1
    } else if (param > 1) {
      xx = x2
      yy = y2
    } else {
      xx = x1 + param * C
      yy = y1 + param * D
    }

    const dx = x - xx
    const dy = y - yy

    return Math.sqrt(dx * dx + dy * dy)
  }

  // Create rough element
  const createElement = (
    id,
    x1,
    y1,
    x2,
    y2,
    type,
    cartoonType
  ) => {
    const roughOptions = {
      seed: Math.floor(Math.random() * 2000),
      strokeWidth,
      stroke: strokeColor,
      roughness: 1.5,
    }

    if (fillColor) {
      roughOptions.fill = fillColor
      roughOptions.fillStyle = "solid"
    }

    let roughElement = null

    if (roughCanvasRef.current) {
      switch (type) {
        case "rectangle":
          roughElement = roughCanvasRef.current.generator.rectangle(x1, y1, x2 - x1, y2 - y1, roughOptions)
          break
        case "circle":
          const radius = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))
          roughElement = roughCanvasRef.current.generator.circle(x1, y1, radius * 2, roughOptions)
          break
        default:
          roughElement = null
      }
    }

    return {
      id,
      type,
      roughElement,
      points: [
        { x: x1, y: y1 },
        { x: x2, y: y2 },
      ],
      strokeColor,
      strokeWidth,
      fillColor,
      cartoonType,
      width: type === "cartoon" ? 100 : undefined,
      height: type === "cartoon" ? 100 : undefined,
      seed: roughOptions.seed,
    }
  }

  // Handle mouse down
  const handleMouseDown = (event) => {
    if (event.button !== 0) return // Only left mouse button

    const { clientX, clientY } = event

    if (tool === "move") {
      setAction("moving")
      setStartPanMousePosition({ x: clientX, y: clientY })
      return
    }

    // Adjust for pan and scale
    const adjustedX = (clientX - panOffset.x) / scale
    const adjustedY = (clientY - panOffset.y) / scale

    // Check if we're clicking on an existing element
    const elementAtPosition = getElementAtPosition(clientX, clientY)

    if (elementAtPosition) {
      const { element, position } = elementAtPosition
      setSelectedElement(element)
      setAction("moving")
      return
    }

    setAction("drawing")

    if (tool === "pencil") {
      const newElement = {
        id: generateId(),
        type: "pencil",
        points: [{ x: adjustedX, y: adjustedY }],
        strokeColor,
        strokeWidth,
      }

      setElements((prevElements) => [...prevElements, newElement])
      setSelectedElement(newElement)
    } else if (tool === "cartoon" && selectedCartoon) {
      const newElement = createElement(
        generateId(),
        adjustedX,
        adjustedY,
        adjustedX + 100,
        adjustedY + 100,
        "cartoon",
        selectedCartoon,
      )

      setElements((prevElements) => [...prevElements, newElement])
      setSelectedElement(newElement)
      updateHistory([...elements, newElement])
    } else {
      const id = generateId()
      const newElement = createElement(id, adjustedX, adjustedY, adjustedX, adjustedY, tool)

      setElements((prevElements) => [...prevElements, newElement])
      setSelectedElement(newElement)
    }
  }

  // Handle mouse move
  const handleMouseMove = (event) => {
    const { clientX, clientY } = event

    // Adjust for pan and scale
    const adjustedX = (clientX - panOffset.x) / scale
    const adjustedY = (clientY - panOffset.y) / scale

    if (action === "moving" && tool === "move") {
      const dx = clientX - startPanMousePosition.x
      const dy = clientY - startPanMousePosition.y

      setPanOffset((prev) => ({
        x: prev.x + dx,
        y: prev.y + dy,
      }))

      setStartPanMousePosition({ x: clientX, y: clientY })
      return
    }

    if (action === "drawing") {
      if (selectedElement) {
        if (selectedElement.type === "pencil") {
          const newPoints = [...selectedElement.points, { x: adjustedX, y: adjustedY }]
          const updatedElement = { ...selectedElement, points: newPoints }

          setElements((prevElements) => prevElements.map((el) => (el.id === selectedElement.id ? updatedElement : el)))

          setSelectedElement(updatedElement)
        } else if (["rectangle", "circle"].includes(selectedElement.type)) {
          const { id, type, points } = selectedElement
          const updatedElement = createElement(id, points[0].x, points[0].y, adjustedX, adjustedY, type)

          setElements((prevElements) => prevElements.map((el) => (el.id === selectedElement.id ? updatedElement : el)))

          setSelectedElement(updatedElement)
        }
      }
    } else if (action === "moving" && selectedElement) {
      // Move the selected element
      if (selectedElement.type === "pencil") {
        // For pencil, move all points
        const dx = adjustedX - selectedElement.points[0].x
        const dy = adjustedY - selectedElement.points[0].y

        const newPoints = selectedElement.points.map((point) => ({
          x: point.x + dx,
          y: point.y + dy,
        }))

        const updatedElement = { ...selectedElement, points: newPoints }

        setElements((prevElements) => prevElements.map((el) => (el.id === selectedElement.id ? updatedElement : el)))

        setSelectedElement(updatedElement)
      } else if (["rectangle", "circle", "cartoon"].includes(selectedElement.type)) {
        // For shapes, calculate the movement
        const dx = adjustedX - selectedElement.points[0].x
        const dy = adjustedY - selectedElement.points[0].y

        let updatedElement

        if (selectedElement.type === "cartoon") {
          updatedElement = {
            ...selectedElement,
            points: [
              { x: adjustedX, y: adjustedY },
              { x: adjustedX + (selectedElement.width || 100), y: adjustedY + (selectedElement.height || 100) },
            ],
          }
        } else {
          const width = selectedElement.points[1].x - selectedElement.points[0].x
          const height = selectedElement.points[1].y - selectedElement.points[0].y

          updatedElement = createElement(
            selectedElement.id,
            adjustedX,
            adjustedY,
            adjustedX + width,
            adjustedY + height,
            selectedElement.type,
          )
        }

        setElements((prevElements) => prevElements.map((el) => (el.id === selectedElement.id ? updatedElement : el)))

        setSelectedElement(updatedElement)
      }
    }
  }

  // Handle mouse up
  const handleMouseUp = () => {
    if (action === "drawing" || action === "moving") {
      if (selectedElement) {
        updateHistory([...elements])
      }
    }

    setAction("none")
    setSelectedElement(null)
  }

  // Handle touch events for mobile and stylus
  const handleTouchStart = (event) => {
    if (event.touches.length === 1) {
      const touch = event.touches[0]
      const mouseEvent = {
        clientX: touch.clientX,
        clientY: touch.clientY,
        button: 0,
      }

      handleMouseDown(mouseEvent)
    }
  }

  const handleTouchMove = (event) => {
    if (event.touches.length === 1) {
      const touch = event.touches[0]
      const mouseEvent = {
        clientX: touch.clientX,
        clientY: touch.clientY,
      }

      handleMouseMove(mouseEvent)
    }
  }

  const handleTouchEnd = () => {
    handleMouseUp()
  }

  // Redraw the canvas
  const redrawCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const context = canvas.getContext("2d")
    if (!context || !roughCanvasRef.current) return

    // Clear the canvas
    context.clearRect(0, 0, canvas.width, canvas.height)

    // Apply pan and scale transformations
    context.save()
    context.translate(panOffset.x, panOffset.y)
    context.scale(scale, scale)

    // Draw each element
    elements.forEach((element) => {
      context.globalAlpha = 1

      if (element.type === "pencil") {
        // Draw pencil strokes
        context.beginPath()
        context.moveTo(element.points[0].x, element.points[0].y)

        element.points.forEach((point) => {
          context.lineTo(point.x, point.y)
        })

        context.strokeStyle = element.strokeColor
        context.lineWidth = element.strokeWidth
        context.lineCap = "round"
        context.lineJoin = "round"
        context.stroke()
      } else if (element.type === "cartoon" && element.cartoonType) {
        // Draw cartoon image
        const img = cartoonImages[element.cartoonType]
        if (img) {
          const x = element.points[0].x
          const y = element.points[0].y
          const width = element.width || 100
          const height = element.height || 100

          context.drawImage(img, x, y, width, height)

          // Draw selection border if selected
          if (selectedElement && selectedElement.id === element.id) {
            context.strokeStyle = "#0099ff"
            context.lineWidth = 2
            context.strokeRect(x, y, width, height)
          }
        }
      } else if (element.roughElement) {
        // Draw rough.js elements
        roughCanvasRef.current.draw(element.roughElement)
      }
    })

    context.restore()
  }

  // Zoom in
  const zoomIn = () => {
    setScale((prevScale) => Math.min(prevScale * 1.2, 5))
  }

  // Zoom out
  const zoomOut = () => {
    setScale((prevScale) => Math.max(prevScale / 1.2, 0.1))
  }

  // Reset zoom and pan
  const resetView = () => {
    setScale(1)
    setPanOffset({ x: 0, y: 0 })
  }

  // Clear canvas
  const clearCanvas = () => {
    setElements([])
    updateHistory([])
  }

  // Save canvas as image
  const saveAsImage = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Create a temporary canvas to draw the image without UI elements
    const tempCanvas = document.createElement("canvas")
    tempCanvas.width = canvas.width
    tempCanvas.height = canvas.height

    const tempContext = tempCanvas.getContext("2d")
    if (!tempContext) return

    // Copy the current canvas to the temporary one
    tempContext.fillStyle = "white"
    tempContext.fillRect(0, 0, tempCanvas.width, tempCanvas.height)
    tempContext.drawImage(canvas, 0, 0)

    // Create download link
    const link = document.createElement("a")
    link.download = "infinite-canvas-drawing.png"
    link.href = tempCanvas.toDataURL("image/png")
    link.click()
  }

  // Increase stroke width
  const increaseStrokeWidth = () => {
    setStrokeWidth((prev) => Math.min(prev + 1, 10))
  }

  // Decrease stroke width
  const decreaseStrokeWidth = () => {
    setStrokeWidth((prev) => Math.max(prev - 1, 1))
  }

  // Toggle cartoon menu
  const toggleCartoonMenu = () => {
    setCartoonMenuOpen(!cartoonMenuOpen)
  }

  // Select cartoon
  const selectCartoon = (cartoonId) => {
    setSelectedCartoon(cartoonId)
    setTool("cartoon")
    setCartoonMenuOpen(false)
  }

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gray-100">
      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full cursor-crosshair touch-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ cursor: tool === "move" ? "grab" : "crosshair" }}
      />

      {/* Toolbar */}
      <div className="absolute flex items-center p-2 space-x-2 transform -translate-x-1/2 bg-white rounded-full shadow-lg top-4 left-1/2">
        <button
          className={`p-2 rounded-full ${tool === "pencil" ? "bg-blue-100" : "hover:bg-gray-100"}`}
          onClick={() => setTool("pencil")}
          title="Pencil"
        >
          <Pencil size={20} />
        </button>
        <button
          className={`p-2 rounded-full ${tool === "rectangle" ? "bg-blue-100" : "hover:bg-gray-100"}`}
          onClick={() => setTool("rectangle")}
          title="Rectangle"
        >
          <Square size={20} />
        </button>
        <button
          className={`p-2 rounded-full ${tool === "circle" ? "bg-blue-100" : "hover:bg-gray-100"}`}
          onClick={() => setTool("circle")}
          title="Circle"
        >
          <Circle size={20} />
        </button>
        <button
          className={`p-2 rounded-full ${tool === "cartoon" ? "bg-blue-100" : "hover:bg-gray-100"}`}
          onClick={toggleCartoonMenu}
          title="Cartoon Figures"
        >
          <ImageIcon size={20} />
        </button>
        <button
          className={`p-2 rounded-full ${tool === "move" ? "bg-blue-100" : "hover:bg-gray-100"}`}
          onClick={() => setTool("move")}
          title="Pan Canvas"
        >
          <Move size={20} />
        </button>

        <div className="w-px h-6 mx-1 bg-gray-300" />

        <div className="flex items-center space-x-1">
          <button
            className="p-2 rounded-full hover:bg-gray-100"
            onClick={decreaseStrokeWidth}
            title="Decrease Stroke Width"
          >
            <Minus size={16} />
          </button>
          <span className="w-5 text-sm font-medium text-center">{strokeWidth}</span>
          <button
            className="p-2 rounded-full hover:bg-gray-100"
            onClick={increaseStrokeWidth}
            title="Increase Stroke Width"
          >
            <Plus size={16} />
          </button>
        </div>

        <div className="w-px h-6 mx-1 bg-gray-300" />

        <input
          type="color"
          value={strokeColor}
          onChange={(e) => setStrokeColor(e.target.value)}
          className="w-8 h-8 rounded-full cursor-pointer"
          title="Stroke Color"
        />
        <input
          type="color"
          value={fillColor || "#ffffff"}
          onChange={(e) => setFillColor(e.target.value === "#ffffff" ? "" : e.target.value)}
          className="w-8 h-8 rounded-full cursor-pointer"
          title="Fill Color"
        />

        <div className="w-px h-6 mx-1 bg-gray-300" />

        <button className="p-2 rounded-full hover:bg-gray-100" onClick={undo} title="Undo" disabled={historyIndex <= 0}>
          <Undo size={20} className={historyIndex <= 0 ? "text-gray-300" : ""} />
        </button>
        <button
          className="p-2 rounded-full hover:bg-gray-100"
          onClick={redo}
          title="Redo"
          disabled={historyIndex >= history.length - 1}
        >
          <Redo size={20} className={historyIndex >= history.length - 1 ? "text-gray-300" : ""} />
        </button>

        <div className="w-px h-6 mx-1 bg-gray-300" />

        <button className="p-2 rounded-full hover:bg-gray-100" onClick={zoomIn} title="Zoom In">
          <ZoomIn size={20} />
        </button>
        <button className="p-2 rounded-full hover:bg-gray-100" onClick={zoomOut} title="Zoom Out">
          <ZoomOut size={20} />
        </button>
        <button className="p-2 rounded-full hover:bg-gray-100" onClick={resetView} title="Reset View">
          <span className="text-xs font-bold">1:1</span>
        </button>

        <div className="w-px h-6 mx-1 bg-gray-300" />

        <button className="p-2 rounded-full hover:bg-gray-100" onClick={clearCanvas} title="Clear Canvas">
          <Trash2 size={20} />
        </button>
        <button className="p-2 rounded-full hover:bg-gray-100" onClick={saveAsImage} title="Save as Image">
          <Download size={20} />
        </button>
      </div>

      {/* Cartoon Menu */}
      {cartoonMenuOpen && (
        <div className="absolute p-3 transform -translate-x-1/2 bg-white rounded-lg shadow-lg top-20 left-1/2">
          <h3 className="mb-2 text-sm font-medium">Cartoon Figures</h3>
          <div className="grid grid-cols-3 gap-2">
            {cartoonFigures.map((figure) => (
              <div
                key={figure.id}
                className={`p-2 cursor-pointer rounded-lg hover:bg-gray-100 ${
                  selectedCartoon === figure.id ? "bg-blue-100" : ""
                }`}
                onClick={() => selectCartoon(figure.id)}
              >
                <img src={figure.src || "/placeholder.svg"} alt={figure.name} className="object-contain w-16 h-16" />
                <p className="mt-1 text-xs text-center">{figure.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status Bar */}
      <div className="absolute px-3 py-1 text-xs bg-white rounded-lg shadow-sm bottom-4 left-4">
        <span>Zoom: {Math.round(scale * 100)}%</span>
      </div>
    </div>
  )
}
