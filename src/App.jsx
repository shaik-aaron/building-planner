import React, { useState, useEffect, useLayoutEffect } from "react";
import rough from "roughjs/bundled/rough.esm";
import { isWithinElement } from "../functions/isWithinElement";
import { cursorForPosition } from "../functions/cursorForPosition";

import "./App.css";

const generator = rough.generator();

function createElement(id, x1, y1, x2, y2, tool) {
  const width = Math.abs(x2 - x1);
  const height = Math.abs(y2 - y1);

  const roughElement =
    tool === "Line"
      ? generator.line(x1, y1, x2, y2)
      : generator.rectangle(x1, y1, x2 - x1, y2 - y1, { roughness: 0.5 });

  return { id, x1, y1, x2, y2, tool, roughElement, width, height };
}

function getElementAtPosition(x, y, elements) {
  return elements
    .map((element) => ({
      ...element,
      position: isWithinElement(x, y, element),
    }))
    .find((element) => element.position !== null);
}

function adjustElementCoordinates(element) {
  const { tool, x1, y1, x2, y2 } = element;
  if (tool === "Rectangle") {
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
}

function resizedCoordinates(clientX, clientY, position, coordinates) {
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
}

function App() {
  const [drawings, setDrawings] = useState([{ elements: [] }]);
  const [currentDrawingIndex, setCurrentDrawingIndex] = useState(0);
  const currentDrawing = drawings[currentDrawingIndex];
  const [action, setAction] = useState("none");
  const [tool, setTool] = useState("Line");
  const [selectedElement, setSelectedElement] = useState(null);

  console.log(currentDrawing.elements);

  useLayoutEffect(() => {
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const roughtCanvas = rough.canvas(canvas);
    currentDrawing.elements.forEach((element) => {
      roughtCanvas.draw(element.roughElement);

      // Display dimensions for rectangles
      if (element.tool === "Rectangle") {
        ctx.fillStyle = "black";
        ctx.font = "12px Arial";
        ctx.fillText(
          `W: ${element.width.toFixed(2)}, H: ${element.height.toFixed(2)}`,
          element.x1 + 5,
          element.y2 - 5
        );
      }
    });
  }, [currentDrawing]);

  function updateElement(id, x1, y1, x2, y2, tool) {
    const updatedElement = createElement(id, x1, y1, x2, y2, tool);

    const elementsCopy = [...currentDrawing.elements];
    elementsCopy[id] = updatedElement;

    const drawingsCopy = [...drawings];
    drawingsCopy[currentDrawingIndex] = { elements: elementsCopy };
    setDrawings(drawingsCopy);
  }

  function handleDelete(event) {
    const { clientX, clientY } = event;
    if (tool === "Delete") {
      const element = getElementAtPosition(
        clientX,
        clientY,
        currentDrawing.elements
      );
      function check(obj) {
        return obj !== element;
      }
      updateDrawing("elements", currentDrawing.elements.filter(check));
    }
  }

  function updateDrawing(key, value) {
    const drawingsCopy = [...drawings];
    drawingsCopy[currentDrawingIndex] = {
      ...drawings[currentDrawingIndex],
      [key]: value,
    };
    setDrawings(drawingsCopy);
  }

  const handleMouseDown = (event) => {
    const { clientX, clientY } = event;
    if (tool === "Selection") {
      const element = getElementAtPosition(
        clientX,
        clientY,
        currentDrawing.elements
      );
      if (element) {
        const offestX = clientX - element.x1;
        const offsetY = clientY - element.y1;
        setSelectedElement({ ...element, offestX, offsetY });
        if (element.position === "inside") {
          setAction("moving");
        } else {
          setAction("resize");
        }
      }
    } else {
      const id = currentDrawing.elements.length;
      const element = createElement(
        id,
        clientX,
        clientY,
        clientX,
        clientY,
        tool
      );

      updateDrawing("elements", [...currentDrawing.elements, element]);
      setAction("drawing");
    }
  };

  const handleMouseMove = (event) => {
    const { clientX, clientY } = event;
    if (tool === "Selection") {
      const element = getElementAtPosition(
        clientX,
        clientY,
        currentDrawing.elements
      );
      event.target.style.cursor = element
        ? cursorForPosition(element.position)
        : "default";
    }
    if (tool === "Delete") {
      event.target.style.cursor = getElementAtPosition(
        clientX,
        clientY,
        currentDrawing.elements
      )
        ? "pointer"
        : "default";
    }
    if (action === "drawing") {
      const index = currentDrawing.elements.length - 1;
      const { x1, y1 } = currentDrawing.elements[index];
      updateElement(index, x1, y1, clientX, clientY, tool);
    }

    // Add the rest of your handle
    // ...

    // Add the rest of your handleMouseMove logic here
    // ...
    else if (action === "moving") {
      const { id, x1, y1, x2, y2, tool, offestX, offsetY } = selectedElement;
      const width = x2 - x1;
      const height = y2 - y1;
      const newX1 = clientX - offestX;
      const newY1 = clientY - offsetY;
      updateElement(id, newX1, newY1, newX1 + width, newY1 + height, tool);
    } else if (action === "resize") {
      const { id, tool, position, ...coordinates } = selectedElement;
      const { x1, y1, x2, y2 } = resizedCoordinates(
        clientX,
        clientY,
        position,
        coordinates
      );
      updateElement(id, x1, y1, x2, y2, tool);
    }
  };

  const handleMouseUp = () => {
    const index = currentDrawing.elements.length - 1;
    const { id, tool } = currentDrawing.elements[index];
    if (action === "drawing") {
      const { x1, y1, x2, y2 } = adjustElementCoordinates(
        currentDrawing.elements[index]
      );
      updateElement(id, x1, y1, x2, y2, tool);
    }
    setAction("none");
    setSelectedElement(null);
  };

  const addNewDrawing = () => {
    setDrawings([...drawings, { elements: [] }]);
    setCurrentDrawingIndex(drawings.length);
  };

  const switchDrawing = (index) => {
    setCurrentDrawingIndex(index);
  };

  return (
    <div>
      <div className="tab-bar">
        <h2>Log in</h2>
        {drawings.map((drawing, index) => (
          <div
            key={index}
            className={
              currentDrawingIndex === index ? "tab-selected" : "tab-unselected"
            }
            onClick={() => switchDrawing(index)}
          >
            Drawing {index + 1}
          </div>
        ))}
        <div className="new" onClick={addNewDrawing}>
          New Drawing
        </div>
      </div>
      <div style={{ position: "absolute" }}>
        <h2>Building Planner</h2>
        <div className="buttons-container">
          <button
            className={tool === "Selection" ? "button-selected" : ""}
            onClick={() => setTool("Selection")}
          >
            Selection
          </button>
          <button
            className={tool === "Line" ? "button-selected" : ""}
            onClick={() => setTool("Line")}
          >
            Line
          </button>
          <button
            className={tool === "Rectangle" ? "button-selected" : ""}
            onClick={() => setTool("Rectangle")}
          >
            Rectangle
          </button>
          <button
            className={tool === "Delete" ? "button-selected" : ""}
            onClick={() => setTool("Delete")}
          >
            Delete
          </button>
        </div>
      </div>
      <canvas
        id="canvas"
        width={window.innerWidth - 12}
        height={window.innerHeight - 12}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={handleDelete}
      />
    </div>
  );
}

export default App;
