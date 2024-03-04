import { useLayoutEffect, useState } from "react";
import rough from "roughjs/bundled/rough.esm";
import { isWithinElement } from "../functions/isWithinElement";

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
  return elements.find((element) => isWithinElement(x, y, element));
}

function App() {
  const [elements, setElements] = useState([]);
  const [action, setAction] = useState("none");
  const [tool, setTool] = useState("Line");
  const [selectedElement, setSelectedElement] = useState(null);

  function updateElement(id, x1, y1, x2, y2, tool) {
    const updatedElement = createElement(id, x1, y1, x2, y2, tool);

    const elementsCopy = [...elements];
    elementsCopy[id] = updatedElement;
    setElements(elementsCopy);
  }

  useLayoutEffect(() => {
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const roughtCanvas = rough.canvas(canvas);
    elements.forEach((element) => {
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
  }, [elements]);

  function handleDelete(event) {
    const { clientX, clientY } = event;
    if (tool === "Delete") {
      const element = getElementAtPosition(clientX, clientY, elements);
      function check(obj) {
        return obj !== element;
      }
      setElements(elements.filter(check));
    }
  }

  const handleMouseDown = (event) => {
    const { clientX, clientY } = event;
    if (tool === "Selection") {
      const element = getElementAtPosition(clientX, clientY, elements);
      if (element) {
        const offestX = clientX - element.x1;
        const offsetY = clientY - element.y1;
        setSelectedElement({ ...element, offestX, offsetY });
        setAction("moving");
      }
    } else {
      const id = elements.length;
      const element = createElement(
        id,
        clientX,
        clientY,
        clientX,
        clientY,
        tool
      );

      setElements((prev) => [...prev, element]);
      setAction("drawing");
    }
  };

  const handleMouseMove = (event) => {
    const { clientX, clientY } = event;
    if (tool === "Selection") {
      event.target.style.cursor = getElementAtPosition(
        clientX,
        clientY,
        elements
      )
        ? "move"
        : "default";
    }
    if (tool === "Delete") {
      event.target.style.cursor = getElementAtPosition(
        clientX,
        clientY,
        elements
      )
        ? "pointer"
        : "default";
    }
    if (action === "drawing") {
      const index = elements.length - 1;
      const { x1, y1 } = elements[index];
      updateElement(index, x1, y1, clientX, clientY, tool);
    } else if (action === "moving") {
      const { id, x1, y1, x2, y2, tool, offestX, offsetY } = selectedElement;
      const width = x2 - x1;
      const height = y2 - y1;
      const newX1 = clientX - offestX;
      const newY1 = clientY - offsetY;
      updateElement(id, newX1, newY1, newX1 + width, newY1 + height, tool);
    }
  };

  const handleMouseUp = () => {
    setAction("none");
    setSelectedElement(null);
  };

  return (
    <div>
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
        width={window.innerWidth}
        height={window.innerHeight}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={handleDelete}
      />
    </div>
  );
}

export default App;
