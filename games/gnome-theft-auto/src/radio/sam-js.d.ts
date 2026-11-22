declare module 'sam-js' {
  export interface SamJsOptions {
    pitch?: number;
    speed?: number;
    mouth?: number;
    throat?: number;
    singmode?: boolean;
    phonetic?: boolean;
  }
  export default class SamJs {
    constructor(options?: SamJsOptions);
    buf32(text: string, phonetic?: boolean): Float32Array;
    buf8(text: string, phonetic?: boolean): Uint8Array;
  }
}
