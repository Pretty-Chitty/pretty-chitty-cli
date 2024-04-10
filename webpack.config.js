import path from "path";
import webpack from "webpack";
import HtmlWebpackPlugin from "html-webpack-plugin";
import ReactRefreshWebpackPlugin from "@pmmmwh/react-refresh-webpack-plugin";
import ReactRefreshBabel from "react-refresh/babel";

const isDevelopment = true; // process.env.NODE_ENV !== "production";
const dist = path.join(process.cwd(), "dist");

console.log(dist);
export default (env) => {
  console.log("working dir", env.WORKING_DIR);
  return {
    mode: isDevelopment ? "development" : "production",

    entry: path.join(env.WORKING_DIR, "./build/index.tsx"),
    output: {
      path: dist,
      umdNamedDefine: true,
      library: "game",
      libraryTarget: "umd",
      filename: "game.js",
    },
    plugins: [
      ...[
        isDevelopment && new ReactRefreshWebpackPlugin(),
        isDevelopment && new webpack.HotModuleReplacementPlugin(),
        isDevelopment &&
          new HtmlWebpackPlugin({
            template: "./build/index.html", // Path to your index.html file
          }),
      ].filter(Boolean),
      ,
    ],
    devtool: "source-map",
    devServer: {
      static: "./dist",
      hot: true,
      liveReload: false,
      devMiddleware: { writeToDisk: true },
      allowedHosts: "all",
      compress: true,
    },
    module: {
      rules: [
        {
          test: /\.(ts|tsx|js)$/,
          use: {
            loader: "babel-loader",
            options: {
              presets: ["@babel/preset-env", "@babel/preset-react", "@babel/preset-typescript"],
              plugins: [
                // "@babel/plugin-transform-typescript",
                // ["@babel/plugin-syntax-decorators", { legacy: true }],
                isDevelopment && ReactRefreshBabel,

                "babel-plugin-transform-typescript-metadata",
                ["@babel/plugin-proposal-decorators", { legacy: true }],
                ["@babel/plugin-proposal-class-properties", { loose: true }],
                // ["@babel/plugin-proposal-decorators", { version: "2023-05" }],
              ].filter(Boolean),

              sourceMaps: true,
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
      ],
    },
    resolve: {
      extensions: [".tsx", ".ts", ".js"],
    },
  };
};
