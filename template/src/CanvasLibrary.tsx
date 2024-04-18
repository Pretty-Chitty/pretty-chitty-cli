import React from "react";

import {
  Color,
  Horizontal,
  Image,
  Layered,
  Text,
  Vertical,
} from "pretty-chitty/ReactCanvas";
import { ParameterizedCanvas } from "pretty-chitty";

import { metropolis, serverroom } from "./assets/network_overload";

// can be defined here?
export class SampleStack extends ParameterizedCanvas {
  title = "default title";
  width = 200;
  height = 400;

  render() {
    return (
      <Horizontal>
        <Vertical>
          <Layered>
            <Color hex="#eab" />
            <Text fill="#336" font="30px sans-serif">
              {this.title}?
            </Text>
          </Layered>
          <Image fill image={metropolis} />
        </Vertical>
        <Image fill image={serverroom} />
      </Horizontal>
    );
  }
}
