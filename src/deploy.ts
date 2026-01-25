import fs from "fs";
import path from "path";
import ftp from "basic-ftp";
import { execSync } from "child_process";

export type FtpSettings = {
  hostname: string;
  username: string;
  password: string;
};

export default async function runDeploy(ftpSettings: FtpSettings, ftpBasePath: string, publicUrlPath: string) {
  try {
    const gameJsonPath = path.join(process.cwd(), "game.json");
    const gameJson = JSON.parse(fs.readFileSync(gameJsonPath, "utf-8"));
    gameJson.version = gameJson.version.replace(/([0-9]+?)$/, (d: string) => parseInt(d) + 1); // autobump version
    fs.writeFileSync(gameJsonPath, JSON.stringify(gameJson, null, "  "));

    const distPath = path.join(process.cwd(), "dist");
    const files = fs.readdirSync(distPath);
    const entryFile = files.find((file) => file.startsWith("game.") && file.endsWith(".js"));
    const nodeFile = files.find((file) => file.startsWith("node.") && file.endsWith(".js"));

    if (!entryFile || !nodeFile) {
      throw new Error("Entry file not found in the dist folder");
    }

    const entryFilePath = path.join(distPath, nodeFile);
    console.log("init game");
    const m = await import(entryFilePath);
    console.log("init game");
    const Game = m.Game;
    const gameInstance = new Game();
    const gameTheme = gameInstance.theme;

    gameJson.backgroundColor = gameTheme.backgroundColor;
    gameJson.foregroundColor = gameTheme.barActiveTextColor;

    if (gameTheme.boxArt) {
      gameJson.boxArt = publicUrlPath + files.find((file) => file === path.basename(gameTheme.boxArt));
    }
    if (gameTheme.screenshot) {
      gameJson.screenshot = publicUrlPath + files.find((file) => file === path.basename(gameTheme.screenshot));
    }

    const entryUrl = publicUrlPath + entryFile;
    const nodeUrl = publicUrlPath + nodeFile;

    gameJson.webEntry = entryUrl;
    gameJson.nodeEntry = nodeUrl;

    const publishedPayload = JSON.stringify(gameJson, null, 2);
    console.log(publishedPayload);

    // Write payload to publishedGame.json next to game.json
    const publishedGamePath = path.join(process.cwd(), "publishedGame.json");
    fs.writeFileSync(publishedGamePath, publishedPayload);
    console.log(`Wrote payload to ${publishedGamePath}`);

    // Copy to clipboard (works on macOS, Windows, and Linux with xclip)
    try {
      const platform = process.platform;
      if (platform === "darwin") {
        execSync("pbcopy", { input: publishedPayload });
      } else if (platform === "win32") {
        execSync("clip", { input: publishedPayload });
      } else {
        execSync("xclip -selection clipboard", { input: publishedPayload });
      }
      console.log("Payload copied to clipboard!");
    } catch {
      console.log("Could not copy to clipboard (clipboard tool not available)");
    }

    const client = new ftp.Client();

    // Recursively upload without overwriting existing files
    async function uploadDirectoryIfNotExists(localDir: string, remoteDir: string) {
      await client.ensureDir(remoteDir);

      for (const item of fs.readdirSync(localDir, { withFileTypes: true })) {
        const localItemPath = path.join(localDir, item.name);
        const remoteItemPath = path.join(remoteDir, path.relative(distPath, localItemPath));

        if (item.isDirectory()) {
          await uploadDirectoryIfNotExists(localItemPath, remoteItemPath);
        } else {
          try {
            // If this doesn't throw, file exists
            await client.size(item.name);
            console.log(`Skipping existing file: ${remoteItemPath}`);
          } catch (err: any) {
            if (err.code === 550) {
              // File not found => upload
              console.log(`Uploading file: ${remoteItemPath}`);

              await client.uploadFrom(localItemPath, item.name);
            } else {
              throw err;
            }
          }
        }
      }

      await client.cd("..");
    }

    try {
      await client.access({
        host: ftpSettings.hostname,
        user: ftpSettings.username,
        password: ftpSettings.password,
      });
      await uploadDirectoryIfNotExists(distPath, ftpBasePath);
    } finally {
      client.close();
    }

    console.log("Folder upload complete!");
  } catch (error) {
    console.error("Error uploading folder:", error);
  }
}
