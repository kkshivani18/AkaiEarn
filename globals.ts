import structuredClone from "@ungap/structured-clone";
import { install } from "react-native-quick-crypto";
import "react-native-get-random-values";
import { Buffer } from "buffer";

if (!("structuredClone" in globalThis)) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  globalThis.structuredClone = structuredClone as any;
}

// Setup Buffer global for Solana Web3.js compatibility
if (!("Buffer" in globalThis)) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  globalThis.Buffer = Buffer as any;
}

install();