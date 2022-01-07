import { parse, resolve, basename, dirname, join } from 'path';
import * as crypto from 'crypto';
import stringify from 'safe-stable-stringify';
import { sync as mkdirp } from 'mkdirp';
import { writeFileSync } from 'fs';
import { ScriptMagick } from 'scriptmagick';

export class NiftyMagick {
  constructor({ traits, meta, outDir }) {
    this.meta = meta;
    this.traits = traits;
    this.hash = crypto
      .createHash('sha256')
      .update(stringify(traits))
      .digest('hex');
    if (!outDir) {
      this.outDir = join(process.cwd(), 'out', this.hash);
    } else {
      this.outDir = outDir;
    }
    this.scriptMagick = new ScriptMagick({ outDir: this.outDir });
    this.json = parse(this.hash).name + '.json';
    this.save = parse(this.hash).name + '.png';
    this.fileName = basename(this.save);
    this.outFile = resolve(join(this.outDir, this.fileName));
    this.outJson = resolve(join(this.outDir, this.json));
    this.layers = [];
    this.out = {};
    mkdirp(dirname(this.outFile));
  }
  push(pth) {
    this.layers.push(pth);
  }
  flatten() {
    this.scriptMagick.composeImages({
      layers: this.layers,
      outFile: this.outFile
    });
  }
  cleanup() {
    this.scriptMagick.cleanup();
  }
  writeJson() {
    writeFileSync(this.outJson, JSON.stringify(this.traits, null, 2));
  }
}
