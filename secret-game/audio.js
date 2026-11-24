// Eight bars in D minor. All instruments use the same musical clock.
const roots = [50, 46, 53, 48, 50, 46, 43, 45];
const voicings = [
  [0, 3, 7, 14],
  [0, 4, 7, 11],
  [0, 4, 7, 14],
  [0, 4, 7, 14],
  [0, 3, 7, 10],
  [0, 4, 7, 14],
  [0, 3, 7, 10],
  [0, 4, 7, 10],
];
const melody = [
  [0, 7],
  [3, 10],
  [6, 12],
  [10, 7],
  [14, 3],
];
const reply = [
  [2, 14],
  [5, 12],
  [9, 7],
  [12, 3],
  [15, 7],
];
const hz = (note) => 440 * 2 ** ((note - 69) / 12);
const sixteenth = 60 / 104 / 4;
// Distinct meters, bass figures and lead voices for the three flagship families.
const bossScores = [
  {
    bpm: 136,
    steps: 16,
    root: 38,
    scale: [0, 1, 3, 7, 8, 10],
    bass: [0, 3, 6, 8, 11, 14],
    lead: [0, 3, 5, 9, 12, 14],
    kicks: [0, 6, 8, 11],
    voice: 'sawtooth',
  },
  {
    bpm: 108,
    steps: 12,
    root: 32,
    scale: [0, 2, 3, 5, 6, 9],
    bass: [0, 4, 6, 10],
    lead: [2, 4, 7, 10],
    kicks: [0, 3, 6],
    voice: 'square',
  },
  {
    bpm: 151,
    steps: 16,
    root: 42,
    scale: [0, 2, 5, 7, 9, 10],
    bass: [0, 2, 5, 8, 10, 13],
    lead: [0, 2, 4, 7, 9, 11, 14],
    kicks: [0, 5, 8, 13],
    voice: 'triangle',
  },
];
function bossTheme(rank) {
  const spec = bossScores[(rank - 1) % bossScores.length];
  // A repeat visit to a hull has its own reproducible two-bar melodic phrase.
  let seed = rank;
  const motif = Array.from({ length: spec.lead.length * 2 }, () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return spec.scale[(seed >>> 16) % spec.scale.length];
  });
  return { ...spec, motif, root: spec.root + (Math.floor((rank - 1) / 3) % 7) };
}
export function createFlightAudio() {
  let ctx,
    master,
    noise,
    session,
    lossBus,
    timer,
    beat = 0,
    nextBeat = 0,
    wave = 1,
    theme = null,
    volume = 10;
  try {
    const saved = localStorage.getItem('low-orbit-volume');
    if (saved !== null && Number.isFinite(+saved)) volume = Math.max(0, Math.min(100, +saved));
  } catch {}
  function init() {
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) return false;
    if (ctx) return true;
    try {
      ctx = new Audio();
    } catch {
      return false;
    }
    master = ctx.createGain();
    master.gain.value = volume / 100;
    master.connect(ctx.destination);
    noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    return true;
  }
  // Short, filtered transients keep shots distinct from the sustained score.
  function voice(
    t,
    len,
    kind,
    pitch,
    end,
    level,
    attack = 0.008,
    cutoff = 3000,
    pan = 0,
    echo = false,
    bus = session.bus,
  ) {
    const source = kind === 'noise' ? ctx.createBufferSource() : ctx.createOscillator();
    const filter = ctx.createBiquadFilter(),
      env = ctx.createGain(),
      stereo = ctx.createStereoPanner();
    if (kind === 'noise') {
      source.buffer = noise;
      source.loop = true;
      filter.type = 'bandpass';
    } else {
      source.type = kind === 'plasma' ? 'sine' : kind;
      source.frequency.setValueAtTime(pitch, t);
      source.frequency.exponentialRampToValueAtTime(end, t + len);
    }
    let modulator, depth;
    if (kind === 'plasma') {
      modulator = ctx.createOscillator();
      depth = ctx.createGain();
      modulator.frequency.setValueAtTime(pitch * 1.83, t);
      modulator.frequency.exponentialRampToValueAtTime(end * 0.72, t + len);
      depth.gain.setValueAtTime(pitch * 0.85, t);
      depth.gain.exponentialRampToValueAtTime(2, t + len);
      modulator.connect(depth).connect(source.frequency);
      modulator.start(t);
      modulator.stop(t + len);
    }
    filter.frequency.setValueAtTime(cutoff, t);
    filter.frequency.exponentialRampToValueAtTime(Math.max(90, cutoff * 0.42), t + len);
    filter.Q.value = kind === 'noise' ? 0.8 : 0.55;
    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(level, t + attack);
    env.gain.exponentialRampToValueAtTime(0.0001, t + len);
    stereo.pan.value = pan;
    source.connect(filter).connect(env).connect(stereo).connect(bus);
    if (echo) stereo.connect(session.echo);
    source.onended = () => {
      for (const node of [source, filter, env, stereo]) node.disconnect();
      modulator?.disconnect();
      depth?.disconnect();
    };
    source.start(t);
    source.stop(t + len + 0.02);
  }
  function arrange(t, step) {
    const bar = Math.floor(step / 16) % 8,
      n = step % 16,
      root = roots[bar],
      chord = voicings[bar];
    if (n === 0)
      chord.forEach((interval, i) => {
        const f = hz(root + interval);
        voice(
          t,
          2.36,
          'sawtooth',
          f,
          f * (1 + i * 0.0008),
          0.042,
          0.21,
          650 + i * 220,
          (i - 1.5) * 0.38,
          true,
        );
      });
    if ([0, 6, 8, 14].includes(n)) {
      const f = hz(root - 12 + (n === 14 ? 7 : 0));
      voice(t, 0.37, 'triangle', f, f, 0.23, 0.012, 880);
    }
    if (n === 0 || n === 8 || (wave > 1 && n === 10)) voice(t, 0.21, 'sine', 116, 38, 0.35, 0.004, 1200);
    if (n === 4 || n === 12) {
      voice(t, 0.16, 'noise', 0, 0, 0.11, 0.005, 2400, -0.15, true);
      voice(t, 0.11, 'triangle', 188, 91, 0.075);
    }
    if (n % 4 === 2 || (wave >= 2 && n % 2 === 1))
      voice(t, n === 14 ? 0.14 : 0.052, 'noise', 0, 0, 0.056, 0.004, 7800, 0.38);
    const lead = (bar % 2 ? reply : melody).find(([on]) => on === n);
    if (lead) {
      const f = hz(root + 12 + lead[1]);
      voice(t, n > 10 ? 0.44 : 0.32, 'triangle', f, f, 0.14, 0.016, 2300, -0.2, true);
    }
    if (wave >= 3 && n % 2 === 0) {
      const f = hz(root + 12 + chord[(n / 2 + bar) % 4]);
      voice(t, 0.19, 'sine', f, f, 0.084, 0.008, 2400, 0.45, true);
    }
  }
  function arrangeBoss(t, step) {
    const bar = Math.floor(step / theme.steps),
      n = step % theme.steps;
    const base = theme.root + [0, 0, theme.scale[2], -2][bar % 4];
    if (theme.kicks.includes(n)) voice(t, 0.21, 'sine', 156, 39, 0.39, 0.003, 2400);
    if (n === Math.floor(theme.steps / 2) || n === theme.steps - 1) {
      voice(t, 0.14, 'noise', 0, 0, 0.18, 0.003, 3700, 0.14, true);
      voice(t, 0.1, 'triangle', 220, 96, 0.11, 0.005, 1200);
    }
    if (n % 2 === 0) voice(t, 0.053, 'noise', 0, 0, 0.07, 0.002, 8800, -0.3);
    if (theme.bass.includes(n)) {
      const f = hz(base + (n % 2 ? 7 : 0));
      voice(t, 0.23, 'sawtooth', f * 1.012, f, 0.22, 0.004, 730);
    }
    const note = theme.lead.indexOf(n);
    if (note >= 0) {
      const f = hz(base + 24 + theme.motif[note + (bar % 2) * theme.lead.length]);
      voice(t, note % 3 === 0 ? 0.32 : 0.16, theme.voice, f, f, 0.15, 0.007, 2200, -0.18, true);
    }
  }
  function schedule() {
    if (!session) return;
    if (nextBeat < ctx.currentTime - 0.18) nextBeat = ctx.currentTime + 0.02;
    while (nextBeat < ctx.currentTime + 0.18) {
      if (theme) arrangeBoss(nextBeat, beat++);
      else arrange(nextBeat, beat++);
      nextBeat += theme ? 60 / theme.bpm / 4 : sixteenth;
    }
  }
  function start() {
    if (session || !init()) return;
    silenceLoss();
    ctx.resume().catch(() => {});
    const bus = ctx.createGain(),
      echo = ctx.createDelay(),
      wet = ctx.createGain();
    echo.delayTime.value = (theme ? 60 / theme.bpm / 4 : sixteenth) * 3;
    wet.gain.value = 0.19;
    echo.connect(wet).connect(bus);
    bus.connect(master);
    session = { bus, echo, wet };
    nextBeat = ctx.currentTime + 0.025;
    schedule();
    timer = setInterval(schedule, 65);
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
    bus.connect(master);
    lossBus = bus;
    // The hull cracks, the engine winds down, then the transponder falls silent.
    voice(t, 0.47, 'noise', 0, 0, 0.67, 0.003, 4400, -0.12, false, bus);
    voice(t, 0.82, 'sine', 158, 32, 0.61, 0.008, 1200, 0, false, bus);
    voice(t + 0.05, 0.53, 'plasma', 605, 46, 0.26, 0.013, 2800, 0.22, false, bus);
    [74, 69, 62].forEach((note, i) => {
      const f = hz(note);
      voice(
        t + 0.35 + i * 0.16,
        i === 2 ? 0.57 : 0.18,
        'triangle',
        f,
        f * 0.984,
        0.27,
        0.012,
        1750,
        (i - 1) * 0.18,
        false,
        bus,
      );
    });
    setTimeout(() => {
      if (lossBus === bus) lossBus = null;
      bus.disconnect();
    }, 1350);
  }
  function stop() {
    silenceLoss();
    clearInterval(timer);
    if (!session) return;
    const { bus, echo, wet } = session;
    session = null;
    bus.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.018);
    setTimeout(() => {
      bus.disconnect();
      echo.disconnect();
      wet.disconnect();
    }, 140);
  }
  function effect(name) {
    if (!session || !volume) return;
    const t = ctx.currentTime;
    switch (name) {
      case 'fire':
        voice(t, 0.14, 'plasma', 980, 119, 0.32, 0.002, 5100);
        voice(t, 0.084, 'sine', 190, 48, 0.27, 0.003, 1900);
        voice(t, 0.027, 'noise', 0, 0, 0.16, 0.002, 6100);
        break;
      case 'raider':
      case 'volley': {
        const heavy = name === 'volley';
        voice(
          t,
          heavy ? 0.42 : 0.23,
          'plasma',
          heavy ? 315 : 610,
          heavy ? 49 : 120,
          0.27,
          0.005,
          3500,
          0.16,
          true,
        );
        break;
      }
      case 'dash':
        voice(t, 0.24, 'sawtooth', 105, 530, 0.095, 0.028, 1450, 0.25, true);
        voice(t, 0.18, 'noise', 0, 0, 0.13, 0.023, 1800);
        break;
      case 'impact':
        voice(t, 0.12, 'plasma', 1130, 186, 0.2, 0.002, 3900);
        voice(t, 0.088, 'noise', 0, 0, 0.15, 0.003, 1800);
        voice(t, 0.09, 'square', 175, 77, 0.07, 0.003, 540);
        break;
      case 'rock':
      case 'ship':
        voice(t, 0.1, 'plasma', 370, 64, 0.25, 0.002, 2500);
        voice(t, 0.49, 'noise', 0, 0, 0.37, 0.007, name === 'rock' ? 1080 : 2250, -0.16);
        voice(t, 0.35, 'sine', name === 'rock' ? 112 : 164, 35, 0.31, 0.008, 990);
        if (name === 'ship') voice(t + 0.06, 0.22, 'noise', 0, 0, 0.15, 0.01, 3100, 0.35, true);
        break;
      case 'graze':
        voice(t, 0.115, 'sine', 870, 1380, 0.13, 0.005, 2700);
        break;
      case 'breach':
        voice(t, 0.3, 'noise', 0, 0, 0.31, 0.006, 3300);
        voice(t, 0.37, 'plasma', 132, 47, 0.42, 0.004, 1900);
        voice(t + 0.1, 0.2, 'triangle', 610, 920, 0.16, 0.01, 2300, 0.22, true);
        break;
      case 'shield':
        [0, 7, 12].forEach((n, i) =>
          voice(
            t + i * 0.032,
            0.34,
            'triangle',
            hz(78 + n),
            hz(54 + n),
            0.14,
            0.006,
            2400,
            (i - 1) * 0.45,
            true,
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
    setBoss(rank) {
      const playing = Boolean(session);
      if (playing) stop();
      theme = rank ? bossTheme(rank) : null;
      beat = 0;
      if (playing) start();
    },
    rewind() {
      theme = null;
      beat = 0;
    },
    get volume() {
      return volume;
    },
    setVolume(value) {
      volume = value;
      if (master) master.gain.setTargetAtTime(value / 100, ctx.currentTime, 0.018);
      try {
        localStorage.setItem('low-orbit-volume', String(volume));
      } catch {}
    },
  };
}
