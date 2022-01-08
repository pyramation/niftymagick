import { prompt as inquire } from 'inquirerer';
import { NiftyAssets } from './assets';
import { getQuestionOrder } from './utils';

export class TraitPrompter {
  constructor({ argv, assetDir, questions }) {
    this.argv = argv;

    // assets
    const assets = new NiftyAssets({
      assetDir
    });

    // meta (assets with paths all set)
    const meta = assets.meta;

    // update colors to be lists with choosing a bg color
    const importedQuestions = questions.map((q) => {
      switch (q.type) {
        case 'color':
          return {
            name: q.name,
            message: q.name,
            ...q,
            type: 'list',
            choices: Object.keys(meta[q.meta])
          };
        default:
          return {
            name: q.name,
            message: q.name,
            ...q
          };
      }
    });

    const singleOpts = {};
    this.singleOpts = singleOpts;
    // single possible answers need to be automatically chosen for now...
    const questions_ = Object.keys(meta).reduce((m, key) => {
      const keys = Object.keys(meta[key]);
      if (keys.length < 2) {
        singleOpts[key] = meta[key][keys[0]].name;
        return m;
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
    }, importedQuestions);

    this.questionOrder = getQuestionOrder(questions_);
    this.questions = getQuestionOrder(questions_).map((name) => {
      return questions_.find((a) => a.name === name);
    });
    this.meta = meta;
  }
  async getTraits() {
    const argv = this.argv;
    for (let i = 0; i < this.questions.length; i++) {
      if (this.questions[i].check) {
        if (this.questions[i].check(this.traits)) {
          this.traits = await inquire([this.questions[i]], {
            ...argv,
            ...this.singleOpts,
            ...this.traits
          });
        }
      } else {
        this.traits = await inquire([this.questions[i]], {
          ...argv,
          ...this.singleOpts,
          ...this.traits
        });
      }
    }
    return this.traits;
  }
  async ask(questions) {
    const argv = this.argv;
    return await inquire(questions, { ...argv, ...this.singleOpts });
  }
}
