/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

declare module '*.module.css' {
  const classes: Record<string, string>;
  export default classes;
}

declare module 'qrcode' {
  const qrcode: any;
  export default qrcode;
  export const toCanvas: any;
  export const toDataURL: any;
  export const toString: any;
}

