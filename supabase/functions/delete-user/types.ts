// @deno-types="https://esm.sh/@types/node@18/index.d.ts"

declare global {
  namespace Deno {
    export const env: {
      get(key: string): string | undefined;
    };
  }
}

export {};
