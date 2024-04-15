import Spritesmith, { SpritesmithResult } from "spritesmith";
import { access, mkdir, readFile, readdir, writeFile } from "fs/promises";
import path from "path";
import { file } from "tmp-promise";
import sharp from "sharp";
import { getAverageColor } from "fast-average-color-node";
import Color from "color";
import { FastAverageColorOptions } from "fast-average-color";

type SpriteResizeRule = {
  maxWidth?: number;
  maxHeight?: number;
  maxPixelsPerFile?: number;
  maxDimensionOfMicroMap?: number;
  format?: "jpg" | "png";
  fit?: "inside" | "outside";
};

export type SpriteDirectorySpec = {
  default?: SpriteResizeRule;
  overrides?: {
    [nameMatch: string]: SpriteResizeRule;
  };
};

async function readSpriteFile(directory: string): Promise<SpriteDirectorySpec> {
  try {
    const spritesFile = path.join(directory, "sprite.json");
    await access(spritesFile);
    const contents = await readFile(spritesFile);
    const spritesSpec = JSON.parse(contents.toString());
    return spritesSpec as SpriteDirectorySpec;
  } catch {
    // file does not exists?
  }

  return {};
}

function getSpecForFile(fileName: string, spec: SpriteDirectorySpec) {
  let result: SpriteResizeRule = {
    maxWidth: 10000,
    maxHeight: 10000,
    maxPixelsPerFile: 10000000,
    maxDimensionOfMicroMap: 15,
    format: "png",
    fit: "inside",
  };

  if (spec.default) {
    result = { ...result, ...spec.default };
  }

  const name = path.basename(fileName);
  if (spec.overrides) {
    Object.entries(spec.overrides)
      .filter(([key]) => new RegExp(key).exec(name))
      .forEach(([key, override]) => {
        result = { ...result, ...override };
      });
  }

  return result;
}

type ResultingFile = {
  format: "jpg" | "png";
  inputFiles: string[];
  totalPixels: number;
};

export type Bounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type ImageFileInfo = {
  file: string;
  bounds: Bounds;
};

export type PartialImageSpec = {
  primary?: ImageFileInfo;
  micro?: ImageFileInfo;
} & (ImageColorSpec | undefined);

export type ImageSpec = {
  primary: ImageFileInfo;
  micro: ImageFileInfo;
} & ImageColorSpec;

export type ImageColorSpec = {
  color: number;
  borderColor: number;
  borderColors: {
    top: number;
    left: number;
    right: number;
    bottom: number;
  };
};

async function processSprite(f: ResultingFile, destinationFile: string) {
  const result = (await new Promise((resolve, reject) => {
    Spritesmith.run(
      {
        src: f.inputFiles,
      },
      (err, result) => {
        if (err) {
          return reject(err);
        }

        resolve(result);
      }
    );
  })) as SpritesmithResult<Buffer>;

  await sharp(result.image).toFile(destinationFile);

  return result.coordinates;
}

async function findColors(file: string, width: number, height: number): Promise<ImageColorSpec> {
  const SIZE = Math.ceil(Math.min(width, height) * 0.1);
  const findColor = async (params?: FastAverageColorOptions) => {
    const c = await getAverageColor(file, params);
    return Color(c.hex).rgbNumber();
  };

  const averageColor = await findColor();
  const topColor = await findColor({
    height: SIZE,
  });
  const bottomColor = await findColor({
    height: SIZE,
    top: height - SIZE,
  });
  const leftColor = await findColor({
    width: SIZE,
  });
  const rightColor = await findColor({
    width: SIZE,
    left: width - SIZE,
  });
  const averageBorderColor = Color(topColor)
    .mix(Color(bottomColor))
    .mix(Color(leftColor).mix(Color(rightColor)))
    .rgbNumber();

  return {
    color: averageColor,
    borderColor: averageBorderColor,
    borderColors: {
      top: topColor,
      bottom: bottomColor,
      left: leftColor,
      right: rightColor,
    },
  };
}

