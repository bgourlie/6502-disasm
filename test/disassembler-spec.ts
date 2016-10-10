import {Disassembler} from "../src/disassembler";
import * as chai from "chai";

const expect = chai.expect;

describe("disassembler", () => {
  it("should decode adc instructions", () => {
    const adcRom = [
      0x61, 0x00,       /* ADC (zp,X) */
      0x65, 0x00,       /* ADC zp */
      0x69, 0x00,       /* ADC # */
      0x6d, 0x00, 0x00, /* ADC abs */
      0x71, 0x00,       /* ADC (ind),Y */
      0x75, 0x00,       /* ADC zp,Y */
      0x79, 0x00, 0x00, /* ADC abs,Y */
      0x7d, 0x00, 0x00, /* ADC abs,X */
    ];

    const romBytes = Uint8Array.from(adcRom);
    const disassembler = new Disassembler(romBytes);
    expect(disassembler.decodeNext()).to.equal("ADC (zp,X)");
    expect(disassembler.decodeNext()).to.equal("ADC zp");
    expect(disassembler.decodeNext()).to.equal("ADC #");
    expect(disassembler.decodeNext()).to.equal("ADC abs");
    expect(disassembler.decodeNext()).to.equal("ADC (zp),Y");
    expect(disassembler.decodeNext()).to.equal("ADC zp,X");
    expect(disassembler.decodeNext()).to.equal("ADC abs,Y");
    expect(disassembler.decodeNext()).to.equal("ADC abs,X");
  });
});
