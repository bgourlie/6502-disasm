export class Disassembler {
  private static readonly INSTR_FAMILY_MASK = 0b11;
  private static readonly INSTR_MASK = 0b111;
  private static readonly ADDRESSING_MODE_MASK = 0b111;

  private static leftPad(value: string, size: number) {
    if (value.length < size) {
      let pad = "0";
      size -= value.length;
      let res = "";
      while (true) {
        /* tslint:disable:no-bitwise */
        if (size & 1) {
          res += pad;
        }
        size >>= 1;
        if (size) {
          pad += pad;
        } else {
          break;
        }
      }
      return res + value;
    }
    return value;
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
        return "???";
    }
  }

  private static decodeFamily00Instruction(byte: number): string {
    const instr = (byte >> 5) & Disassembler.INSTR_MASK;

    switch (instr) {
      case 0b0:
        return "???";
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
        return "???";
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
        return "???";
    }
  }

  private readonly bytes: Uint8Array;
  private readonly decodeTo: number;

  private pc: number = 0;

  constructor(bytes: Uint8Array, pcStart: number = 0, decodeTo?: number) {
    this.bytes = bytes;
    this.pc = pcStart;
    this.decodeTo = decodeTo ? decodeTo : bytes.length;
  }

  public decodeNext(): string {
    if (this.pc >= this.decodeTo) {
      return ".END";
    }

    const byte = this.bytes[this.pc];

    switch (byte) {
      case 0x0:
        this.pc += 1; // BRK has a padding byte
        return "BRK";
      case 0x40:
        return "RTI";
      case 0x60:
        return "RTS";
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
      case 0x10:
        return "BPL " + this.relative();
      case 0x30:
        return "BMI " + this.relative();
      case 0x50:
        return "BVC " + this.relative();
      case 0x70:
        return "BVS " + this.relative();
      case 0x90:
        return "BCC " + this.relative();
      case 0xb0:
        return "BCS " + this.relative();
      case 0xd0:
        return "BNE " + this.relative();
      case 0xf0:
        return "BEQ " + this.relative();
      case 0x20:
        return "JSR " + this.abs();
      default:
        const instrFamily = byte & Disassembler.INSTR_FAMILY_MASK;
        let decoded: string;
        switch (instrFamily) {
          case 0b01:
            decoded = Disassembler.decodeFamily01Instruction(byte) + " " + this.decodeFamily01AddressingMode(byte);
            break;
          case 0b10:
            decoded = Disassembler.decodeFamily10Instruction(byte) + " " + this.decodeFamily10AddressingMode(byte);
            break;
          case 0b00:
            decoded = Disassembler.decodeFamily00Instruction(byte) + " " + this.decodeFamily00AddressingMode(byte);
            break;
          default:
            decoded = "???";
        }
        this.pc += 1;
        return decoded;
    }
  }

  private read8(): string {
    this.pc += 1;
    const val = this.bytes[this.pc];
    return Disassembler.leftPad(val.toString(16), 2).toUpperCase();
  }

  private read16(): string {
    const byte1 = this.bytes[this.pc + 1];
    const byte2 = this.bytes[this.pc + 2];
    this.pc += 2;
    const val = byte1 | byte2 << 8;
    return Disassembler.leftPad(val.toString(16), 4).toUpperCase();
  }

  private decodeFamily00AddressingMode(byte: number): string {
    const am = (byte >> 2) & Disassembler.ADDRESSING_MODE_MASK;

    switch (am) {
      case 0b0:
        return this.immediate();
      case 0b1:
        return this.zp();
      case 0b10:
        return "???";
      case 0b11:
        return this.abs();
      case 0b100:
        return "???";
      case 0b101:
        return this.zpX();
      case 0b110:
        return "???";
      case 0b111:
        return this.absX();
      default:
        return "???";
    }
  }

  private indexedIndirect(): string {
    return `(\$${this.read8()},X)`;
  }

  private indirectIndexed(): string {
    return `(\$${this.read8()}),Y`;
  }

  private zp(): string {
    return `\$${this.read8()}`;
  }

  private immediate(): string {
    return `#\$${this.read8()}`;
  }

  private abs(): string {
    return `\$${this.read16()}`;
  }

  private zpX(): string {
    return `\$${this.read8()},X`;
  }

  private absY(): string {
    return `\$${this.read16()},Y`;
  }

  private absX(): string {
    return `\$${this.read16()},X`;
  }

  private relative(): string {
    return `\$${this.read8()}`;
  }

  private decodeFamily01AddressingMode(byte: number): string {
    const am = (byte >> 2) & Disassembler.ADDRESSING_MODE_MASK;
    switch (am) {
      case 0b0:
        return this.indexedIndirect();
      case 0b1:
        return this.zp();
      case 0b10:
        return this.immediate();
      case 0b11:
        return this.abs();
      case 0b100:
        return this.indirectIndexed();
      case 0b101:
        return this.zpX();
      case 0b110:
        return this.absY();
      case 0b111:
        return this.absX();
      default:
        return "???";
    }
  }

  private decodeFamily10AddressingMode(byte: number): string {
    const am = (byte >> 2) & Disassembler.ADDRESSING_MODE_MASK;

    switch (am) {
      case 0b0:
        return this.immediate();
      case 0b1:
        return this.zp();
      case 0b10:
        return "A";
      case 0b11:
        return this.abs();
      case 0b100:
        return "???";
      case 0b101:
        return this.zpX();
      case 0b110:
        return "???";
      case 0b111:
        return this.absX();
      default:
        return "???";
    }
  }
}
