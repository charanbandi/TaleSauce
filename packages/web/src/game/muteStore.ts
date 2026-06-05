const MUTE_KEY = "talesauce-muted";

type Listener = (muted: boolean) => void;
const listeners = new Set<Listener>();
let _muted = typeof localStorage !== "undefined" && localStorage.getItem(MUTE_KEY) === "true";

export const muteStore = {
  get muted() { return _muted; },
  toggle(): boolean {
    _muted = !_muted;
    localStorage.setItem(MUTE_KEY, String(_muted));
    listeners.forEach((l) => l(_muted));
    return _muted;
  },
  subscribe(l: Listener): () => void {
    listeners.add(l);
    return () => { listeners.delete(l); };
  },
};
