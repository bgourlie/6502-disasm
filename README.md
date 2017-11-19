# 6502-disasm [![Build Status](https://travis-ci.org/bgourlie/6502-disasm.svg?branch=master)](https://travis-ci.org/bgourlie/6502-disasm)
A 6502 disassembler written in TypeScript.

### Usage

    const d = require("6502-disasm");
    const disasm = new d.Disassembler(new Uint8Array([0x61, 0xFA]));
    disasm.decode(); // Outputs [ 'ADC ($FA,X)' ]
