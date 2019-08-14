const { smap, sscan, stake, sskip } = require("pfrp/streams");
const { mockTimeSource } = require("pfrp/cyclebridge");
const dists = require("pfrp/dists");

const makeNoseAngleSimulator = function({
  Time = mockTimeSource(),
  n = 600, // 1min
  period = 100 // 10hz
}) {
  const timer = stake(n, Time.periodic(100));

  const Simulator = sources => {
    const stateStamped$ = sscan(
      (prev, input) => {
        const now = Time._time();
        if (prev.label === "engaged" && prev.stamp + prev.duration < now) {
          return {
            stamp: now,
            label: "disengaged",
            duration: 1000
          };
        } else if (
          prev.label === "disengaged" &&
          prev.stamp + prev.duration < now
        ) {
          return {
            stamp: now,
            label: "engaged",
            duration: 1000
          };
        } else {
          return prev;
        }
      },
      {
        label: "disengaged",
        stamp: Time._time(),
        duration: 1000
      },
      timer
    );

    const noseAngleStamped$ = sskip(
      1,
      smap(
        state =>
          state.label === "engaged"
            ? {
                stamp: Time._time(),
                theta: dists.gaussian(0, 0.1)
              }
            : {
                stamp: Time._time(),
                theta: dists.gaussian(1.0, 0.01)
              },
        stateStamped$
      )
    );

    return {
      Time: Time,
      stateStamped: stateStamped$,
      noseAngleStamped: noseAngleStamped$
    };
  };

  return Simulator;
};

module.exports = {
  makeNoseAngleSimulator: makeNoseAngleSimulator
};
