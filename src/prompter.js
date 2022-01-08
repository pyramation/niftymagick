import { prompt as inquire } from 'inquirerer';
import { NiftyAssets } from './assets';

export class TraitPrompter {
  constructor({ argv, assetDir, schemaDir, additionalQuestions }) {
    this.argv = argv;

    // assets
    this.assets = new NiftyAssets({
      assetDir,
      schemaDir,
      additionalQuestions
    });
    this.questions = this.assets.questions;
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
