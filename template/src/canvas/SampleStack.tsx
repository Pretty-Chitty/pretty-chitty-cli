import React from "react";
import { Color, Layered, Text } from "pretty-chitty/ReactCanvas";
import { ParameterizedCanvas } from "@pretty-chitty/core";

// can be defined here?

export class SampleStack extends ParameterizedCanvas {
  title = "default title";
  width = 200;
  height = 400;

  render() {
    return (
      <Layered>
        <Color hex="#eab" />
        <Text fill="#336" font="30px sans-serif">
          {this.title}?
        </Text>
      </Layered>
    );
  }
}
