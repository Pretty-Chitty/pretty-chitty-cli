#!/usr/bin/env -S npx tsx --experimental-import-meta-resolve

// Suppress punycode deprecation warning from dependencies
process.removeAllListeners('warning');
process.on('warning', (warning) => {
  if (warning.name === 'DeprecationWarning' && warning.message.includes('punycode')) {
    return;
  }
  console.warn(warning);
});

import { cli } from "../src/index.ts";

await cli();

/*
./node_modules/pretty-chitty-cli/bin/run.js watch
*/
