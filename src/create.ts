import readline from "readline";
import path from "path";
import { promises as fs } from "fs";
import { resolve, join } from "path";

async function replaceGameName(filePath: string, gameName: string) {
  try {
    // Read the contents of the file
    let content = await fs.readFile(filePath, "utf8");

    // Replace all instances of GAME_NAME with gameName
    const updatedContent = content.replace(/GAME_NAME/g, gameName);

    // Write the updated content to a new file
    await fs.writeFile(filePath, updatedContent, "utf8");
    console.log("File has been updated and saved.");
  } catch (error) {
    console.error("Error processing the file:", error);
  }
}

async function copyDir(src: string, dest: string) {
  const fullSrcPath = resolve(import.meta.url.substring(7), src); // Adjust for 'file://'
  const fullDestPath = resolve(dest);

  try {
    // Ensure the destination directory exists
    await fs.mkdir(fullDestPath, { recursive: true });

    // Read all the contents of the source directory
    const entries = await fs.readdir(fullSrcPath, { withFileTypes: true });

    // Iterate through each entry in the source directory
    for (let entry of entries) {
      const srcPath = join(fullSrcPath, entry.name);
      const destPath = join(fullDestPath, entry.name);

      if (entry.isDirectory()) {
        // Recursively copy directories
        await copyDir(srcPath, destPath);
      } else {
        // Copy files
        await fs.copyFile(srcPath, destPath);
      }
    }
  } catch (error) {
    console.error("Error copying directory:", error);
    throw error; // Rethrow the error for caller to handle if needed
  }
}

export default async function create() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  // Promisify the question method
  const question = (query: string) =>
    new Promise<string>((resolve) => {
      rl.question(query, (answer) => {
        resolve(answer);
      });
    });

  const name = await question("What should this game be called? ");

  if (/[^A-Za-z0-9]/.test(name)) {
    console.error("Invalid name - must be all alphanumeric characters");
    process.exit(1);
  }
  if (/^[0-9]/.test(name)) {
    console.error("Invalid name - cannot start with a number");
    process.exit(1);
  }

  // Usage
  const srcDirectory = "../../template"; // Source directory relative to this script
  const destDirectory = process.cwd(); // Destination directory (current working directory)

  await copyDir(srcDirectory, destDirectory)
    .then(() => console.log("Directory copied successfully!"))
    .catch((err) => console.error("Failed to copy directory:", err));

  // fix package.json and main source file
  await replaceGameName(path.join(destDirectory, "package.json"), name);
  await replaceGameName(path.join(destDirectory, "src/GAME_NAME.ts"), name);
  await fs.rename(path.join(destDirectory, "src/GAME_NAME.ts"), path.join(destDirectory, `src/${name}.ts`));

  process.exit();
}
