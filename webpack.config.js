import path from "path";
import webpack from "webpack";
import TerserPlugin from "terser-webpack-plugin";
import HtmlWebpackPlugin from "html-webpack-plugin";
import ReactRefreshWebpackPlugin from "@pmmmwh/react-refresh-webpack-plugin";
import ReactRefreshBabel from "react-refresh/babel";
import { BundleAnalyzerPlugin } from "webpack-bundle-analyzer";
import ForkTsCheckerWebpackPlugin from "fork-ts-checker-webpack-plugin";

const dist = path.join(process.cwd(), "dist");
const __dirname = path.dirname(new URL(import.meta.url).pathname);

export default (env) => {
  const isDevelopment = env.TARGET_ENV === "dev";
  const isNode = !!env.IS_NODE;
  const sourceMaps = true;

  console.log("working dir", env.WORKING_DIR);
  return {
    target: isNode ? "node" : undefined,
    mode: isDevelopment ? "development" : "production",

    experiments: isDevelopment
      ? undefined
      : {
          outputModule: true,
        },
    entry: path.join(
      env.WORKING_DIR,
      isDevelopment ? "./build/index.tsx" : isNode ? "./build/entry-node.tsx" : "./build/entry.tsx",
    ),
    output: {
      chunkFormat: isNode ? "module" : undefined,

      path: isDevelopment ? dist : path.join(env.WORKING_DIR, "./dist"),
      umdNamedDefine: isDevelopment,
      library: isDevelopment ? "game" : undefined,
      libraryTarget: isDevelopment ? "umd" : "module",
      filename: isDevelopment ? "game.js" : `${isNode ? "node" : "game"}.[contenthash].js`,
    },
    plugins: [
      // TypeScript type checking (only fails build in production)
      new ForkTsCheckerWebpackPlugin({
        async: isDevelopment,
        typescript: {
          configFile: path.join(__dirname, "tsconfig.json"),
        },
      }),
      // Node build: replace frontend modules with stubs
      ...(isNode
        ? [
            new webpack.NormalModuleReplacementPlugin(/^three$/, path.join(__dirname, "stubs/three-stub.js")),
            new webpack.NormalModuleReplacementPlugin(/^react$/, path.join(__dirname, "stubs/react-stub.js")),
            new webpack.NormalModuleReplacementPlugin(/^react-dom$/, path.join(__dirname, "stubs/react-dom-stub.js")),
            new webpack.NormalModuleReplacementPlugin(
              /^react-dom\/client$/,
              path.join(__dirname, "stubs/react-dom-client-stub.js"),
            ),
            new webpack.NormalModuleReplacementPlugin(/^@mui\//, path.join(__dirname, "stubs/mui-stub.js")),
            new webpack.NormalModuleReplacementPlugin(/^@material-ui\//, path.join(__dirname, "stubs/mui-stub.js")),
          ]
        : []),
      // Bundle analyzer (opt-in via ANALYZE env var)
      ...(env.ANALYZE && !isNode ? [new BundleAnalyzerPlugin()] : []),
      // Development plugins
      ...[
        isDevelopment && new ReactRefreshWebpackPlugin(),
        isDevelopment && new webpack.HotModuleReplacementPlugin(),
        isDevelopment &&
          new HtmlWebpackPlugin({
            template: path.join(env.WORKING_DIR, "./build/index.html"), // Path to your index.html file
          }),
      ].filter(Boolean),
    ],
    devtool: sourceMaps && !isNode ? "source-map" : undefined,
    devServer: {
      static: "./dist",
      hot: true,
      liveReload: false,
      devMiddleware: { writeToDisk: true },
      allowedHosts: "all",
      compress: true,
      historyApiFallback: true,
      headers: {
        "Access-Control-Allow-Origin": "*", // Allow all origins
      },
    },
    module: {
      // For Node builds, don't error on missing exports from stubbed modules
      ...(isNode && {
        parser: {
          javascript: {
            exportsPresence: "warn",
          },
        },
      }),
      rules: [
        {
          test: /\.js$/,
          enforce: "pre",
          use: ["source-map-loader"],
        },
        {
          test: /\.(ts|tsx)$/,
          use: {
            loader: "babel-loader",
            options: {
              presets: ["@babel/preset-env", "@babel/preset-react", "@babel/preset-typescript"],
              plugins: [
                isDevelopment && ReactRefreshBabel,

                "babel-plugin-transform-typescript-metadata",
                ["@babel/plugin-proposal-decorators", { legacy: true }],
                ["@babel/plugin-proposal-class-properties", { loose: true }],
                ["@babel/plugin-transform-private-methods", { loose: true }],
                ["@babel/plugin-transform-private-property-in-object", { loose: true }],
              ].filter(Boolean),

              sourceMaps: sourceMaps,
            },
          },
        },
        {
          test: /\.(js)$/,
          use: {
            loader: "babel-loader",
            options: {
              presets: ["@babel/preset-env", "@babel/preset-react"],
              plugins: [isDevelopment && ReactRefreshBabel].filter(Boolean),

              sourceMaps: sourceMaps,
            },
          },

          exclude: /node_modules/,
        },
        {
          test: /(\.svg)|(inline\.png)|(inline\.jpg)/,
          type: isNode ? "asset/resource" : "asset/inline",
        },
        {
          test: /\.(png)|(jpg)/,
          exclude: /(inline\.png)|(inline\.jpg)/,
          type: "asset/resource",
        },
        {
          test: /\.(css|sass|scss)$/,
          use: isNode ? "null-loader" : [{ loader: "style-loader" }, { loader: "css-loader" }],
        },
      ].filter((a) => a),
    },

    optimization: {
      usedExports: true,
      sideEffects: true,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            keep_fnames: true,
            keep_classnames: true,
            compress: {
              dead_code: true,
              unused: true,
            },
          },
        }),
      ],
    },
    // Ignore warnings from node_modules (e.g., stubbed exports in nested dependencies)
    ignoreWarnings: [
      {
        module: /node_modules/,
      },
    ],
    resolve: {
      extensions: [".tsx", ".ts", ".js"],

      symlinks: false,
    },
  };
};
