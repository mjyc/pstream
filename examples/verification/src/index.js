const { runTabletRobotFaceApp } = require("@cycle-robot-drivers/run");
const { fromXStream, toXStream } = require("pfrp/cyclebridge");

const App = require("./App");

runTabletRobotFaceApp(sources => {
  const sinks = App({
    Time: {
      _time: Date.now
    },
    PoseDetection: {
      poses: fromXStream(sources.PoseDetection.events("poses"))
    }
  });
  return {
    SpeechSynthesisAction: {
      goal: toXStream(sinks.SpeechSynthesisAction.goal)
    }
  };
});
