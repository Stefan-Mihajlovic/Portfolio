import { createDustNoise, tileSize } from './dust-noise.js';

const vertex = `#version 300 es
void main() {
  vec2 corner = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
  gl_Position = vec4(corner * 2.0 - 1.0, 0.0, 1.0);
}`;

// Same density, lighting and projection as the Canvas 2D fallback. The GPU
// interpolates the shared periodic noise tile and shades all pixels in parallel.
const fragment = `#version 300 es
precision highp float;
uniform highp sampler2D noiseTile;
uniform sampler2D outgoing;
uniform vec2 size, focus, region, lightPosition;
uniform float phase, camera, progress, fieldScale;
uniform bool blendOutgoing;
out vec4 color;

float noiseAt(vec2 p) { return texture(noiseTile, (p + .5) / ${tileSize}.0).r; }
float sq(float x) { return x*x; }

void main() {
  vec2 pixel = vec2(gl_FragCoord.x, size.y - gl_FragCoord.y) - .5;
  float span = max(size.x, size.y);
  vec2 ray = (pixel - size * focus) / span;
  float remaining = 1.0 - progress;
  vec2 farP = ray * (1.0 + remaining * 1.65) + vec2(0, camera * .0000055);
  vec2 midP = ray * (1.0 + remaining * 3.2) + vec2(0, camera * .000034);
  vec2 nearP = ray * (1.0 + remaining * 5.0) + vec2(0, camera * .000095);
  vec2 lightAt = lightPosition * size / span;

  vec2 s = (farP * fieldScale + region * .55) * 194.0 + vec2(47,18);
  float swirl = noiseAt(s * .72 + vec2(phase,0));
  float eddy = noiseAt(s.yx * .89 + vec2(63,-phase*.72));
  vec2 f = s + vec2(swirl*34.0, eddy*31.0);
  float gas = noiseAt(f + phase*vec2(-.45,.37));
  float wisps = noiseAt(f*vec2(2.8,3.1) + vec2(eddy*21.0, gas*25.0-phase));
  float grit = noiseAt(f*vec2(8.1,7.6) + vec2(wisps*13.0,phase));
  float mass = max(0.0, .24+gas*.92+wisps*.25);
  float dust = clamp(.74+eddy*1.8-grit*.16, .08, 1.0);
  float filament = 1.0 / (1.0+520.0*sq(gas+.33*wisps+.09*grit-.13));
  vec2 bluePos = (farP - lightAt*vec2(.9,1) + vec2(swirl*.13,eddy*.09))*vec2(4.8,6.9);
  vec2 amberPos = (farP + lightAt*vec2(1,1.25) + vec2(eddy*.18,swirl*.16))*vec2(3.4,4.8);
  float blue = 1.0/sq(1.0+dot(bluePos,bluePos));
  float amber = 1.0/sq(1.0+dot(amberPos,amberPos));
  float glow = dust*(mass*mass+.30*filament*max(0.0,.65+wisps));

  vec2 corePos = midP-lightAt;
  float r2 = dot(corePos,corePos);
  float middle = noiseAt((midP+region)*vec2(264,240)+vec2(phase*1.7+53.0,96.0-phase));
  float lace = noiseAt(midP*vec2(797,676)+vec2(middle*24.0,-phase*2.0));
  float shell = r2*81.0-.53+.85*middle+.23*lace;
  float plasma = max(0.0,.35+middle+.54*lace) / (1.0+r2*150.0) * (.95/(1.0+57.0*shell*shell)+.36);
  float core = 1.0/(1.0+r2*210000.0);

  float shape = noiseAt((nearP+region*1.4)*vec2(123,147)+vec2(78.0-phase*1.4,29.0+phase*.7));
  float edge = noiseAt(nearP*vec2(324,365)+vec2(shape*35.0,21.0-phase));
  float veil = clamp((shape+.34*edge-.04)*2.6,0.0,1.0);
  float rim = veil*(1.0-veil)*(.15+blue+.5*amber);
  vec3 radiance = glow*(vec3(32,37,50)+blue*vec3(45,119,148)+amber*vec3(160,81,46))
                + plasma*vec3(68,146,171)+core*vec3(212,227,223);
  vec3 rgb = clamp((vec3(6,8,14)+(1.0-veil*.78)*radiance+rim*vec3(38,23,24))/255.0,0.0,1.0);
  if (blendOutgoing) {
    vec2 origin = vec2(focus.x,1.0-focus.y);
    vec2 uv = origin+(gl_FragCoord.xy/size-origin)*(1.0-.89*progress);
    rgb = mix(texture(outgoing,uv).rgb,rgb,smoothstep(0.0,1.0,progress));
  }
  color = vec4(rgb,1);
}`;

