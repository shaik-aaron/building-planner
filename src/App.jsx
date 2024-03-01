import { useLayoutEffect } from "react";
import rough from "roughjs/bundled/rough.esm";

const generator = rough.generator();

function App() {
  useLayoutEffect(() => {
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");

    const roughtCanvas = rough.canvas(canvas);
    const rect = generator.rectangle(10, 10, 100, 100);
    const line = generator.line(10, 10, 110, 110);
    roughtCanvas.draw(rect);
    roughtCanvas.draw(line);
  });

  return (
    <canvas id="canvas" width={window.innerWidth} height={window.innerHeight} />
  );
}

export default App;
