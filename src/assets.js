import { resolve, dirname, join } from 'path';
import { sync as glob } from 'glob';
import { readFileSync } from 'fs';
import inflection from 'inflection';
import { getQuestionOrder } from './utils';

const getFiles = (dir) => {
  if (!dir) return [];
  return glob(resolve(join(dir, '/**/*.json')));
};

export class NiftyAssets {
  constructor({ assetDir, schemaDir, additionalQuestions }) {
    this.content = [];
    this.assetFiles = getFiles(assetDir);
    this.schemaFiles = getFiles(schemaDir);
    this.additionalQuestions = additionalQuestions || [];
    this.processAssets();
    this.processSchemata();
    this.processConfirmations();
    this.processQuestions();
    this.processOptions();
    this.parseDeps();
  }
  processSchemata() {
    const objs = this.assetFiles.reduce((m, v) => {
      const content = JSON.parse(readFileSync(v, 'utf-8'));
      if (!content.type) {
        throw new Error(v + ' missing type:');
      }
      if (!content.name) {
        throw new Error(v + ' missing name:');
      }
      m[content.type] = content;
      return m;
    }, {});
    this.schemas = Object.values(objs);
    this.schemaHash = objs;
  }
  processAssets() {
    this.meta = this.assetFiles.reduce((m, v) => {
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
      this.content.push(content);
      return m;
    }, {});
  }
  processConfirmations() {
    const confirms = this.content.reduce((m, v) => {
      const qName = inflection.camelize('has_' + v.type, true);
      const schema = this.schemas.find((s) => s.type === v.type);
      if ((schema && schema.ignore) || (schema && schema.required)) return m;
      m[qName] = {
        type: 'confirm',
        name: qName,
        message: qName,
        requiredBy: [v.type]
      };
      return m;
    }, {});
    this.confirmations = Object.values(confirms);
  }
  processOptions() {
    const singleOpts = {};
    const opts = Object.keys(this.meta).reduce((m, key) => {
      const keys = Object.keys(this.meta[key]);
      if (keys.length < 2) {
        singleOpts[key] = this.meta[key][keys[0]].name;
      }
      // ask user for which item of the possible types...
      return [
        ...m,
        {
          type: 'list',
          name: key,
          message: key,
          choices: keys
        }
      ];
    }, []);
    this.choices = opts;
    this.singleOpts = singleOpts;
    return opts;
  }
  processQuestions() {
    // update colors to be lists with choosing a bg color
    this.importedQuestions = this.additionalQuestions.map((q) => {
      switch (q.type) {
        case 'color':
          if (!q.meta) {
            throw new Error('colors require meta field');
          }
          if (!this.meta[q.meta]) {
            throw new Error('colors require meta field that exists');
          }
          return {
            name: q.name,
            message: q.name,
            ...q,
            type: 'list',
            choices: Object.keys(this.meta[q.meta])
          };
        default:
          return {
            name: q.name,
            message: q.name,
            ...q
          };
      }
    });
  }
  parseDeps() {
    const all = [
      ...this.choices,
      ...this.confirmations,
      ...this.importedQuestions
    ];
    const questionHash = all.reduce((m, v) => {
      m[v.name] = v;
      return m;
    }, {});
    this.questions = all.map((x) => {
      if (x.requiredBy) {
        /*
          {
            "type": "confirm",
            "name": "hasHat",
            "requiredBy": ["hat"]
          }
        */
        x.requiredBy.forEach((r) => {
          const obj = questionHash[r];
          obj.requires = obj.requires || [];
          if (!obj.requires.includes(x.name)) {
            obj.requires.push(x.name);
          }
          questionHash[r] = obj;
        });
      }
      if (x.excludedBy) {
        /*
          {
            "type": "confirm",
            "name": "otherhat",
            "excludedBy": ["hat"]
          }
        */
        x.excludedBy.forEach((r) => {
          const obj = questionHash[r];
          obj.excludes = obj.excludes || [];
          if (!obj.excludes.includes(x.name)) {
            obj.excludes.push(x.name);
          }
          questionHash[r] = obj;
        });
      }
    });
    const chk = () => true;
    const log = (t) => {
      // console.log(t);
    };
    const __questions = Object.values(questionHash).map((q) => {
      if (q.willExclude) {
        // write that check() to include
        Object.keys(q.willExclude).forEach((key) => {
          const val = q.willExclude[key];
          const that = questionHash[key];

          // update requires
          that.requires = that.requires || [];
          if (!that.requires.includes(q.name)) {
            that.requires.push(q.name);
          }

          log(`${q.name} if val:${val} excludes ${key}`);
          const check = !that.check ? chk : that.check;
          that.check = (traits) => {
            return traits[q.name] == val && check();
          };
        });
      }
      if (q.excludes && q.excludes.length) {
        // write that check() to include
        q.excludes.forEach((t) => {
          const that = questionHash[t];

          // update requires
          that.requires = that.requires || [];
          if (!that.requires.includes(q.name)) {
            that.requires.push(q.name);
          }
          if (
            q.type === 'confirm' &&
            // if it's not mentioned in exclusions
            (!q.exclusions || !q.exclusions.hasOwnProperty(t))
          ) {
            log(`${q.name} if true excludes ${t}`);
            const check = !that.check ? chk : that.check;
            that.check = (traits) => {
              return traits[q.name] && check();
            };
          }
        });
      }
      if (q.requires && q.requires.length) {
        // write this check() to include
        q.requires.forEach((t) => {
          const that = questionHash[t];
          if (
            that.type === 'confirm' &&
            // if it's not mentioned in includedWhen
            (!q.includedWhen || !q.includedWhen.hasOwnProperty(t))
          ) {
            log(`${q.name} requires ${t} is true`);
            const check = !q.check ? chk : q.check;
            q.check = (traits) => {
              return traits[q.name] && check();
            };
          }
        });
      }
      if (q.includedWhen) {
        // write this check() to include
        Object.keys(q.includedWhen).forEach((key) => {
          const val = q.includedWhen[key];
          const that = questionHash[key];

          // update requires
          q.requires = q.requires || [];
          if (!q.requires.includes(key)) {
            q.requires.push(key);
          }

          log(`${q.name} includedWhen ${key} is val:${val}`);
          const check = !q.check ? chk : q.check;
          q.check = (traits) => {
            return traits[q.name] == val && check();
          };
        });
      }
      if (q.excludedWhen) {
        // write this check() to include
        Object.keys(q.excludedWhen).forEach((key) => {
          const val = q.excludedWhen[key];
          const that = questionHash[key];

          // update requires
          q.requires = q.requires || [];
          if (!q.requires.includes(key)) {
            q.requires.push(key);
          }

          log(`${q.name} excludedWhen ${key} is val:${val}`);
          const check = !q.check ? chk : q.check;
          q.check = (traits) => {
            return traits[q.name] != val && check();
          };
        });
      }
      return q;
    });

    this.questionOrder = getQuestionOrder(__questions);
    this.questions = getQuestionOrder(__questions).map((name) => {
      return __questions.find((a) => a.name === name);
    });
  }
}
