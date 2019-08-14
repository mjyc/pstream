const dists = require("webppl/src/dists");
const util = require("webppl/src/util");

module.exports = dists.metadata().reduce((prev, { name, params }) => {
  prev[name.charAt(0).toLowerCase() + name.slice(1)] = (...args) => {
    const p = util.isObject(args[0])
      ? args[0]
      : params
          .map(param => param.name)
          .reduce(
            (prev, name, i) => ({
              ...prev,
              [name]: args[i]
            }),
            {}
          );
    const dist = new dists[name](p);
    return dist.sample();
  };
  return prev;
}, {});
