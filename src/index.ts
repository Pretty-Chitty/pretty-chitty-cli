import create from "./create";
import watch from "./watch";
import link from "./link";
import runWebpackBuild from "./build";
import runDeploy from "./deploy";
import inquirer from "inquirer";
import fs from "fs";
import { processDirectory } from "./resizer";

function showHelp() {
  console.log(`
Pretty Chitty CLI - Build tools for Pretty Chitty board games

Usage:
  pretty-chitty-cli <command>

Commands:
  create    Create a new game project from template
  watch     Start development server with hot-reloading
  build     Create production build
  deploy    Build and deploy to FTP server
  link      Link local @pretty-chitty/core package (for development)

Examples:
  pretty-chitty-cli create
  pretty-chitty-cli watch
  pretty-chitty-cli build
  pretty-chitty-cli deploy

For more information, visit: https://prettychitty.com
`);
}

export async function cli(): Promise<void> {
  const [, , command] = process.argv;

  switch (command) {
    case "create": {
      await create();
      break;
    }
    case "spritemap": {
      await processDirectory(process.argv[3], process.argv[4]);
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
    case "help":
    case "--help":
    case "-h": {
      showHelp();
      break;
    }
    case "deploy": {
      const settingsFile = ".ftpsettings.json";
      let ftpsettings;

      if (fs.existsSync(settingsFile)) {
        ftpsettings = JSON.parse(fs.readFileSync(settingsFile, "utf8"));
      } else {
        ftpsettings = await inquirer.prompt([
          { type: "input", name: "host", message: "FTP host:" },
          { type: "input", name: "username", message: "FTP username:" },
          { type: "password", name: "password", message: "FTP password:" },
          { type: "input", name: "remotePath", message: "FTP remote path:" },
          { type: "input", name: "publicUrlPath", message: "Public URL path (maps to remotePath):" },
        ]);
        fs.writeFileSync(settingsFile, JSON.stringify(ftpsettings, null, 2));
      }

      await runDeploy(
        { hostname: ftpsettings.host, username: ftpsettings.username, password: ftpsettings.password },
        ftpsettings.remotePath,
        ftpsettings.publicUrlPath
      );
      break;
    }
    default: {
      if (command) {
        console.error(`Error: Unknown command "${command}"\n`);
      }
      showHelp();
      process.exit(command ? 1 : 0);
    }
  }
}
