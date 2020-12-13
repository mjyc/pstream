const { runTabletRobotFaceApp } = require("@cycle-robot-drivers/run");
const { fromXStream, toXStream } = require("pstreamjs/cyclebridge");

const Program = require("./Program");

runTabletRobotFaceProgram((sources) => {
  const sinks = Program({
    Time: {
      _time: Date.now,
    },
    PoseDetection: {
      poses: fromXStream(sources.PoseDetection.events("poses")),
    },
  });
  return {
    SpeechSynthesisAction: {
      goal: toXStream(sinks.SpeechSynthesisAction.goal),
    },
  };
});
