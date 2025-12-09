import { BoxGeometry, Mesh, MeshPhongMaterial } from "three";
import { Chit, ChitRenderSpec } from "@pretty-chitty/core";
import { BASE_SIZE } from "../consts";

export class Box extends Chit {
  public override render(spec: ChitRenderSpec): void {
    const boxGeometry = new BoxGeometry(BASE_SIZE, BASE_SIZE, BASE_SIZE);
    const side = new MeshPhongMaterial({
      color: 12303291,
    });

    spec.object = new Mesh(boxGeometry, [side, side, side, side, side, side]);
    spec.object.receiveShadow = true;
    spec.object.castShadow = true;
  }
}
