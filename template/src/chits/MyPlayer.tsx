import { PlayerChit, SparkChit, ChildOutlet } from "pretty-chitty";
import { CounterChit } from "./CounterChit";

export class MyPlayer extends PlayerChit {
  @ChildOutlet public counter = new CounterChit().set((c) => (c.player = this));

  override getSparks(): SparkChit[] {
    return [this.counter];
  }
}
