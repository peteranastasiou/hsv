import "./style.css";
import * as twgl from "twgl.js/dist/6.x/twgl-full";
import * as lodash from "lodash";

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
  uniform vec2 u_points[10];   // support up to 10 points
  uniform int u_pointCount;
  uniform float u_thickness;

  #define PI2 6.283185308

  // From https://github.com/hughsk/glsl-hsv2rgb
  vec3 hsv2rgb3(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
  }

  // Distance from point p to segment ab
  float distToSegment(vec2 p, vec2 a, vec2 b) {
    vec2 pa = p - a;
    vec2 ba = b - a;
    float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
    return length(pa - ba * h);
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
    // float dist = distance(uv, u_mouse);
    // float dot = smoothstep(0.02, 0.0, dist);
    
    // Distance to line
    float minDist = 1e5;
    for (int i = 0; i < 9; i++) {
      if (i >= u_pointCount - 1) break;
      float d = distToSegment(uv, u_points[i], u_points[i+1]);
      minDist = min(minDist, d);
    }

    if (minDist < u_thickness) {
      gl_FragColor = vec4(1,0,0,1);
    } else {
      // radial rainbow
      vec3 hsv = toRadialHsv(uv);
      vec3 bg = hsv2rgb3(hsv);

      // vec3 color = mix(vec3(0.0), bg, 1.0 - dot);

      gl_FragColor = vec4(bg, 1.0);
    }
  }
`;

function rgbToHsv(params: {r: number, g: number, b: number}) {
  let {r,g,b} = params;
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const delta = max - min;

  let h = 0, s = 0, v = max;

  if (delta !== 0) {
    s = max === 0 ? 0 : delta / max;

    switch (max) {
      case r:
        h = ((g - b) / delta + (g < b ? 6 : 0)); break;
      case g:
        h = ((b - r) / delta + 2); break;
      case b:
        h = ((r - g) / delta + 4); break;
    }

    h /= 6;
  }

  return {
    h: h,        // Hue [0, 1]
    s: s,        // Saturation [0, 1]
    v: v         // Value [0, 1]
  };
}

const programInfo = twgl.createProgramInfo(gl, [vertexShader, fragShader]);
const bufferInfo = twgl.primitives.createXYQuadBufferInfo(gl);

function render(points: number[][]) {
  // const hsv = rgbToHsv(params);
  // const radius = hsv.s; // 0 - 1
  // const angle = 2 * Math.PI * hsv.h; // hue to radians
  // // Map to cartesian coordinates
  // const x = radius * Math.cos(angle);
  // const y = radius * Math.sin(angle);

  resize();
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.useProgram(programInfo.program);
  twgl.setUniforms(programInfo, {
    u_points: ([] as number[]).concat.apply([], points),  // trust me, this nonsense simply flattens [[a,b],[c,d]] to [a,b,c,d]
    u_pointCount: points.length,
    u_thickness: 0.01,
  });
  twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
  twgl.drawBufferInfo(gl, bufferInfo);
}

const loadImage = (file: any) => {
  const canvas2 = document.getElementById("canvas2") as HTMLCanvasElement;
  const ctx = canvas2.getContext("2d")!;
  canvas2.width = 500;
  canvas2.height = 500;

  // Load the image and draw it onto the canvas
  var img = new Image();
  img.src = file;
  img.onload = () => {
    ctx.drawImage(img, 0, 0, img.width/2.0, img.height/2.0);
  };

  // origin of line
  let x0 = 0;
  let y0 = 0;
  canvas2.addEventListener("mousedown", (e) => {
    x0 = e.offsetX;
    y0 = e.offsetY;
    canvas2.addEventListener("mousemove", moved);
  });
  canvas2.addEventListener("mouseup", () => {
    canvas2.removeEventListener("mousemove", moved);
  });
  const moved = (e) => {
    const x = e.offsetX;
    const y = e.offsetY;

    // Draw line
    ctx.drawImage(img, 0, 0, img.width/2.0, img.height/2.0);
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x,y);
    // ctx.setLineDash([0,1,1.5]);
    ctx.strokeStyle = "white";
    ctx.stroke();

    // Iterate through line, collecting rgb data
    let points: number[][] = [];
    iterateLine(x0, y0, x, y, 9, (x: number, y: number) => {
      const [r,g,b,_] = ctx.getImageData(x, y, 1, 1).data;
      
      // Conver rgb to x,y coord
      const hsv = rgbToHsv({r,g,b});
      const radius = hsv.s; // 0 - 1
      const angle = 2 * Math.PI * hsv.h; // hue to radians
      // Map to cartesian coordinates in hsv space
      const i = radius * Math.cos(angle);
      const j = radius * Math.sin(angle);
      points.push([i, j]);
      // Convert rgb to colour style string
      // ctx.fillStyle = `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
      // ctx.fillRect(x-10, y-10, 20, 20);
      // ctx.stroke();
      // console.log(x,y);
    });
    render(points);
  };
}

/**
 * Calls the callback n+1 times along the length of the line
 * @param callback 
 */
function iterateLine(x0: number, y0: number, x1: number, y1: number, n: number, callback: (x: number, y: number) => void) {
  const dx = x1 - x0;
  const dy = y1 - y0;

  const xIncrement = dx / n;
  const yIncrement = dy / n;

  let x = x0;
  let y = y0;

  lodash.forEach(lodash.range(n + 1), () => {
    callback(Math.round(x), Math.round(y));
    x += xIncrement;
    y += yIncrement;
  });
}

document.querySelector('#getfile')!
        .addEventListener('change', (e) => {
  var file = (e as any).target.files[0];
  loadImage(window.URL.createObjectURL(file));
  e.preventDefault();
});

// canvas.addEventListener('mousemove', (e) => {
//   const rect = canvas.getBoundingClientRect();
//   mouse.x = 2.0*(e.clientX - rect.left) / rect.width - 1.0;
//   mouse.y = -2.0*(e.clientY - rect.top) / rect.height + 1.0; // Flip Y
//   render();
// });

// Starting colour
render({r:0, g:0, b:0});
