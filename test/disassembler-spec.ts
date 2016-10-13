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

    const decoded = new Disassembler(Uint8Array.from(adcRom)).decode();
    expect(decoded[0]).to.equal("ADC ($00,X)");
    expect(decoded[1]).to.equal("ADC $00");
    expect(decoded[2]).to.equal("ADC #$00");
    expect(decoded[3]).to.equal("ADC $F00F");
    expect(decoded[4]).to.equal("ADC ($00),Y");
    expect(decoded[5]).to.equal("ADC $00,X");
    expect(decoded[6]).to.equal("ADC $0000,Y");
    expect(decoded[7]).to.equal("ADC $0000,X");
  });
});
