export class Disassembler {
  private static readonly INSTR_FAMILY_MASK = 0b11;
  private static readonly INSTR_MASK = 0b111;
  private static readonly ADDRESSING_MODE_MASK = 0b111;

  private static readonly INSTR_LEN = [
    1, 2, 0, 0, 0, 2, 2, 0, 1, 2, 1, 0, 0, 3, 3, 0, // 0x00
    2, 2, 0, 0, 0, 2, 2, 0, 1, 3, 0, 0, 0, 3, 3, 0, // 0x10
    3, 2, 0, 0, 2, 2, 2, 0, 1, 2, 1, 0, 3, 3, 3, 0, // 0x20
    2, 2, 0, 0, 0, 2, 2, 0, 1, 3, 0, 0, 0, 3, 3, 0, // 0x30
    1, 2, 0, 0, 0, 2, 2, 0, 1, 2, 1, 0, 3, 3, 3, 0, // 0x40
    2, 2, 0, 0, 0, 2, 2, 0, 1, 3, 0, 0, 0, 3, 3, 0, // 0x50
    1, 2, 0, 0, 0, 2, 2, 0, 1, 2, 1, 0, 3, 3, 3, 0, // 0x60
    2, 2, 0, 0, 0, 2, 2, 0, 1, 3, 0, 0, 0, 3, 3, 0, // 0x70
    0, 2, 0, 0, 2, 2, 2, 0, 1, 0, 1, 0, 3, 3, 3, 0, // 0x80
    2, 2, 0, 0, 2, 2, 2, 0, 1, 3, 1, 0, 0, 3, 0, 0, // 0x90
    2, 2, 2, 0, 2, 2, 2, 0, 1, 2, 1, 0, 3, 3, 3, 0, // 0xA0
    2, 2, 0, 0, 2, 2, 2, 0, 1, 3, 1, 0, 3, 3, 3, 0, // 0xB0
    2, 2, 0, 0, 2, 2, 2, 0, 1, 2, 1, 0, 3, 3, 3, 0, // 0xC0
    2, 2, 0, 0, 0, 2, 2, 0, 1, 3, 0, 0, 0, 3, 3, 0, // 0xD0
    2, 2, 0, 0, 2, 2, 2, 0, 1, 2, 1, 0, 3, 3, 3, 0, // 0xE0
    2, 2, 0, 0, 0, 2, 2, 0, 1, 3, 0, 0, 0, 3, 3, 0, // 0xF0
  ];

  private readonly bytes: Uint8Array;
  private readonly bytesLen: number;

  private pc: number = 0;

  constructor(bytes: Uint8Array) {
    this.bytes = bytes;
    this.bytesLen = bytes.length;
  }

  private static decodeFamily00Instruction(byte: number): string {
    const instr = (byte >> 5) & Disassembler.INSTR_MASK;

    switch (instr) {
      case 0b0:
        throw "Unexpected instruction byte for family 00";
      case 0b1:
        return "BIT";
      case 0b10:
        return "JMP";
      case 0b11:
        return "JMP";
      case 0b100:
        return "STY";
      case 0b101:
        return "LDY";
      case 0b110:
        return "CPY";
      case 0b111:
        return "CPX";
      default:
        throw `Non-exhaustive match on instruction: ${instr.toString(6)}`;
    }
  }

  private static decodeFamily00AddressingMode(byte: number): string {
    const am = (byte >> 2) & Disassembler.ADDRESSING_MODE_MASK;

    switch(am) {
      case 0b0:
        return "#";
      case 0b1:
        return "zp";
      case 0b10:
        throw "Invalid addressing byte for family 10.";
      case 0b11:
        return "abs";
      case 0b100:
        throw "Invalid addressing byte for family 10.";
      case 0b101:
        return "zp,X";
      case 0b110:
        throw "Invalid addressing byte for family 10.";
      case 0b111:
        return "abs,X";
      default:
        throw `Non-exhaustive match on addressing mode: ${am.toString(6)}`;
    }
  }

  private static decodeFamily01Instruction(byte: number): string {
    const instr = (byte >> 5) & Disassembler.INSTR_MASK;

    switch (instr) {
      case 0b0:
        return "ORA";
      case 0b1:
        return "AND";
      case 0b10:
        return "EOR";
      case 0b11:
        return "ADC";
      case 0b100:
        return "STA";
      case 0b101:
        return "LDA";
      case 0b110:
        return "CMP";
      case 0b111:
        return "SBC";
      default:
        throw `Non-exhaustive match on instruction: ${instr.toString(6)}`
    }
  }