export function createGpuDust(canvas) {
  const gl = canvas.getContext('webgl2', {
    alpha: false, antialias: false, depth: false, stencil: false, failIfMajorPerformanceCaveat: true,
  });
  if (!gl) return null;
  const program = gl.createProgram();
  for (const [type, source] of [[gl.VERTEX_SHADER, vertex], [gl.FRAGMENT_SHADER, fragment]]) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    gl.attachShader(program, shader);
    gl.deleteShader(shader);
  }
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
  gl.useProgram(program);
  gl.disable(gl.DITHER);
  const uniforms = {};
  for (const name of ['noiseTile','outgoing','size','focus','region','lightPosition','phase','camera','progress','fieldScale','blendOutgoing']) {
    uniforms[name] = gl.getUniformLocation(program, name);
  }

  function texture(unit, wrap) {
    gl.activeTexture(unit);
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap);
    return tex;
  }
  texture(gl.TEXTURE0, gl.REPEAT);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.R16F, tileSize, tileSize, 0, gl.RED, gl.FLOAT, createDustNoise());
  gl.uniform1i(uniforms.noiseTile, 0);
  gl.uniform1i(uniforms.outgoing, 1);

  // Two persistent textures: at departure the completed frame becomes the
  // outgoing snapshot by exchanging handles, even on interrupted flights.
  function surface() {
    const tex = texture(gl.TEXTURE1, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    const buffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, buffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    return { tex, buffer, w: 1, h: 1 };
  }
  let target = surface(), snapshot = surface();
  let previousFlight, hasSnapshot = false;
  return function render({w,h,phase,camera,region,flightId,progress,focusX,focusY}) {
    if (previousFlight !== undefined && previousFlight !== flightId && progress < 1) {
      [snapshot, target] = [target, snapshot];
      hasSnapshot = true;
    }
    previousFlight = flightId;
    if (progress >= 1) hasSnapshot = false;
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    if (target.w !== w || target.h !== h) {
      gl.bindTexture(gl.TEXTURE_2D, target.tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      target.w = w; target.h = h;
    }
    gl.bindTexture(gl.TEXTURE_2D, snapshot.tex);
    gl.bindFramebuffer(gl.FRAMEBUFFER, target.buffer);
    gl.viewport(0,0,w,h);
    gl.uniform2f(uniforms.size,w,h);
    gl.uniform2f(uniforms.focus,focusX,focusY);
    gl.uniform2f(uniforms.region,region.x,region.y);
    gl.uniform2f(uniforms.lightPosition,region.lightX,region.lightY);
    gl.uniform1f(uniforms.phase,phase);
    gl.uniform1f(uniforms.camera,camera);
    gl.uniform1f(uniforms.fieldScale,region.scale);
    gl.uniform1f(uniforms.progress,progress);
    gl.uniform1i(uniforms.blendOutgoing,hasSnapshot);
    gl.drawArrays(gl.TRIANGLES,0,3);
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER,null);
    gl.blitFramebuffer(0,0,w,h,0,0,w,h,gl.COLOR_BUFFER_BIT,gl.NEAREST);
  };
}
