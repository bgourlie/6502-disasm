import { PackedRom } from "../src/packed_rom";
import * as chai from "chai";

const expect = chai.expect;

describe("packed_rom", () => {
  it("should unpack signed 32-bit int to bytes (little endian)", () => {
    const packedRom = new PackedRom([-99]);
    const result = packedRom.toBytes();
    expect(result[0]).to.equal(0x9d);
    expect(result[1]).to.equal(0xff);
    expect(result[2]).to.equal(0xff);
    expect(result[3]).to.equal(0xff);
  });
});
