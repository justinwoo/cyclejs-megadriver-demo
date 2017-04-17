import xs, { Stream } from 'xstream';
import { div, label, input, hr, h1, p, makeDOMDriver, VNode } from '@cycle/dom';
import { DOMSource } from '@cycle/dom/xstream-typings';

function run<A, B>(main : (source : A) => Stream<B>, driver : (sink : Stream<B>) => A) : any {
  // makeSubject
  const stream = xs.create<B>();

  const observer = {
    next : (x) => { stream.shamefullySendNext(x); },
    error : (err) => { stream.shamefullySendError(err); },
    complete : () => { stream.shamefullySendComplete(); },
  };

  // feed subject to driver at first
  const source = driver(stream);

  // streamSubscribe
  main(source).addListener(observer);
  return () => stream.removeListener(observer);
}

// interface Command {}
// class DOMCommand implements Command {
//   constructor(readonly node : VNode) {}
// }
// class ConsoleCommand implements Command {
//   constructor(readonly text : string) {}
// }
type Command
  = DOMCommand
  | ConsoleCommand
  ;

type DOMCommand = {
  type : 'DOMCommand',
  payload : {
    node : VNode
  }
};

type ConsoleCommand = {
  type : 'ConsoleCommand',
  payload : {
    text : string
  }
};

interface Source {
  dom : DOMSource;
  timer : Stream<number>;
};

function createDOMCommand(node : VNode) : Command {
  return {
    type : 'DOMCommand',
    payload : {
      node
    }
  };
};

function createConsoleCommand(text : string) : Command {
  return {
    type : 'ConsoleCommand',
    payload : {
      text
    }
  };
};

function main(source : Source) : Stream<Command> {
  const inputs = source.dom.select('.field').events('input')
    .map(ev => (ev.target as HTMLInputElement).value)
    .startWith('');
  const counts = source.timer;

  const vnodes = xs.combine(inputs, counts)
    .map(([name, count]) =>
      div('#root', [
        h1(name ? `Hello, ${name}!`  : 'Hello! Please enter your name...'),
        label('Name:'),
        input('.field', { attrs : { type : 'text', value : name } }),
        hr(),
        p(`the count is now ${count}`)
      ]))
    // .map(vnode => new DOMCommand(vnode));
    .map(vnode => createDOMCommand(vnode));
  const strings = xs.combine(inputs, counts)
    .map(([name, count]) => `${name} : ${count}`)
    // .map(string => new ConsoleCommand(string));
    .map(string => createConsoleCommand(string));

  return xs.merge(vnodes, strings);
}

function driver(sink : Stream<Command>) : Source {
  sink.map(cmd =>
    // cmd instanceof ConsoleCommand
    //   ? xs.of(cmd.text)
    //    : xs.empty()
    cmd.type === 'ConsoleCommand'
      ? xs.of(cmd.payload.text)
       : xs.empty()
  ).flatten().addListener({
    next : x => console.log(x),
    error : console.log,
    complete : console.log
  });

  const domDriver = makeDOMDriver('#app');
  const dom : any = domDriver(sink.map(cmd =>
    // cmd instanceof DOMCommand
    //   ? xs.of(cmd.node)
    //    : xs.empty()
    cmd.type === 'DOMCommand'
      // ? xs.of(cmd.node)
      ? xs.of(cmd.payload.node)
       : xs.empty()
  ).flatten());

  return {
    dom,
    timer : xs.periodic(1000)
  };
};

run(main, driver);
