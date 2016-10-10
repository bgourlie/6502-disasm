export class PackedRom {
  private readonly packed: number[];

  constructor(packed: number[]) {
    this.packed = packed;
  }

  public toBytes() : Uint8Array {
    return new Uint8Array(Int32Array.from(this.packed).buffer)
  }
}
