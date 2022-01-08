import { prompt as inquire } from 'inquirerer';

export class TraitPrompter {
  constructor({ argv, assets }) {
    this.argv = argv;
    this.assets = assets;
    this.questions = assets.questions;
    this.singleOpts = assets.singleOpts;
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
