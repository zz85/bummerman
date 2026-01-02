// State synchronization module with pluggable transports
// First implementation: Broadcast Channel API for same-origin tab communication

class SyncTransport {
  send(type, data) { throw new Error('Not implemented'); }
  onMessage(callback) { throw new Error('Not implemented'); }
  close() {}
}

class BroadcastChannelTransport extends SyncTransport {
  constructor(channelName = 'bummerman-sync') {
    super();
    this.channel = new BroadcastChannel(channelName);
  }

  send(type, data) {
    this.channel.postMessage({ type, data, ts: Date.now() });
  }

  onMessage(callback) {
    this.channel.onmessage = (e) => callback(e.data.type, e.data.data);
  }

  close() {
    this.channel.close();
  }
}

class GameSync {
  constructor(transport = new BroadcastChannelTransport()) {
    this.transport = transport;
    this.listeners = {};
    this.transport.onMessage((type, data) => this._dispatch(type, data));
  }

  // Subscribe to events
  on(type, callback) {
    (this.listeners[type] ||= []).push(callback);
  }

  off(type, callback) {
    if (this.listeners[type]) {
      this.listeners[type] = this.listeners[type].filter(cb => cb !== callback);
    }
  }

  _dispatch(type, data) {
    (this.listeners[type] || []).forEach(cb => cb(data));
    (this.listeners['*'] || []).forEach(cb => cb(type, data));
  }

  // State replication
  sendState(state) {
    this.transport.send('state', state);
  }

  // Events
  emit(eventType, data) {
    this.transport.send(eventType, data);
  }

  close() {
    this.transport.close();
  }
}