export async function processDirectory(directory: string, targetDirectory: string) {
  const spriteSpec = await readSpriteFile(directory);

  const dirInfo = await readdir(directory);

  const microFile: ResultingFile = {
    format: "jpg",
    inputFiles: [],
    totalPixels: 0,
  };

  const files: ResultingFile[] = [];

  const fileResults: {
    [name: string]: PartialImageSpec;
  } = {};
  const tmpToFileName: { [name: string]: string } = {};

  for (let i = 0; i < dirInfo.length; i++) {
    const fileName = dirInfo[i];

    if (fileName.endsWith(".png") || fileName.endsWith(".jpg") || fileName.endsWith(".webp")) {
      // find the spec to use (bounds, file type, etc)
      let name = path
        .basename(fileName)
        .slice(0, path.basename(fileName).lastIndexOf("."))
        .replace(/[^a-zA-Z0-9_]/g, "");

      if (/^[0-9]/.exec(name)) {
        name = `_${name}`;
      }

      const spec = getSpecForFile(fileName, spriteSpec);

      // write a predictable version of this image (in the correct size) in a tmp folder
      const finalSizedImage = await file({ postfix: ".png" });
      const info = await sharp(path.join(directory, fileName))
        .resize(spec.maxWidth, spec.maxHeight, {
          fit: spec.fit,
          withoutEnlargement: true,
        })
        .toFile(finalSizedImage.path);
      tmpToFileName[finalSizedImage.path] = name;

      // write a very small version of this image (in the correct size) in a tmp folder
      const microImage = await file({ postfix: ".png" });
      const microInfo = await sharp(path.join(directory, fileName))
        .resize(spec.maxDimensionOfMicroMap, spec.maxDimensionOfMicroMap, {
          fit: spec.fit,
          withoutEnlargement: true,
        })
        .toFile(microImage.path);
      tmpToFileName[microImage.path] = name;

      // there will just be one "microfile" per folder, so we can gather all of that info here
      microFile.inputFiles.push(microImage.path);
      microFile.totalPixels += microInfo.width * microInfo.height;

      // find average colors
      const colorInfo = await findColors(finalSizedImage.path, info.width, info.height);

      // stash the color info
      fileResults[name] = colorInfo;

      // find or create the resulting file to use
      const size = info.width * info.height;
      let f = files.find(
        (f) => f.format === spec.format && f.totalPixels + size < (spec.maxPixelsPerFile ?? 10000000000)
      );
      if (!f) {
        f = { format: spec.format ?? "png", inputFiles: [], totalPixels: 0 };
        files.push(f);
      }

      f.totalPixels += size;
      f.inputFiles.push(finalSizedImage.path);
    }
  }

  try {
    await mkdir(path.join(targetDirectory, "output"));
  } catch (e) {
    // eat it.
  }

  const microFileName = path.join(targetDirectory, "output", `${path.basename(directory)}_microinline.jpg`);
  Object.entries(await processSprite(microFile, microFileName)).forEach(([key, value]) => {
    const result = fileResults[tmpToFileName[key]];
    result.micro = {
      file: "__MICRO__",
      bounds: value,
    };
  });

  const fileNamePerFile: string[] = [];
  for (let i = 0; i < files.length; i++) {
    fileNamePerFile[i] = `${path.basename(directory)}_file${i + 1}.${files[i].format}`;
    const outputFile = path.join(targetDirectory, "output", fileNamePerFile[i]);

    Object.entries(await processSprite(files[i], outputFile)).forEach(([key, value]) => {
      const result = fileResults[tmpToFileName[key]];
      result.primary = {
        file: `__FILE${i + 1}__`,
        bounds: value,
      };
    });
  }

  function fixReplacements(s: string) {
    s = s.replace(/"__MICRO__"/g, "micro");
    for (let i = 0; i < files.length; i++) {
      s = s.replace(new RegExp(`"__FILE${i + 1}__"`, "g"), `file${i + 1}`);
    }
    return s;
  }

  writeFile(
    path.join(targetDirectory, `${path.basename(directory)}.ts`),
    `import micro from "./output/${path.basename(microFileName)}";
${files.map((file, index) => `import file${index + 1} from "./output/${fileNamePerFile[index]}";`).join("\n")}

${Object.entries(fileResults)
  .map(([key, value]) =>
    `export const ${key} = ${fixReplacements(JSON.stringify(value))}`.replaceAll(/"([^"]+?)":/g, (a, b) => `${b}:`)
  )
  .join("\n\n")}`
  );
}
