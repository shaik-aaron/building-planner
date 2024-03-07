import React, { useState, useEffect, useLayoutEffect } from "react";
import rough from "roughjs/bundled/rough.esm";
import { cursorForPosition } from "../functions/cursorForPosition";
import "./App.css";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
} from "firebase/auth";
import { auth, db } from "../firebase/firebase";
import resizedCoordinates from "../functions/resizedCoordinates";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { adjustElementCoordinates } from "../functions/adjustElementCoordinates";
import { getElementAtPosition } from "../functions/getElementAtPosition";

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

function App() {
  const [drawings, setDrawings] = useState([{ elements: [] }]);
  const [currentDrawingIndex, setCurrentDrawingIndex] = useState(0);
  const currentDrawing = drawings[currentDrawingIndex];
  const [action, setAction] = useState("none");
  const [tool, setTool] = useState("Line");
  const [selectedElement, setSelectedElement] = useState(null);
  const [save, setSave] = useState("Save");
  const [user, setUser] = useState("");

  //functions to read/save drawings

  async function saveDrawings() {
    setSave("Saving...");
    const serializedDrawings = drawings.map((drawing) => ({
      elements: drawing.elements.map((element) => ({
        ...element,
        roughElement: JSON.stringify(element.roughElement),
      })),
    }));
    if (user.uid) {
      const userPlansRef = doc(db, "user_plans", user.uid);
      await setDoc(userPlansRef, {
        drawings: serializedDrawings || null,
      });
      setSave("Save");
      alert("Saved");
    }
  }

  async function readDrawings() {
    const userPlansRef = doc(db, "user_plans", user.uid);
    const userPlansSnapshot = await getDoc(userPlansRef);
    const temp = userPlansSnapshot.data();
    const deserializedDrawings = temp.drawings.map((drawing) => ({
      elements: drawing.elements.map((element) => ({
        ...element,
        roughElement: JSON.parse(element.roughElement),
      })),
    }));
    setDrawings(deserializedDrawings);
  }

  //sign in

  async function googleSignIn() {
    const provider = await new GoogleAuthProvider();
    return signInWithPopup(auth, provider);
  }

  //Lifecycle functions

  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
      }
    });
  }, [user]);

  useLayoutEffect(() => {
    if (user) {
      readDrawings();
    }
  }, [user]);

  useLayoutEffect(() => {
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const roughtCanvas = rough.canvas(canvas);
    currentDrawing.elements.forEach((element) => {
      roughtCanvas.draw(element.roughElement);

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

  //function to update Element

  function updateElement(id, x1, y1, x2, y2, tool) {
    const updatedElement = createElement(id, x1, y1, x2, y2, tool);

    const elementsCopy = [...currentDrawing.elements];
    elementsCopy[id] = updatedElement;

    const drawingsCopy = [...drawings];
    drawingsCopy[currentDrawingIndex] = { elements: elementsCopy };
    setDrawings(drawingsCopy);
  }

  //funcion to update plan

  function updateDrawing(key, value) {
    const drawingsCopy = [...drawings];
    drawingsCopy[currentDrawingIndex] = {
      ...drawings[currentDrawingIndex],
      [key]: value,
    };
    setDrawings(drawingsCopy);
  }

  //mouse events

  function handleDelete(event) {
    const { clientX, clientY } = event;
    if (tool === "Delete") {
      const elementToDelete = getElementAtPosition(
        clientX,
        clientY,
        currentDrawing.elements
      );
      if (elementToDelete.position === "inside") {
        delete elementToDelete.position;
        updateDrawing(
          "elements",
          currentDrawing.elements.filter(
            (element) => element.id !== elementToDelete.id
          )
        );
      }
    }
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
    } else if (tool !== "Delete") {
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
    } else if (action === "moving") {
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
        {user === "" ? (
          <h2
            onClick={googleSignIn}
            style={{ color: "white", marginBottom: 8 }}
          >
            Sign in
          </h2>
        ) : (
          <h2 style={{ color: "white", marginBottom: 8, padding: 20 }}>
            {user.displayName}
          </h2>
        )}
        <h3
          onClick={saveDrawings}
          style={{
            color: "white",
            marginBottom: 8,
            padding: 12,
            fontFamily: "Anta",
            cursor: "pointer",
          }}
        >
          {save}
        </h3>
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
