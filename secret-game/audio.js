// Procedural Web Audio engine:
// High-energy 132 BPM arcade space-shooter anthem (A minor -> heroic chorus climax),
// 3 distinct boss themes, warp hyper-jump audio, and unmistakable player-hit crunch with music ducking.

const hz = (note) => 440 * 2 ** ((note - 69) / 12);
const comboScale = [69, 72, 74, 76, 79, 81, 84, 86, 88, 91, 93]; // A minor pentatonic

// --- MAIN SOUNDTRACK: Driving 132 BPM Space-Shooter Anthem in A Minor (16-bar A + Pre-Chorus + Climax B) ---
const MAIN_BPM = 132;
const MAIN_STEP = 60 / MAIN_BPM / 4;

// Progression:
// Bars 0-3 (Launch Riff):  Am -> F -> G -> Em
// Bars 4-7 (Tension Rise): Am -> F -> Dm -> E7 (snare build into climax!)
// Bars 8-15 (Heroic Climax): Fmaj7 -> G -> Am -> C/G -> F -> G -> E7 -> Am (soaring supersaw lead + octave gallop!)
const mainBars = [
  // A1: Punchy arcade hook
  { root: 45, chord: [0, 3, 7, 12], bass: [0, 12, 0, 12, 0, 12, 7, 12], lead: [[0, 24, 2], [2, 27, 2], [4, 29, 3], [8, 27, 2], [10, 24, 2], [12, 22, 4]] },
  { root: 41, chord: [0, 4, 7, 12], bass: [0, 12, 0, 12, 0, 12, 7, 12], lead: [[0, 28, 2], [2, 31, 2], [4, 33, 3], [8, 31, 2], [10, 28, 2], [12, 26, 4]] },
  { root: 43, chord: [0, 4, 7, 12], bass: [0, 12, 0, 12, 7, 12, 4, 12], lead: [[0, 26, 2], [2, 28, 2], [4, 31, 4], [10, 28, 2], [12, 26, 4]] },
  { root: 40, chord: [0, 3, 7, 11], bass: [0, 12, 0, 12, 7, 10, 12, 10], lead: [[0, 27, 3], [4, 26, 3], [8, 24, 4], [12, 22, 4]] },

  // A2: Escalation + Bar 7 snare build
  { root: 45, chord: [0, 3, 7, 14], bass: [0, 12, 0, 12, 3, 12, 7, 12], lead: [[0, 24, 2], [2, 27, 2], [4, 31, 3], [8, 29, 2], [10, 27, 2], [12, 29, 4]] },
  { root: 41, chord: [0, 4, 7, 14], bass: [0, 12, 0, 12, 4, 12, 7, 12], lead: [[0, 31, 3], [4, 33, 3], [8, 36, 4], [12, 33, 4]] },
  { root: 50, chord: [0, 3, 7, 10], bass: [0, 12, 0, 12, 7, 12, 3, 10], lead: [[0, 24, 2], [2, 26, 2], [4, 27, 4], [8, 29, 4], [12, 27, 4]] },
  { root: 40, chord: [0, 4, 7, 10, 16], bass: [0, 12, 4, 12, 7, 12, 10, 12], lead: [[0, 28, 3], [4, 31, 3], [8, 32, 4], [12, 35, 4]] },

  // B1: SOARING CLIMAX CHORUS (octave-lifted anthem!)
  { root: 41, chord: [0, 4, 7, 11, 16], bass: [0, 12, 0, 12, 0, 12, 7, 12], lead: [[0, 36, 3], [3, 38, 3], [6, 40, 4], [10, 38, 2], [12, 36, 4]] },
  { root: 43, chord: [0, 4, 7, 12, 16], bass: [0, 12, 0, 12, 7, 12, 11, 12], lead: [[0, 36, 3], [3, 38, 3], [6, 40, 4], [10, 43, 2], [12, 40, 4]] },
  { root: 45, chord: [0, 3, 7, 12, 15], bass: [0, 12, 0, 12, 3, 12, 7, 12], lead: [[0, 36, 2], [2, 39, 2], [4, 41, 4], [8, 39, 2], [10, 36, 2], [12, 34, 4]] },
  { root: 48, chord: [0, 4, 7, 12, 16], bass: [0, 12, 0, 12, 7, 12, 4, 12], lead: [[0, 36, 4], [6, 34, 2], [8, 31, 4], [12, 28, 4]] },

  // B2: Heroic peak & triumphant turnaround
  { root: 41, chord: [0, 4, 7, 11, 16], bass: [0, 12, 0, 12, 4, 12, 7, 12], lead: [[0, 36, 3], [3, 40, 3], [6, 43, 4], [10, 40, 2], [12, 38, 4]] },
  { root: 43, chord: [0, 4, 7, 14, 16], bass: [0, 12, 0, 12, 7, 12, 14, 12], lead: [[0, 38, 3], [4, 40, 3], [8, 43, 4], [12, 45, 4]] },
  { root: 40, chord: [0, 4, 7, 10, 16], bass: [0, 12, 4, 12, 7, 12, 10, 12], lead: [[0, 40, 4], [4, 38, 2], [6, 35, 2], [8, 38, 4], [12, 35, 4]] },
  { root: 45, chord: [0, 3, 7, 12, 15], bass: [0, 12, 7, 12, 3, 7, 10, 12], lead: [[0, 36, 6], [8, 31, 4], [12, 27, 4]] },
];

