import { BoxGeometry, Mesh, MeshPhongMaterial } from "three";
import {
  RootChit,
  PlayerChit,
  DropdownChit,
  SparkChit,
  ChildOutlet,
  Chit,
  ChitRenderSpec,
} from "pretty-chitty";

import { cityscape2 } from "./assets/network_overload";
import { SampleStack } from "./CanvasLibrary";
import { PlayerAid } from "./PlayerAids";

export * from "./PlayerAids";

export class Card extends Chit {
  public something: number = 2;
  public tapped: boolean = false;
  public flipped: boolean = false;
  public x = 0;
  public y = 0;

  @ChildOutlet public subCard?: Card;

  public override render(spec: ChitRenderSpec): void {
    const boxGeometry = new BoxGeometry(1, 2, 0.1);

    const ts = new SampleStack().set((obj) => {
      obj.title = "#" + this.something * 2;
    });

    const face = new MeshPhongMaterial({
      bumpMap: ts.get().texture,
      bumpScale: 1,
      map: ts.get().texture,
    });

    const side = new MeshPhongMaterial({
      color: 0xbbbbbb,
    });

    spec.object = new Mesh(boxGeometry, [side, side, side, side, face, side]);
    spec.object.receiveShadow = true;
    spec.object.castShadow = true;

    spec.rotateZ = this.tapped ? Math.PI / 2 : 0;
    spec.rotateY = this.flipped ? Math.PI : 0;
    spec.offsetZ = this.flipped ? 0.1 : 0;
    spec.offsetX = this.x * 1.25;
    spec.offsetY = this.y * 2.5;
    spec.offsetZ = this.tapped ? 0.25 : 0 + (this.flipped ? 3.1 : 0);
  }
}

export class CounterChit extends SparkChit {
  public player: MyPlayer | undefined;

  public get icon() {
    return this.player;
  }
  public get headerIcon() {
    return cityscape2;
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
