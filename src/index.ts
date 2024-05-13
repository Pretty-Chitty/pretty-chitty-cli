import create from "./create";
import watch from "./watch";

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
  }
}
