# cycle.js megadriver + sink ADT approximation demo

In Cycle.js, a main function is supposed to always return a sink for each driver that you register, being a Stream of some value. This adds a lot of pain since this is pretty dynamic and hard to type.

But what if we take a step back and think about how to mash everything together?

By merging all of the sinks into a single sink, we can provide all the data we need into one sink, and by effectively filtering out those sinks using higher order streams, we can safely extract the values we care about and feed them to the drivers as needed.

How is this most easily achieved? ADTs!

By matching on the constructor that you're interested in, we can filter out the other constructors you don't want per source. I demonstrated this [here](https://github.com/justinwoo/purescript-cycle-adt-etch-sketch) in Purescript, but we can approximate this well enough in Javascript by using plain old ES6 classes and Typescript Interface:

```typescript
interface Command {}
class DOMCommand implements Command {
  constructor(readonly node: VNode) {}
}
class ConsoleCommand implements Command {
  constructor(readonly text: string) {}
}

function driver(sink: Stream<Command>): Source {
  sink.map(cmd =>
    cmd instanceof ConsoleCommand
      ? xs.of(cmd.text)
      : xs.empty()
  ).flatten().addListener({
    next: x => console.log(x),
    error: console.log,
    complete: console.log
  });
  // ...
```

By doing this, we can have a run function that is now defined as
simply:

```typescript
function run<A, B>(main: (source: A) => Stream<B>, driver: (sink: Stream<B>) => A)
```

I hope this comes in handy for others as it will for me.
