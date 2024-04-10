import path from "path";
import { fileURLToPath } from "url";
import { spawn } from "child_process";
import { URL } from "url";

export default async function runWebpackWatch() {
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
    [webpackPath, "server", `--config=${webpackConfigPath}`, `--env`, `WORKING_DIR=${process.cwd()}`],
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
