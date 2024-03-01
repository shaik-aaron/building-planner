import { useLayoutEffect, useState } from "react";
import rough from "roughjs/bundled/rough.esm";

const generator = rough.generator();

function createElement(x1, y1, x2, y2, tool) {
  const roughElement =
    tool === "Line"
      ? generator.line(x1, y1, x2, y2)
      : generator.rectangle(x1, y1, x2 - x1, y2 - y1);
  return { x1, y1, x2, y2, tool, roughElement };
}

function isWithinElement(x, y, element) {
  const { tool } = element;
}

function getElementAtPosition(x, y, elements) {
  return elements.find((element) => isWithinElement(x, y, element));
}

function App() {
  const [elements, setElements] = useState([]);
  const [action, setAction] = useState("none");
  const [tool, setTool] = useState("Line");

  console.log(elements);

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
    } else {
      const element = createElement(clientX, clientY, clientX, clientY, tool);

      setElements((prev) => [...prev, element]);
      setAction("drawing");
    }
  };

  const handleMouseMove = (event) => {
    if (action === "drawing") {
      const { clientX, clientY } = event;
      const index = elements.length - 1;
      const { x1, y1 } = elements[index];
      const updatedElement = createElement(x1, y1, clientX, clientY, tool);

      const elementsCopy = [...elements];
      elementsCopy[index] = updatedElement;
      setElements(elementsCopy);
    }
  };

  const handleMouseUp = () => {
    setAction("none");
  };

  return (
    <div>
      <input
        onChange={() => setTool("Selection")}
        type="radio"
        checked={tool === "selection"}
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
