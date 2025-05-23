import "./style.css";
import * as twgl from "twgl.js/dist/6.x/twgl-full";

const canvas = document.getElementById("glcanvas") as HTMLCanvasElement;
canvas.width = 500;
canvas.height = 500;

// const ctx = canvas.getContext("2d")!;
// ctx.lineCap = "round";
// ctx.lineJoin = 'round';
// ctx.strokeStyle = 'black';
// ctx.lineWidth = 20;
// ctx.beginPath();
// ctx.moveTo(10,10);
// ctx.lineTo(100,100);
// ctx.stroke();
// ctx.closePath();

const gl = canvas.getContext("webgl")!;
const glCanvas = gl.canvas as HTMLCanvasElement;
twgl.resizeCanvasToDisplaySize(glCanvas);
gl.viewport(0,0, glCanvas.width, glCanvas.height);