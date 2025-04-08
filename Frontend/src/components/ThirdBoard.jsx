"use client"

import { useState, useRef, useEffect } from "react"
import { RoughCanvas } from "roughjs/bin/canvas"
import {
  Pencil,
  Square,
  Circle,
  Type,
  Trash2,
  Download,
  Move,
  ZoomIn,
  ZoomOut,
  Undo,
  Redo,
  ImageIcon,
} from "lucide-react"

// Cartoon figures data
const cartoonFigures = [
  { id: "cat", name: "Kitty", src: "/placeholder.svg?height=100&width=100" },
  { id: "dog", name: "Puppy", src: "/placeholder.svg?height=100&width=100" },
  { id: "bird", name: "Birdie", src: "/placeholder.svg?height=100&width=100" },
  { id: "fish", name: "Fishy", src: "/placeholder.svg?height=100&width=100" },
  { id: "rabbit", name: "Bunny", src: "/placeholder.svg?height=100&width=100" },
  { id: "bear", name: "Teddy", src: "/placeholder.svg?height=100&width=100" },
]

// Bright colors for kids
const kidColors = [
  "#FF0000", // Red
  "#FF9900", // Orange
  "#FFFF00", // Yellow
  "#33CC33", // Green
  "#3366FF", // Blue
  "#9933FF", // Purple
  "#FF66CC", // Pink
  "#000000", // Black
  "#FFFFFF", // White
]

// Background colors
const backgroundColors = [
  "#FFFFFF", // White
  "#F0F0F0", // Light Gray
  "#E0FFFF", // Light Cyan
  "#F5DEB3", // Wheat
  "#FFE4C4", // Bisque
  "#FAF0E6", // Linen
]

