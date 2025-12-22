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

  // Match exported class declarations with extends clauses
  // Pattern: export class ClassName extends BaseClass
  // Also handles: export abstract class ClassName extends BaseClass
  const classRegex = /export\s+(abstract\s+)?class\s+(\w+)\s+extends\s+(\w+)/g;

  let match;
  while ((match = classRegex.exec(content)) !== null) {
    const isAbstract = !!match[1]; // Check if 'abstract' keyword was captured
    const className = match[2];
    const extendsFrom = match[3];

    classes.push({
      className,
      extendsFrom,
      filePath: path.relative(canvasDir, filePath),
      isAbstract,
    });
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

    if (allCanvasClasses.length === 0) {
      console.log(`No Canvas classes found in ${canvasDir}`);
      return;
    }

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
    const fileContent = `import { ICanvasLibrary } from "@pretty-chitty/core";

${imports.join("\n")}

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
