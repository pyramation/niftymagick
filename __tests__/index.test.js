import { NiftyAssets, getQuestionsFromMeta } from '../src';
it('getQuestionsFromMeta', async () => {
  // assets
  const assets = new NiftyAssets({
    assetDir: __dirname + '/../__fixtures__/'
  });
  const qs = getQuestionsFromMeta(
    [
      {
        type: 'pattern',
        ignore: true
      }
    ],
    assets.meta
  );
  console.log(qs);
});

// const questionDemo = [
//   {
//     type: 'confirm',
//     name: 'someBooleanOption'
//   },
//   {
//     type: 'confirm',
//     name: 'anotherOption',
//     requires: ['someBooleanOption'],
//     check: (traits) => traits.someBooleanOption === true
//   }
// ];
