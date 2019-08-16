//
// Event Streams
//
// * follows basic-streams protocol https://github.com/rpominov/basic-streams#protocol
// * has basic-streams limitations https://github.com/rpominov/basic-streams#limitations-and-alternatives
//

// https://github.com/rpominov/basic-streams/blob/master/packages/map/index.ts
function map(fn, stream) {
  return cb => stream(payload => cb(fn(payload)));
}

function mapTo(value, stream) {
  return cb => stream(() => cb(value));
}

// https://github.com/rpominov/basic-streams/blob/master/packages/filter/index.ts
function filter(predicate, stream) {
  return cb =>
    stream(payload => {
      if (predicate(payload)) cb(payload);
    });
}

// https://github.com/rpominov/basic-streams/blob/master/packages/scan/index.ts
// modified to "share" the return "shared" stream
function scan(reducer, seed, stream) {
  return share(cb => {
    let acc = seed;
    cb(acc);
    return stream(next => {
      acc = reducer(acc, next);
      cb(acc);
    });
  });
}

// https://github.com/rpominov/basic-streams/blob/master/packages/chain/index.ts
// modified and renamed to "merge" to be consistent with rxjs
function merge(...streams) {
  return cb => {
    const disposers = [];
    streams.forEach(stream => disposers.push(stream(payload => cb(payload))));
    return () => disposers.forEach(fn => fn());
  };
}

function combineLatest(...streams) {
  return cb => {
    const vals = {};
    const disposers = [];
    streams.forEach((stream, i) => {
      return disposers.push(
        stream(payload => {
          vals[i] = payload;
          if (Object.keys(vals).length === streams.length) {
            cb(Object.values(vals));
          }
        })
      );
    });
    return () => disposers.forEach(fn => fn());
  };
}

// https://github.com/rpominov/basic-streams/blob/master/packages/prepend/index.ts
// renamed to "prepend" to be consistent with rxjs
function startWith(x, stream) {
  return cb => {
    cb(x);
    return stream(cb);
  };
}

// https://github.com/rpominov/basic-streams/blob/master/packages/skip-duplicates/index.ts
// renamed to "distinctUntilChanged" to be consistent with rxjs
function distinctUntilChanged(comp, stream) {
  return cb => {
    let latest = null;
    return stream(x => {
      if (!latest || !comp(latest.value, x)) {
        latest = { value: x };
        cb(x);
      }
    });
  };
}

function pairwise(stream) {
  let isFirst = true;
  return cb =>
    stream(payload => {
      if (isFirst) {
        prev = payload;
        isFirst = false;
      } else {
        cb([prev, payload]);
        prev = payload;
      }
    });
}

// https://github.com/rpominov/basic-streams/blob/master/packages/take/index.ts
function take(n, stream) {
  return cb => {
    let state = { cb, count: 0 };

    function stop() {
      if (state !== null) {
        const { disposer } = state;
        state = null;
        if (disposer) {
          disposer();
        }
      }
    }

    function onEvent(x) {
      if (state !== null) {
        const { cb } = state;
        cb(x);
        state.count++;
        if (state.count >= n) {
          stop();
        }
      }
    }

    if (n === 0) {
      state = null;
    }

    const disposer = stream(onEvent);

    if (state === null) {
      disposer();
    } else {
      state.disposer = disposer;
    }

    return stop;
  };
}

// https://github.com/rpominov/basic-streams/blob/master/packages/skip/index.ts
function skip(n, stream) {
  return cb => {
    let count = 0;
    return stream(x => {
      count++;
      if (count > n) {
        cb(x);
      }
    });
  };
}

function debounce(fn, stream) {
  return cb => {
    let timeout;
    return stream(payload => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => cb(payload), fn(payload));
    });
  };
}

//
// Extra - do not have matching functions in wppl/pstream.js
//

// https://github.com/rpominov/basic-streams/blob/master/packages/multicast/index.ts
// renamed to "share" to be consistent with rxjs
function share(stream) {
  if (stream.name === "_hotStream") {
    return () => {};
  }

  const callbacks = [];
  let activeCallbacks = 0;
  let sourceSubscription = null;
  let numCallbackCalled = 0;
  let initialValue;

  function startSource() {
    const currentSubscription = {};
    sourceSubscription = currentSubscription;
    const disposer = stream(callCallbacks);
    if (sourceSubscription === currentSubscription) {
      sourceSubscription.disposer = disposer;
    } else {
      disposer();
    }
  }

  function stopSource() {
    if (sourceSubscription !== null) {
      const { disposer } = sourceSubscription;
      sourceSubscription = null;
      if (disposer) {
        disposer();
      }
    }
  }

  function callCallbacks(x) {
    if (numCallbackCalled === 0) initialValue = x;
    numCallbackCalled += 1;
    for (let i = 0; i < callbacks.length; i++) {
      const callback = callbacks[i];
      if (callback !== null) {
        callback(x);
      }
    }
  }

  const _hotStream = cb => {
    const cbIndex = callbacks.push(cb) - 1;
    activeCallbacks++;
    if (activeCallbacks === 1) {
      startSource();
    } else if (numCallbackCalled === 1) {
      // only remembers the initial value
      cb(initialValue);
    }
    return () => {
      if (callbacks[cbIndex] !== null) {
        callbacks[cbIndex] = null;
        activeCallbacks--;
        if (activeCallbacks === 0) {
          stopSource();
        }
      }
    };
  };
  return _hotStream;
}

// https://github.com/rpominov/basic-streams/blob/master/packages/of-many/index.ts
// simplified and renamed to "fromIter" to be consistent with rxjs
function fromIter(iter) {
  return cb => {
    // https://github.com/staltz/callbag-from-iter/blob/master/index.js
    const iterator =
      typeof Symbol !== "undefined" && iter[Symbol.iterator]
        ? iter[Symbol.iterator]()
        : iter;
    let next = iterator.next();
    while (!next.done) {
      cb(next.value);
      next = iterator.next();
    }
    return () => {};
  };
}

// https://github.com/staltz/callbag-interval/blob/master/index.js
// modified to follow basic-streams protocol
function interval(period) {
  let i = 0;
  return cb => {
    const id = setInterval(() => {
      cb(i++);
    }, period);
    return () => {
      clearInterval(id);
    };
  };
}

function createSubject() {
  const subject = {
    next: null,
    stream: cb => {
      subject.next = x => cb(x);
      return () => (subject.next = null);
    }
  };
  return subject;
}

module.exports = {
  default: {
    map,
    mapTo,
    filter,
    merge,
    combineLatest,
    scan,
    startWith,
    distinctUntilChanged,
    pairwise,
    take,
    skip,
    debounce
  },
  // extra
  share,
  fromIter,
  interval,
  createSubject,
  // to avoid naming conflict in wppl
  smap: map,
  smapTo: mapTo,
  sfilter: filter,
  sscan: scan,
  smerge: merge,
  scombineLatest: combineLatest,
  sstartWith: startWith,
  sdistinctUntilChanged: distinctUntilChanged,
  spairwise: pairwise,
  stake: take,
  sskip: skip,
  sdebounce: debounce
};
