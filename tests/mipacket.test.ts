import {expect} from 'chai';
import MiPacket from '../src/mipacket';

describe('packets', function() {
  it('from Buffer', function() {
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

  it('from hexstring', function() {
    const packet = new MiPacket('5020aa0148ab90785634120d1004c2009402');
    console.log(packet);
    expect(packet.mac.toString('hex')).equal('1234567890ab');
  });


  /*
  * packet can have hasEvent = true but doesn't contain an actual event
  */
  it('hasEvent but does not', function() {
    const buffer = Buffer.from('71205d0105ab90785634120d', 'hex');
    const packet = new MiPacket(buffer);
    console.log(packet);
    expect(packet.mac.toString('hex')).equal('1234567890ab');
    expect(packet.hasEvent).true;
    expect(packet.event).undefined;
  });
});
