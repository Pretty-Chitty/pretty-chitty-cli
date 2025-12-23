import { readdir, readFile, writeFile } from "fs/promises";
import path from "path";

export interface ChitClassInfo {
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
  chitsDir: string
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
        filePath: path.relative(chitsDir, filePath),
        isAbstract,
      });
    }
  }

  return classes;
}

/**
 * Determines which classes extend Chit (directly or indirectly)
 */
function findChitClasses(allClasses: ClassDefinition[]): ChitClassInfo[] {
  const chitClasses = new Set<string>();
  const classMap = new Map<string, ClassDefinition>();

  // Build a map of className -> ClassDefinition
  for (const cls of allClasses) {
    classMap.set(cls.className, cls);
  }

  // Start with Chit and classes that contain "Chit" in their name or extend something with "Chit"
  chitClasses.add("Chit");
  for (const cls of allClasses) {
    if (cls.className.includes("Chit") || cls.extendsFrom.includes("Chit")) {
      chitClasses.add(cls.className);
    }
  }

  // Iteratively add any class that extends a known Chit class
  let previousSize = 0;
  while (chitClasses.size !== previousSize) {
    previousSize = chitClasses.size;

    for (const cls of allClasses) {
      if (chitClasses.has(cls.extendsFrom)) {
        chitClasses.add(cls.className);
      }
    }
  }

  // Build the result array, excluding abstract classes
  const result: ChitClassInfo[] = [];
  for (const cls of allClasses) {
    if (chitClasses.has(cls.className) && !cls.isAbstract) {
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
      // Skip the generated ChitLibrary.ts file
      if (entry.name !== "ChitLibrary.ts") {
        files.push(fullPath);
      }
    }
  }

  return files;
}

/**
 * Generates the ChitLibrary.ts file
 */
export async function generateChitLibrary(chitsDir: string): Promise<void> {
  try {
    // Scan for all TypeScript files
    const files = await scanDirectory(chitsDir);

    // Parse each file for all class definitions
    const allClassDefs: ClassDefinition[] = [];
    for (const file of files) {
      const classes = await parseFileForClasses(file, chitsDir);
      allClassDefs.push(...classes);
    }

    // Determine which classes extend Chit (directly or indirectly)
    const allChitClasses = findChitClasses(allClassDefs);

    if (allChitClasses.length === 0) {
      console.log(`No Chit classes found in ${chitsDir}`);
      return;
    }

    // Generate imports
    const imports = allChitClasses.map((info) => {
      const importPath = "./" + info.filePath.replace(/\.tsx?$/, "");
      return `import { ${info.className} } from "${importPath}";`;
    });

    // Generate the library object
    const libraryEntries = allChitClasses.map((info) => {
      return `  ${info.className},`;
    });

    // Generate the file content
    const fileContent = `import { IChitLibrary } from "@pretty-chitty/core";

${imports.join("\n")}

export const ChitLibrary: IChitLibrary<Player, Root> = {
${libraryEntries.join("\n")}
};
`;

    // Write the file
    const outputPath = path.join(chitsDir, "ChitLibrary.ts");
    await writeFile(outputPath, fileContent);

    console.log(`Generated ChitLibrary.ts with ${allChitClasses.length} Chit class(es)`);
  } catch (error) {
    console.error(`Error generating ChitLibrary:`, error);
    throw error;
  }
}
