import { IChitLibrary } from "@pretty-chitty/core";

import { Box } from "./Box";
import { Root } from "./Root";
import { MainBoard } from "./MainBoard";
import { Player } from "./Player";
import { PlayerAid } from "./PlayerAid";

export const ChitLibrary: IChitLibrary<Player, Root> = {
  Box,
  Root,
  MainBoard,
  PlayerAid,
  Player,
};
