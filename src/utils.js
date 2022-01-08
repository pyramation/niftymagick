// https://www.electricmonk.nl/log/2008/08/07/dependency-resolving-algorithm/
export const getDeps = (deps) => {
  function depResolver(modulename, resolved, unresolved) {
    unresolved.push(modulename);
    if (!deps[modulename]) {
      throw new Error('no module exists: ' + modulename);
    }
    const edges = deps[modulename].requires || [];
    for (let i = 0; i < edges.length; i++) {
      const dep = edges[i];
      if (!resolved.includes(dep)) {
        if (unresolved.includes(dep)) {
          throw new Error(`Circular reference detected ${modulename}, ${dep}`);
        }
        depResolver(dep, resolved, unresolved);
      }
    }
    resolved.push(modulename);
    const index = unresolved.indexOf(modulename);
    unresolved.splice(index);
  }

  return (name) => {
    const resolved = [];
    const unresolved = [];
    depResolver(name, resolved, unresolved);
    return resolved;
  };
};

export const convertQuestionsToDeps = (questions) => {
  return questions.reduce((m, v) => {
    m[v.name] = v;
    return m;
  }, {});
};

export const getQuestionOrder = (questions) => {
  const deps = convertQuestionsToDeps(questions);

  // require everything and then get the order...
  const getDependencies = getDeps({
    ...deps,
    root: {
      name: 'root',
      requires: Object.keys(deps)
    }
  });
  const order = getDependencies('root');
  order.pop();
  return order;
};
