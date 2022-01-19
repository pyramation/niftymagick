import { NiftyAssets, getQuestionsFromMeta } from '../src';
// assets
const assets = new NiftyAssets({
  assetDir: __dirname + '/../__fixtures__/assets',
  schemaDir: __dirname + '/../__fixtures__/schemas',
  additionalQuestions: [
    {
      type: 'color',
      name: 'hairColor',
      meta: 'pattern',
      requires: ['hasHair'],
      includedWhen: {
        hasHair: true
      }
    },
    {
      type: 'confirm',
      name: 'hasHairPattern',
      requires: ['hasHair'],
      excludes: ['hairColor'],
      willExclude: {
        hairColor: true
      }
    },
    {
      type: 'confirm',
      name: 'anotherThing',
      excludedWhen: {
        hasHair: false,
        hasHairPattern: true
      }
    },
    {
      type: 'color',
      name: 'hairPattern',
      meta: 'pattern',
      requires: ['hasHairPattern'],
      includedWhen: {
        hasHairPattern: true
      }
    }
  ]
});
it('confirmations', async () => {
  expect(JSON.stringify(assets.confirmations, null, 2)).toMatchSnapshot();
});
it('choices', async () => {
  expect(JSON.stringify(assets.choices, null, 2)).toMatchSnapshot();
});
it('singleOpts', async () => {
  expect(JSON.stringify(assets.singleOpts, null, 2)).toMatchSnapshot();
});
it('all', async () => {
  expect(JSON.stringify(assets.questions, null, 2)).toMatchSnapshot();
});
it('schema', async () => {
  expect(JSON.stringify(assets.schemas, null, 2)).toMatchSnapshot();
});
