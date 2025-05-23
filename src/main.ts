import "./style.css";
import * as twgl from "twgl.js/dist/6.x/twgl-full";

const canvas = document.getElementById("glcanvas") as HTMLCanvasElement;
canvas.width = 500;
canvas.height = 500;

const gl = canvas.getContext("webgl")!;
const glCanvas = gl.canvas as HTMLCanvasElement;


function resize() {
  twgl.resizeCanvasToDisplaySize(glCanvas);
  gl.viewport(0,0, glCanvas.width, glCanvas.height);
}
resize();

const mouse = { x: 0, y: 0 };

const vertexShader = `
    attribute vec4 position;
    varying vec2 uv;
    void main() {
      uv = position.xy;
      gl_Position = position;
    }
  `;

const fragShader = `
  precision mediump float;
  varying vec2 uv;
  uniform vec2 u_mouse;

  #define PI2 6.283185308

  // From https://github.com/hughsk/glsl-hsv2rgb
  vec3 hsv2rgb3(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
  }

  vec3 toRadialHsv(vec2 xy) {
    float d = sqrt(xy.x*xy.x + xy.y*xy.y);

    // map angle from [-pi,pi] to [-0.5,0.5]
    float angle = atan(xy.y, xy.x)/PI2;

    // Out of bounds should be white
    if (d > 1.0) {
      return vec3(0.0, 0.0, 1.0);
    }

    return vec3(angle, d, 1.0);
  }

  void main() {
    // dot
    float dist = distance(uv, u_mouse);
    float dot = smoothstep(0.02, 0.0, dist);

    // radial rainbow
    vec3 hsv = toRadialHsv(uv);
    vec3 bg = hsv2rgb3(hsv);

    vec3 color = mix(vec3(0.0), bg, 1.0 - dot);

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
  twgl.setUniforms(programInfo, {
    u_mouse: [mouse.x, mouse.y],
  });
  twgl.drawBufferInfo(gl, bufferInfo);
}

canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  mouse.x = 2.0*(e.clientX - rect.left) / rect.width - 1.0;
  mouse.y = -2.0*(e.clientY - rect.top) / rect.height + 1.0; // Flip Y
  render();
});

render();
