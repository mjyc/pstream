const { map, reduce } = require("./header.wppl");

var smap = function(fn, stream) {
  return map(
    ({ stamp, value }) => ({
      stamp: stamp,
      value: fn(value)
    }),
    stream
  );
};

var smapTo = function(x, stream) {
  return map(
    ({ stamp, value }) => ({
      stamp: stamp,
      value: x
    }),
    stream
  );
};

var sscan = function(reducer, seed, stream) {
  return reduce(
    ({ stamp, value }, prev) => {
      return prev.concat({
        stamp: stamp,
        value: reducer(prev[prev.length - 1].value, value)
      });
    },
    [{ stamp: 0, value: seed }],
    stream.reverse()
  );
};

var sstartWith = function(x, stream) {
  return [{ stamp: 0, value: x }].concat(stream);
};

var sdistinctUntilChanged = function(compare, stream) {
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

var sdebounce = function(fn, stream) {
  if (stream.length < 2) {
    return stream;
  } else {
    return reduce(
      ({ stamp, value }, prev) =>
        stamp - prev.stamp > fn(value)
          ? prev.concat({ stamp: stamp, value: value })
          : prev,
      [stream[0]],
      stream.slice(1).reverse()
    );
  }
};

module.exports = {
  smap,
  sscan,
  sstartWith,
  sdistinctUntilChanged,
  sdebounce
};
