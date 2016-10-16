class State {
  public pc: number;
  public readonly decodeTo: number;

  constructor(pc: number, decodeTo: number) {
    this.pc = pc;
    this.decodeTo = decodeTo;
  }

  public incPc8(): boolean {
    if (this.pc < this.decodeTo) {
      this.pc += 1;
      return true;
    }
    return false;
  }

  public incPc16(): boolean {
    if (this.pc < this.decodeTo - 1) {
      this.pc += 2;
      return true;
    }
    return false;
  }
}

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

  constructor(bytes: Uint8Array) {
    this.bytes = bytes;
  }

  public decode(start: number = 0, end?: number): string[] {
    const decodeTo = end
      ? end > this.bytes.length ? this.bytes.length : end
      : this.bytes.length;

    const state = new State(start, decodeTo);
    const ret: string[] = [];

    while (state.pc < decodeTo - 1) {
      const byte = this.bytes[state.pc];
      state.pc += 1; // No need for incPc8 because we no it's safe to inc at this point

      switch (byte) {
        case 0x0:
          ret.push("BRK");
          if (!state.incPc8()) {
            break;
          }
          break;
        case 0x40:
          ret.push("RTI");
          break;
        case 0x60:
          ret.push("RTS");
          break;
        case 0x08:
          ret.push("PHP");
          break;
        case 0x28:
          ret.push("PLP");
          break;
        case 0x48:
          ret.push("PHA");
          break;
        case 0x68:
          ret.push("PLA");
          break;
        case 0x88:
          ret.push("DEY");
          break;
        case 0xa8:
          ret.push("TAY");
          break;
        case 0xc8:
          ret.push("INY");
          break;
        case 0xe8:
          ret.push("INX");
          break;
        case 0x18:
          ret.push("CLC");
          break;
        case 0x38:
          ret.push("SEC");
          break;
        case 0x58:
          ret.push("CLI");
          break;
        case 0x78:
          ret.push("SEI");
          break;
        case 0x98:
          ret.push("TYA");
          break;
        case 0xb8:
          ret.push("CLV");
          break;
        case 0xd8:
          ret.push("CLD");
          break;
        case 0xf8:
          ret.push("SED");
          break;
        case 0x8a:
          ret.push("TXA");
          break;
        case 0x9a:
          ret.push("TXS");
          break;
        case 0xaa:
          ret.push("TAX");
          break;
        case 0xba:
          ret.push("TSX");
          break;
        case 0xca:
          ret.push("DEX");
          break;
        case 0xea:
          ret.push("NOP");
          break;
        case 0x10:
          ret.push("BPL " + this.relative(state));
          break;
        case 0x30:
          ret.push("BMI " + this.relative(state));
          break;
        case 0x50:
          ret.push("BVC " + this.relative(state));
          break;
        case 0x70:
          ret.push("BVS " + this.relative(state));
          break;
        case 0x90:
          ret.push("BCC " + this.relative(state));
          break;
        case 0xb0:
          ret.push("BCS " + this.relative(state));
          break;
        case 0xd0:
          ret.push("BNE " + this.relative(state));
          break;
        case 0xf0:
          ret.push("BEQ " + this.relative(state));
          break;
        case 0x20:
          ret.push("JSR " + this.abs(state));
          break;
        default:
          const instrFamily = byte & Disassembler.INSTR_FAMILY_MASK;
          switch (instrFamily) {
            case 0b01:
              ret.push(Disassembler.decodeFamily01Instruction(byte) + " "
                + this.decodeFamily01AddressingMode(byte, state));
              break;
            case 0b10:
              ret.push(Disassembler.decodeFamily10Instruction(byte) + " "
                + this.decodeFamily10AddressingMode(byte, state));
              break;
            case 0b00:
              ret.push(Disassembler.decodeFamily00Instruction(byte) + " "
                + this.decodeFamily00AddressingMode(byte, state));
              break;
            default:
              ret.push("???");
              break;
          }
      }
    }
    ret.push(".END");
    return ret;
  }

  private read8(state: State): string {
    if (state.incPc8()) {
      const val = this.bytes[state.pc - 1];
      return Disassembler.leftPad(val.toString(16), 2).toUpperCase();
    }
    return "END";
  }

  private read16(state: State): string {
    if (state.incPc16()) {
      const byte1 = this.bytes[state.pc - 2];
      const byte2 = this.bytes[state.pc - 1];
      const val = byte1 | byte2 << 8;
      return Disassembler.leftPad(val.toString(16), 4).toUpperCase();
    }
    return "END";
  }

  private decodeFamily00AddressingMode(byte: number, state: State): string {
    const am = (byte >> 2) & Disassembler.ADDRESSING_MODE_MASK;

    switch (am) {
      case 0b0:
        return this.immediate(state);
      case 0b1:
        return this.zp(state);
      case 0b10:
        return "???";
      case 0b11:
        return this.abs(state);
      case 0b100:
        return "???";
      case 0b101:
        return this.zpX(state);
      case 0b110:
        return "???";
      case 0b111:
        return this.absX(state);
      default:
        return "???";
    }
  }

  private indexedIndirect(state: State): string {
    return `(\$${this.read8(state)},X)`;
  }

  private indirectIndexed(state: State): string {
    return `(\$${this.read8(state)}),Y`;
  }

  private zp(state: State): string {
    return `\$${this.read8(state)}`;
  }

  private immediate(state: State): string {
    return `#\$${this.read8(state)}`;
  }

  private abs(state: State): string {
    return `\$${this.read16(state)}`;
  }

  private zpX(state: State): string {
    return `\$${this.read8(state)},X`;
  }

  private absY(state: State): string {
    return `\$${this.read16(state)},Y`;
  }

  private absX(state: State): string {
    return `\$${this.read16(state)},X`;
  }

  private relative(state: State): string {
    return `\$${this.read8(state)}`;
  }

  private decodeFamily01AddressingMode(byte: number, state: State): string {
    const am = (byte >> 2) & Disassembler.ADDRESSING_MODE_MASK;
    switch (am) {
      case 0b0:
        return this.indexedIndirect(state);
      case 0b1:
        return this.zp(state);
      case 0b10:
        return this.immediate(state);
      case 0b11:
        return this.abs(state);
      case 0b100:
        return this.indirectIndexed(state);
      case 0b101:
        return this.zpX(state);
      case 0b110:
        return this.absY(state);
      case 0b111:
        return this.absX(state);
      default:
        return "???";
    }
  }

  private decodeFamily10AddressingMode(byte: number, state: State): string {
    const am = (byte >> 2) & Disassembler.ADDRESSING_MODE_MASK;

    switch (am) {
      case 0b0:
        return this.immediate(state);
      case 0b1:
        return this.zp(state);
      case 0b10:
        return "A";
      case 0b11:
        return this.abs(state);
      case 0b100:
        return "???";
      case 0b101:
        return this.zpX(state);
      case 0b110:
        return "???";
      case 0b111:
        return this.absX(state);
      default:
        return "???";
    }
  }
}
