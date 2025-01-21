import create from "./create";
import watch from "./watch";
import link from "./link";
import runWebpackBuild from "./build";

export async function cli(): Promise<void> {
  const [, , command] = process.argv;

  switch (command) {
    case "create": {
      await create();
      break;
    }
    case "watch": {
      await watch();
      break;
    }
    case "link": {
      await link();
      break;
    }
    case "build": {
      await runWebpackBuild();
      break;
    }
  }
}
