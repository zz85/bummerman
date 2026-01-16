// Network adapter - swap backends at runtime
let adapter = null;

export function setAdapter(a) { adapter = a; }
export const initPeer = () => adapter.init();
export const hostGame = (cb) => adapter.host(cb);
export const joinGame = (id, cb) => adapter.join(id, cb);
export const rejoinGame = (session, cb) => adapter.rejoin(session, cb);
export const getSession = () => adapter.getSession();
export const clearSession = () => adapter.clearSession();
export const send = (d) => adapter.send(d);
export const sendTo = (id, d) => adapter.sendTo(id, d);
export const sendToEach = (fn) => adapter.sendToEach(fn);
export const broadcast = (d, ex) => adapter.broadcast(d, ex);
export const getPing = () => adapter.getPing();
export const getIsHost = () => adapter.getIsHost();
export const isConnected = () => adapter.isConnected();
export const getPlayerCount = () => adapter.getPlayerCount();
export const getMyId = () => adapter.getMyId();
