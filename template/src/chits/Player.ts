import { PlayerChit, SparkChit, ChildOutlet } from "@pretty-chitty/core";
import { CounterChit } from "./CounterChit";

export class Player extends PlayerChit {
  @ChildOutlet public counter = new CounterChit().set((c) => c.bindToPlayer(this));

  override getSparks(): SparkChit[] {
    return [this.counter];
  }
}
