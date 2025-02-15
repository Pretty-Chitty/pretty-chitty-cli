import path from "path";
import { fileURLToPath } from "url";
import { spawn } from "child_process";
import { URL } from "url";
import chokidar from "chokidar";
import { processDirectory } from "./resizer";
import { readdir } from "fs/promises";
import { createFiles } from "./createFiles";

// Function to extract the first subdirectory under a given base directory from a full path
function getFirstSubdirectory(baseDir: string, filePath: string) {
  // Get the relative path from baseDir to filePath
  const relativePath = path.relative(baseDir, filePath);

  // Split the relative path by path separator to get individual components
  const pathParts = relativePath.split(path.sep);

  // Return the first part, which is the direct subdirectory under baseDir
  return pathParts[0];
}

function setupFileWatcher() {
  const ASSETS_DIR = "src/assets";
  const fileWatcher = chokidar.watch(ASSETS_DIR, {
    ignored: /^(src\/assets\/output)|(\.ts)$/,
    persistent: true,
    ignoreInitial: true,
  });

  const processing: { [key: string]: boolean } = {};
  const needsReprocessing: { [key: string]: boolean } = {};

  function process(folderName: string) {
    if (folderName.startsWith(".")) {
      return;
    }

    if (processing[folderName]) {
      needsReprocessing[folderName] = true;
      return;
    }

    needsReprocessing[folderName] = false;
    processing[folderName] = true;
    processDirectory(path.join(ASSETS_DIR, folderName), ASSETS_DIR)
      .catch(console.error)
      .finally(() => {
        processing[folderName] = false;
        if (needsReprocessing[folderName]) {
          process(folderName);
        }
      });
  }

  const handler = (p: string) => {
    const folderName = getFirstSubdirectory(ASSETS_DIR, p);
    if (folderName.startsWith(".")) {
      return;
    }

    console.log(`Saw change in ${folderName}`, p);
    process(folderName);
  };

  fileWatcher.on("change", handler);
  fileWatcher.on("add", handler);
  fileWatcher.on("unlink", handler);

  readdir(ASSETS_DIR, { withFileTypes: true }).then((list) => {
    for (let i = 0; i < list.length; i++) {
      if (list[i].isDirectory() && list[i].name !== "output") {
        process(list[i].name);
      }
    }
  });
}

export default async function runWebpackWatch() {
  await createFiles();

  setupFileWatcher();

  // Convert the module URL to a file path and get the directory name
  const __dirname = fileURLToPath(new URL(".", import.meta.url));

  let webpackPath;
  try {
    // This finds the entry point of the webpack module
    const webpackEntryPoint = await import.meta.resolve("webpack");
    // Construct the path to the webpack binary
    webpackPath = path.resolve(fileURLToPath(webpackEntryPoint), "../../bin/webpack.js");
  } catch (error) {
    console.error(error);
    console.error("Could not find webpack in the current project.");
    return;
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
      "server",
      `--config=${webpackConfigPath}`,
      `--env`,
      `WORKING_DIR=${process.cwd()}`,
      `--env`,
      `TARGET_ENV=dev`,
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
  });
}
