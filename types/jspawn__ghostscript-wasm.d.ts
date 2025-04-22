declare module '@jspawn/ghostscript-wasm' {
  export default function GS(): Promise<{
    call: (args: string[]) => Promise<void>;
  }>;
}
