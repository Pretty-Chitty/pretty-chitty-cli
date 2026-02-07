import path from "path";
import { promises as fs } from "fs";

export async function createFiles() {
  try {
    const packageJsonPath = path.join(".", "package.json");

    // Read package.json and parse it
    const packageJsonData = await fs.readFile(packageJsonPath, "utf8");
    const packageJson = JSON.parse(packageJsonData);

    // Define the build directory path
    const buildDir = path.join(".", "build");

    // Ensure the build directory exists
    await fs.mkdir(buildDir, { recursive: true });

    // File names and their contents
    const files = [
      {
        name: "index.tsx",
        content: `import React from "react";
      import { createRoot } from "react-dom/client";
      import Root from "./root";
      
      const container = document.getElementById("root");
      if (container) {
        const root = createRoot(container);
        root.render(<Root />);
      }`,
      },
      {
        name: "index.html",
        content: `<!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>A Pretty, Chitty Game Engine</title>
        </head>
        <body>
          <div id="root"></div>
          <!-- Webpack will output your JavaScript here -->
        </body>
      </html>`,
      },
      {
        name: "root.tsx",
        content: `import React from "react";
      import Game from "${path.join("..", packageJson.entry ?? packageJson.main)}";
      import { GameDesigner } from "@pretty-chitty/core";
      
      export default function Root() {
        const game = new Game();
        return <GameDesigner game={game} />
      }`,
      },
      {
        name: "entry.tsx",
        content: `
        import React from "react";
        import { createRoot } from "react-dom/client";
        import Game from "${path.join("..", packageJson.entry ?? packageJson.main)}";
        import { Match, Connection, ClientTrustMatchViewer, ServerTrustMatchViewer, DemoWrapper } from "@pretty-chitty/core";
        import type { IMatchStorage } from "@pretty-chitty/core";
        
        export function createClientTrustMatchViewer(container: HTMLElement, storage: IMatchStorage, playerId: string, players: IPlayerInfo[], onBack: () => void, onLoadProgress: (panelsCreated:number,panelsLoaded:number) => void, options: any) {
          const root = createRoot(container);
          const game = new Game();
          root.render(<ClientTrustMatchViewer game={game} playerId={playerId} players={players} matchStorage={storage} onBack={onBack} onLoadProgress={onLoadProgress} options={options} />);
        }

        export function createServerTrustMatchViewer(container: HTMLElement, playerId: string, transport: ConnectionTransport, onBack: () => void, onLoadProgress: (panelsCreated:number,panelsLoaded:number) => void) {
          const root = createRoot(container);
          const game = new Game();
          root.render(<ServerTrustMatchViewer game={game} playerId={playerId} transport={transport} onBack={onBack} onLoadProgress={onLoadProgress} />);
        }

        export function createDemoMatchViewer(container: HTMLElement) {
          const root = createRoot(container);
          const game = new Game();
          root.render(<DemoWrapper game={game} />);
        }

        export { Game, Match, Connection };
        `,
      },
      {
        name: "entry-node.tsx",
        content: `
import Game from "${path.join("..", packageJson.entry ?? packageJson.main)}";
import { Match, Connection } from "@pretty-chitty/core";

export { Game, Match, Connection };
`,
      },
    ];

    // Create and write to files
    await Promise.all(files.map((file) => fs.writeFile(path.join(buildDir, file.name), file.content)));

    console.log("All files have been created successfully.");
  } catch (error) {
    console.error("An error occurred:", error);
  }
}
