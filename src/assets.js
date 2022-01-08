import { resolve, dirname, join } from 'path';
import { sync as glob } from 'glob';
import { readFileSync } from 'fs';

export class NiftyAssets {
  constructor({ assetDir }) {
    this.meta = glob(resolve(join(assetDir, '/**/*.json'))).reduce((m, v) => {
      const dir = dirname(v);
      const content = JSON.parse(readFileSync(v, 'utf-8'));
      if (!content.type) {
        throw new Error(v + ' missing type:');
      }
      if (!content.name) {
        throw new Error(v + ' missing name:');
      }
      content.dir = dir;
      m[content.type] = m[content.type] || {};
      m[content.type][content.name] = content;

      content.paths = {};
      if (content.image) content.paths.image = join(content.dir, content.image);
      if (content.fill) content.paths.fill = join(content.dir, content.fill);
      if (content.stroke)
        content.paths.stroke = join(content.dir, content.stroke);
      if (content.shadow)
        content.paths.shadow = join(content.dir, content.shadow);
      if (content.back) {
        content.paths.back = {};
        if (content.back.fill)
          content.paths.back.fill = join(content.dir, content.back.fill);
        if (content.back.stroke)
          content.paths.back.stroke = join(content.dir, content.back.stroke);
      }
      return m;
    }, {});
  }
}
