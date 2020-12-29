/* eslint-disable require-jsdoc */

function getBit(value: number, bit: number): boolean {
  return (value & (1 << bit)) !== 0;
}

function getInt(value: number, start: number, end: number): number {
  return (value >> start) & ((1 << (end - start + 1)) - 1);
}

function getMac(value: Buffer, start: number): Buffer {
  const res = Buffer.allocUnsafe(6);
  for (let i = 0; i < 6; i++) {
    res[i] = value[start + 5 - i];
  }
  return res;
}

function readUInt24LE(data: Buffer, offset: number = 0): number {
  return (
    data.readUInt8(offset) |
    (data.readUInt8(offset + 1) << 8) + (data.readUInt8(offset + 2) << 16));
}

const EVENT_RESOLVER = {
  0x03: (data: Buffer) => ({motion: data.readUInt8(0) ? true : false}),
  0x04: (data: Buffer) => ({temperature: data.readUInt16LE(0) / 10}),
  0x05: (data: Buffer) => ({
    switch: data.readUInt8(0),
    temperature: data.readUInt8(1),
  }),
  0x06: (data: Buffer) => ({humidity: data.readUInt16LE(0) / 10}),
  0x07: (data: Buffer) => ({illuminance: readUInt24LE(data)}),
  0x08: (data: Buffer) => ({moisture: data.readUInt8(0)}),
  0x09: (data: Buffer) => ({conductivity: data.readUInt16LE(0)}),
  0x0A: (data: Buffer) => ({battery: data.readUInt8(0)}),
  0x0D: (data: Buffer) => ({
    temperature: data.readUInt16LE(0) / 10,
    humidity: data.readUInt16LE(2) / 10,
  }),
  0x10: (data: Buffer) => ({formaldehyde: data.readUInt16LE(0) / 100}),
  0x12: (data: Buffer) => ({switch: data.readUInt8(0) ? true : false}),
  0x13: (data: Buffer) => ({consumable: data.readUInt8(0)}),
  0x17: (data: Buffer) => ({idle_time: data.readUInt32LE(0) / 60}),
  0x18: (data: Buffer) => ({light: data.readUInt8(0)}),
  0x19: (data: Buffer) => ({open: data.readUInt8(0)}),
};

const PRODUCT_NAMES = {
  0x0098: 'HHCCJCY01',
  0x01AA: 'LYWSDCGQ',
  0x015D: 'HHCCPOT002',
  0x02DF: 'JQJCY01YM',
  0x03DD: 'MUE4094RT',
  0x0347: 'CGG1',
  0x03BC: 'GCLS002',
  0x045B: 'LYWSD02',
  0x040A: 'WX08ZM',
  0x0576: 'CGD1',
  0x055B: 'LYWSD03MMC',
  0x07F6: 'MJYD02YLA',
};

class Capabilities {
  readonly isConnectable: boolean;
  readonly isCentralable: boolean;
  readonly isEncryptable: boolean;
  readonly bindState: number;
  readonly hasIoCapabilities: boolean;
  constructor(data: number) {
    this.isConnectable = getBit(data, 0);
    this.isCentralable = getBit(data, 1);
    this.isEncryptable = getBit(data, 2);
    this.bindState = getInt(data, 3, 4);
    this.hasIoCapabilities = getBit(data, 5);
  }
}

class IoCapabilities {
  readonly inputCapabilities: number;
  readonly outputCapabilities: number;
  constructor(data: number) {
    this.inputCapabilities = getInt(data, 0, 3);
    this.outputCapabilities = getInt(data, 4, 7);
  }
}

class Mesh {
  readonly pbType: number;
  readonly state: number;
  readonly version: number;
  constructor(data: number) {
    this.pbType = getInt(data, 0, 1);
    this.state = getInt(data, 2, 3);
    this.version = getInt(data, 4, 7);
  }
}

