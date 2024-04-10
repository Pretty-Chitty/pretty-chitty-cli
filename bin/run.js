#!/usr/bin/env -S npx tsx --experimental-import-meta-resolve

import { cli } from "../src/index.ts";

await cli();
