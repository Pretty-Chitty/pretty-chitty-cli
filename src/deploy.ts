import fs from "fs";
import path from "path";
import crypto from "crypto";
import ftp from "basic-ftp";
import { execSync } from "child_process";
import sharp from "sharp";

export type FtpSettings = {
  hostname: string;
  username: string;
  password: string;
};

export default async function runDeploy(ftpSettings: FtpSettings, ftpBasePath: string, publicUrlPath: string) {
  try {
    // Read and bump version in package.json
    const packageJsonPath = path.join(process.cwd(), "package.json");
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));

    // Bump the patch version (e.g., "1.0.0" -> "1.0.1")
    const versionParts = packageJson.version.split(".");
    versionParts[2] = String(parseInt(versionParts[2]) + 1);
    packageJson.version = versionParts.join(".");
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

    // Extract major version
    const majorVersion = parseInt(versionParts[0]);

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
    const gameMetadata = gameInstance.metadata;
    const rootChit = new gameInstance.chitLibrary.Root();

    // Build the published payload from package.json and game metadata
    const publishedJson: Record<string, any> = {
      id: packageJson.name,
      major: majorVersion,
      minPlayers: rootChit.minPlayers,
      maxPlayers: rootChit.maxPlayers,
      configurationOptions: rootChit.getConfigurationOptions(),
      version: packageJson.version,
      backgroundColor: gameTheme.backgroundColor,
      foregroundColor: gameTheme.barActiveTextColor,
      ...gameMetadata,
    };

    // Process and optimize images
    async function processImage(imagePath: string, maxSize?: number): Promise<string> {
      const originalFile = files.find((file) => file === path.basename(imagePath));
      if (!originalFile) {
        throw new Error(`Image not found in dist: ${imagePath}`);
      }

      const originalPath = path.join(distPath, originalFile);
      const baseName = path.basename(originalFile, path.extname(originalFile));

      let pipeline = sharp(originalPath);

      if (maxSize) {
        pipeline = pipeline.resize(maxSize, maxSize, {
          fit: "inside",
          withoutEnlargement: true,
        });
      }

      const buffer = await pipeline.jpeg({ quality: 95 }).toBuffer();
      const hash = crypto.createHash("sha256").update(new Uint8Array(buffer)).digest("hex").slice(0, 8);
      const outputFile = `${baseName}.${hash}.jpg`;
      const outputPath = path.join(distPath, outputFile);

      fs.writeFileSync(outputPath, new Uint8Array(buffer));

      console.log(`Processed image: ${originalFile} -> ${outputFile}`);
      return outputFile;
    }

    if (gameMetadata.boxArt) {
      const boxArtFile = await processImage(gameMetadata.boxArt);
      publishedJson.boxArt = publicUrlPath + boxArtFile;
    }
    if (gameMetadata.screenshot) {
      const screenshotFile = await processImage(gameMetadata.screenshot, 1200);
      publishedJson.screenshot = publicUrlPath + screenshotFile;
    }

    const entryUrl = publicUrlPath + entryFile;
    const nodeUrl = publicUrlPath + nodeFile;

    publishedJson.webEntry = entryUrl;
    publishedJson.nodeEntry = nodeUrl;

    const publishedPayload = JSON.stringify(publishedJson, null, 2);
    console.log(publishedPayload);

    // Write payload to publishedGame.json
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
