import {
  Game,
  PlayerInfo,
  Chit,
  GameResult,
  Turn,
  GameTheme,
  ChitRenderSpec,
  LightSpec,
  StaticImage,
} from "@pretty-chitty/core";
import { Mesh, MeshPhongMaterial, PlaneGeometry } from "three";
import "@fontsource/quicksand/400.css";
import "@fontsource/quicksand/700.css";

import * as ButtonLibrary from "./ButtonLibrary";
import { ChitLibrary } from "./chits/ChitLibrary";
import { CanvasLibrary } from "./canvas/CanvasLibrary";

import { Root } from "./chits/Root";
import { Player } from "./chits/Player";
import { Box } from "./chits/Box";
import { table } from "./assets/environment";

import boxArt from "../static/boxArt.jpg";
import screenshot from "../static/screenshot.jpg";

const theme = GameTheme.withDefaults("#2d3142", "#ef8354");
theme.boxArt = boxArt;
theme.screenshot = screenshot;
theme.fontFamily = "Quicksand, sans-serif";

export default class GAME_NAME implements Game<Player, Root> {
  name = "GAME_NAME";

  chitLibrary = ChitLibrary;
  canvasLibrary = CanvasLibrary;
  buttonLibrary = ButtonLibrary;

  theme = theme;

  tokenMap = {
    some_icon: { image: table },
  };

  async run(setup: Turn<GameResult<Player>, Player, Root>, rootChit: Root) {
    const players = rootChit.players.copy();
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

  renderDefaultRootChit(spec: ChitRenderSpec): void {
    const scale = { rx: 25, ry: 25 };
    const mesh = new Mesh(
      new PlaneGeometry(100, 100),
      new MeshPhongMaterial({
        map: StaticImage.texture(table, scale),
        bumpMap: StaticImage.texture(table, scale),
        bumpScale: 30,
      }),
    );
    mesh.position.z = -0.02;
    spec.ornaments.push(mesh);
    spec.lightSpec = LightSpec.realistic();
  }
}
