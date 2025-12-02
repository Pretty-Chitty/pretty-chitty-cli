import { Chit, PanelTab } from "pretty-chitty";
import { table } from "../assets/environment";

export class MainBoard extends Chit {
  public get panelTab(): PanelTab {
    return {
      icon: table,
      color: "#443321",
    };
  }
}
