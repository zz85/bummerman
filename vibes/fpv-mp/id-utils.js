const words = ['red','blue','green','gold','fire','ice','sun','moon','star','rock','tree','wave','wind','storm','cloud','rain','snow','leaf','bird','fish','wolf','bear','lion','hawk','frog','deer','fox','owl','cat','dog','ant','bee'];

export function uuid() {
  return crypto.randomUUID?.() || 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

export function toWords(u) {
  const num = parseInt(u.replace(/-/g, '').slice(0, 8), 16);
  return [words[(num >> 20) & 31], words[(num >> 15) & 31], words[(num >> 10) & 31], words[(num >> 5) & 31]].join('-');
}
