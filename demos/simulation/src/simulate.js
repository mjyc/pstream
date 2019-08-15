const { share, createSubject } = require("pstreamjs");
const { mockTimeSource } = require("pstreamjs/cyclebridge");
const { makeNoseAngleSimulator } = require("./simulators/engagement");
const makeEngagementDetector = require("./apps/makeEngagementDetector.wppl");

const Time = mockTimeSource();
const n = 300;
const period = 100;
const HumanSimulator = makeNoseAngleSimulator({
  Time: Time,
  n: n,
  period: period
});
const App = makeEngagementDetector();

const appInput = HumanSimulator();
const appOutput = App(appInput);

let recordedHumanState;
Time.record(appInput.stateStamped)(recorded => (recordedHumanState = recorded));

let recordedDetectionOutput;
Time.record(appOutput)(recorded => (recordedDetectionOutput = recorded));

Time.run(() => {
  console.log(recordedHumanState);
}, n * period);
