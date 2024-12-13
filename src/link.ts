import * as fs from "fs";
import * as path from "path";
import * as glob from "glob";
import * as os from "os";

export default async function link() {
  const tempDir = os.tmpdir();

  const findFile = (pattern: string): string => {
    const files = glob.sync(pattern);
    if (files.length === 0) {
      throw new Error("No files found");
    }
    return files[0];
  };

  const copyFile = (src: string, dest: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      fs.copyFile(src, dest, (err) => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });
  };

  const updatePackageJson = async (filePath: string) => {
    const packageJsonPath = path.join(process.cwd(), "package.json");
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
    packageJson.dependencies["pretty-chitty"] = `file:${filePath}`;
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  };

  try {
    const __dirname = process.cwd();
    const pattern = path.join(__dirname, "../pretty-chitty/pretty-chitty*.tgz");
    const file = await findFile(pattern);
    const timestamp = Date.now();
    const destFileName = `pretty-chitty-${timestamp}.tgz`;
    const destFilePath = path.join(tempDir, destFileName);
    await copyFile(file, destFilePath);
    await updatePackageJson(destFilePath);
    console.log(`Linked pretty-chitty to ${destFilePath}`);
  } catch (error) {
    console.error("Error linking pretty-chitty:", error);
  }
}
