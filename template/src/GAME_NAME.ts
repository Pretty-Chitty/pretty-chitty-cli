import { Game, PlayerInfo, Chit, Turn, GameTheme, ChitRenderSpec, LightSpec, StaticImage } from "pretty-chitty";
import { Mesh, MeshPhongMaterial, PlaneGeometry } from "three";

import * as ChitLibrary from "./ChitLibrary";
import * as CanvasLibrary from "./CanvasLibrary";
import * as ButtonLibrary from "./ButtonLibrary";

import { FlipButton } from "./ButtonLibrary";
import { Box, MyPlayer, Root } from "./ChitLibrary";
import { table } from "./assets/environment";

export default class GAME_NAME implements Game<MyPlayer, Root> {
  name = "GAME_NAME";

  chitLibrary = ChitLibrary;
  canvasLibrary = CanvasLibrary;
  buttonLibrary = ButtonLibrary;

  theme = GameTheme.withDefaults("#2d3142", "#ef8354");

  async run(players: MyPlayer[], setup: Turn<any, MyPlayer, Root>, rootChit: Root) {
    players[0].color = "#ed00cb";
    players[1].color = "#00edcb";

    const boxes: Box[] = [];
    const createBox = () => {
      const b = new Box();
      boxes.push(b);
      return b;
    };

    rootChit.mainBoard.add(createBox());
    players.forEach((p) => p.add(createBox()));

    await setup.createTurn([rootChit], players[0], async (turn) => {
      await turn.pick([
        Chit.pick<Box>(boxes, (box) => {
          box.removeFromParent();
        }),
      ]);
    });

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
    const mesh = new Mesh(
      new PlaneGeometry(100, 100),
      new MeshPhongMaterial({
        map: StaticImage.texture(table, scale),
        bumpMap: StaticImage.texture(table, scale),
        bumpScale: 30,
      })
    );
    mesh.position.z = -0.02;
    spec.ornaments.push(mesh);
    spec.lightSpec = LightSpec.realistic();
  }
}
