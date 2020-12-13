const { share, createSubject, map, scan, take, skip } = require("pstreamjs");
const { mockTimeSource } = require("pstreamjs/cyclebridge");
const dists = require("pstreamjs/dists");
const { evalT } = require("ltljs");

const Program = require("../src/Program");

test("always not empty string", (done) => {
  const Time = mockTimeSource();
  const n = 1000;
  const period = 100;
  const timer = take(n, Time.periodic(100));

  const HumanSimulator = (sinks) => {
    sinks.SpeechSynthesisAction.goal((g) => null);
    const state$ = scan(
      (prev, input) => {
        const now = Time._time();
        if (prev.label === "engaged" && prev.stamp + prev.duration < now) {
          return {
            stamp: now,
            label: "disengaged",
            duration: dists.uniform(500, 1000),
          };
        } else if (
          prev.label === "disengaged" &&
          prev.stamp + prev.duration < now
        ) {
          return {
            stamp: now,
            label: "engaged",
            duration: 1000,
          };
        } else {
          return prev;
        }
      },
      {
        label: "engaged",
        stamp: Time._time(),
        duration: 1000,
      },
      timer
    );
    const poses$ = skip(
      1,
      map((state) => {
        return state.label === "engaged" ? [{}] : [];
      }, state$)
    );
    return {
      Time: Time,
      PoseDetection: { poses: poses$ },
    };
  };

  const subjects = {
    SpeechSynthesisAction: {
      goal: createSubject(),
    },
  };
  const humanInputProxy = {
    SpeechSynthesisAction: {
      goal: share(subjects.SpeechSynthesisAction.goal.stream),
    },
  };
  const progInput = HumanSimulator(humanInputProxy);
  const progOutput = Program(progInput);
  progOutput.SpeechSynthesisAction.goal(
    subjects.SpeechSynthesisAction.goal.next
  );

  let spec = {
    type: "always",
    value: {
      type: "not",
      value: "emptyString",
    },
  };
  progOutput.SpeechSynthesisAction.goal((g) => {
    spec = evalT(spec, () => g !== "");
    expect(!!spec).toBeTruthy;
  });

  Time.run(done, n * period);
});
