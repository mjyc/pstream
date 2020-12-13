const { share, createSubject } = require("pstreamjs");
const { mockTimeSource } = require("pstreamjs/cyclebridge");
const { makeNoseAngleSimulator } = require("./simulators/engagement");
const makeEngagementDetector = require("./programs/makeEngagementDetector.wppl");

const Time = mockTimeSource();
const n = 300;
const period = 100;
const HumanSimulator = makeNoseAngleSimulator({
  Time: Time,
  n: n,
  period: period,
});
const Program = makeEngagementDetector();

const progInput = HumanSimulator();
const progOutput = Program(progInput);

let recordedHumanState;
Time.record(progInput.stateStamped)(
  (recorded) => (recordedHumanState = recorded)
);

let recordedDetectionOutput;
Time.record(progOutput)((recorded) => (recordedDetectionOutput = recorded));

Time.run(() => {
  console.log(recordedHumanState);
}, n * period);
