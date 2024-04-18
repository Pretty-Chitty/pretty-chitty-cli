import {
  Game,
  PlayerInfo,
  Chit,
  Turn,
  GameTheme,
  ChitRenderSpec,
  LightSpec,
  StaticImage,
} from "pretty-chitty";
import { Mesh, MeshPhongMaterial, PlaneGeometry } from "three";

import * as ChitLibrary from "./ChitLibrary";
import * as CanvasLibrary from "./CanvasLibrary";
import * as ButtonLibrary from "./ButtonLibrary";

import { FlipButton } from "./ButtonLibrary";
import { Card, MyPlayer, Root } from "./ChitLibrary";
import { table } from "./assets/environment";

export class DemoGame implements Game<MyPlayer, Root> {
  name = "Demo Game";

  chitLibrary = ChitLibrary;
  canvasLibrary = CanvasLibrary;
  buttonLibrary = ButtonLibrary;

  theme = GameTheme.withDefaults("#2d3142", "#ef8354");

  async run(
    players: MyPlayer[],
    setup: Turn<any, MyPlayer, Root>,
    rootChit: Root
  ) {
    players[0].color = "#ed00cb";
    players[1].color = "#00edcb";

    // set up the board
    const W = 3;
    const H = 3;

    const pieces = [...new Array(W * H)].map((d, i) =>
      new Card().set((c) => {
        c.x = Math.floor(i / H);
        c.y = i % H;
        rootChit.mainBoard.add(c);
      })
    );
    setup.flush();

    const rng2 = await setup.takeRng(W * H);
    const pieces2 = [...new Array(W * H)].map((d, i) =>
      new Card().set((c) => {
        c.x = Math.floor(i / H);
        c.y = i % H;
        const target = players[Math.floor(rng2() * players.length)];
        target.add(c);
      })
    );
    setup.flush();

    // now do 100 turns
    for (let i = 0; i < 100; i++) {
      const player = players[i % 2];
      rootChit.playerAid.turnCount++;
      player.counter.value += Math.round((await setup.rng()) * 10);

      // alternating players
      await setup.createTurn(
        [
          ...pieces,
          ...pieces2,
          rootChit.mainBoard,
          ...players.map((p) => p.counter),
        ],
        player,
        async (turn) => {
          let lastPiece: Card | undefined;
          const counter = (await turn.rng()) * 3 + 3;
          for (let i = 0; i < counter; i++) {
            await turn.pick([
              Chit.pick(pieces, async (chit) => {
                chit.tapped = !chit.tapped;
                lastPiece = chit;
              })
                .message("pick a card")
                .help("Help text for pick a card"),
              Chit.pick(pieces2, (chit) => {
                chit.flipped = !chit.flipped;
              })
                .message("bring home")
                .help("Help text for bring home"),
              lastPiece &&
                new FlipButton(async () => {
                  if (lastPiece) {
                    lastPiece.flipped = !lastPiece.flipped;
                  }
                }),
            ]);
          }
        }
      );
    }

    return {
      winners: [players[0]],
    };
  }

  generateRootChit() {
    return new Root();
  }

  generatePlayer(playerInfo: PlayerInfo) {
    return new MyPlayer(playerInfo);
  }

  renderDefaultRootChit(spec: ChitRenderSpec): void {
    const scale = { rx: 25, ry: 25 };
    spec.ornament = new Mesh(
      new PlaneGeometry(100, 100),
      new MeshPhongMaterial({
        map: StaticImage.from(table, scale),
        bumpMap: StaticImage.from(table, scale),
        bumpScale: 30,
      })
    );
    spec.ornament.position.z = -0.02;
    spec.lightSpec = LightSpec.realistic();
  }
}
