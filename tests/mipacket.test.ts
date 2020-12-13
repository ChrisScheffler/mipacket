import {expect} from 'chai';
import MiPacket from '../src/mipacket';

describe('packets', function() {
  it('mac', function() {
    const buffer = Buffer.from([
      0x50, // 00
      0x20, // 01
      0xaa, // 02
      0x01, // 03
      0x48, // 04
      0xab, // 05
      0x90, // 06
      0x78, // 07
      0x56, // 08
      0x34, // 09
      0x12, // 10
      0x0d, // 11
      0x10, // 12
      0x04, // 13
      0xc2, // 14
      0x00, // 15
      0x94, // 16
      0x02, // 17
    ]);
    const packet = new MiPacket(buffer);
    console.log(packet);
    expect(packet.mac.toString('hex')).equal('1234567890ab');
  });
});