const ThirdBoard = () => {
  const canvasRef = useRef(null)
  const roughCanvasRef = useRef(null)
  const textInputRef = useRef(null)

  // Initialize state variables with default values
  const [elements, setElements] = useState([])
  const [action, setAction] = useState("none")
  const [tool, setTool] = useState("pencil")
  const [selectedElement, setSelectedElement] = useState(null)
  const [color, setColor] = useState("#FF0000")
  const [fillColor, setFillColor] = useState("")
  const [strokeWidth, setStrokeWidth] = useState(5)
  const [history, setHistory] = useState([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })
  const [startPanMousePosition, setStartPanMousePosition] = useState({ x: 0, y: 0 })
  const [scale, setScale] = useState(1)
  const [showGrid, setShowGrid] = useState(false)
  const [showCartoonMenu, setShowCartoonMenu] = useState(false)
  const [selectedCartoon, setSelectedCartoon] = useState(null)
  const [cartoonImages, setCartoonImages] = useState({})
  const [textInput, setTextInput] = useState("")
  const [showTextInput, setShowTextInput] = useState(false)
  const [textPosition, setTextPosition] = useState({ x: 0, y: 0 })
  const [showMagic, setShowMagic] = useState(false)
  const [magicPosition, setMagicPosition] = useState({ x: 100, y: 100 })
  const [resizing, setResizing] = useState(false)
  const [resizeStartPoint, setResizeStartPoint] = useState({ x: 0, y: 0 })
  const [resizeStartDimensions, setResizeStartDimensions] = useState({ width: 0, height: 0 })
  const [backgroundColor, setBackgroundColor] = useState("#FFFFFF")
  const [gridColor, setGridColor] = useState("#E0E0E0")
  const [gridSize, setGridSize] = useState(20)
  const [showBackgroundOptions, setShowBackgroundOptions] = useState(false)

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

      // Set initial canvas size
      const canvas = canvasRef.current
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight

      // Draw initial white background
      const ctx = canvas.getContext("2d")
      ctx.fillStyle = "white"
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }
  }, [])

  // Resize canvas when window resizes
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        const canvas = canvasRef.current
        const ctx = canvas.getContext("2d")
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

        canvas.width = window.innerWidth
        canvas.height = window.innerHeight

        ctx.putImageData(imageData, 0, 0)
        redrawCanvas()
      }
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Redraw canvas when elements, pan offset, or scale changes
  useEffect(() => {
    redrawCanvas()
  }, [elements, panOffset, scale, showGrid, backgroundColor])

  // Focus text input when showing
  useEffect(() => {
    if (showTextInput && textInputRef.current) {
      textInputRef.current.focus()
    }
  }, [showTextInput])

  // Generate a unique ID
  const generateId = () => {
    return Math.random().toString(36).substr(2, 9)
  }

  // Add to history when elements change
  const updateHistory = (newElements) => {
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
    const adjustedX = (x - panOffset.x) / scale
    const adjustedY = (y - panOffset.y) / scale

    for (let i = elements.length - 1; i >= 0; i--) {
      const element = elements[i]

      if (element.type === "text") {
        const canvas = canvasRef.current
        const ctx = canvas.getContext("2d")
        ctx.font = `${element.fontSize || 20}px Comic Sans MS`
        const textWidth = ctx.measureText(element.text).width
        const textHeight = element.fontSize || 20

        if (
          adjustedX >= element.x &&
          adjustedX <= element.x + textWidth &&
          adjustedY >= element.y - textHeight &&
          adjustedY <= element.y
        ) {
          const isNearCorner = adjustedX >= element.x + textWidth - 10 && adjustedY >= element.y - 10
          return { element, position: isNearCorner ? "resize" : "inside" }
        }
      } else if (element.type === "cartoon") {
        const width = element.width || 100
        const height = element.height || 100

        if (
          adjustedX >= element.x &&
          adjustedX <= element.x + width &&
          adjustedY >= element.y &&
          adjustedY <= element.y + height
        ) {
          const isNearCorner = adjustedX >= element.x + width - 20 && adjustedY >= element.y + height - 20
          return { element, position: isNearCorner ? "resize" : "inside" }
        }
      } else if (element.type === "rectangle") {
        const [x1, y1] = [element.x1, element.y1]
        const [x2, y2] = [element.x2, element.y2]

        if (
          adjustedX >= Math.min(x1, x2) &&
          adjustedX <= Math.max(x1, x2) &&
          adjustedY >= Math.min(y1, y2) &&
          adjustedY <= Math.max(y1, y2)
        ) {
          const isNearCorner = adjustedX >= Math.max(x1, x2) - 20 && adjustedY >= Math.max(y1, y2) - 20
          return { element, position: isNearCorner ? "resize" : "inside" }
        }
      } else if (element.type === "circle") {
        const [x1, y1] = [element.x1, element.y1]
        const [x2, y2] = [element.x2, element.y2]
        const radius = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))

        if (Math.sqrt(Math.pow(adjustedX - x1, 2) + Math.pow(adjustedY - y1, 2)) <= radius) {
          const distFromCenter = Math.sqrt(Math.pow(adjustedX - x1, 2) + Math.pow(adjustedY - y1, 2))
          const isNearEdge = Math.abs(distFromCenter - radius) < 20
          return { element, position: isNearEdge ? "resize" : "inside" }
        }
      }
    }

    return null
  }

  // Create rough element
  const createElement = (id, x1, y1, x2, y2, type) => {
    const roughOptions = {
      seed: Math.floor(Math.random() * 2000),
      strokeWidth,
      stroke: color,
      roughness: 2,
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
      x1,
      y1,
      x2,
      y2,
      color,
      strokeWidth,
      fillColor,
      seed: roughOptions.seed,
    }
  }

  // Handle mouse down
  const handleMouseDown = (event) => {
    if (event.button !== 0) return // Only left mouse button

    const { clientX, clientY } = event

    // Adjust for pan and scale
    const adjustedX = (clientX - panOffset.x) / scale
    const adjustedY = (clientY - panOffset.y) / scale

    if (tool === "move") {
      const elementAtPosition = getElementAtPosition(clientX, clientY)
      if (elementAtPosition) {
        const { element, position } = elementAtPosition
        setSelectedElement(element)
        
        if (position === "resize") {
          setResizing(true)
          setResizeStartPoint({ x: clientX, y: clientY })
          setResizeStartDimensions({
            width: element.width || Math.abs(element.x2 - element.x1),
            height: element.height || Math.abs(element.y2 - element.y1)
          })
          setAction("resizing")
        } else {
          setAction("moving")
        }
        return
      }
    } else if (tool === "eraser") {
      const elementAtPosition = getElementAtPosition(clientX, clientY)
      if (elementAtPosition) {
        const { element } = elementAtPosition
        setElements((prevElements) => prevElements.filter((el) => el.id !== element.id))
        updateHistory([...elements.filter((el) => el.id !== element.id)])
      }
      return
    }

    setAction("drawing")

    if (tool === "pencil") {
      const newElement = {
        id: generateId(),
        type: "pencil",
        points: [{ x: adjustedX, y: adjustedY }],
        color,
        strokeWidth,
      }

      setElements((prevElements) => [...prevElements, newElement])
      setSelectedElement(newElement)
    } else if (tool === "text") {
      setShowTextInput(true)
      setTextPosition({ x: adjustedX, y: adjustedY })
    } else if (tool === "cartoon" && selectedCartoon) {
      const newElement = {
        id: generateId(),
        type: "cartoon",
        cartoonType: selectedCartoon,
        x: adjustedX,
        y: adjustedY,
        width: 100,
        height: 100,
      }

      setElements((prevElements) => [...prevElements, newElement])
      setSelectedElement(newElement)
      updateHistory([...elements, newElement])
    } else if (["rectangle", "circle"].includes(tool)) {
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

    if (action === "moving" && selectedElement) {
      const updatedElement = {
        ...selectedElement,
        x: adjustedX,
        y: adjustedY,
      }

      setElements((prevElements) =>
        prevElements.map((el) => (el.id === selectedElement.id ? updatedElement : el))
      )
      setSelectedElement(updatedElement)
    } else if (action === "resizing" && selectedElement && resizing) {
      const dx = clientX - resizeStartPoint.x
      const dy = clientY - resizeStartPoint.y
      
      const updatedElement = { ...selectedElement }
      
      if (selectedElement.type === "cartoon") {
        updatedElement.width = Math.max(20, resizeStartDimensions.width + dx / scale)
        updatedElement.height = Math.max(20, resizeStartDimensions.height + dy / scale)
      } else if (selectedElement.type === "text") {
        updatedElement.fontSize = Math.max(10, resizeStartDimensions.width + dx / scale)
      } else if (selectedElement.type === "rectangle") {
        updatedElement.x2 = selectedElement.x1 + (resizeStartDimensions.width + dx / scale)
        updatedElement.y2 = selectedElement.y1 + (resizeStartDimensions.height + dy / scale)
      } else if (selectedElement.type === "circle") {
        const radius = Math.sqrt(Math.pow(resizeStartDimensions.width + dx / scale, 2) + 
                                Math.pow(resizeStartDimensions.height + dy / scale, 2))
        updatedElement.x2 = selectedElement.x1 + radius
        updatedElement.y2 = selectedElement.y1 + radius
      }
      
      setElements((prevElements) =>
        prevElements.map((el) => (el.id === selectedElement.id ? updatedElement : el))
      )
      setSelectedElement(updatedElement)
    } else if (action === "drawing") {
      if (selectedElement) {
        if (selectedElement.type === "pencil") {
          const newPoints = [...selectedElement.points, { x: adjustedX, y: adjustedY }]
          const updatedElement = { ...selectedElement, points: newPoints }

          setElements((prevElements) => prevElements.map((el) => (el.id === selectedElement.id ? updatedElement : el)))

          setSelectedElement(updatedElement)
        } else if (["rectangle", "circle"].includes(selectedElement.type)) {
          const { id, type } = selectedElement
          const updatedElement = createElement(id, selectedElement.x1, selectedElement.y1, adjustedX, adjustedY, type)

          setElements((prevElements) => prevElements.map((el) => (el.id === selectedElement.id ? updatedElement : el)))

          setSelectedElement(updatedElement)
        }
      }
    } else if (tool === "eraser") {
      const elementAtPosition = getElementAtPosition(clientX, clientY)
      if (elementAtPosition) {
        const { element } = elementAtPosition
        setElements((prevElements) => prevElements.filter((el) => el.id !== element.id))
      }
    }
  }

  // Handle mouse up
  const handleMouseUp = () => {
    if (action === "drawing" || action === "moving" || action === "resizing") {
      if (selectedElement) {
        updateHistory([...elements])
      }
    }

    setAction("none")
    setResizing(false)
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

  // Add text to canvas
  const addText = () => {
    if (textInput.trim() === "") return

    const newElement = {
      id: generateId(),
      type: "text",
      text: textInput,
      x: textPosition.x,
      y: textPosition.y,
      color,
      fontSize: 20,
    }

    setElements((prevElements) => [...prevElements, newElement])
    updateHistory([...elements, newElement])

    setTextInput("")
    setShowTextInput(false)
  }

  // Redraw the canvas
  const redrawCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const context = canvas.getContext("2d", { willReadFrequently: true })
    if (!context || !roughCanvasRef.current) return

    // Clear the canvas
    context.clearRect(0, 0, canvas.width, canvas.height)

    // Draw background with selected color
    context.fillStyle = backgroundColor
    context.fillRect(0, 0, canvas.width, canvas.height)

    // Apply pan and scale transformations
    context.save()
    context.translate(panOffset.x, panOffset.y)
    context.scale(scale, scale)

    // Draw grid if enabled
    if (showGrid) {
      const gridColor = "#A0A0A0" // Darker grid color for better visibility

      context.beginPath()
      context.strokeStyle = gridColor
      context.lineWidth = 1

      // Calculate grid boundaries based on canvas size and pan/zoom
      const startX = -panOffset.x / scale
      const startY = -panOffset.y / scale
      const endX = (canvas.width - panOffset.x) / scale
      const endY = (canvas.height - panOffset.y) / scale

      // Draw vertical lines
      for (let x = Math.floor(startX / gridSize) * gridSize; x < endX; x += gridSize) {
        context.moveTo(x, startY)
        context.lineTo(x, endY)
      }

      // Draw horizontal lines
      for (let y = Math.floor(startY / gridSize) * gridSize; y < endY; y += gridSize) {
        context.moveTo(startX, y)
        context.lineTo(endX, y)
      }

      context.stroke()
    }

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

        context.strokeStyle = element.color
        context.lineWidth = element.strokeWidth
        context.lineCap = "round"
        context.lineJoin = "round"
        context.stroke()
      } else if (element.type === "text") {
        // Draw text
        context.font = `${element.fontSize || 20}px Comic Sans MS`
        context.fillStyle = element.color
        context.fillText(element.text, element.x, element.y)

        // Draw selection/resize handle if selected
        if (selectedElement && selectedElement.id === element.id) {
          const textWidth = context.measureText(element.text).width
          const textHeight = element.fontSize || 20

          // Draw selection box
          context.strokeStyle = "#0099ff"
          context.lineWidth = 2
          context.strokeRect(element.x - 5, element.y - textHeight - 5, textWidth + 10, textHeight + 10)

          // Draw resize handle
          context.fillStyle = "#0099ff"
          context.fillRect(element.x + textWidth - 5, element.y - 5, 10, 10)
        }
      } else if (element.type === "cartoon" && element.cartoonType) {
        // Draw cartoon image
        const img = cartoonImages[element.cartoonType]
        if (img) {
          context.drawImage(img, element.x, element.y, element.width || 100, element.height || 100)

          // Draw selection/resize handle if selected
          if (selectedElement && selectedElement.id === element.id) {
            context.strokeStyle = "#0099ff"
            context.lineWidth = 2
            context.strokeRect(element.x, element.y, element.width || 100, element.height || 100)

            // Draw resize handle
            context.fillStyle = "#0099ff"
            context.fillRect(element.x + (element.width || 100) - 10, element.y + (element.height || 100) - 10, 20, 20)
          }
        }
      } else if (element.roughElement) {
        // Draw rough.js elements
        roughCanvasRef.current.draw(element.roughElement)

        // Draw selection/resize handle if selected
        if (selectedElement && selectedElement.id === element.id) {
          if (element.type === "rectangle") {
            const x = Math.min(element.x1, element.x2)
            const y = Math.min(element.y1, element.y2)
            const width = Math.abs(element.x2 - element.x1)
            const height = Math.abs(element.y2 - element.y1)

            context.strokeStyle = "#0099ff"
            context.lineWidth = 2
            context.strokeRect(x, y, width, height)

            // Draw resize handle
            context.fillStyle = "#0099ff"
            context.fillRect(Math.max(element.x1, element.x2) - 10, Math.max(element.y1, element.y2) - 10, 20, 20)
          } else if (element.type === "circle") {
            const radius = Math.sqrt(Math.pow(element.x2 - element.x1, 2) + Math.pow(element.y2 - element.y1, 2))

            context.strokeStyle = "#0099ff"
            context.lineWidth = 2
            context.beginPath()
            context.arc(element.x1, element.y1, radius, 0, 2 * Math.PI)
            context.stroke()

            // Draw resize handle
            const angle = Math.atan2(element.y2 - element.y1, element.x2 - element.x1)
            context.fillStyle = "#0099ff"
            context.fillRect(
              element.x1 + radius * Math.cos(angle) - 10,
              element.y1 + radius * Math.sin(angle) - 10,
              20,
              20,
            )
          }
        }
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

    const tempContext = tempCanvas.getContext("2d", { willReadFrequently: true })
    if (!tempContext) return

    // Copy the current canvas to the temporary one with the background color
    tempContext.fillStyle = backgroundColor
    tempContext.fillRect(0, 0, tempCanvas.width, tempCanvas.height)

    // Apply pan and scale transformations
    tempContext.translate(panOffset.x, panOffset.y)
    tempContext.scale(scale, scale)

    // Draw grid if enabled
    if (showGrid) {
      tempContext.beginPath()
      tempContext.strokeStyle = gridColor
      tempContext.lineWidth = 1

      // Calculate grid boundaries
      const startX = -panOffset.x / scale
      const startY = -panOffset.y / scale
      const endX = (tempCanvas.width - panOffset.x) / scale
      const endY = (tempCanvas.height - panOffset.y) / scale

      // Draw vertical lines
      for (let x = Math.floor(startX / gridSize) * gridSize; x < endX; x += gridSize) {
        tempContext.moveTo(x, startY)
        tempContext.lineTo(x, endY)
      }

      // Draw horizontal lines
      for (let y = Math.floor(startY / gridSize) * gridSize; y < endY; y += gridSize) {
        tempContext.moveTo(startX, y)
        tempContext.lineTo(endX, y)
      }

      tempContext.stroke()
    }

    // Draw each element
    elements.forEach((element) => {
      if (element.type === "pencil") {
        // Draw pencil strokes
        tempContext.beginPath()
        tempContext.moveTo(element.points[0].x, element.points[0].y)

        element.points.forEach((point) => {
          tempContext.lineTo(point.x, point.y)
        })

        tempContext.strokeStyle = element.color
        tempContext.lineWidth = element.strokeWidth
        tempContext.lineCap = "round"
        tempContext.lineJoin = "round"
        tempContext.stroke()
      } else if (element.type === "text") {
        // Draw text
        tempContext.font = `${element.fontSize || 20}px Comic Sans MS`
        tempContext.fillStyle = element.color
        tempContext.fillText(element.text, element.x, element.y)
      } else if (element.type === "cartoon" && element.cartoonType) {
        // Draw cartoon image
        const img = cartoonImages[element.cartoonType]
        if (img) {
          tempContext.drawImage(img, element.x, element.y, element.width || 100, element.height || 100)
        }
      } else if (element.roughElement) {
        // Draw rough.js elements
        roughCanvasRef.current.generator.draw(tempContext, element.roughElement)
      }
    })

    // Create download link
    const link = document.createElement("a")
    link.download = "my-awesome-drawing.jpg"
    link.href = tempCanvas.toDataURL("image/jpeg")
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
    setShowCartoonMenu(!showCartoonMenu)
  }

  // Select cartoon
  const selectCartoon = (cartoonId) => {
    setSelectedCartoon(cartoonId)
    setTool("cartoon")
    setShowCartoonMenu(false)
  }

  // Toggle magic button
  const toggleMagic = () => {
    setShowMagic(!showMagic)
    // Set random position for the magic button
    setMagicPosition({
      x: 100 + Math.random() * (window.innerWidth - 200),
      y: 100 + Math.random() * (window.innerHeight - 200),
    })
  }

  // Create a random shape with the magic button
  const createMagicShape = () => {
    const shapes = ["rectangle", "circle"]
    const randomShape = shapes[Math.floor(Math.random() * shapes.length)]
    const randomColor = kidColors[Math.floor(Math.random() * kidColors.length)]
    const randomFill = kidColors[Math.floor(Math.random() * kidColors.length)]

    const x = (magicPosition.x - panOffset.x) / scale
    const y = (magicPosition.y - panOffset.y) / scale

    // Save current settings
    const currentColor = color
    const currentFill = fillColor

    // Set random colors
    setColor(randomColor)
    setFillColor(randomFill)

    // Create element
    const id = generateId()
    const size = 50 + Math.random() * 100
    const newElement = createElement(id, x, y, x + size, y + size, randomShape)

    setElements((prevElements) => [...prevElements, newElement])
    updateHistory([...elements, newElement])

    // Restore settings
    setColor(currentColor)
    setFillColor(currentFill)

    // Move magic button
    setMagicPosition({
      x: 100 + Math.random() * (window.innerWidth - 200),
      y: 100 + Math.random() * (window.innerHeight - 200),
    })
  }

  // Custom Magic Wand Icon
  const MagicWandIcon = ({ size = 24, color = "currentColor" }) => {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M8 9L7 7L5 6L7 5L8 3L9 5L11 6L9 7L8 9Z"
          fill={color}
          stroke={color}
          strokeWidth="1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M18 18L16.5 14.5L13 13L16.5 11.5L18 8L19.5 11.5L23 13L19.5 14.5L18 18Z"
          fill={color}
          stroke={color}
          strokeWidth="1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M5 16L4.5 14.5L3 14L4.5 13.5L5 12L5.5 13.5L7 14L5.5 14.5L5 16Z"
          fill={color}
          stroke={color}
          strokeWidth="1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M12 12L3 21" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }

  // Add function to toggle background options
  const toggleBackgroundOptions = () => {
    setShowBackgroundOptions(!showBackgroundOptions)
  }

  // Add function to change grid size
  const changeGridSize = (size) => {
    setGridSize(size)
  }

  // Add a custom Eraser Icon for better visibility
  const EraserIcon = ({ size = 24, color = "currentColor" }) => {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M18 14L8.5 4.5C7.7 3.7 6.3 3.7 5.5 4.5L4.5 5.5C3.7 6.3 3.7 7.7 4.5 8.5L14 18"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M14 18L19.5 18C19.8 18 20 17.8 20 17.5C20 17.2 19.8 17 19.5 17L15.5 17L14 18Z"
          fill={color}
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M14 18L6.5 18C6.2 18 6 17.8 6 17.5C6 17.2 6.2 17 6.5 17L12.5 17L14 18Z"
          fill="white"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M14 18L14 18" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }
  
  // Add a custom Grid Icon for better visibility
  const GridIcon = ({ size = 24, color = "currentColor" }) => {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="3" width="7" height="7" rx="1" stroke={color} strokeWidth="2" />
        <rect x="14" y="3" width="7" height="7" rx="1" stroke={color} strokeWidth="2" />
        <rect x="3" y="14" width="7" height="7" rx="1" stroke={color} strokeWidth="2" />
        <rect x="14" y="14" width="7" height="7" rx="1" stroke={color} strokeWidth="2" />
      </svg>
    )
  }
  
  // Add a custom Background Icon
  const BackgroundIcon = ({ size = 24, color = "currentColor" }) => {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="3" width="18" height="18" rx="2" stroke={color} strokeWidth="2" />
        <path d="M3 8L21 8" stroke={color} strokeWidth="2" strokeLinecap="round" />
        <path d="M7 3L7 8" stroke={color} strokeWidth="2" strokeLinecap="round" />
        <path d="M12 3L12 21" stroke={color} strokeWidth="2" strokeLinecap="round" strokeDasharray="1 3" />
      </svg>
    )
  }
  
  return (
    <div className="relative w-full h-screen overflow-hidden bg-blue-50">
      {/* Header */}
      <div className="relative p-3 text-center text-white bg-gradient-to-r from-purple-500 to-pink-500">
        <div className="absolute transform -translate-y-1/2 left-2 top-1/2">
          <span className="text-2xl text-yellow-300">✏️</span>
          <span className="ml-2 text-2xl text-yellow-300">🎨</span>
        </div>
        <h1 className="text-2xl font-bold">Super Fun Drawing Canvas!</h1>
        <div className="absolute transform -translate-y-1/2 right-2 top-1/2">
          <span className="text-2xl text-yellow-300">🖌️</span>
          <span className="ml-2 text-2xl text-yellow-300">✨</span>
        </div>
      </div>
  
      {/* Toolbar */}
      <div className="flex flex-wrap justify-center gap-2 p-3 bg-yellow-200">
        {/* Drawing tools */}
        <div className="flex flex-col items-center">
          <button
            className={`rounded-full p-3 ${tool === "pencil" ? "bg-green-400" : "bg-white"} shadow-md hover:bg-green-200`}
            onClick={() => setTool("pencil")}
          >
            <Pencil size={24} color="#333" />
          </button>
          <span className="mt-1 text-xs font-bold">Draw</span>
        </div>
  
        <div className="flex flex-col items-center">
          <button
            className={`rounded-full p-3 ${tool === "eraser" ? "bg-green-400" : "bg-white"} shadow-md hover:bg-green-200`}
            onClick={() => setTool("eraser")}
          >
            <EraserIcon size={28} color={tool === "eraser" ? "#333" : "#FF6B6B"} />
          </button>
          <span className="mt-1 text-xs font-bold font-extrabold text-red-500">Erase</span>
        </div>
  
        <div className="flex flex-col items-center">
          <button
            className={`rounded-full p-3 ${tool === "circle" ? "bg-green-400" : "bg-white"} shadow-md hover:bg-green-200`}
            onClick={() => setTool("circle")}
          >
            <Circle size={24} color="#333" />
          </button>
          <span className="mt-1 text-xs font-bold">Circle</span>
        </div>
  
        <div className="flex flex-col items-center">
          <button
            className={`rounded-full p-3 ${tool === "rectangle" ? "bg-green-400" : "bg-white"} shadow-md hover:bg-green-200`}
            onClick={() => setTool("rectangle")}
          >
            <Square size={24} color="#333" />
          </button>
          <span className="mt-1 text-xs font-bold">Square</span>
        </div>
  
        <div className="flex flex-col items-center">
          <button
            className={`rounded-full p-3 ${tool === "text" ? "bg-green-400" : "bg-white"} shadow-md hover:bg-green-200`}
            onClick={() => setTool("text")}
          >
            <Type size={24} color="#333" />
          </button>
          <span className="mt-1 text-xs font-bold">Text</span>
        </div>
  
        <div className="flex flex-col items-center">
          <button
            className={`rounded-full p-3 ${tool === "cartoon" ? "bg-green-400" : "bg-white"} shadow-md hover:bg-green-200`}
            onClick={toggleCartoonMenu}
          >
            <ImageIcon size={24} color="#333" />
          </button>
          <span className="mt-1 text-xs font-bold">Stickers</span>
        </div>
  
        <div className="flex flex-col items-center">
          <button
            className={`rounded-full p-3 ${tool === "move" ? "bg-green-400" : "bg-white"} shadow-md hover:bg-green-200`}
            onClick={() => setTool("move")}
          >
            <Move size={24} color="#333" />
          </button>
          <span className="mt-1 text-xs font-bold">Move</span>
        </div>
  
        {/* Pen thickness */}
        <div className="flex flex-col items-center">
          <div className="flex items-center p-2 bg-white rounded-lg shadow-md">
            <button className="p-1 bg-blue-200 rounded-full hover:bg-blue-300" onClick={decreaseStrokeWidth}>
              -
            </button>
            <div className="mx-2 font-bold">{strokeWidth}</div>
            <button className="p-1 bg-blue-200 rounded-full hover:bg-blue-300" onClick={increaseStrokeWidth}>
              +
            </button>
          </div>
          <span className="mt-1 text-xs font-bold">Size</span>
        </div>
  
        {/* Colors */}
        <div className="flex flex-col items-center">
          <div className="grid grid-cols-3 gap-1 p-2 bg-white rounded-lg shadow-md">
            {kidColors.map((c, idx) => (
              <button
                key={idx}
                className={`w-6 h-6 rounded-full border-2 ${color === c ? "border-black" : "border-gray-200"}`}
                style={{ backgroundColor: c }}
                onClick={() => setColor(c)}
              />
            ))}
          </div>
          <span className="mt-1 text-xs font-bold">Colors</span>
        </div>
  
        {/* Fill color toggle */}
        <div className="flex flex-col items-center">
          <div className="p-2 bg-white rounded-lg shadow-md">
            <div className="mb-1 text-xs font-bold">Fill:</div>
            <div
              className="w-8 h-8 border-2 border-gray-300 rounded-md cursor-pointer"
              style={{ backgroundColor: fillColor || "transparent" }}
              onClick={() => setFillColor(fillColor ? "" : color)}
            />
          </div>
          <span className="mt-1 text-xs font-bold">Fill</span>
        </div>
  
        {/* Background color */}
        <div className="flex flex-col items-center">
          <button className="p-3 bg-white rounded-full shadow-md hover:bg-green-200" onClick={toggleBackgroundOptions}>
            <BackgroundIcon size={24} color="#333" />
          </button>
          <span className="mt-1 text-xs font-bold">Page</span>
        </div>
  
        {/* Grid toggle with options */}
        <div className="flex flex-col items-center">
          <button
            className={`rounded-full p-3 ${showGrid ? "bg-green-400" : "bg-white"} shadow-md hover:bg-green-200`}
            onClick={() => setShowGrid(!showGrid)}
          >
            <GridIcon size={24} color="#333" />
          </button>
          <span className="mt-1 text-xs font-bold">Grid</span>
        </div>
  
        {/* Action buttons */}
        <div className="flex flex-col items-center">
          <button className="p-3 bg-white rounded-full shadow-md hover:bg-red-200" onClick={clearCanvas}>
            <Trash2 size={24} color="#f00" />
          </button>
          <span className="mt-1 text-xs font-bold">Clear</span>
        </div>
  
        <div className="flex flex-col items-center">
          <button
            className="p-3 bg-white rounded-full shadow-md hover:bg-blue-200"
            onClick={undo}
            disabled={historyIndex <= 0}
          >
            <Undo size={24} color={historyIndex <= 0 ? "#ccc" : "#333"} />
          </button>
          <span className="mt-1 text-xs font-bold">Undo</span>
        </div>
  
        <div className="flex flex-col items-center">
          <button
            className="p-3 bg-white rounded-full shadow-md hover:bg-blue-200"
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
          >
            <Redo size={24} color={historyIndex >= history.length - 1 ? "#ccc" : "#333"} />
          </button>
          <span className="mt-1 text-xs font-bold">Redo</span>
        </div>
  
        <div className="flex flex-col items-center">
          <button className="p-3 bg-white rounded-full shadow-md hover:bg-green-200" onClick={saveAsImage}>
            <Download size={24} color="#333" />
          </button>
          <span className="mt-1 text-xs font-bold">Save</span>
        </div>
  
        <div className="flex flex-col items-center">
          <button
            className="p-3 bg-purple-400 rounded-full shadow-md hover:bg-purple-500 animate-pulse"
            onClick={toggleMagic}
          >
            <MagicWandIcon size={24} color="white" />
          </button>
          <span className="mt-1 text-xs font-bold">Magic!</span>
        </div>
      </div>
  
      {/* Canvas */}
      <div className="relative flex-grow mx-4 mb-4 overflow-hidden rounded-lg shadow-lg" style={{ backgroundColor }}>
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-crosshair touch-none"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        />
  
        {/* Background color options */}
        {showBackgroundOptions && (
          <div className="absolute z-10 p-4 transform -translate-x-1/2 bg-white rounded-lg shadow-xl top-4 left-1/2">
            <h3 className="mb-2 text-lg font-bold text-center">Choose Page Color</h3>
            <div className="grid grid-cols-4 gap-3">
              {backgroundColors.map((bgColor, idx) => (
                <button
                  key={idx}
                  className={`w-12 h-12 rounded-lg border-4 ${
                    backgroundColor === bgColor ? "border-blue-500" : "border-gray-200"
                  }`}
                  style={{ backgroundColor: bgColor }}
                  onClick={() => {
                    setBackgroundColor(bgColor)
                    setShowBackgroundOptions(false)
                  }}
                />
              ))}
            </div>
  
            <div className="mt-4">
              <h4 className="mb-2 text-sm font-bold">Grid Size:</h4>
              <div className="flex justify-between">
                <button
                  className={`px-3 py-1 rounded ${gridSize === 10 ? "bg-blue-500 text-white" : "bg-gray-200"}`}
                  onClick={() => changeGridSize(10)}
                >
                  Small
                </button>
                <button
                  className={`px-3 py-1 rounded ${gridSize === 20 ? "bg-blue-500 text-white" : "bg-gray-200"}`}
                  onClick={() => changeGridSize(20)}
                >
                  Medium
                </button>
                <button
                  className={`px-3 py-1 rounded ${gridSize === 40 ? "bg-blue-500 text-white" : "bg-gray-200"}`}
                  onClick={() => changeGridSize(40)}
                >
                  Large
                </button>
              </div>
            </div>
  
            <button
              className="w-full py-2 mt-4 font-bold transition-colors bg-green-400 rounded-lg hover:bg-green-500"
              onClick={() => setShowBackgroundOptions(false)}
            >
              Done
            </button>
          </div>
        )}
  
        {/* Text input overlay */}
        {showTextInput && (
          <div
            className="absolute top-0 left-0 flex items-center justify-center w-full h-full bg-black bg-opacity-30"
            onClick={() => setShowTextInput(false)}
          >
            <div className="p-4 bg-white rounded-lg shadow-lg" onClick={(e) => e.stopPropagation()}>
              <h3 className="mb-2 text-lg font-bold">Add Text</h3>
              <input
                ref={textInputRef}
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                className="w-full p-2 mb-2 border rounded"
                placeholder="Type something fun!"
              />
              <div className="flex justify-end gap-2">
                <button className="px-3 py-1 bg-gray-200 rounded" onClick={() => setShowTextInput(false)}>
                  Cancel
                </button>
                <button className="px-3 py-1 text-white bg-blue-500 rounded" onClick={addText}>
                  Add
                </button>
              </div>
            </div>
          </div>
        )}
  
        {/* Cartoon menu overlay */}
        {showCartoonMenu && (
          <div className="absolute z-10 p-4 transform -translate-x-1/2 bg-white rounded-lg shadow-xl top-20 left-1/2">
            <h3 className="mb-2 text-lg font-bold">Choose a Sticker</h3>
            <div className="grid grid-cols-3 gap-3">
              {cartoonFigures.map((figure) => (
                <div
                  key={figure.id}
                  className="flex flex-col items-center p-2 rounded-lg cursor-pointer hover:bg-blue-100"
                  onClick={() => selectCartoon(figure.id)}
                >
                  <img src={figure.src || "/placeholder.svg"} alt={figure.name} className="object-contain w-16 h-16" />
                  <span className="mt-1 text-xs">{figure.name}</span>
                </div>
              ))}
            </div>
            <button className="w-full py-1 mt-3 bg-gray-200 rounded" onClick={() => setShowCartoonMenu(false)}>
              Close
            </button>
          </div>
        )}
  
        {/* Floating magic button */}
        {showMagic && (
          <div
            className="absolute"
            style={{
              left: `${magicPosition.x}px`,
              top: `${magicPosition.y}px`,
              transform: "translate(-50%, -50%)",
            }}
          >
            <button
              className="w-16 h-16 rounded-full shadow-xl bg-gradient-to-r from-pink-500 to-purple-500 animate-bounce"
              onClick={createMagicShape}
            >
              <div className="font-bold text-white">Surprise!</div>
            </button>
          </div>
        )}
      </div>
  
      {/* Status bar */}
      <div className="absolute px-3 py-1 text-xs bg-white rounded-lg shadow-sm bottom-4 left-4">
        <span>Zoom: {Math.round(scale * 100)}%</span>
      </div>
  
      {/* Zoom controls */}
      <div className="absolute flex bg-white rounded-lg shadow-sm bottom-4 right-4">
        <button className="px-3 py-1 hover:bg-gray-100" onClick={zoomIn}>
          <ZoomIn size={20} />
        </button>
        <button className="px-3 py-1 hover:bg-gray-100" onClick={zoomOut}>
          <ZoomOut size={20} />
        </button>
        <button className="px-3 py-1 hover:bg-gray-100" onClick={resetView}>
          <span className="text-xs font-bold">Reset</span>
        </button>
      </div>
    </div>
  )
}

export default ThirdBoard