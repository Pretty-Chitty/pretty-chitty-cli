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

import * as ButtonLibrary from "./buttons/ButtonLibrary";
import { ChitLibrary } from "./chits/ChitLibrary";
import { CanvasLibrary } from "./canvas/CanvasLibrary";

import { Root } from "./chits/Root";
import { MyPlayer } from "./chits/MyPlayer";
import { Box } from "./chits/Box";
import { table } from "./assets/environment";

import boxArt from "../static/boxArt.jpg";
import screenshot from "../static/screenshot.jpg";

const theme = GameTheme.withDefaults("#2d3142", "#ef8354");
theme.boxArt = boxArt;
theme.screenshot = screenshot;

export default class GAME_NAME implements Game<MyPlayer, Root> {
  name = "GAME_NAME";

  galleryItemWidth = 300;
  galleryItemSpacing = 20;

  chitLibrary = ChitLibrary;
  canvasLibrary = CanvasLibrary;
  buttonLibrary = ButtonLibrary;

  theme = theme;

  tokenMap = {
    some_icon: { image: table },
  };

  async run(setup: Turn<GameResult<MyPlayer>, MyPlayer, Root>, rootChit: Root) {
    await rootChit.players.shuffle();
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
