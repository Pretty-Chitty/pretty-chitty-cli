import path from "path";
import webpack from "webpack";
import TerserPlugin from "terser-webpack-plugin";
import HtmlWebpackPlugin from "html-webpack-plugin";
import ReactRefreshWebpackPlugin from "@pmmmwh/react-refresh-webpack-plugin";
import ReactRefreshBabel from "react-refresh/babel";

const dist = path.join(process.cwd(), "dist");

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
    entry: path.join(env.WORKING_DIR, isDevelopment ? "./build/index.tsx" : "./build/entry.tsx"),
    output: {
      chunkFormat: isNode ? "module" : undefined,

      path: isDevelopment ? dist : path.join(env.WORKING_DIR, "./dist"),
      umdNamedDefine: isDevelopment,
      library: isDevelopment ? "game" : undefined,
      libraryTarget: isDevelopment ? "umd" : "module",
      filename: isDevelopment ? "game.js" : `${isNode ? "node" : "game"}.[contenthash].js`,
    },
    plugins: [
      ...[
        isDevelopment && new ReactRefreshWebpackPlugin(),
        isDevelopment && new webpack.HotModuleReplacementPlugin(),
        isDevelopment &&
          new HtmlWebpackPlugin({
            template: path.join(env.WORKING_DIR, "./build/index.html"), // Path to your index.html file
          }),
      ].filter(Boolean),
    ],
    devtool: sourceMaps ? "source-map" : undefined,
    devServer: {
      static: "./dist",
      hot: true,
      liveReload: false,
      devMiddleware: { writeToDisk: true },
      allowedHosts: "all",
      compress: true,
      headers: {
        "Access-Control-Allow-Origin": "*", // Allow all origins
      },
    },
    module: {
      rules: [
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
          type: "asset/inline",
        },
        {
          test: /\.(png)|(jpg)/,
          exclude: /(inline\.png)|(inline\.jpg)/,
          type: "asset/resource",
        },
        {
          test: /\.(css|sass|scss)$/,
          use: [
            {
              loader: "style-loader",
            },
            {
              loader: "css-loader",
            },
          ],
        },
      ].filter((a) => a),
    },

    optimization: {
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            keep_fnames: true,
            keep_classnames: true,
          },
        }),
      ],
    },
    resolve: {
      extensions: [".tsx", ".ts", ".js"],

      symlinks: false,
    },
  };
};
