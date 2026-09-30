const listeners = new Map();

export const bus = {
  on(event, fn) {
    if (!listeners.has(event)) listeners.set(event, []);
    listeners.get(event).push(fn);
  },
  emit(event, data) {
    const fns = listeners.get(event);
    if (fns) for (const fn of fns) fn(data);
  },
};
