const xs = require("xstream").default;

function toXStream(stream) {
  let unsubscribe = () => {};

  return xs.create({
    start: listener => {
      unsubscribe = stream(ev => listener.next(ev));
    },

    stop: () => {
      unsubscribe();
    }
  });
}

const { share } = require("./pstream");

function fromXStream(in$) {
  return share(cb => {
    const listener = { next: val => cb(val) };
    in$.addListener(listener);
    return () => {
      in$.removeListener(listener);
    };
  });
}

const cycleTime = require("@cycle/time");

// https://github.com/cyclejs/cyclejs/tree/master/time#mocktimesourceinterval
// https://github.com/cyclejs/cyclejs/blob/master/time/src/time-source.ts#L18-L27
function mockTimeSource(...args) {
  const Time = cycleTime.mockTimeSource(...args);
  return {
    diagram: (diagramString, values) =>
      fromXStream(Time.diagram(diagramString, values)),
    record: stream => fromXStream(Time.record(toXStream(stream))),
    assertEqual: (actual, expected, comparator) =>
      Time.assertEqual(toXStream(actual), toXStream(expected), comparator),
    periodic: period => fromXStream(Time.periodic(period)),
    run: Time.run,
    _time: Time._time
  };
}

module.exports = {
  toXStream: toXStream,
  fromXStream: fromXStream,
  mockTimeSource: mockTimeSource
};
