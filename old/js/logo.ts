

const canvas = document.getElementById("glass-canvas") as HTMLCanvasElement;
const gl = canvas.getContext("webgl2");

if (!gl) throw new Error("WebGL2 not supported");

// Vertex shader (fullscreen quad)
const vertexShaderSource = `#version 300 es
in vec2 a_position;
out vec2 v_uv;
void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

const fragmentShaderSource = `#version 300 es
precision highp float;
out vec4 outColor;
in vec2 v_uv;
uniform vec2 u_resolution;
uniform float u_time;

vec3 lightDir = normalize(vec3(-0.5, 0.8, -1.0)); // Directional light
vec3 lightColor = vec3(1.0, 1.0, 1.0);            // White light
vec3 ambientColor = vec3(0.1, 0.1, 0.2);          // Soft ambient

#define MAX_STEPS 100
#define MAX_DIST 100.0
#define SURF_DIST 0.01

float sphereSDF(vec3 p, float r) {
  return length(p) - r;
}

const int NUM_SPHERES = 12;

float scene(vec3 p) {
  float angle = u_time * 0.5;
  mat2 rot = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
  
  mat2 rot2 = mat2(cos(-angle), -sin(-angle), sin(-angle), cos(-angle));

  float minDist = 100.0;

  for (int i = 0; i < NUM_SPHERES; i++) {
    float theta = float(i) / float(NUM_SPHERES) * 6.28318; // full circle
    vec3 center = vec3(cos(theta), float(i) / 6.0, sin(theta)) * 1.5; // radius
    center.xz = (i % 2 == 0 ? rot : rot2) * center.xz; // orbit around origin
    float d = sphereSDF(p - center, 0.6); // smaller radius
    minDist = min(minDist, d);
  }

  return minDist;
}

vec3 getNormal(vec3 p) {
  float d = scene(p);
  vec2 e = vec2(0.001, 0.0);
  vec3 n = d - vec3(
    scene(p - e.xyy),
    scene(p - e.yxy),
    scene(p - e.yyx)
  );
  return normalize(n);
}

vec3 raymarch(vec3 ro, vec3 rd) {
  float dO = 0.0;
  for (int i = 0; i < MAX_STEPS; i++) {
    vec3 p = ro + rd * dO;
    float dS = scene(p);
    if (dS < SURF_DIST) {
      vec3 n = getNormal(p);

      // Lighting calculations
      float diff = max(dot(n, lightDir), 0.0);
      vec3 reflectDir = reflect(-lightDir, n);
      float spec = pow(max(dot(rd, reflectDir), 0.0), 32.0);

      vec3 baseColor = vec3(0.6 + 0.4 * sin(p.x), 0.8 + 0.2 * cos(p.z), 1.0);
      vec3 lighting = ambientColor + diff * lightColor + spec * lightColor;

      vec3 refracted = refract(rd, n, 1.0 / 1.5);
      return baseColor * lighting;
    }
    dO += dS;
    if (dO > MAX_DIST) break;
  }
  return vec3(0.0); // background
}


void main() {
  vec2 uv = (gl_FragCoord.xy - u_resolution * 0.5) / u_resolution.y;
  vec3 ro = vec3(0.2, 2.0, 3.0); // Camera position
  vec3 target = vec3(0.0, 0.0, 0.0); // Look-at point

  // Compute camera basis
  vec3 forward = normalize(target - ro);
  vec3 right = normalize(cross(forward, vec3(0.0, 1.0, 0.0)));
  vec3 up = cross(right, forward);

  vec3 rd = normalize(uv.x * right + uv.y * up + forward);

  vec3 color = vec3(0.0);
  int samples = 4;

  for (int i = 0; i < samples; i++) {
    for (int j = 0; j < samples; j++) {
      vec2 jitter = vec2(float(i), float(j)) / float(samples) - 0.5;
      vec2 offsetUV = uv + jitter / u_resolution.y;
      vec3 rd = normalize(offsetUV.x * right + offsetUV.y * up + forward);
      color += raymarch(ro, rd);
    }
  }

  color /= float(samples * samples);
  outColor = vec4(color, 1.0);

}
`;

// Compile shaders
function compileShader(type: number, source: string): WebGLShader {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(shader)!);
  }
  return shader;
}

// Program linking
function createProgram(vsSource: string, fsSource: string): WebGLProgram {
  const vs = compileShader(gl.VERTEX_SHADER, vsSource);
  const fs = compileShader(gl.FRAGMENT_SHADER, fsSource);
  const program = gl.createProgram()!;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program)!);
  }
  return program;
}

const program = createProgram(vertexShaderSource, fragmentShaderSource);
gl.useProgram(program);

// Fullscreen quad setup
const quadVerts = new Float32Array([
  -1, -1,
   1, -1,
  -1,  1,
   1,  1,
]);

const vao = gl.createVertexArray();
gl.bindVertexArray(vao);

const vbo = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
gl.bufferData(gl.ARRAY_BUFFER, quadVerts, gl.STATIC_DRAW);

const posLoc = gl.getAttribLocation(program, "a_position");
gl.enableVertexAttribArray(posLoc);
gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

// Uniforms
const resLoc = gl.getUniformLocation(program, "u_resolution");
const timeLoc = gl.getUniformLocation(program, "u_time");

// Render loop
function render(time: number) {
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.useProgram(program);
  gl.uniform2f(resLoc, canvas.width, canvas.height);
  gl.uniform1f(timeLoc, time * 0.001);
  gl.bindVertexArray(vao);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  requestAnimationFrame(render);
}

requestAnimationFrame(render);
