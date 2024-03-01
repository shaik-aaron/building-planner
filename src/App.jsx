import { useLayoutEffect, useState } from "react";
import rough from "roughjs/bundled/rough.esm";
import { isWithinElement } from "../functions/isWithinElement";

const generator = rough.generator();

function createElement(id, x1, y1, x2, y2, tool) {
  const roughElement =
    tool === "Line"
      ? generator.line(x1, y1, x2, y2)
      : generator.rectangle(x1, y1, x2 - x1, y2 - y1);
  return { id, x1, y1, x2, y2, tool, roughElement };
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
    elements.forEach((element) => roughtCanvas.draw(element.roughElement));
  }, [elements]);

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
      <input
        onChange={() => setTool("Selection")}
        type="radio"
        checked={tool === "Selection"}
      />
      <label>Selection</label>
      <input
        onChange={() => setTool("Line")}
        type="radio"
        checked={tool === "Line"}
      />
      <label>Line</label>
      <input
        onChange={() => setTool("Rectangle")}
        type="radio"
        checked={tool === "Rectangle"}
      />
      <label>Rectangle</label>
      <canvas
        id="canvas"
        width={window.innerWidth}
        height={window.innerHeight}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      />
    </div>
  );
}

export default App;
