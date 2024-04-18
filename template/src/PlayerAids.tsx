import React from "react";
import { DropdownChit } from "pretty-chitty";

export class PlayerAid extends DropdownChit {
  public turnCount = 0;

  renderLabel() {
    return `Current turn: ${this.turnCount}`;
  }
  renderBody() {
    return <p>This is a box</p>;
  }
}
