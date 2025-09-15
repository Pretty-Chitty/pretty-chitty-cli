import { RootChit, DropdownChit, ChildOutlet } from "pretty-chitty";
import { PlayerAid } from "./PlayerAid";
import { MyPlayer } from "./MyPlayer";
import { MainBoard } from "./MainBoard";

export class Root extends RootChit<MyPlayer> {
  @ChildOutlet public mainBoard = new MainBoard();
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
