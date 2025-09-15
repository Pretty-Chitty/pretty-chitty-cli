import { SparkChit } from "pretty-chitty";
import { MyPlayer } from "./MyPlayer";

export class CounterChit extends SparkChit {
  public player: MyPlayer | undefined;

  public get icon() {
    return this.player;
  }
}
