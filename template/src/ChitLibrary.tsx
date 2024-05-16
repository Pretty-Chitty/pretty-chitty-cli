import { BoxGeometry, Mesh, MeshPhongMaterial } from "three";
import { RootChit, PlayerChit, DropdownChit, SparkChit, ChildOutlet, Chit, ChitRenderSpec } from "pretty-chitty";

import { PlayerAid } from "./PlayerAids";

export * from "./PlayerAids";

export class Box extends Chit {
  public override render(spec: ChitRenderSpec): void {
    const boxGeometry = new BoxGeometry(1, 1, 1);
    const side = new MeshPhongMaterial({
      color: 0xbbbbbb,
    });

    spec.object = new Mesh(boxGeometry, [side, side, side, side, side, side]);
    spec.object.receiveShadow = true;
    spec.object.castShadow = true;
  }
}

export class CounterChit extends SparkChit {
  public player: MyPlayer | undefined;

  public get icon() {
    return this.player;
  }
}

export class MyPlayer extends PlayerChit {
  @ChildOutlet public counter = new CounterChit().set((c) => (c.player = this));

  override getSparks(): SparkChit[] {
    return [this.counter];
  }
}

export class Table extends Chit {}

export class Root extends RootChit<MyPlayer> {
  @ChildOutlet public mainBoard = new Table();
  @ChildOutlet public playerAid = new PlayerAid();

  override getDropdowns(): DropdownChit[] {
    return [this.playerAid];
  }

  override getLayout(width: number, height: number) {
    if (height > width) {
      return [
        {
          height: 2,
          contents: this.mainBoard,
        },
        { height: 1, contents: this.players.map((p) => p) },
      ];
    } else {
      return [
        {
          height: 1,
          contents: [
            {
              width: 2,
              contents: this.mainBoard,
            },
            { width: 1, contents: this.players.map((p) => p) },
          ],
        },
      ];
    }
  }
}