  private static decodeFamily01AddressingMode(byte: number): string {
    const am = (byte >> 2) & Disassembler.ADDRESSING_MODE_MASK;

    switch(am) {
      case 0b0:
        return "(zp,X)";
      case 0b1:
        return "zp";
      case 0b10:
        return "#";
      case 0b11:
        return "abs";
      case 0b100:
        return "(zp),Y";
      case 0b101:
        return "zp,X";
      case 0b110:
        return "abs,Y";
      case 0b111:
        return "abs,X";
      default:
        throw `Non-exhaustive match on addressing mode: ${am.toString(6)}`;
    }
  }

  private static decodeFamily10Instruction(byte: number): string {
    const instr = (byte >> 5) & Disassembler.INSTR_MASK;

    switch (instr) {
      case 0b0:
        return "ASL";
      case 0b1:
        return "ROL";
      case 0b10:
        return "LSR";
      case 0b11:
        return "ROR";
      case 0b100:
        return "STX";
      case 0b101:
        return "LDX";
      case 0b110:
        return "DEC";
      case 0b111:
        return "INC";
      default:
        throw `Non-exhaustive match on instruction: ${instr.toString(6)}`
    }
  }

  private static decodeFamily10AddressingMode(byte: number): string {
    const am = (byte >> 2) & Disassembler.ADDRESSING_MODE_MASK;

    switch(am) {
      case 0b0:
        return "#";
      case 0b1:
        return "zp";
      case 0b10:
        return "acc";
      case 0b11:
        return "abs";
      case 0b100:
        throw "Invalid addressing byte for family 10.";
      case 0b101:
        return "zp,X";
      case 0b110:
        throw "Invalid addressing byte for family 10.";
      case 0b111:
        return "abs,X";
      default:
        throw `Non-exhaustive match on addressing mode: ${am.toString(6)}`;
    }
  }

  public decodeNext(): string {
    if(this.pc >= this.bytesLen) {
      throw `Program counter out-of-bounds: ${this.pc}.  Upper-bound is ${this.bytesLen - 1}`;
    }

    const byte = this.bytes[this.pc];
    this.pc += Disassembler.INSTR_LEN[byte];

    switch(byte) {
      case 0x0:
        return "BRK";
      case 0x10:
        return "BPL";
      case 0x20:
        return "JSR abs";
      case 0x30:
        return "BMI";
      case 0x40:
        return "RTI";
      case 0x50:
        return "BVC";
      case 0x60:
        return "RTS";
      case 0x70:
        return "BVS";
      case 0x90:
        return "BCC";
      case 0xb0:
        return "BCS";
      case 0xd0:
        return "BNE";
      case 0xf0:
        return "BEQ";
      case 0x08:
        return "PHP";
      case 0x28:
        return "PLP";
      case 0x48:
        return "PHA";
      case 0x68:
        return "PLA";
      case 0x88:
        return "DEY";
      case 0xa8:
        return "TAY";
      case 0xc8:
        return "INY";
      case 0xe8:
        return "INX";
      case 0x18:
        return "CLC";
      case 0x38:
        return "SEC";
      case 0x58:
        return "CLI";
      case 0x78:
        return "SEI";
      case 0x98:
        return "TYA";
      case 0xb8:
        return "CLV";
      case 0xd8:
        return "CLD";
      case 0xf8:
        return "SED";
      case 0x8a:
        return "TXA";
      case 0x9a:
        return "TXS";
      case 0xaa:
        return "TAX";
      case 0xba:
        return "TSX";
      case 0xca:
        return "DEX";
      case 0xea:
        return "NOP";
    }

    const instrFamily = byte & Disassembler.INSTR_FAMILY_MASK;

    switch (instrFamily) {
      case 0b01:
        return Disassembler.decodeFamily01Instruction(byte) + " " + Disassembler.decodeFamily01AddressingMode(byte);
      case 0b10:
        return Disassembler.decodeFamily10Instruction(byte) + " " + Disassembler.decodeFamily10AddressingMode(byte);
      case 0b00:
        return Disassembler.decodeFamily00Instruction(byte) + " " + Disassembler.decodeFamily00AddressingMode(byte);
      default:
        throw "Non-exhaustive match on instruction family."
    }
  }
}

