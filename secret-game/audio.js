// Studio-grade procedural Web Audio synth engine:
// Stereo impulse reverb + ping-pong delay, dual-oscillator analog voices,
// 16-bar A/B main orbital soundtrack, and 3 bespoke boss compositions.

const hz = (note) => 440 * 2 ** ((note - 69) / 12);
const comboScale = [62, 65, 67, 69, 72, 74, 77, 79, 81, 84, 86];

// --- MAIN SOUNDTRACK: 16-bar A/B composition in D Minor / F Major lift (118 BPM) ---
// Each bar has: root MIDI note, chord intervals, bass octave/step pattern, lead melody [step, noteOffset, durSteps]
const MAIN_BPM = 118;
const MAIN_STEP = 60 / MAIN_BPM / 4;

const mainBars = [
  // SECTION A (Bars 0-7): Atmospheric orbital drive (Dm -> Bbmaj7 -> Gm7 -> A7sus4 -> Dm -> Bb -> C -> A7)
  { root: 50, chord: [0, 3, 7, 10, 14], bass: [0, 0, 12, 0, 0, 0, 12, 7], lead: [[0, 14, 3], [3, 15, 2], [6, 12, 4], [12, 10, 3]] },
  { root: 46, chord: [0, 4, 7, 11, 14], bass: [0, 0, 12, 0, 0, 7, 12, 11], lead: [[0, 11, 3], [4, 14, 3], [8, 16, 4], [14, 14, 2]] },
  { root: 43, chord: [0, 3, 7, 10, 14], bass: [0, 0, 12, 0, 3, 0, 7, 10], lead: [[0, 14, 4], [6, 17, 3], [10, 15, 3], [14, 14, 2]] },
  { root: 45, chord: [0, 5, 7, 10, 14], bass: [0, 0, 12, 0, 7, 5, 4, 0], lead: [[0, 12, 4], [6, 10, 3], [10, 9, 4]] },
  { root: 50, chord: [0, 3, 7, 14], bass: [0, 0, 12, 0, 0, 3, 7, 10], lead: [[0, 14, 2], [2, 15, 2], [4, 17, 4], [10, 19, 3], [14, 17, 2]] },
  { root: 46, chord: [0, 4, 7, 14], bass: [0, 0, 12, 0, 4, 7, 12, 7], lead: [[0, 16, 4], [6, 14, 3], [10, 11, 4]] },
  { root: 48, chord: [0, 4, 7, 14], bass: [0, 0, 12, 0, 7, 0, 12, 11], lead: [[0, 14, 3], [4, 16, 3], [8, 19, 4], [14, 16, 2]] },
  { root: 45, chord: [0, 4, 7, 10], bass: [0, 0, 12, 7, 4, 7, 10, 12], lead: [[0, 16, 4], [6, 13, 4], [12, 12, 3]] },

  // SECTION B (Bars 8-15): Soaring chorus lift (Fmaj7 -> C -> Dm9 -> Am7 -> Bbmaj7 -> C -> Gm7 -> A7)
  { root: 53, chord: [0, 4, 7, 11, 14], bass: [0, 12, 0, 12, 7, 12, 0, 11], lead: [[0, 16, 3], [3, 19, 3], [6, 21, 5], [12, 19, 3]] },
  { root: 48, chord: [0, 4, 7, 12, 16], bass: [0, 12, 0, 12, 7, 12, 11, 7], lead: [[0, 19, 4], [6, 16, 3], [10, 14, 4]] },
  { root: 50, chord: [0, 3, 7, 10, 14], bass: [0, 12, 0, 12, 3, 12, 7, 10], lead: [[0, 15, 3], [3, 17, 3], [6, 19, 4], [12, 17, 3]] },
  { root: 45, chord: [0, 3, 7, 10, 14], bass: [0, 12, 0, 7, 10, 12, 7, 3], lead: [[0, 19, 4], [6, 15, 4], [12, 14, 3]] },
  { root: 46, chord: [0, 4, 7, 11, 14], bass: [0, 12, 0, 12, 7, 12, 4, 7], lead: [[0, 19, 3], [3, 21, 3], [6, 23, 5], [12, 21, 3]] },
  { root: 48, chord: [0, 4, 7, 14], bass: [0, 12, 0, 12, 7, 12, 14, 12], lead: [[0, 19, 4], [6, 16, 3], [10, 19, 4]] },
  { root: 43, chord: [0, 3, 7, 10, 14], bass: [0, 12, 0, 7, 10, 7, 3, 0], lead: [[0, 17, 3], [4, 15, 3], [8, 14, 4], [14, 12, 2]] },
  { root: 45, chord: [0, 4, 7, 10, 13], bass: [0, 12, 7, 12, 4, 7, 10, 13], lead: [[0, 13, 3], [4, 16, 3], [8, 19, 4], [12, 16, 4]] },
];

