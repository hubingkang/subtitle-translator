declare module 'langs' {
  interface LangItem {
    '1': string;
    '2B': string;
    '2T': string;
    '3': string;
    name: string;
    local: string;
  }

  interface Langs {
    all(): LangItem[];
    where(key: string, value: string): LangItem | undefined;
    has(key: string, value: string): boolean;
  }

  const langs: Langs;
  export = langs;
}