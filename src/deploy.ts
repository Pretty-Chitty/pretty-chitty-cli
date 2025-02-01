import fs from "fs";
import path from "path";
import ftp from "basic-ftp";

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
    const m = await import(entryFilePath);
    const Game = m.Game;
    const gameInstance = new Game();
    const gameTheme = gameInstance.theme;

    gameJson.backgroundColor = gameTheme.backgroundColor;
    gameJson.foregroundColor = gameTheme.barActiveTextColor;

    const entryUrl = publicUrlPath + entryFile;
    const nodeUrl = publicUrlPath + nodeFile;

    gameJson.webEntry = entryUrl;
    gameJson.nodeEntry = nodeUrl;

    console.log(JSON.stringify(gameJson, null, 2));

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