// --- 3 BESPOKE BOSS SOUNDTRACKS ---
const BOSS_SCORES = [
  // 0: SCYTHE (138 BPM, E Phrygian cyberpunk assault)
  {
    bpm: 138,
    root: 40, // E2
    bars: [
      { shift: 0, chord: [0, 7, 12, 15], riff: [[0, 24, 2], [2, 25, 2], [4, 24, 2], [6, 22, 2], [8, 24, 3], [12, 27, 2], [14, 25, 2]] },
      { shift: 1, chord: [0, 7, 12, 16], riff: [[0, 24, 2], [3, 27, 2], [6, 26, 2], [8, 24, 3], [12, 22, 2], [14, 20, 2]] },
      { shift: 3, chord: [0, 7, 12, 16], riff: [[0, 24, 2], [2, 26, 2], [4, 28, 3], [8, 26, 2], [10, 24, 2], [12, 22, 4]] },
      { shift: 1, chord: [0, 7, 11, 15], riff: [[0, 24, 3], [4, 27, 2], [6, 29, 2], [8, 27, 2], [10, 24, 2], [12, 23, 4]] },
    ],
    bassPattern: [0, 12, 0, 12, 0, 12, 7, 12, 0, 12, 0, 12, 1, 12, 7, 10],
    kicks: [0, 4, 8, 10, 12],
    snares: [4, 12],
    leadWave: 'sawtooth',
    arpScale: [0, 1, 3, 7, 8, 10, 12, 15],
  },
  // 1: BASTION (124 BPM, C Minor heavy industrial brass & stomp)
  {
    bpm: 124,
    root: 36, // C2
    bars: [
      { shift: 0, chord: [0, 7, 12, 15], riff: [[0, 24, 4], [6, 27, 2], [8, 26, 4], [12, 24, 3]] },
      { shift: 8, chord: [0, 7, 12, 16], riff: [[0, 24, 4], [6, 23, 2], [8, 24, 4], [12, 28, 4]] },
      { shift: 5, chord: [0, 7, 12, 15], riff: [[0, 27, 3], [4, 26, 3], [8, 24, 4], [12, 22, 4]] },
      { shift: 7, chord: [0, 7, 11, 14], riff: [[0, 26, 4], [4, 23, 3], [8, 26, 3], [12, 29, 4]] },
    ],
    bassPattern: [0, 0, 12, 0, 0, 7, 0, 10, 0, 0, 12, 0, 3, 0, 7, 10],
    kicks: [0, 3, 6, 8, 11, 14],
    snares: [4, 12],
    leadWave: 'square',
    arpScale: [0, 3, 5, 7, 10, 12, 15],
  },
  // 2: VESPER (146 BPM, F# Minor high-velocity melodic finale)
  {
    bpm: 146,
    root: 42, // F#2
    bars: [
      { shift: 0, chord: [0, 7, 12, 15], riff: [[0, 27, 2], [2, 29, 2], [4, 31, 3], [8, 29, 2], [10, 27, 2], [12, 24, 4]] },
      { shift: 8, chord: [0, 7, 12, 16], riff: [[0, 28, 2], [2, 31, 2], [4, 33, 3], [8, 31, 2], [10, 28, 2], [12, 26, 4]] },
      { shift: 10, chord: [0, 7, 12, 16], riff: [[0, 26, 2], [2, 28, 2], [4, 31, 4], [10, 28, 2], [12, 26, 4]] },
      { shift: 7, chord: [0, 7, 11, 16], riff: [[0, 28, 3], [4, 31, 3], [8, 35, 4], [12, 31, 4]] },
    ],
    bassPattern: [0, 12, 0, 12, 0, 12, 7, 12, 0, 12, 0, 12, 10, 12, 7, 12],
    kicks: [0, 4, 8, 12],
    snares: [4, 12],
    leadWave: 'sawtooth',
    arpScale: [0, 2, 3, 7, 10, 12, 14, 15],
  },
];

