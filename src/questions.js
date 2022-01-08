import inflection from 'inflection';

export const getQuestionsFromMeta = (schemas = [], meta) => {
  const exploded = Object.values(meta).reduce((m, v) => {
    return [...m, ...Object.values(v)];
  }, []);
  const questions = exploded.reduce((m, v) => {
    const qName = inflection.camelize('has_' + v.type, true);
    const schema = schemas.find((s) => s.type === v.type);
    if (schema && schema.ignore) return m;
    m[qName] = {
      type: 'confirm',
      name: qName,
      message: qName,
      requiredBy: [v.type]
    };
    return m;
  }, {});
  return questions;
};
