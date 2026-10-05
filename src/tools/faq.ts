import type { FaqItem } from './types.ts';

/** FAQ entries that apply to every tool. */
export const PRIVACY_FAQ: FaqItem = {
  q: 'Are my files uploaded anywhere?',
  a: 'No. neverupload has no server that receives files. Everything happens inside your browser on your own device, and the files never leave it. You can even disconnect from the internet and the tool keeps working.',
};

export const OFFLINE_FAQ: FaqItem = {
  q: 'Does it work offline?',
  a: 'Yes. After your first visit the app is cached by your browser, so you can use it without a connection. You can also install it as an app from your browser menu.',
};