class Event {
  readonly eventId: number;
  readonly eventData: object;
  constructor(eventId: number, eventData: Buffer) {
    if (EVENT_RESOLVER[eventId]) {
      this.eventId = eventId;
      this.eventData = EVENT_RESOLVER[eventId](eventData);
    } else {
      throw new Error(`unknown event (id: ${eventId})`);
    }
  }
}

export default class MiPacket {
  readonly isEncrypted: boolean;
  readonly hasMac: boolean;
  readonly hasCapabilities: boolean;
  readonly hasEvent: boolean;
  readonly hasMesh: boolean;
  readonly isRegistered: boolean;
  readonly bindingState: boolean;
  readonly authMode: number;
  readonly version: number;
  readonly productId: number;
  readonly productName: string;
  readonly frameCounter: number;
  readonly mac: Buffer;
  readonly capabilities: Capabilities;
  readonly comboKey: string;
  readonly ioCapabilities: IoCapabilities;
  readonly mesh: Mesh;
  readonly event: Event;
  readonly keyBuffer1: Buffer;
  readonly keyBuffer2: Buffer;

  constructor(data: Buffer | string) {
    if (!data || data.length < 5) {
      throw new Error('invalid packet length');
    }
    let buffer: Buffer;
    if (typeof data === 'string') {
      buffer = Buffer.from(data, 'hex');
    } else {
      buffer = data;
    }
    const frame = buffer.readUInt16LE(0);
    this.isEncrypted = getBit(frame, 3);
    this.hasMac = getBit(frame, 4);
    this.hasCapabilities = getBit(frame, 5);
    this.hasEvent = getBit(frame, 6);
    this.hasMesh = getBit(frame, 7);
    this.isRegistered = getBit(frame, 8);
    this.bindingState = getBit(frame, 9);
    this.authMode = getInt(frame, 10, 11);
    this.version = getInt(frame, 12, 15);
    this.productId = buffer.readUInt16LE(2);
    this.productName = PRODUCT_NAMES[this.productId] || 'unknown';
    this.frameCounter = buffer.readUInt8(4);
    let pos = 5;
    if (this.hasMac) {
      this.mac = getMac(buffer, pos);
      pos += 6;
    }
    if (this.hasCapabilities) {
      this.capabilities = new Capabilities(buffer.readUInt8(pos));
      pos += 1;
    }
    if (this.hasCapabilities && this.capabilities.bindState === 3 && this.version >= 3) {
      this.comboKey = 'not implemented yet';
      pos += 2;
    }
    if (this.hasCapabilities && this.capabilities.hasIoCapabilities) {
      this.ioCapabilities = new IoCapabilities(buffer.readUInt8(pos));
      pos += 2;
    }
    if (this.hasEvent && pos < buffer.length) {
      let eventLength = 0;
      let eventId = 0;
      if (this.version >= 5) {
        eventLength = buffer.readUInt8(pos);
        eventId = buffer.readUInt8(pos + 1);
        pos += 2;
      } else {
        eventId = buffer.readUInt8(pos);
        eventLength = buffer.readUInt8(pos + 2);
        pos += 3;
      }
      if (eventLength > 0) {
        const eventData = Buffer.alloc(eventLength);
        buffer.copy(eventData, 0, pos, pos + eventLength);
        this.event = new Event(eventId, eventData);
      }
    }
    if (this.isEncrypted) {
      this.keyBuffer1 = Buffer.alloc(3);
      buffer.copy(this.keyBuffer1, 0, pos, pos + 3);
      pos += 3;
      if (this.version >= 4) {
        this.keyBuffer2 = Buffer.alloc(4);
        buffer.copy(this.keyBuffer2, 0, pos, pos + 4);
        pos += 4;
      } else {
        this.keyBuffer2 = Buffer.alloc(1);
        buffer.copy(this.keyBuffer2, 0, pos, pos + 1);
        pos += 1;
      }
    }
    if (this.hasMesh) {
      this.mesh = new Mesh(buffer.readUInt8(pos));
      pos += 2;
    }
  }
}
