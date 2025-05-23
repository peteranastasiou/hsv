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


function resize() {
  twgl.resizeCanvasToDisplaySize(glCanvas);
  gl.viewport(0,0, glCanvas.width, glCanvas.height);
}
resize();

const vertexShader = `
    attribute vec4 position;
    varying vec2 v_uv;
    void main() {
      v_uv = position.xy * 0.5 + 0.5;
      gl_Position = position;
    }
  `;

const fragShader = `
  precision mediump float;
  varying vec2 v_uv;

  // From https://github.com/hughsk/glsl-hsv2rgb
  vec3 hsv2rgb3(vec3 c)
  {
      vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
      vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
      return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
  }

  void main() {
    vec3 hsv = vec3(v_uv.x, v_uv.y, 1.0);
    vec3 color = hsv2rgb3(hsv);
    if (v_uv.x*v_uv.x + v_uv.y*v_uv.y < 0.01) {
       color = vec3(0.0,0.0,0.0);
    }
    gl_FragColor = vec4(color, 1.0);
  }
`;

const programInfo = twgl.createProgramInfo(gl, [vertexShader, fragShader]);
const bufferInfo = twgl.primitives.createXYQuadBufferInfo(gl);

function render() {
  resize();
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.useProgram(programInfo.program);
  twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
  twgl.drawBufferInfo(gl, bufferInfo);
}

render();
