const {
  share,
  createSubject,
  smap,
  sscan,
  stake,
  sskip
} = require("pfrp/pstream");
const { mockTimeSource } = require("pfrp/cyclebridge");
const dists = require("pfrp/dists");
const { evalT } = require("ltljs");

const App = require("../src/App");

test("always not empty string", done => {
  const Time = mockTimeSource();
  const n = 1000;
  const period = 100;
  const timer = stake(n, Time.periodic(100));

  const HumanSimulator = sinks => {
    sinks.SpeechSynthesisAction.goal(g => null);
    const state$ = sscan(
      (prev, input) => {
        const now = Time._time();
        if (prev.label === "engaged" && prev.stamp + prev.duration < now) {
          return {
            stamp: now,
            label: "disengaged",
            duration: dists.uniform(500, 1000)
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
        label: "engaged",
        stamp: Time._time(),
        duration: 1000
      },
      timer
    );
    const poses$ = sskip(
      1,
      smap(state => {
        return state.label === "engaged" ? [{}] : [];
      }, state$)
    );
    return {
      Time: Time,
      PoseDetection: { poses: poses$ }
    };
  };

  const subjects = {
    SpeechSynthesisAction: {
      goal: createSubject()
    }
  };
  const humanInputProxy = {
    SpeechSynthesisAction: {
      goal: share(subjects.SpeechSynthesisAction.goal.stream)
    }
  };
  const appInput = HumanSimulator(humanInputProxy);
  const appOutput = App(appInput);
  appOutput.SpeechSynthesisAction.goal(
    subjects.SpeechSynthesisAction.goal.next
  );

  let spec = {
    type: "always",
    value: {
      type: "not",
      value: "emptyString"
    }
  };
  appOutput.SpeechSynthesisAction.goal(g => {
    spec = evalT(spec, () => g !== "");
    expect(!!spec).toBeTruthy;
  });

  Time.run(done, n * period);
});
