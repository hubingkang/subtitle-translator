declare module 'subsrt' {
  interface SubtitleEntry {
    start: number;
    end: number;
    text: string;
  }

  interface BuildOptions {
    format?: string;
  }

  export function parse(content: string): SubtitleEntry[];
  export function build(entries: SubtitleEntry[], options?: BuildOptions): string;
}