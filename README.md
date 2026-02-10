# Pretty Chitty

Pretty Chitty is a pretty & chitty board game platform. It's a typescript framework that makes it quick and easy to build high quality async or realtime 3d strategy games.

This cli utility is a necessary tool to build and develop Pretty Chitty games.

## Prerequisites

Install the Pretty Chitty CLI globally:

```bash
npm install -g @pretty-chitty/cli
# or
yarn global add @pretty-chitty/cli
```

This allows you to use the `pretty-chitty-cli` command from anywhere on your system.

## Available Commands

### `create`

Creates a new game project from the template.

```bash
pretty-chitty-cli create
```

**What it does:**

- Prompts you for a game name (alphanumeric characters only, cannot start with a number)
- Will create a boilerplate game in the working directory

**Usage:**
Run this command in an empty directory where you want to create your new game.

---

### `watch` (or `start`)

Starts the development server with hot-reloading.

```bash
npm start
# or
yarn start
# or
pretty-chitty-cli watch
```

**What it does:**

- Generates required library files (ChitLibrary and CanvasLibrary)
- Watches the `src/assets/*` directory for changes and automatically processes sprite sheets
- Watches the `src/chits` directory and regenerates ChitLibrary when files change
- Watches the `src/canvas` directory and regenerates CanvasLibrary when files change
- Starts webpack-dev-server in development mode with hot module replacement
- Opens your game in a browser at `http://localhost:8080`

**Development workflow:**

- Any changes to your TypeScript/React files will automatically refresh the browser
- Asset changes (images in `src/assets`) are automatically processed into optimized sprite sheets
- Chit and canvas component changes trigger automatic library regeneration

---

### `build`

Creates a production build of your game.

```bash
npm run build
# or
yarn build
# or
pretty-chitty-cli build
```

**What it does:**

- Generates required library files (ChitLibrary and CanvasLibrary)
- Processes all assets in `src/assets` into optimized sprite sheets
- Deletes the existing `dist` folder to ensure a clean build
- Runs webpack in production mode with optimizations
- Creates two bundles:
  - `game.[hash].js` - Main browser bundle
  - `node.[hash].js` - Node.js compatible bundle (for serverside running of games)
- Outputs minified, optimized files to the `dist` directory

**Output:**
All production files are placed in the `dist` directory, ready for deployment.

---

### `deploy`

Builds and deploys your game to an FTP server.

```bash
npm run deploy
# or
yarn deploy
# or
pretty-chitty-cli deploy
```

**What it does:**

1. Prompts for FTP credentials on first run (saves to `.ftpsettings.json`)
   - FTP host
   - FTP username
   - FTP password
   - Remote path on the FTP server
   - Public URL path (maps to remote path)
2. Auto-increments the patch version in `package.json`
3. Loads the Node.js bundle to extract game metadata (name, description, box art, screenshots) and theme colors
4. Generates `publishedGame.json` with all metadata and asset URLs
5. Uploads all files from `dist` to the FTP server
6. Skips files that already exist on the server (incremental uploads)

**FTP Settings:**
The first time you run deploy, you'll be prompted for FTP settings. These are saved to `.ftpsettings.json` in your project root. To change settings, either:

- Delete `.ftpsettings.json` and run deploy again, or
- Edit `.ftpsettings.json` directly

**Example `.ftpsettings.json`:**

```json
{
  "host": "ftp.example.com",
  "username": "your-username",
  "password": "your-password",
  "remotePath": "/public_html/games/your-game",
  "publicUrlPath": "https://example.com/games/your-game/"
}
```

**Note:** Add `.ftpsettings.json` to your `.gitignore` to keep credentials secure.

---

## Project Structure

```
your-game/
├── src/
│   ├── assets/          # Game assets (sprites, images)
│   │   └── output/      # Processed sprite sheets (auto-generated)
│   ├── chits/           # Chit components (game pieces)
│   ├── canvas/          # Canvas components (game screens)
│   └── YourGame.ts      # Main game entry point
├── dist/                # Production build output
├── package.json         # Project dependencies and scripts
└── .ftpsettings.json    # FTP deployment settings (git-ignored)
```

## Development Tips

- **Assets**: Place image files in subdirectories under `src/assets/`. Each subdirectory is processed into a sprite sheet.
- **Chits**: Create game piece components in `src/chits/`. The ChitLibrary is auto-generated.
- **Canvas**: Create screen/view components in `src/canvas/`. The CanvasLibrary is auto-generated.
- **Hot Reload**: The dev server supports hot module replacement for rapid iteration.

## Dependencies

This project uses:

- **React** - UI components
- **Three.js** - 3D rendering capabilities
- **@pretty-chitty/core** - Core game framework
- **@pretty-chitty/cli** - Build and development tools
- **TypeScript** - Type-safe development

## Learn More

For more information about the Pretty Chitty framework, visit the documentation or explore the `@pretty-chitty/core` package.
