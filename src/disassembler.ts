class State {
  public pc: number;

  constructor(pc: number) {
    this.pc = pc;
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

  public* iterator(start: number = 0, end?: number): IterableIterator<string> {
    const state = new State(start);
    const decodeTo = end ? end : this.bytes.length;

    while (state.pc < decodeTo) {
      if (state.pc >= decodeTo) {
        yield ".END";
      }
      const byte = this.bytes[state.pc];
      state.pc += 1;

      switch (byte) {
        case 0x0:
          state.pc += 1; // BRK has a padding byte
          yield "BRK";
          break;
        case 0x40:
          yield "RTI";
          break;
        case 0x60:
          yield "RTS";
          break;
        case 0x08:
          yield "PHP";
          break;
        case 0x28:
          yield "PLP";
          break;
        case 0x48:
          yield "PHA";
          break;
        case 0x68:
          yield "PLA";
          break;
        case 0x88:
          yield "DEY";
          break;
        case 0xa8:
          yield "TAY";
          break;
        case 0xc8:
          yield "INY";
          break;
        case 0xe8:
          yield "INX";
          break;
        case 0x18:
          yield "CLC";
          break;
        case 0x38:
          yield "SEC";
          break;
        case 0x58:
          yield "CLI";
          break;
        case 0x78:
          yield "SEI";
          break;
        case 0x98:
          yield "TYA";
          break;
        case 0xb8:
          yield "CLV";
          break;
        case 0xd8:
          yield "CLD";
          break;
        case 0xf8:
          yield "SED";
          break;
        case 0x8a:
          yield "TXA";
          break;
        case 0x9a:
          yield "TXS";
          break;
        case 0xaa:
          yield "TAX";
          break;
        case 0xba:
          yield "TSX";
          break;
        case 0xca:
          yield "DEX";
          break;
        case 0xea:
          yield "NOP";
          break;
        case 0x10:
          yield "BPL " + this.relative(state);
          break;
        case 0x30:
          yield "BMI " + this.relative(state);
          break;
        case 0x50:
          yield "BVC " + this.relative(state);
          break;
        case 0x70:
          yield "BVS " + this.relative(state);
          break;
        case 0x90:
          yield "BCC " + this.relative(state);
          break;
        case 0xb0:
          yield "BCS " + this.relative(state);
          break;
        case 0xd0:
          yield "BNE " + this.relative(state);
          break;
        case 0xf0:
          yield "BEQ " + this.relative(state);
          break;
        case 0x20:
          yield "JSR " + this.abs(state);
          break;
        default:
          const instrFamily = byte & Disassembler.INSTR_FAMILY_MASK;
          switch (instrFamily) {
            case 0b01:
              yield Disassembler.decodeFamily01Instruction(byte) + " "
              + this.decodeFamily01AddressingMode(byte, state);
              break;
            case 0b10:
              yield Disassembler.decodeFamily10Instruction(byte) + " "
              + this.decodeFamily10AddressingMode(byte, state);
              break;
            case 0b00:
              yield Disassembler.decodeFamily00Instruction(byte) + " "
              + this.decodeFamily00AddressingMode(byte, state);
              break;
            default:
              yield "???";
              break;
          }
      }
    }
  }

  private read8(state: State): string {
    const val = this.bytes[state.pc];
    state.pc += 1;
    return Disassembler.leftPad(val.toString(16), 2).toUpperCase();
  }

  private read16(state: State): string {
    const byte1 = this.bytes[state.pc];
    const byte2 = this.bytes[state.pc + 1];
    state.pc += 2;
    const val = byte1 | byte2 << 8;
    return Disassembler.leftPad(val.toString(16), 4).toUpperCase();
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
