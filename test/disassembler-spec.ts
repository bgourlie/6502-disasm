import {Disassembler} from "../src/disassembler";
import * as chai from "chai";

const expect = chai.expect;

describe("disassembler", () => {
  it("should decode adc instructions", () => {
    const adcRom = [
      0x61, 0x00, /* ADC (zp,X) */
      0x65, 0x00, /* ADC zp */
      0x69, 0x00, /* ADC # */
      0x6d, 0x0f, 0xf0, /* ADC abs */
      0x71, 0x00, /* ADC (ind),Y */
      0x75, 0x00, /* ADC zp,Y */
      0x79, 0x00, 0x00, /* ADC abs,Y */
      0x7d, 0x00, 0x00, /* ADC abs,X */
    ];

    const romBytes = Uint8Array.from(adcRom);
    const disassembler = new Disassembler(romBytes);
    expect(disassembler.decodeNext()).to.equal("ADC ($00,X)");
    expect(disassembler.decodeNext()).to.equal("ADC $00");
    expect(disassembler.decodeNext()).to.equal("ADC #$00");
    expect(disassembler.decodeNext()).to.equal("ADC $F00F");
    expect(disassembler.decodeNext()).to.equal("ADC ($00),Y");
    expect(disassembler.decodeNext()).to.equal("ADC $00,X");
    expect(disassembler.decodeNext()).to.equal("ADC $0000,Y");
    expect(disassembler.decodeNext()).to.equal("ADC $0000,X");
  });
});
