// Tests new or modified code only; code copied from rpominov's basic-streams
//   without modifications are not tested.
const {
  smerge,
  scombineLatest,
  spairwise,
  sdebounce,
  share,
  createSubject
} = require("../src/pstream");

// many tests are using on createSubject
describe("createSubject", () => {
  test("sets .next to the input callback fn on subscribe", () => {
    const subject = createSubject();
    expect(subject.next).toEqual(null);
    const listener = () => {};
    subject.stream(listener); // subscribe
    expect(subject.next).not.toEqual(null);
    expect(subject.next.name).not.toEqual("listener");
  });

  test("publishes events via .next(evt)", done => {
    const subject = createSubject();
    const expected = [1, 2, 3, 4];
    subject.stream(output => {
      expect(output).toEqual(expected.shift());
      if (expected.length === 0) done();
    });
    subject.next(1);
    subject.next(2);
    subject.next(3);
    subject.next(4);
  });

  test("sets .next to null on unsubscribe", () => {
    const subject = createSubject();
    const listener = () => {};
    const disposer = subject.stream(listener);
    disposer(); // unsubscribe
    expect(subject.next).toEqual(null);
  });
});

describe("merge", () => {
  test("merges", done => {
    const subject1 = createSubject();
    const subject2 = createSubject();
    let i = 0;
    const expected = [1, 2, 3, 4];
    smerge(subject1.stream, subject2.stream)(output => {
      expect(output).toEqual(expected.shift());
      if (expected.length === 0) done();
    });
    subject1.next(1);
    subject2.next(2);
    subject1.next(3);
    subject2.next(4);
  });

  test("preserves a disposer", done => {
    const subject1 = createSubject();
    const subject2 = createSubject();
    const disposer = smerge(subject1.stream, subject2.stream)(output => {
      done.fail(`Unexpected output ${JSON.stringify(output)}`);
    });
    disposer();
    expect(subject1.next).toEqual(null); // unsubscribed
    expect(subject2.next).toEqual(null); // unsubscribed
    done();
  });
});

describe("combineLatest", () => {
  test("combines", done => {
    const subject1 = createSubject();
    const subject2 = createSubject();
    let i = 0;
    const expected = [[1, 2], [3, 2], [3, 4]];
    scombineLatest(subject1.stream, subject2.stream)(output => {
      expect(output).toEqual(expected.shift());
      if (expected.length === 0) done();
    });
    subject1.next(1);
    subject2.next(2);
    subject1.next(3);
    subject2.next(4);
  });

  test("preserves a disposer", done => {
    const subject1 = createSubject();
    const subject2 = createSubject();
    const disposer = scombineLatest(subject1.stream, subject2.stream)(
      output => {
        done.fail(`Unexpected output ${JSON.stringify(output)}`);
      }
    );
    disposer();
    expect(subject1.next).toEqual(null); // unsubscribed
    expect(subject2.next).toEqual(null); // unsubscribed
    done();
  });
});

describe("pairwise", () => {
  test("pairwises", done => {
    const subject = createSubject();
    let i = 0;
    const expected = [[1, 2], [2, 3], [3, 4]];
    spairwise(subject.stream)(output => {
      expect(output).toEqual(expected.shift());
      if (expected.length === 0) done();
    });
    subject.next(1);
    subject.next(2);
    subject.next(3);
    subject.next(4);
  });

  test("preserves a disposer", done => {
    const subject = createSubject();
    const disposer = spairwise(subject.stream)(output => {
      done.fail(`Unexpected output ${JSON.stringify(output)}`);
    });
    disposer();
    expect(subject.next).toEqual(null); // unsubscribed
    done();
  });
});

// only testing the modified part
describe("share", () => {
  test("returns _hotStream", () => {
    const subject = createSubject();
    const shared = share(subject.stream);
    expect(shared.name).toBe("_hotStream");
  });
});

describe("debounce", () => {
  test("preserves a disposer", done => {
    const subject = createSubject();
    const disposer = sdebounce(() => {}, subject.stream)(output => {
      done.fail(`Unexpected output ${JSON.stringify(output)}`);
    });
    disposer();
    expect(subject.next).toEqual(null); // unsubscribed
    done();
  });

  test("debounces", done => {
    const subject = createSubject();
    const expected = [0, 1, 2, 3, 4];
    const disposer = sdebounce(i => i * 2, subject.stream)(output => {
      expect(output).toEqual(expected.shift());
    });
    setTimeout(() => subject.next(0), 0);
    setTimeout(() => subject.next(1), 10);
    setTimeout(() => subject.next(2), 20);
    setTimeout(() => subject.next(3), 30);
    setTimeout(() => subject.next(4), 40);
    setTimeout(() => subject.next(5), 50);
    setTimeout(() => subject.next(6), 60);
    setTimeout(() => subject.next(7), 70);
    setTimeout(() => subject.next(8), 80);
    setTimeout(() => subject.next(9), 90);
    setTimeout(() => {
      disposer();
      done();
    }, 100);
  });
});