function createImpulseResponse(ctx, duration = 1.8, decay = 2.6) {
  const length = Math.floor(ctx.sampleRate * duration);
  const impulse = ctx.createBuffer(2, length, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const channel = impulse.getChannelData(ch);
    let lp = 0;
    for (let i = 0; i < length; i++) {
      const env = Math.pow(1 - i / length, decay);
      const raw = (Math.random() * 2 - 1) * env;
      // Gentle damping so reverb sounds dark and warm, never harsh/hissy
      lp = lp * 0.72 + raw * 0.28;
      channel[i] = lp;
    }
  }
  return impulse;
}

export function createFlightAudio() {
  let ctx,
    master,
    compressor,
    noise,
    reverbImpulse,
    session,
    lossBus,
    timer,
    beat = 0,
    nextBeat = 0,
    wave = 1,
    intensity = 0,
    bossSpec = null,
    bossRank = 0,
    volume = 35;

  try {
    const saved = localStorage.getItem('low-orbit-volume');
    if (saved !== null && Number.isFinite(+saved)) volume = Math.max(0, Math.min(100, +saved));
  } catch {}

  function init() {
    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtor) return false;
    if (ctx) return true;
    try {
      ctx = new AudioCtor();
    } catch {
      return false;
    }
    compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -13;
    compressor.knee.value = 16;
    compressor.ratio.value = 4.2;
    compressor.attack.value = 0.004;
    compressor.release.value = 0.18;

    master = ctx.createGain();
    master.gain.value = (volume / 100) * 0.9;
    compressor.connect(master).connect(ctx.destination);

    noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    reverbImpulse = createImpulseResponse(ctx, 1.75, 2.7);
    return true;
  }

  // Dual-oscillator detuned analog synth voice with resonant filter & stereo/reverb sends
  function synthVoice({
    t,
    len,
    waveType = 'sawtooth',
    freq,
    endFreq = freq,
    level = 0.12,
    attack = 0.01,
    cutoffStart = 2400,
    cutoffEnd = 650,
    q = 1.2,
    detune = 0,
    pan = 0,
    reverb = 0,
    delay = 0,
    bus = session?.musicBus,
  }) {
    if (!bus || !ctx) return;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(Math.max(80, cutoffStart), t);
    filter.frequency.exponentialRampToValueAtTime(Math.max(80, cutoffEnd), t + len);
    filter.Q.value = q;

    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(Math.max(0.0002, level), t + Math.max(0.002, attack));
    env.gain.exponentialRampToValueAtTime(0.0001, t + len);

    const panner = ctx.createStereoPanner();
    panner.pan.value = Math.max(-0.92, Math.min(0.92, pan));

    const oscs = detune > 0 ? [-detune, detune] : [0];
    const nodes = [filter, env, panner];
    let lastOsc = null;
    for (const cents of oscs) {
      const osc = ctx.createOscillator();
      osc.type = waveType;
      osc.frequency.setValueAtTime(Math.max(24, freq), t);
      if (endFreq !== freq) osc.frequency.exponentialRampToValueAtTime(Math.max(24, endFreq), t + len);
      osc.detune.value = cents;
      osc.connect(filter);
      osc.start(t);
      osc.stop(t + len + 0.03);
      nodes.push(osc);
      lastOsc = osc;
    }

    filter.connect(env).connect(panner).connect(bus);
    if (reverb > 0 && session?.reverbSend) {
      const send = ctx.createGain();
      send.gain.value = reverb;
      panner.connect(send).connect(session.reverbSend);
      nodes.push(send);
    }
    if (delay > 0 && session?.delaySend) {
      const send = ctx.createGain();
      send.gain.value = delay;
      panner.connect(send).connect(session.delaySend);
      nodes.push(send);
    }
    if (lastOsc) {
      lastOsc.onended = () => {
        for (const n of nodes) {
          try {
            n.disconnect();
          } catch {}
        }
      };
    }
  }

  // Punchy analog drum kit voices
  function playKick(t, level = 0.42, punch = 155) {
    if (!session || !ctx) return;
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(punch, t);
    osc.frequency.exponentialRampToValueAtTime(42, t + 0.085);
    osc.frequency.exponentialRampToValueAtTime(32, t + 0.24);
    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(level, t + 0.003);
    env.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
    osc.connect(env).connect(session.musicBus);
    osc.onended = () => {
      osc.disconnect();
      env.disconnect();
    };
    osc.start(t);
    osc.stop(t + 0.27);
  }

  function playSnare(t, level = 0.2, bright = 3200) {
    if (!session || !ctx) return;
    // Snare noise crack with gated reverb send
    const src = ctx.createBufferSource();
    src.buffer = noise;
    src.loop = true;
    const hp = ctx.createBiquadFilter();
    hp.type = 'bandpass';
    hp.frequency.setValueAtTime(bright, t);
    hp.Q.value = 0.7;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(level, t + 0.003);
    env.gain.exponentialRampToValueAtTime(0.0001, t + 0.17);
    src.connect(hp).connect(env).connect(session.musicBus);
    if (session.reverbSend) {
      const rev = ctx.createGain();
      rev.gain.value = 0.35;
      env.connect(rev).connect(session.reverbSend);
    }
    src.onended = () => {
      src.disconnect();
      hp.disconnect();
      env.disconnect();
    };
    src.start(t);
    src.stop(t + 0.19);
    // Snare body thump
    synthVoice({
      t,
      len: 0.09,
      waveType: 'triangle',
      freq: 215,
      endFreq: 108,
      level: level * 0.65,
      attack: 0.002,
      cutoffStart: 1200,
      cutoffEnd: 400,
      q: 0.7,
    });
  }

  function playHat(t, open = false, level = 0.055, pan = 0.28) {
    if (!session || !ctx) return;
    const src = ctx.createBufferSource();
    src.buffer = noise;
    src.loop = true;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.setValueAtTime(open ? 6800 : 8800, t);
    const env = ctx.createGain();
    const dur = open ? 0.16 : 0.042;
    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(level, t + 0.002);
    env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    const panner = ctx.createStereoPanner();
    panner.pan.value = pan;
    src.connect(hp).connect(env).connect(panner).connect(session.musicBus);
    src.onended = () => {
      src.disconnect();
      hp.disconnect();
      env.disconnect();
      panner.disconnect();
    };
    src.start(t);
    src.stop(t + dur + 0.02);
  }

  // Raw SFX voice helper (stays crisp & clean on separate SFX bus)
  function sfxVoice(
    t,
    len,
    kind,
    pitch,
    end,
    level,
    attack = 0.006,
    cutoff = 3000,
    pan = 0,
    reverb = 0,
    bus = session?.sfxBus,
  ) {
    if (!bus || !ctx) return;
    const source = kind === 'noise' ? ctx.createBufferSource() : ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const env = ctx.createGain();
    const stereo = ctx.createStereoPanner();
    if (kind === 'noise') {
      source.buffer = noise;
      source.loop = true;
      filter.type = 'bandpass';
    } else {
      source.type = kind === 'plasma' ? 'sine' : kind;
      source.frequency.setValueAtTime(Math.max(20, pitch), t);
      source.frequency.exponentialRampToValueAtTime(Math.max(20, end), t + len);
    }
    let modulator, depth;
    if (kind === 'plasma') {
      modulator = ctx.createOscillator();
      depth = ctx.createGain();
      modulator.frequency.setValueAtTime(Math.max(20, pitch * 1.83), t);
      modulator.frequency.exponentialRampToValueAtTime(Math.max(20, end * 0.72), t + len);
      depth.gain.setValueAtTime(pitch * 0.85, t);
      depth.gain.exponentialRampToValueAtTime(2, t + len);
      modulator.connect(depth).connect(source.frequency);
      modulator.start(t);
      modulator.stop(t + len);
    }
    filter.frequency.setValueAtTime(cutoff, t);
    filter.frequency.exponentialRampToValueAtTime(Math.max(90, cutoff * 0.42), t + len);
    filter.Q.value = kind === 'noise' ? 0.85 : 0.6;
    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(Math.max(0.0002, level), t + attack);
    env.gain.exponentialRampToValueAtTime(0.0001, t + len);
    stereo.pan.value = Math.max(-0.9, Math.min(0.9, pan));
    source.connect(filter).connect(env).connect(stereo).connect(bus);
    if (reverb > 0 && session?.reverbSend) {
      const send = ctx.createGain();
      send.gain.value = reverb;
      stereo.connect(send).connect(session.reverbSend);
    }
    source.onended = () => {
      for (const node of [source, filter, env, stereo]) node.disconnect();
      modulator?.disconnect();
      depth?.disconnect();
    };
    source.start(t);
    source.stop(t + len + 0.025);
  }

  function arrangeMain(t, step) {
    const barIndex = Math.floor(step / 16) % mainBars.length;
    const n = step % 16;
    const bar = mainBars[barIndex];
    const inChorus = barIndex >= 8;
    const drive = Math.min(1, intensity + (inChorus ? 0.25 : 0));

    // 1. Lush warm analog chord pad at bar downbeat
    if (n === 0) {
      bar.chord.forEach((interval, i) => {
        const f = hz(bar.root + interval);
        synthVoice({
          t,
          len: MAIN_STEP * 15.6,
          waveType: 'sawtooth',
          freq: f,
          level: 0.028 + (inChorus ? 0.008 : 0),
          attack: 0.22,
          cutoffStart: 850 + i * 220 + drive * 500,
          cutoffEnd: 520 + i * 140,
          q: 0.8,
          detune: 7,
          pan: (i - (bar.chord.length - 1) / 2) * 0.28,
          reverb: 0.48,
        });
      });
    }

    // 2. Rolling Moog-style 8th/16th analog bassline
    if (n % 2 === 0 || (drive > 0.45 && n % 4 === 3)) {
      const slot = Math.floor(n / 2) % bar.bass.length;
      const semi = bar.bass[slot];
      const f = hz(bar.root - 12 + semi);
      const accent = n === 0 || n === 6 || n === 12;
      synthVoice({
        t,
        len: MAIN_STEP * (n % 2 === 0 ? 1.85 : 1.05),
        waveType: 'sawtooth',
        freq: f,
        level: accent ? 0.165 : 0.125,
        attack: 0.005,
        cutoffStart: (accent ? 1180 : 780) + drive * 520,
        cutoffEnd: 240,
        q: 2.2,
        detune: 5,
        pan: 0,
      });
    }

    // 3. Punchy groove percussion + bar-end tom fills
    if (n === 0 || n === 8 || (n === 10 && (inChorus || wave >= 2)) || (n === 14 && drive > 0.7)) {
      playKick(t, inChorus ? 0.44 : 0.39, 148);
    }
    if (n === 4 || n === 12) {
      playSnare(t, inChorus ? 0.21 : 0.17, 3200);
    }
    if (n % 2 === 0) {
      playHat(t, n === 14, n % 4 === 2 ? 0.062 : 0.032, n % 4 === 2 ? 0.32 : -0.22);
    } else if (inChorus || wave >= 2 || drive > 0.4) {
      playHat(t, false, 0.028, 0.18);
    }
    // Subtle synth-tom fill on bar 7 and bar 15
    if ((barIndex === 7 || barIndex === 15) && [13, 14, 15].includes(n)) {
      const tomPitch = [190, 150, 112][n - 13];
      synthVoice({
        t,
        len: 0.16,
        waveType: 'triangle',
        freq: tomPitch,
        endFreq: tomPitch * 0.52,
        level: 0.18,
        attack: 0.004,
        cutoffStart: 1200,
        cutoffEnd: 320,
        pan: (n - 14) * 0.35,
        reverb: 0.35,
      });
    }

    // 4. Expressive soaring lead melody
    const hit = bar.lead.find(([on]) => on === n);
    if (hit) {
      const [, offset, dur] = hit;
      const f = hz(bar.root + 12 + offset);
      synthVoice({
        t,
        len: MAIN_STEP * dur * 0.95,
        waveType: inChorus ? 'sawtooth' : 'triangle',
        freq: f,
        level: inChorus ? 0.095 : 0.115,
        attack: 0.015,
        cutoffStart: (inChorus ? 3400 : 2500) + drive * 900,
        cutoffEnd: 1100,
        q: 1.5,
        detune: inChorus ? 9 : 4,
        pan: -0.18,
        reverb: 0.36,
        delay: 0.38,
      });
    }

    // 5. Shimmering stereo bell-arp counter-melody
    if ((inChorus || wave >= 2 || drive > 0.35) && n % 2 === 0) {
      const chordNote = bar.chord[(n / 2 + barIndex) % bar.chord.length];
      const f = hz(bar.root + 24 + chordNote);
      synthVoice({
        t,
        len: MAIN_STEP * 1.9,
        waveType: 'sine',
        freq: f,
        level: 0.048 + drive * 0.02,
        attack: 0.004,
        cutoffStart: 4200,
        cutoffEnd: 1800,
        pan: n % 4 === 0 ? 0.42 : -0.36,
        reverb: 0.45,
        delay: 0.42,
      });
    }
  }

  function arrangeBoss(t, step) {
    const barIdx = Math.floor(step / 16) % bossSpec.bars.length;
    const n = step % 16;
    const bar = bossSpec.bars[barIdx];
    const stepLen = 60 / bossSpec.bpm / 4;
    const root = bossSpec.root + bar.shift + ((Math.floor((bossRank - 1) / 3) % 4) * 2);

    // 1. Massive brassy chord stab on bar downbeat (and beat 3 for Bastion)
    if (n === 0 || (bossSpec === BOSS_SCORES[1] && n === 8)) {
      bar.chord.forEach((interval, i) => {
        synthVoice({
          t,
          len: stepLen * 7.5,
          waveType: 'sawtooth',
          freq: hz(root + 12 + interval),
          level: 0.042,
          attack: 0.03,
          cutoffStart: 2200 + i * 240,
          cutoffEnd: 520,
          q: 1.4,
          detune: 11,
          pan: (i - 1.5) * 0.35,
          reverb: 0.45,
        });
      });
    }

    // 2. Relentless 16th-note boss bassline
    const bassSemi = bossSpec.bassPattern[n];
    const bassFreq = hz(root + bassSemi);
    synthVoice({
      t,
      len: stepLen * 0.92,
      waveType: 'sawtooth',
      freq: bassFreq,
      level: n % 4 === 0 ? 0.2 : 0.145,
      attack: 0.003,
      cutoffStart: n % 4 === 0 ? 1750 : 1050,
      cutoffEnd: 260,
      q: 2.5,
      detune: 6,
    });

    // 3. Driving boss drums + energetic snare rolls on bar 4
    if (bossSpec.kicks.includes(n)) playKick(t, 0.48, 172);
    if (bossSpec.snares.includes(n) || (barIdx === 3 && n >= 12)) {
      playSnare(t, barIdx === 3 && n >= 12 ? 0.16 + (n - 12) * 0.03 : 0.24, 3600);
    }
    if (n % 2 === 0) playHat(t, n === 14, 0.055, n % 4 === 0 ? -0.3 : 0.3);

    // 4. Aggressive boss hook riff
    const hit = bar.riff.find(([on]) => on === n);
    if (hit) {
      const [, offset, dur] = hit;
      const f = hz(root + offset);
      synthVoice({
        t,
        len: stepLen * dur * 0.94,
        waveType: bossSpec.leadWave,
        freq: f,
        level: 0.11,
        attack: 0.008,
        cutoffStart: 4200,
        cutoffEnd: 1400,
        q: 1.8,
        detune: 10,
        pan: -0.15,
        reverb: 0.3,
        delay: 0.34,
      });
    }

    // 5. High-tension 16th arp pulse
    if (n % 2 === 1) {
      const note = bossSpec.arpScale[(n + barIdx * 3) % bossSpec.arpScale.length];
      synthVoice({
        t,
        len: stepLen * 1.1,
        waveType: 'triangle',
        freq: hz(root + 24 + note),
        level: 0.055,
        attack: 0.003,
        cutoffStart: 3600,
        cutoffEnd: 1500,
        pan: n % 4 === 1 ? 0.45 : -0.45,
        delay: 0.32,
      });
    }
  }

  function schedule() {
    if (!session) return;
    if (nextBeat < ctx.currentTime - 0.18) nextBeat = ctx.currentTime + 0.02;
    while (nextBeat < ctx.currentTime + 0.18) {
      if (bossSpec) arrangeBoss(nextBeat, beat++);
      else arrangeMain(nextBeat, beat++);
      nextBeat += bossSpec ? 60 / bossSpec.bpm / 4 : MAIN_STEP;
    }
  }

  function start() {
    if (session || !init()) return;
    silenceLoss();
    ctx.resume().catch(() => {});

    const rootBus = ctx.createGain();
    const musicBus = ctx.createGain();
    musicBus.gain.value = 0.88;
    const sfxBus = ctx.createGain();
    sfxBus.gain.value = 1.0;

    // Warm stereo convolver reverb
    const reverbSend = ctx.createGain();
    const convolver = ctx.createConvolver();
    convolver.buffer = reverbImpulse;
    const reverbWet = ctx.createGain();
    reverbWet.gain.value = 0.42;
    reverbSend.connect(convolver).connect(reverbWet).connect(rootBus);

    // Tempo-synced stereo delay with subtle feedback
    const delaySend = ctx.createGain();
    const delayNode = ctx.createDelay(1.0);
    const stepLen = bossSpec ? 60 / bossSpec.bpm / 4 : MAIN_STEP;
    delayNode.delayTime.value = stepLen * 3;
    const delayFilter = ctx.createBiquadFilter();
    delayFilter.type = 'lowpass';
    delayFilter.frequency.value = 2200;
    const delayFeedback = ctx.createGain();
    delayFeedback.gain.value = 0.3;
    const delayWet = ctx.createGain();
    delayWet.gain.value = 0.28;
    delaySend.connect(delayNode);
    delayNode.connect(delayFilter);
    delayFilter.connect(delayWet).connect(rootBus);
    delayFilter.connect(delayFeedback).connect(delayNode);

    musicBus.connect(rootBus);
    sfxBus.connect(rootBus);
    rootBus.connect(compressor);

    session = {
      rootBus,
      musicBus,
      sfxBus,
      reverbSend,
      convolver,
      reverbWet,
      delaySend,
      delayNode,
      delayFilter,
      delayFeedback,
      delayWet,
    };
    nextBeat = ctx.currentTime + 0.025;
    schedule();
    timer = setInterval(schedule, 55);
  }

  function silenceLoss() {
    if (!lossBus) return;
    const bus = lossBus;
    lossBus = null;
    bus.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.012);
    setTimeout(() => bus.disconnect(), 100);
  }

  function death() {
    if (!ctx || !volume) return;
    silenceLoss();
    const t = ctx.currentTime;
    const bus = ctx.createGain();
    bus.connect(compressor);
    lossBus = bus;
    sfxVoice(t, 0.5, 'noise', 0, 0, 0.58, 0.003, 4200, -0.12, 0, bus);
    sfxVoice(t, 0.85, 'sine', 162, 30, 0.55, 0.008, 1200, 0, 0, bus);
    sfxVoice(t + 0.05, 0.55, 'plasma', 610, 44, 0.24, 0.013, 2800, 0.22, 0, bus);
    [74, 69, 62].forEach((note, i) => {
      const f = hz(note);
      sfxVoice(
        t + 0.35 + i * 0.16,
        i === 2 ? 0.58 : 0.18,
        'triangle',
        f,
        f * 0.985,
        0.24,
        0.012,
        1750,
        (i - 1) * 0.18,
        0,
        bus,
      );
    });
    setTimeout(() => {
      if (lossBus === bus) lossBus = null;
      bus.disconnect();
    }, 1400);
  }

  function stop() {
    silenceLoss();
    clearInterval(timer);
    if (!session) return;
    const s = session;
    session = null;
    s.rootBus.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.02);
    setTimeout(() => {
      for (const node of Object.values(s)) {
        try {
          node.disconnect();
        } catch {}
      }
    }, 160);
  }

  function effect(name, detail = 0) {
    if (!session || !volume) return;
    const t = ctx.currentTime;
    const jitter = 0.96 + Math.random() * 0.08;
    switch (name) {
      case 'fire':
        sfxVoice(t, 0.1, 'plasma', 960 * jitter, 145, 0.18, 0.002, 4600, (Math.random() - 0.5) * 0.15);
        sfxVoice(t, 0.055, 'sine', 190 * jitter, 52, 0.14, 0.002, 1800);
        break;
      case 'focusFire':
        sfxVoice(t, 0.09, 'sawtooth', 1240 * jitter, 340, 0.12, 0.002, 5200);
        sfxVoice(t, 0.07, 'sine', 340 * jitter, 110, 0.14, 0.002, 2200);
        break;
      case 'missile':
        sfxVoice(t, 0.18, 'noise', 0, 0, 0.1, 0.01, 2400, (Math.random() - 0.5) * 0.4);
        sfxVoice(t, 0.15, 'triangle', 420 * jitter, 760, 0.075, 0.01, 2200);
        break;
      case 'phaseDash':
        sfxVoice(t, 0.22, 'sine', 240, 820, 0.19, 0.008, 3400, 0, 0.35);
        sfxVoice(t, 0.17, 'noise', 0, 0, 0.16, 0.006, 3800);
        break;
      case 'nova':
        sfxVoice(t, 0.72, 'sine', 190, 28, 0.52, 0.004, 1400);
        sfxVoice(t, 0.58, 'plasma', 880, 72, 0.3, 0.006, 4600, 0, 0.4);
        sfxVoice(t, 0.42, 'noise', 0, 0, 0.24, 0.008, 2800, 0, 0.3);
        [62, 69, 74, 81].forEach((n, i) =>
          sfxVoice(t + i * 0.03, 0.44, 'triangle', hz(n), hz(n + 12), 0.12, 0.006, 3800, (i - 1.5) * 0.3, 0.45),
        );
        break;
      case 'shard': {
        const note = comboScale[Math.min(comboScale.length - 1, Math.max(0, Math.floor(detail)))];
        const f = hz(note);
        sfxVoice(t, 0.12, 'sine', f, f * 1.02, 0.1, 0.003, 3800, (Math.random() - 0.5) * 0.3, 0.32);
        break;
      }
      case 'upgrade':
        [62, 69, 74, 81, 86].forEach((n, i) =>
          sfxVoice(t + i * 0.055, 0.3, 'triangle', hz(n), hz(n), 0.14, 0.006, 3800, (i - 2) * 0.2, 0.4),
        );
        break;
      case 'warning':
        for (let i = 0; i < 3; i++) {
          sfxVoice(t + i * 0.28, 0.22, 'sawtooth', 440, 310, 0.17, 0.01, 1800, 0, 0.35);
          sfxVoice(t + i * 0.28, 0.22, 'sine', 110, 82, 0.22, 0.01, 800);
        }
        break;
      case 'beam':
        sfxVoice(t, 0.5, 'sawtooth', 260, 180, 0.17, 0.02, 2600, 0, 0.35);
        sfxVoice(t, 0.48, 'noise', 0, 0, 0.13, 0.02, 3400);
        break;
      case 'raider':
      case 'volley': {
        const heavy = name === 'volley';
        sfxVoice(
          t,
          heavy ? 0.34 : 0.19,
          'plasma',
          (heavy ? 315 : 610) * jitter,
          heavy ? 49 : 120,
          0.2,
          0.005,
          3400,
          0.16,
          0.25,
        );
        break;
      }
      case 'dash':
        sfxVoice(t, 0.24, 'sawtooth', 105, 540, 0.095, 0.024, 1550, 0.25, 0.25);
        sfxVoice(t, 0.18, 'noise', 0, 0, 0.12, 0.02, 1800);
        break;
      case 'impact':
        sfxVoice(t, 0.075, 'plasma', 1220 * jitter, 220, 0.14, 0.002, 4100);
        sfxVoice(t, 0.055, 'noise', 0, 0, 0.09, 0.002, 2000);
        break;
      case 'rock':
      case 'ship':
        sfxVoice(t, 0.1, 'plasma', 370 * jitter, 64, 0.22, 0.002, 2600);
        sfxVoice(t, 0.4, 'noise', 0, 0, 0.3, 0.006, name === 'rock' ? 1080 : 2300, -0.14, 0.25);
        sfxVoice(t, 0.3, 'sine', name === 'rock' ? 112 : 164, 34, 0.26, 0.006, 980);
        break;
      case 'graze': {
        const note = comboScale[Math.min(comboScale.length - 1, Math.floor(detail) + 3)];
        sfxVoice(t, 0.09, 'sine', hz(note), hz(note + 5), 0.1, 0.003, 3400, (Math.random() - 0.5) * 0.4, 0.22);
        break;
      }
      case 'breach':
        sfxVoice(t, 0.34, 'noise', 0, 0, 0.3, 0.005, 3400, 0, 0.35);
        sfxVoice(t, 0.4, 'plasma', 142, 42, 0.38, 0.004, 1900, 0, 0.3);
        sfxVoice(t + 0.09, 0.24, 'triangle', 620, 960, 0.15, 0.01, 2400, 0.22, 0.4);
        break;
      case 'shield':
        [0, 7, 12].forEach((n, i) =>
          sfxVoice(
            t + i * 0.03,
            0.34,
            'triangle',
            hz(78 + n),
            hz(54 + n),
            0.14,
            0.006,
            2400,
            (i - 1) * 0.45,
            0.35,
          ),
        );
        break;
    }
  }

  return {
    start,
    stop,
    death,
    effect,
    setWave(value) {
      wave = value;
    },
    setIntensity(value) {
      intensity = Math.max(0, Math.min(1, value));
    },
    setBoss(rank) {
      const playing = Boolean(session);
      if (playing) stop();
      bossRank = rank || 0;
      bossSpec = rank ? BOSS_SCORES[(rank - 1) % BOSS_SCORES.length] : null;
      beat = 0;
      if (playing) start();
    },
    rewind() {
      bossRank = 0;
      bossSpec = null;
      intensity = 0;
      beat = 0;
    },
    get volume() {
      return volume;
    },
    setVolume(value) {
      volume = Math.max(0, Math.min(100, value));
      if (master) master.gain.setTargetAtTime((volume / 100) * 0.9, ctx.currentTime, 0.018);
      try {
        localStorage.setItem('low-orbit-volume', String(volume));
      } catch {}
    },
  };
}
