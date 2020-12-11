const { map, filter, reduce, sort } = require("./header.wppl");

var p$map = function(fn, stream) {
  return map(
    ({ stamp, value }) => ({
      stamp: stamp,
      value: fn(value),
    }),
    stream
  );
};

var p$mapTo = function(x, stream) {
  return map(
    ({ stamp, value }) => ({
      stamp: stamp,
      value: x,
    }),
    stream
  );
};

var p$filter = function(fn, stream) {
  return filter(({ stamp, value }) => !!fn(value), stream);
};

var p$scan = function(reducer, seed, stream) {
  return reduce(
    ({ stamp, value }, prev) => {
      return prev.concat({
        stamp: stamp,
        value: reducer(prev[prev.length - 1].value, value),
      });
    },
    [{ stamp: 0, value: seed }],
    stream.slice(0).reverse()
  );
};

var p$merge = function() {
  const streams = arguments;
  return sort(
    [].concat.apply([], streams),
    (a, b) => a < b,
    (x) => x.stamp
  );
};

var p$startWith = function(x, stream) {
  return [{ stamp: 0, value: x }].concat(stream);
};

var p$distinctUntilChanged = function(compare, stream) {
  if (stream.length < 2) {
    return stream;
  } else {
    return reduce(
      ({ stamp, value }, prev) =>
        compare(prev[prev.length - 1].value, value)
          ? prev
          : prev.concat({ stamp: stamp, value: value }),
      [stream[0]],
      stream.slice(1).reverse()
    );
  }
};

var p$debounce = function(fn, stream) {
  if (stream.length < 2) {
    return stream;
  } else {
    const { candidate, arr } = reduce(
      ({ stamp, value }, { candidate, arr }) => {
        return {
          candidate: {
            stamp: stamp + fn(value),
            value: value,
          },
          arr:
            candidate === null
              ? []
              : candidate.stamp < stamp
              ? arr.concat(candidate)
              : arr,
        };
      },
      { candidate: null, arr: null },
      stream.slice(0).reverse()
    );
    return arr.concat(candidate);
  }
};

module.exports = {
  map: p$map,
  scan: p$scan,
  startWith: p$startWith,
  distinctUntilChanged: p$distinctUntilChanged,
  debounce: p$debounce,
};
