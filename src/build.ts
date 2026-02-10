import path from "path";
import { fileURLToPath } from "url";
import { spawn } from "child_process";
import { URL } from "url";
import { processDirectory } from "./resizer";
import { readdir, rm, access } from "fs/promises";
import { createFiles } from "./createFiles";
import { generateChitLibrary } from "./chitLibraryGenerator";
import { generateCanvasLibrary } from "./canvasLibraryGenerator";

async function setupFileWatcher() {
  const ASSETS_DIR = "src/assets";

  const processing: { [key: string]: boolean } = {};
  const needsReprocessing: { [key: string]: boolean } = {};

  async function process(folderName: string) {
    if (processing[folderName]) {
      needsReprocessing[folderName] = true;
      return;
    }

    needsReprocessing[folderName] = false;
    processing[folderName] = true;
    await processDirectory(path.join(ASSETS_DIR, folderName), ASSETS_DIR)
      .catch(console.error)
      .finally(async () => {
        processing[folderName] = false;
        if (needsReprocessing[folderName]) {
          await process(folderName);
        }
      });
  }

  await readdir(ASSETS_DIR, { withFileTypes: true }).then(async (list) => {
    for (let i = 0; i < list.length; i++) {
      if (list[i].isDirectory() && list[i].name !== "output") {
        await process(list[i].name);
      }
    }
  });
}

async function setupChitLibrary() {
  const CHITS_DIR = "src/chits";

  // Check if the chits directory exists
  try {
    await access(CHITS_DIR);
  } catch {
    // Directory doesn't exist, skip setup
    return;
  }

  try {
    await generateChitLibrary(CHITS_DIR);
  } catch (error) {
    console.error("Error generating ChitLibrary:", error);
  }
}

async function setupCanvasLibrary() {
  const CANVAS_DIR = "src/canvas";

  // Check if the canvas directory exists
  try {
    await access(CANVAS_DIR);
  } catch {
    // Directory doesn't exist, skip setup
    return;
  }

  try {
    await generateCanvasLibrary(CANVAS_DIR);
  } catch (error) {
    console.error("Error generating CanvasLibrary:", error);
  }
}

export default async function runWebpackBuild() {
  await createFiles();

  await setupFileWatcher();
  await setupChitLibrary();
  await setupCanvasLibrary();

  // Convert the module URL to a file path and get the directory name
  const __dirname = fileURLToPath(new URL(".", import.meta.url));

  let webpackPath;
  try {
    // This finds the entry point of the webpack module
    const webpackEntryPoint = await import.meta.resolve!("webpack");
    // Construct the path to the webpack binary
    webpackPath = path.resolve(fileURLToPath(webpackEntryPoint), "../../bin/webpack.js");
  } catch (error) {
    console.error(error);
    console.error("Could not find webpack in the current project.");
    return;
  }

  const distPath = path.join(process.cwd(), "dist");
  try {
    await rm(distPath, { recursive: true, force: true });
    console.log(`Deleted contents of ${distPath}`);
  } catch (error) {
    console.error(`Error deleting contents of ${distPath}:`, error);
  }

  console.log(webpackPath);
  // Construct the absolute path to webpack.config.js
  const webpackConfigPath = path.join(__dirname, "../webpack.config.js");
  console.log(webpackConfigPath);
  // Spawn the 'npx webpack watch' command
  const webpackProcess = spawn(
    "node",
    [
      webpackPath,
      "build",
      `--config=${webpackConfigPath}`,
      `--env`,
      `WORKING_DIR=${process.cwd()}`,
      `--env`,
      `TARGET_ENV=prod`,
    ],
    {
      cwd: path.join(__dirname, "../"),
    }
  );

  // Handle normal output
  webpackProcess.stdout.on("data", (data: string) => {
    console.log(`stdout: ${data}`);
  });

  // Handle error output
  webpackProcess.stderr.on("data", (data: string) => {
    console.error(`stderr: ${data}`);
  });

  // Handle the close event
  webpackProcess.on("close", (code: string) => {
    console.log(`child process exited with code ${code}`);

    const isNodeProcess = spawn(
      "node",
      [
        webpackPath,
        "build",
        `--config=${webpackConfigPath}`,
        `--env`,
        `WORKING_DIR=${process.cwd()}`,
        `--env`,
        `TARGET_ENV=prod`,
        `--env`,
        `IS_NODE=true`,
      ],
      {
        cwd: path.join(__dirname, "../"),
      }
    );

    // Handle normal output
    isNodeProcess.stdout.on("data", (data: string) => {
      console.log(`stdout: ${data}`);
    });

    // Handle error output
    isNodeProcess.stderr.on("data", (data: string) => {
      console.error(`stderr: ${data}`);
    });
  });
}
