import { readdir, readFile, writeFile } from "fs/promises";
import path from "path";

export interface CanvasClassInfo {
  className: string;
  filePath: string;
}

interface ClassDefinition {
  className: string;
  extendsFrom: string;
  filePath: string;
  isAbstract: boolean;
}

/**
 * Parses a TypeScript file to find all exported class definitions
 */
async function parseFileForClasses(
  filePath: string,
  canvasDir: string
): Promise<ClassDefinition[]> {
  const content = await readFile(filePath, "utf-8");
  const classes: ClassDefinition[] = [];

  // Match exported class declarations
  // First find all class declarations, then parse each one individually
  const classStartRegex = /export\s+(abstract\s+)?class\s+(\w+)/g;

  let match;
  while ((match = classStartRegex.exec(content)) !== null) {
    const isAbstract = !!match[1];
    const className = match[2];
    const startPos = match.index + match[0].length;

    // From this position, find the extends clause
    // We need to skip over any generic parameters first
    let pos = startPos;
    let angleDepth = 0;
    let foundExtends = false;
    let extendsFrom = "";

    // Skip whitespace and generics
    while (pos < content.length) {
      const char = content[pos];

      if (char === "<") {
        angleDepth++;
        pos++;
      } else if (char === ">") {
        angleDepth--;
        pos++;
      } else if (angleDepth === 0 && /\s/.test(char)) {
        // Skip whitespace when not inside <>
        pos++;
      } else if (angleDepth === 0) {
        // We're outside <> and hit a non-whitespace character
        // Check if this is the start of 'extends'
        if (content.substring(pos, pos + 7) === "extends") {
          foundExtends = true;
          pos += 7;
          // Skip whitespace after 'extends'
          while (pos < content.length && /\s/.test(content[pos])) {
            pos++;
          }
          // Capture the base class name
          const nameMatch = content.substring(pos).match(/^(\w+)/);
          if (nameMatch) {
            extendsFrom = nameMatch[1];
          }
          break;
        } else {
          // Hit something else, stop looking
          break;
        }
      } else {
        // Inside <>, keep going
        pos++;
      }
    }

    if (foundExtends && extendsFrom) {
      classes.push({
        className,
        extendsFrom,
        filePath: path.relative(canvasDir, filePath),
        isAbstract,
      });
    }
  }

  return classes;
}

/**
 * Determines which classes extend ParameterizedCanvas (directly or indirectly)
 */
function findCanvasClasses(allClasses: ClassDefinition[]): CanvasClassInfo[] {
  const canvasClasses = new Set<string>();
  const classMap = new Map<string, ClassDefinition>();

  // Build a map of className -> ClassDefinition
  for (const cls of allClasses) {
    classMap.set(cls.className, cls);
  }

  // Start with ParameterizedCanvas and classes that contain "Canvas" in their name or extend something with "Canvas"
  canvasClasses.add("ParameterizedCanvas");
  for (const cls of allClasses) {
    if (cls.className.includes("Canvas") || cls.extendsFrom.includes("Canvas")) {
      canvasClasses.add(cls.className);
    }
  }

  // Iteratively add any class that extends a known Canvas class
  let previousSize = 0;
  while (canvasClasses.size !== previousSize) {
    previousSize = canvasClasses.size;

    for (const cls of allClasses) {
      if (canvasClasses.has(cls.extendsFrom)) {
        canvasClasses.add(cls.className);
      }
    }
  }

  // Build the result array, excluding abstract classes
  const result: CanvasClassInfo[] = [];
  for (const cls of allClasses) {
    if (canvasClasses.has(cls.className) && !cls.isAbstract) {
      result.push({
        className: cls.className,
        filePath: cls.filePath,
      });
    }
  }

  return result;
}

/**
 * Scans a directory recursively for TypeScript files
 */
async function scanDirectory(dir: string): Promise<string[]> {
  const files: string[] = [];
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      const subFiles = await scanDirectory(fullPath);
      files.push(...subFiles);
    } else if (entry.isFile() && (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx"))) {
      // Skip the generated CanvasLibrary.ts file
      if (entry.name !== "CanvasLibrary.ts") {
        files.push(fullPath);
      }
    }
  }

  return files;
}

/**
 * Generates the CanvasLibrary.ts file
 */
export async function generateCanvasLibrary(canvasDir: string): Promise<void> {
  try {
    // Scan for all TypeScript files
    const files = await scanDirectory(canvasDir);

    // Parse each file for all class definitions
    const allClassDefs: ClassDefinition[] = [];
    for (const file of files) {
      const classes = await parseFileForClasses(file, canvasDir);
      allClassDefs.push(...classes);
    }

    // Determine which classes extend ParameterizedCanvas (directly or indirectly)
    const allCanvasClasses = findCanvasClasses(allClassDefs);

    // Generate imports
    const imports = allCanvasClasses.map((info) => {
      const importPath = "./" + info.filePath.replace(/\.tsx?$/, "");
      return `import { ${info.className} } from "${importPath}";`;
    });

    // Generate the library object
    const libraryEntries = allCanvasClasses.map((info) => {
      return `  ${info.className},`;
    });

    // Generate the file content
    const importsSection = imports.length > 0 ? `\n${imports.join("\n")}\n` : "";
    const fileContent = `import { ICanvasLibrary } from "@pretty-chitty/core";${importsSection}
export const CanvasLibrary: ICanvasLibrary = {
${libraryEntries.join("\n")}
};
`;

    // Write the file
    const outputPath = path.join(canvasDir, "CanvasLibrary.ts");
    await writeFile(outputPath, fileContent);

    console.log(`Generated CanvasLibrary.ts with ${allCanvasClasses.length} Canvas class(es)`);
  } catch (error) {
    console.error(`Error generating CanvasLibrary:`, error);
    throw error;
  }
}
