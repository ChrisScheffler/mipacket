# mipacket

Node.js package for parsing Xiaomi BLE packets.

[![npm](https://img.shields.io/npm/v/mipacket.svg)](https://www.npmjs.com/package/mipacket)
![language](https://img.shields.io/github/languages/top/ChrisScheffler/mipacket.svg)
![commit](https://img.shields.io/github/last-commit/ChrisScheffler/mipacket.svg)
[![licence](https://img.shields.io/npm/l/miflora.svg)](LICENSE)

---

## Install

```bash
npm install mipacket
```

## Usage

```javascript
const packet = new MiPacket(buffer);
```

## Sample output

```javascript
MiPacket {
  frameControl: FrameControl {
    isEncrypted: false,
    hasMac: true,
    hasCapabilities: false,
    hasEvent: true,
    hasMesh: false,
    isRegistered: false,
    bindingState: false,
    authMode: 0,
    version: 2
  },
  productId: 426,
  productName: 'LYWSDCGQ',
  frameCounter: 72,
  mac: <Buffer 12 34 56 78 90 ab>,
  event: Event {
      eventId: 13,
      eventData: {
          temperature: 19.4,
          humidity: 66
        }
    }
}
```