// --- 3 BESPOKE BOSS SOUNDTRACKS ---
const BOSS_SCORES = [
  {
    bpm: 140,
    root: 40,
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
  {
    bpm: 126,
    root: 36,
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
  {
    bpm: 148,
    root: 42,
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

function createImpulseResponse(ctx, duration = 1.65, decay = 2.8) {
  const length = Math.floor(ctx.sampleRate * duration);
  const impulse = ctx.createBuffer(2, length, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const channel = impulse.getChannelData(ch);
    let lp = 0;
    for (let i = 0; i < length; i++) {
      const env = Math.pow(1 - i / length, decay);
      const raw = (Math.random() * 2 - 1) * env;
      lp = lp * 0.7 + raw * 0.3;
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
    compressor.release.value = 0.16;

    master = ctx.createGain();
    master.gain.value = (volume / 100) * 0.9;
    compressor.connect(master).connect(ctx.destination);

    noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    reverbImpulse = createImpulseResponse(ctx, 1.65, 2.8);
    return true;
  }

  function synthVoice({
    t,
    len,
    waveType = 'sawtooth',
    freq,
    endFreq = freq,
    level = 0.12,
    attack = 0.008,
    cutoffStart = 2800,
    cutoffEnd = 800,
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

  function playKick(t, level = 0.45, punch = 162) {
    if (!session || !ctx) return;
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(punch, t);
    osc.frequency.exponentialRampToValueAtTime(44, t + 0.08);
    osc.frequency.exponentialRampToValueAtTime(32, t + 0.22);
    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(level, t + 0.003);
    env.gain.exponentialRampToValueAtTime(0.0001, t + 0.23);
    osc.connect(env).connect(session.musicBus);
    osc.onended = () => {
      osc.disconnect();
      env.disconnect();
    };
    osc.start(t);
    osc.stop(t + 0.25);
  }

  function playSnare(t, level = 0.22, bright = 3400) {
    if (!session || !ctx) return;
    const src = ctx.createBufferSource();
    src.buffer = noise;
    src.loop = true;
    const hp = ctx.createBiquadFilter();
    hp.type = 'bandpass';
    hp.frequency.setValueAtTime(bright, t);
    hp.Q.value = 0.72;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(level, t + 0.003);
    env.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
    src.connect(hp).connect(env).connect(session.musicBus);
    if (session.reverbSend) {
      const rev = ctx.createGain();
      rev.gain.value = 0.36;
      env.connect(rev).connect(session.reverbSend);
    }
    src.onended = () => {
      src.disconnect();
      hp.disconnect();
      env.disconnect();
    };
    src.start(t);
    src.stop(t + 0.18);

    synthVoice({
      t,
      len: 0.085,
      waveType: 'triangle',
      freq: 220,
      endFreq: 108,
      level: level * 0.65,
      attack: 0.002,
      cutoffStart: 1300,
      cutoffEnd: 420,
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
    hp.frequency.setValueAtTime(open ? 6800 : 9000, t);
    const env = ctx.createGain();
    const dur = open ? 0.14 : 0.038;
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

  function sfxVoice(
    t,
    len,
    kind,
    pitch,
    end,
    level,
    attack = 0.005,
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
    const inClimax = barIndex >= 8;
    const isBuildBar = barIndex === 7 || barIndex === 15;
    const drive = Math.min(1, intensity + (inClimax ? 0.35 : 0));

    // 1. Bold synth-brass chords (stabbed on beat 1 and syncopated beat 3.5 in climax!)
    if (n === 0 || (inClimax && n === 10)) {
      const chordLen = inClimax ? MAIN_STEP * (n === 0 ? 9.5 : 5.5) : MAIN_STEP * 15;
      bar.chord.forEach((interval, i) => {
        synthVoice({
          t,
          len: chordLen,
          waveType: 'sawtooth',
          freq: hz(bar.root + 12 + interval),
          level: inClimax ? 0.036 : 0.024,
          attack: inClimax ? 0.025 : 0.14,
          cutoffStart: (inClimax ? 2600 : 1200) + i * 240 + drive * 600,
          cutoffEnd: 560 + i * 120,
          q: 1.1,
          detune: inClimax ? 11 : 7,
          pan: (i - (bar.chord.length - 1) / 2) * 0.32,
          reverb: 0.42,
        });
      });
    }

    // 2. Relentless 16th-note octave arcade bass gallop
    const bassSlot = Math.floor(n / 2) % bar.bass.length;
    const bassNote = bar.root - 12 + bar.bass[bassSlot] + (n % 2 === 1 ? 12 : 0);
    const accent = n % 4 === 0 || n === 14;
    synthVoice({
      t,
      len: MAIN_STEP * (n % 2 === 0 ? 1.05 : 0.88),
      waveType: 'sawtooth',
      freq: hz(bassNote),
      level: accent ? 0.175 : 0.12,
      attack: 0.003,
      cutoffStart: (accent ? 1650 : 980) + drive * 620,
      cutoffEnd: 240,
      q: 2.3,
      detune: 5,
    });

    // 3. Energetic four-on-the-floor kick + crisp snare + climax build rolls
    if (n === 0 || n === 4 || n === 8 || n === 12 || (inClimax && n === 14)) {
      playKick(t, inClimax ? 0.46 : 0.4, 160);
    }
    if (n === 4 || n === 12) {
      playSnare(t, inClimax ? 0.24 : 0.19, 3400);
    }
    // Pre-chorus snare buildup into bar 8 climax!
    if (isBuildBar && [10, 12, 13, 14, 15].includes(n)) {
      playSnare(t, 0.14 + (n - 10) * 0.032, 3600 + (n - 10) * 200);
    }
    // Crisp 16th hi-hat groove
    if (n % 2 === 0) {
      playHat(t, n % 4 === 2, n % 4 === 2 ? 0.068 : 0.034, n % 4 === 2 ? 0.34 : -0.24);
    } else if (inClimax || wave >= 2 || drive > 0.3) {
      playHat(t, false, 0.034, 0.22);
    }

    // 4. Soaring supersaw lead anthem
    const hit = bar.lead.find(([on]) => on === n);
    if (hit) {
      const [, offset, dur] = hit;
      const f = hz(bar.root + offset);
      synthVoice({
        t,
        len: MAIN_STEP * dur * 0.96,
        waveType: 'sawtooth',
        freq: f,
        level: inClimax ? 0.115 : 0.092,
        attack: 0.008,
        cutoffStart: (inClimax ? 4800 : 3100) + drive * 900,
        cutoffEnd: 1300,
        q: 1.5,
        detune: inClimax ? 12 : 7,
        pan: -0.14,
        reverb: 0.34,
        delay: 0.34,
      });
    }

    // 5. Sparkling 16th arcade starlight arpeggio in climax / higher intensity
    if ((inClimax || drive > 0.35) && n % 2 === 1) {
      const arpNote = bar.chord[(Math.floor(n / 2) + barIndex) % bar.chord.length];
      synthVoice({
        t,
        len: MAIN_STEP * 1.35,
        waveType: 'triangle',
        freq: hz(bar.root + 24 + arpNote),
        level: inClimax ? 0.068 : 0.045,
        attack: 0.003,
        cutoffStart: 4400,
        cutoffEnd: 1800,
        pan: n % 4 === 1 ? 0.44 : -0.44,
        reverb: 0.38,
        delay: 0.36,
      });
    }
  }

  function arrangeBoss(t, step) {
    const barIdx = Math.floor(step / 16) % bossSpec.bars.length;
    const n = step % 16;
    const bar = bossSpec.bars[barIdx];
    const stepLen = 60 / bossSpec.bpm / 4;
    const root = bossSpec.root + bar.shift + ((Math.floor((bossRank - 1) / 3) % 4) * 2);

    if (n === 0 || (bossSpec === BOSS_SCORES[1] && n === 8)) {
      bar.chord.forEach((interval, i) => {
        synthVoice({
          t,
          len: stepLen * 7.5,
          waveType: 'sawtooth',
          freq: hz(root + 12 + interval),
          level: 0.044,
          attack: 0.025,
          cutoffStart: 2400 + i * 240,
          cutoffEnd: 540,
          q: 1.4,
          detune: 11,
          pan: (i - 1.5) * 0.35,
          reverb: 0.42,
        });
      });
    }

    const bassSemi = bossSpec.bassPattern[n];
    synthVoice({
      t,
      len: stepLen * 0.92,
      waveType: 'sawtooth',
      freq: hz(root + bassSemi),
      level: n % 4 === 0 ? 0.2 : 0.145,
      attack: 0.003,
      cutoffStart: n % 4 === 0 ? 1850 : 1100,
      cutoffEnd: 260,
      q: 2.5,
      detune: 6,
    });

    if (bossSpec.kicks.includes(n)) playKick(t, 0.48, 174);
    if (bossSpec.snares.includes(n) || (barIdx === 3 && n >= 12)) {
      playSnare(t, barIdx === 3 && n >= 12 ? 0.16 + (n - 12) * 0.032 : 0.24, 3600);
    }
    if (n % 2 === 0) playHat(t, n === 14, 0.055, n % 4 === 0 ? -0.3 : 0.3);

    const hit = bar.riff.find(([on]) => on === n);
    if (hit) {
      const [, offset, dur] = hit;
      synthVoice({
        t,
        len: stepLen * dur * 0.94,
        waveType: bossSpec.leadWave,
        freq: hz(root + offset),
        level: 0.115,
        attack: 0.008,
        cutoffStart: 4400,
        cutoffEnd: 1500,
        q: 1.8,
        detune: 10,
        pan: -0.15,
        reverb: 0.3,
        delay: 0.34,
      });
    }

    if (n % 2 === 1) {
      const note = bossSpec.arpScale[(n + barIdx * 3) % bossSpec.arpScale.length];
      synthVoice({
        t,
        len: stepLen * 1.1,
        waveType: 'triangle',
        freq: hz(root + 24 + note),
        level: 0.058,
        attack: 0.003,
        cutoffStart: 3800,
        cutoffEnd: 1600,
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
    musicBus.gain.value = 0.84;
    const sfxBus = ctx.createGain();
    sfxBus.gain.value = 1.05;

    const reverbSend = ctx.createGain();
    const convolver = ctx.createConvolver();
    convolver.buffer = reverbImpulse;
    const reverbWet = ctx.createGain();
    reverbWet.gain.value = 0.38;
    reverbSend.connect(convolver).connect(reverbWet).connect(rootBus);

    const delaySend = ctx.createGain();
    const delayNode = ctx.createDelay(1.0);
    const stepLen = bossSpec ? 60 / bossSpec.bpm / 4 : MAIN_STEP;
    delayNode.delayTime.value = stepLen * 3;
    const delayFilter = ctx.createBiquadFilter();
    delayFilter.type = 'lowpass';
    delayFilter.frequency.value = 2300;
    const delayFeedback = ctx.createGain();
    delayFeedback.gain.value = 0.28;
    const delayWet = ctx.createGain();
    delayWet.gain.value = 0.25;
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
    sfxVoice(t, 0.55, 'noise', 0, 0, 0.72, 0.003, 4200, -0.1, 0, bus);
    sfxVoice(t, 0.9, 'sine', 175, 28, 0.7, 0.005, 1200, 0, 0, bus);
    sfxVoice(t + 0.04, 0.55, 'plasma', 620, 42, 0.34, 0.01, 2800, 0.2, 0, bus);
    [76, 72, 69].forEach((note, i) => {
      const f = hz(note);
      sfxVoice(
        t + 0.34 + i * 0.16,
        i === 2 ? 0.62 : 0.18,
        'triangle',
        f,
        f * 0.985,
        0.28,
        0.01,
        1900,
        (i - 1) * 0.18,
        0,
        bus,
      );
    });
    setTimeout(() => {
      if (lossBus === bus) lossBus = null;
      bus.disconnect();
    }, 1450);
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

  function duckMusic(seconds = 0.28, floor = 0.32) {
    if (!session || !ctx) return;
    const t = ctx.currentTime;
    session.musicBus.gain.cancelScheduledValues(t);
    session.musicBus.gain.setTargetAtTime(floor, t, 0.012);
    session.musicBus.gain.setTargetAtTime(0.84, t + seconds, 0.12);
  }

  function effect(name, detail = 0) {
    if (!session || !volume) return;
    const t = ctx.currentTime;
    const jitter = 0.96 + Math.random() * 0.08;
    switch (name) {
      case 'fire':
        sfxVoice(t, 0.095, 'plasma', 960 * jitter, 145, 0.17, 0.002, 4600, (Math.random() - 0.5) * 0.15);
        sfxVoice(t, 0.05, 'sine', 190 * jitter, 52, 0.13, 0.002, 1800);
        break;
      case 'focusFire':
        sfxVoice(t, 0.085, 'sawtooth', 1240 * jitter, 340, 0.11, 0.002, 5200);
        sfxVoice(t, 0.065, 'sine', 340 * jitter, 110, 0.13, 0.002, 2200);
        break;
      case 'missile':
        sfxVoice(t, 0.18, 'noise', 0, 0, 0.1, 0.01, 2400, (Math.random() - 0.5) * 0.4);
        sfxVoice(t, 0.15, 'triangle', 420 * jitter, 760, 0.075, 0.01, 2200);
        break;
      case 'phaseDash':
        sfxVoice(t, 0.22, 'sine', 240, 820, 0.19, 0.008, 3400, 0, 0.35);
        sfxVoice(t, 0.17, 'noise', 0, 0, 0.16, 0.006, 3800);
        break;
      case 'warp':
        duckMusic(1.6, 0.25);
        // Rising lightspeed hyper-drive sweep + crystalline boom
        sfxVoice(t, 1.35, 'sawtooth', 82, 920, 0.24, 0.18, 3600, 0, 0.5);
        sfxVoice(t, 1.45, 'sine', 110, 440, 0.3, 0.14, 2400, 0, 0.45);
        sfxVoice(t + 0.1, 1.25, 'noise', 0, 0, 0.22, 0.25, 4200, 0, 0.4);
        sfxVoice(t + 1.18, 0.65, 'sine', 180, 32, 0.52, 0.006, 1200, 0, 0.35);
        [69, 76, 81, 88].forEach((n, i) =>
          sfxVoice(t + 1.18 + i * 0.04, 0.55, 'triangle', hz(n), hz(n), 0.13, 0.01, 4200, (i - 1.5) * 0.35, 0.55),
        );
        break;
      case 'nova':
        duckMusic(0.32, 0.4);
        sfxVoice(t, 0.72, 'sine', 190, 28, 0.54, 0.004, 1400);
        sfxVoice(t, 0.58, 'plasma', 880, 72, 0.32, 0.006, 4600, 0, 0.4);
        sfxVoice(t, 0.42, 'noise', 0, 0, 0.24, 0.008, 2800, 0, 0.3);
        [69, 76, 81, 88].forEach((n, i) =>
          sfxVoice(t + i * 0.03, 0.44, 'triangle', hz(n), hz(n + 12), 0.13, 0.006, 3800, (i - 1.5) * 0.3, 0.45),
        );
        break;
      case 'coin':
        sfxVoice(t, 0.08, 'sine', 1320 * jitter, 1760, 0.13, 0.002, 5200, (Math.random() - 0.5) * 0.25, 0.25);
        sfxVoice(t + 0.045, 0.12, 'triangle', 1760 * jitter, 2093, 0.1, 0.002, 5600, 0, 0.3);
        break;
      case 'overshield':
        [69, 73, 76, 81, 88].forEach((n, i) =>
          sfxVoice(t + i * 0.04, 0.42, 'triangle', hz(n), hz(n * 1.005), 0.17, 0.006, 4600, (i - 2) * 0.25, 0.48),
        );
        sfxVoice(t, 0.38, 'sine', 220, 660, 0.22, 0.02, 2400, 0, 0.4);
        break;
      case 'buy':
        if (!ctx || !volume) return;
        init();
        ctx.resume().catch(() => {});
        {
          const b = ctx.createGain();
          b.connect(compressor);
          [69, 76, 81].forEach((n, i) =>
            sfxVoice(ctx.currentTime + i * 0.05, 0.22, 'triangle', hz(n), hz(n), 0.16, 0.004, 4000, 0, 0, b),
          );
          setTimeout(() => b.disconnect(), 500);
        }
        break;
      case 'shard': {
        const note = comboScale[Math.min(comboScale.length - 1, Math.max(0, Math.floor(detail)))];
        const f = hz(note);
        sfxVoice(t, 0.12, 'sine', f, f * 1.02, 0.1, 0.003, 3800, (Math.random() - 0.5) * 0.3, 0.3);
        break;
      }
      case 'upgrade':
        [69, 76, 81, 88, 93].forEach((n, i) =>
          sfxVoice(t + i * 0.055, 0.32, 'triangle', hz(n), hz(n), 0.15, 0.006, 3800, (i - 2) * 0.2, 0.4),
        );
        break;
      case 'warning':
        duckMusic(0.85, 0.35);
        for (let i = 0; i < 3; i++) {
          sfxVoice(t + i * 0.28, 0.22, 'sawtooth', 440, 310, 0.22, 0.01, 2000, 0, 0.35);
          sfxVoice(t + i * 0.28, 0.22, 'sine', 110, 82, 0.26, 0.01, 800);
        }
        break;
      case 'beam':
        sfxVoice(t, 0.5, 'sawtooth', 260, 180, 0.18, 0.02, 2600, 0, 0.35);
        sfxVoice(t, 0.48, 'noise', 0, 0, 0.14, 0.02, 3400);
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
          0.22,
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
        sfxVoice(t, 0.4, 'noise', 0, 0, 0.3, 0.006, name === 'rock' ? 1080 : 2300, -0.14, 0.22);
        sfxVoice(t, 0.3, 'sine', name === 'rock' ? 112 : 164, 34, 0.26, 0.006, 980);
        break;
      case 'graze': {
        const note = comboScale[Math.min(comboScale.length - 1, Math.floor(detail) + 3)];
        sfxVoice(t, 0.09, 'sine', hz(note), hz(note + 5), 0.1, 0.003, 3400, (Math.random() - 0.5) * 0.4, 0.22);
        break;
      }
      case 'breach':
        duckMusic(0.25, 0.42);
        sfxVoice(t, 0.36, 'noise', 0, 0, 0.36, 0.004, 3400, 0, 0.35);
        sfxVoice(t, 0.42, 'plasma', 142, 40, 0.44, 0.004, 1900, 0, 0.3);
        sfxVoice(t + 0.08, 0.24, 'triangle', 640, 980, 0.16, 0.01, 2400, 0.22, 0.4);
        break;
      case 'overheat':
        // Chicken Invaders-style thermal lockout: sharp steam hiss + power-down whine + warning chirp!
        sfxVoice(t, 0.52, 'noise', 0, 0, 0.36, 0.004, 3600, 0, 0.25);
        sfxVoice(t, 0.36, 'sawtooth', 540, 130, 0.2, 0.005, 1900, 0, 0.2);
        sfxVoice(t + 0.02, 0.09, 'square', 820, 620, 0.14, 0.002, 2600, -0.2, 0.15);
        sfxVoice(t + 0.13, 0.1, 'square', 720, 520, 0.14, 0.002, 2400, 0.2, 0.15);
        break;
      case 'heatWarn':
        sfxVoice(t, 0.045, 'triangle', 920 + detail * 240, 760 + detail * 180, 0.08, 0.002, 3400, 0, 0.08);
        break;
      case 'coolReady':
        sfxVoice(t, 0.085, 'triangle', 540, 860, 0.13, 0.003, 3800, 0, 0.15);
        break;
      case 'shield': {
        // Shield hit: music duck + energy shatter + warning chirp (extra drop when shield hits 0!)
        const broke = detail <= 0;
        duckMusic(0.32, 0.3);
        sfxVoice(t, 0.28, 'sine', 185, 42, 0.66, 0.002, 1100, 0, 0.2);
        sfxVoice(t, 0.22, 'noise', 0, 0, 0.48, 0.002, 3200, 0, 0.3);
        sfxVoice(t, 0.28, 'plasma', 860, 140, 0.44, 0.002, 4600, 0, 0.35);
        sfxVoice(t + 0.03, 0.16, 'triangle', 580, broke ? 190 : 320, 0.26, 0.004, 2600, -0.22, 0.25);
        if (broke) {
          sfxVoice(t + 0.14, 0.26, 'sawtooth', 390, 140, 0.28, 0.004, 2200, 0.22, 0.35);
        }
        break;
      }
      case 'hull': {
        // Direct red hull hit: heavy metallic crunch + deep sub thud + urgent red-alert alarm!
        const critical = detail <= 1;
        duckMusic(0.42, 0.22);
        sfxVoice(t, 0.38, 'sine', 165, 28, 0.82, 0.002, 800, 0, 0.2);
        sfxVoice(t, 0.3, 'noise', 0, 0, 0.68, 0.002, 1850, 0, 0.3);
        sfxVoice(t, 0.24, 'square', 220, 68, 0.38, 0.002, 1400, 0, 0.25);
        sfxVoice(t + 0.04, 0.16, 'sawtooth', 620, 310, 0.3, 0.004, 2800, -0.25, 0.25);
        sfxVoice(t + 0.18, 0.18, 'sawtooth', critical ? 740 : 480, critical ? 480 : 240, 0.32, 0.004, 3000, 0.25, 0.3);
        if (critical) {
          sfxVoice(t + 0.33, 0.2, 'square', 740, 480, 0.28, 0.004, 2800, 0, 0.25);
        }
        break;
      }
    }
  }

  function uiBuy() {
    if (!volume || !init()) return;
    ctx.resume().catch(() => {});
    const b = ctx.createGain();
    b.connect(compressor);
    const t = ctx.currentTime;
    [69, 76, 81, 88].forEach((n, i) =>
      sfxVoice(t + i * 0.045, 0.24, 'triangle', hz(n), hz(n), 0.16, 0.004, 4200, (i - 1.5) * 0.2, 0, b),
    );
    setTimeout(() => b.disconnect(), 600);
  }

  function overclockOn() {
    if (!volume || !init()) return;
    ctx.resume().catch(() => {});

    // Separate saturated low-end growl bus from clean high-voltage sheen (zero muddy clash!)
    const dirtyIn = ctx.createGain();
    const shaper = ctx.createWaveShaper();
    const dirtyFilter = ctx.createBiquadFilter();
    const dirtyOut = ctx.createGain();
    const cleanOut = ctx.createGain();

    const curve = new Float32Array(256);
    for (let i = 0; i < 256; i++) {
      const x = i / 127.5 - 1;
      curve[i] = Math.tanh(x * 2.6);
    }
    shaper.curve = curve;
    shaper.oversample = '2x';

    const t = ctx.currentTime;
    dirtyFilter.type = 'lowpass';
    dirtyFilter.Q.value = 3.2;
    dirtyFilter.frequency.setValueAtTime(260, t);
    dirtyFilter.frequency.exponentialRampToValueAtTime(2400, t + 0.14);
    dirtyFilter.frequency.exponentialRampToValueAtTime(520, t + 0.38);
    dirtyOut.gain.value = 0.62;
    cleanOut.gain.value = 0.72;

    dirtyIn.connect(shaper).connect(dirtyFilter).connect(dirtyOut).connect(compressor);
    cleanOut.connect(compressor);

    // 1. Tight mechanical ignition punch + crisp spark snap (instant tactile hit)
    sfxVoice(t, 0.16, 'sine', 190, 48, 0.58, 0.002, 800, 0, 0, cleanOut);
    sfxVoice(t, 0.065, 'noise', 0, 0, 0.34, 0.002, 3600, 0, 0, cleanOut);

    // 2. Angry dark power-fifth reactor growl (D2 + A2 revving fiercely up to G2 + D3)
    sfxVoice(t + 0.01, 0.36, 'sawtooth', 73.4, 98.0, 0.34, 0.012, 3200, -0.22, 0, dirtyIn);
    sfxVoice(t + 0.01, 0.36, 'sawtooth', 74.2, 99.1, 0.28, 0.012, 3200, 0.22, 0, dirtyIn);
    sfxVoice(t + 0.02, 0.34, 'sawtooth', 110.0, 146.8, 0.24, 0.015, 3200, 0, 0, dirtyIn);

    // 3. Sleek dark metallic blade-lock sheen on top (clean, un-muddied tension!)
    sfxVoice(t + 0.055, 0.24, 'plasma', 392, 587, 0.13, 0.008, 4200, 0, 0, cleanOut);
    sfxVoice(t + 0.11, 0.19, 'triangle', 587, 554, 0.11, 0.005, 3800, 0, 0, cleanOut);

    setTimeout(() => {
      for (const n of [dirtyIn, shaper, dirtyFilter, dirtyOut, cleanOut]) n.disconnect();
    }, 650);
  }

  function overclockOff() {
    if (!volume || !init()) return;
    ctx.resume().catch(() => {});
    const bus = ctx.createGain();
    const lp = ctx.createBiquadFilter();
    const t = ctx.currentTime;
    lp.type = 'lowpass';
    lp.Q.value = 1.6;
    lp.frequency.setValueAtTime(1600, t);
    lp.frequency.exponentialRampToValueAtTime(220, t + 0.28);
    bus.gain.value = 0.72;
    bus.connect(lp).connect(compressor);

    // 1. Crisp mechanical unlatch click
    sfxVoice(t, 0.055, 'triangle', 340, 145, 0.28, 0.002, 2400, 0, 0, bus);
    // 2. Smooth reactor power-down turbine drop
    sfxVoice(t + 0.01, 0.28, 'sawtooth', 146.8, 65.4, 0.22, 0.008, 1600, -0.18, 0, bus);
    sfxVoice(t + 0.01, 0.28, 'sine', 110.0, 52.0, 0.34, 0.006, 900, 0.18, 0, bus);
    // 3. Brief airy pressure-vent release
    sfxVoice(t + 0.02, 0.16, 'noise', 0, 0, 0.18, 0.01, 2200, 0, 0, bus);

    setTimeout(() => {
      bus.disconnect();
      lp.disconnect();
    }, 500);
  }

  function uiClick() {
    if (!volume || !init()) return;
    ctx.resume().catch(() => {});
    const b = ctx.createGain();
    b.connect(compressor);
    const t = ctx.currentTime;
    sfxVoice(t, 0.055, 'triangle', 640, 920, 0.14, 0.002, 4200, 0, 0, b);
    sfxVoice(t, 0.025, 'noise', 0, 0, 0.09, 0.001, 4800, 0, 0, b);
    setTimeout(() => b.disconnect(), 220);
  }

  function uiClose() {
    if (!volume || !init()) return;
    ctx.resume().catch(() => {});
    const b = ctx.createGain();
    b.connect(compressor);
    const t = ctx.currentTime;
    sfxVoice(t, 0.075, 'triangle', 520, 290, 0.14, 0.002, 2800, 0, 0, b);
    setTimeout(() => b.disconnect(), 240);
  }

  function uiLaunch(overclock = false) {
    if (!volume || !init()) return;
    ctx.resume().catch(() => {});
    const b = ctx.createGain();
    b.connect(compressor);
    const t = ctx.currentTime;
    if (overclock) {
      sfxVoice(t, 0.28, 'sawtooth', 98, 220, 0.24, 0.005, 2400, 0, 0, b);
      sfxVoice(t, 0.24, 'sine', 165, 58, 0.42, 0.003, 900, 0, 0, b);
      sfxVoice(t + 0.04, 0.22, 'plasma', 440, 880, 0.16, 0.005, 4200, 0, 0, b);
    } else {
      sfxVoice(t, 0.22, 'sine', 220, 440, 0.22, 0.004, 2400, 0, 0, b);
      sfxVoice(t + 0.03, 0.2, 'triangle', 523.25, 783.99, 0.18, 0.004, 4200, 0.15, 0, b);
      sfxVoice(t, 0.16, 'noise', 0, 0, 0.14, 0.006, 2600, 0, 0, b);
    }
    setTimeout(() => b.disconnect(), 480);
  }

  function uiRefund() {
    if (!volume || !init()) return;
    ctx.resume().catch(() => {});
    const b = ctx.createGain();
    b.connect(compressor);
    const t = ctx.currentTime;
    [81, 76, 72, 79].forEach((n, i) =>
      sfxVoice(t + i * 0.04, 0.14, 'triangle', hz(n), hz(n) * 0.98, 0.15, 0.003, 3600, (i - 1.5) * 0.18, 0, b),
    );
    setTimeout(() => b.disconnect(), 450);
  }

  // Unique signature selection SFX for each playable ship!
  function uiShip(rig = 'kestrel') {
    if (!volume || !init()) return;
    ctx.resume().catch(() => {});
    const b = ctx.createGain();
    b.connect(compressor);
    const t = ctx.currentTime;
    if (rig === 'falcon') {
      // Agile Striker: brisk thruster whoosh + snappy twin seeker target-lock chirps
      sfxVoice(t, 0.12, 'noise', 0, 0, 0.16, 0.004, 3400, 0, 0, b);
      sfxVoice(t + 0.01, 0.065, 'sine', 880, 1180, 0.16, 0.002, 4600, -0.18, 0, b);
      sfxVoice(t + 0.08, 0.095, 'triangle', 1180, 1568, 0.17, 0.002, 5200, 0.18, 0, b);
    } else if (rig === 'aegis') {
      // Heavy Cruiser: deep armored bulkhead thud + warm low plasma shield hum
      sfxVoice(t, 0.22, 'sine', 135, 58, 0.42, 0.003, 620, 0, 0, b);
      sfxVoice(t + 0.015, 0.24, 'sawtooth', 146.8, 138.6, 0.13, 0.012, 920, -0.2, 0, b);
      sfxVoice(t + 0.015, 0.24, 'triangle', 220.0, 220.0, 0.16, 0.015, 1400, 0.2, 0, b);
    } else {
      // Kestrel (Rail-Lance): sleek magnetic rail charge sweep + crisp cyan harmonic lock
      sfxVoice(t, 0.16, 'plasma', 420, 880, 0.17, 0.004, 4000, -0.14, 0, b);
      sfxVoice(t + 0.055, 0.17, 'triangle', 659.25, 1318.5, 0.15, 0.003, 4800, 0.14, 0, b);
    }
    setTimeout(() => b.disconnect(), 480);
  }

  return {
    start,
    stop,
    death,
    effect,
    uiBuy,
    uiClick,
    uiClose,
    uiLaunch,
    uiRefund,
    uiShip,
    overclockOn,
    overclockOff,
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
      if (rank) {
        const base = BOSS_SCORES[(rank - 1) % BOSS_SCORES.length];
        // Higher procedural boss ranks escalate tempo and transpose key slightly for fresh intensity
        bossSpec = {
          ...base,
          bpm: Math.min(168, base.bpm + Math.floor((rank - 1) / 3) * 6),
        };
      } else {
        bossSpec = null;
      }
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
