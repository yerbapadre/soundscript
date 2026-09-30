export const VOICE_SYNTH = {
  Bell(ctx, dest, freq, t) {
    for (const [ratio, amp] of [[1, 1.0], [2.0, 0.4], [2.76, 0.22], [3.9, 0.1]]) {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "sine"; o.frequency.value = freq * ratio;
      const decay = 1.6 / ratio;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.22 * amp, t + 0.006);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05 + decay);
      o.connect(g).connect(dest); o.start(t); o.stop(t + 0.1 + decay);
    }
  },
  Marimba(ctx, dest, freq, t) {
    for (const [ratio, amp, dur] of [[1, 0.5, 0.55], [4.0, 0.16, 0.18], [9.2, 0.05, 0.09]]) {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "sine"; o.frequency.value = freq * ratio;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(amp, t + 0.003);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(dest); o.start(t); o.stop(t + dur + 0.02);
    }
  },
  Bass(ctx, dest, freq, t) {
    const f = freq / 2;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass"; lp.Q.value = 5;
    lp.frequency.setValueAtTime(500, t);
    lp.frequency.exponentialRampToValueAtTime(120, t + 0.3);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.34, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
    lp.connect(g).connect(dest);
    const saw = ctx.createOscillator(); saw.type = "sawtooth"; saw.frequency.value = f; saw.connect(lp);
    const sub = ctx.createOscillator(); sub.type = "sine"; sub.frequency.value = f; sub.connect(lp);
    saw.start(t); saw.stop(t + 0.95); sub.start(t); sub.stop(t + 0.95);
  },
  Ambient(ctx, dest, freq, t) {
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass"; lp.frequency.setValueAtTime(700, t);
    lp.frequency.linearRampToValueAtTime(1600, t + 1.2);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.16, t + 0.5);
    g.gain.setValueAtTime(0.16, t + 1.4);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 3.4);
    lp.connect(g).connect(dest);
    for (const det of [-9, -3, 4, 10]) {
      const o = ctx.createOscillator(); o.type = "sine"; o.frequency.value = freq; o.detune.value = det;
      o.connect(lp); o.start(t); o.stop(t + 3.5);
    }
    const air = ctx.createOscillator(); air.type = "sine"; air.frequency.value = freq * 2;
    const ag = ctx.createGain(); ag.gain.setValueAtTime(0.0001, t);
    ag.gain.linearRampToValueAtTime(0.05, t + 0.8); ag.gain.exponentialRampToValueAtTime(0.0001, t + 3.0);
    air.connect(ag).connect(lp); air.start(t); air.stop(t + 3.1);
  },
  Pad(ctx, dest, freq, t) {
    const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 1800;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.16, t + 0.12);
    g.gain.setValueAtTime(0.16, t + 0.6);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.8);
    lp.connect(g).connect(dest);
    for (const det of [-6, 0, 6]) {
      const o = ctx.createOscillator(); o.type = "sawtooth"; o.frequency.value = freq; o.detune.value = det;
      o.connect(lp); o.start(t); o.stop(t + 1.9);
    }
  },
  Pluck(ctx, dest, freq, t) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = "triangle"; o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.3, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
    o.connect(g).connect(dest); o.start(t); o.stop(t + 0.7);
  },
  Glass(ctx, dest, freq, t) {
    for (const [ratio, amp, dur] of [[1, 0.24, 0.9], [3.0, 0.12, 0.5], [5.4, 0.06, 0.3]]) {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "sine"; o.frequency.value = freq * ratio;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(amp, t + 0.003);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(dest); o.start(t); o.stop(t + dur);
    }
  },
};
