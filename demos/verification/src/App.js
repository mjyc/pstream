const { smap, sfilter, sscan, sskip } = require("pfrp/pstream");

const engagedTimeout = 1000;

module.exports = sources => {
  const poses$ = sources.PoseDetection.poses;
  const numFaces$ = smap(poses => poses.length, poses$);
  const attentionState$ = sscan(
    (prev, numFaces) => {
      if (prev.state === "engaged" && numFaces === 0) {
        return {
          stamp: sources.Time._time(),
          state: "disengaged",
          elapsed: 0
        };
      } else if (prev.state === "disengaged" && numFaces === 1) {
        return {
          stamp: sources.Time._time(),
          state: "engaged",
          elapsed: 0
        };
      } else {
        return {
          ...prev,
          elapsed: sources.Time._time() - prev.stamp
        };
      }
    },
    {
      stamp: sources.Time._time(),
      state: "disengaged",
      elapsed: 0
    },
    numFaces$
  );

  const model$ = sskip(
    1,
    sscan(
      (prev, input) => {
        if (prev.state === "on") {
          if (input.state === "disengaged" && input.elapsed > engagedTimeout) {
            return {
              stamp: input.stamp,
              state: "off",
              output: "Goodbye!"
            };
          } else {
            return {
              ...prev,
              output: null
            };
          }
        } else if (prev.state === "off") {
          if (input.state === "engaged") {
            return {
              stamp: input.stamp,
              state: "on",
              output: "Hello"
            };
          } else {
            return {
              ...prev,
              output: null
            };
          }
        }
      },
      {
        stamp: sources.Time._time(),
        state: "off",
        output: null
      },
      attentionState$
    )
  );
  const output$ = sfilter(x => x !== null, smap(m => m.output, model$));

  return {
    SpeechSynthesisAction: {
      goal: output$
    }
  };
};
