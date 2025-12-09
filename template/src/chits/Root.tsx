import { RootChit, DropdownChit, ChildOutlet } from "@pretty-chitty/core";
import { PlayerAid } from "./PlayerAid";
import { MyPlayer } from "./MyPlayer";
import { MainBoard } from "./MainBoard";
import { LayoutNode } from "@pretty-chitty/core";

export class Root extends RootChit<MyPlayer> {
  @ChildOutlet public mainBoard = new MainBoard();
  @ChildOutlet public playerAid = new PlayerAid();

  override getDropdowns(): DropdownChit[] {
    return [this.playerAid];
  }

  override getLayout(width: number, height: number, playerId: string): LayoutNode {
    return {
      direction: "optimizePreferHorizontal",
      collapseOrder: 5,
      splits: [
        {
          order: 1,
          chit: this.mainBoard,
          minWidth: 325,
          minHeight: 270,
        },
        {
          direction: "optimizePreferHorizontal",
          collapseOrder: 4,
          splits: [
            ...this.players
              .filter((p) => p.id === playerId)
              .map((p) => ({
                order: 100,
                minWidth: 325,
                minHeight: 260,
                chit: p,
              })),
            {
              direction: "optimizePreferVertical",
              collapseOrder: 3,
              splits: this.players
                .filter((p) => p.id !== playerId)
                .map((p, i) => ({
                  order: i + 10,
                  minWidth: 300,
                  minHeight: 200,
                  chit: p,
                })),
            },
          ],
        },
      ],
    };
  }
}
