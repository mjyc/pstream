const xs = require("xstream").default;
const { toXStream, fromXStream } = require("../cyclebridge");

test("toXStream", async done => {
  const stream = cb => {
    cb(1);
    cb(2);
    cb(3);
    cb(4);
    return () => {};
  };
  const output = [];
  const expected = [1, 2, 3, 4];
  toXStream(stream).addListener({
    next: val => {
      output.push(val);
      if (output.length === 4) {
        expect(output).toEqual(expected);
        done();
      }
    }
  });
});

test("fromXStream", () => {
  const in$ = xs.create();
  const stream = fromXStream(in$);
  const output = [];
  const unsubscribe = stream(val => {
    output.push(val);
  });
  const expected = [1, 2, 3, 4];
  in$.shamefullySendNext(1);
  in$.shamefullySendNext(2);
  in$.shamefullySendNext(3);
  in$.shamefullySendNext(4);
  expect(output).toEqual(expected);
  unsubscribe();
  in$.shamefullySendNext(5);
  in$.shamefullySendNext(6);
  expect(output).toEqual(expected);
});
