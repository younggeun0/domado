/**
 * Base webpack config used across other specific configs
 */

import webpack from 'webpack';
import TsconfigPathsPlugins from 'tsconfig-paths-webpack-plugin';
import dotenv from 'dotenv';
import webpackPaths from './webpack.paths';
import { dependencies as externals } from '../../release/app/package.json';

// TODO, dotenv 대신 입력받아 사용하도록 변경(localStroage에 저장)
// TODO, 환경변수 미설정 시 에러 발생처리 or 노션 기록 제거
dotenv.config();

const configuration: webpack.Configuration = {
  externals: [...Object.keys(externals || {})],

  stats: 'errors-only',

  module: {
    rules: [
      {
        test: /\.[jt]sx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'ts-loader',
          options: {
            // Remove this line to enable type checking in webpack builds
            transpileOnly: true,
            compilerOptions: {
              module: 'esnext',
            },
          },
        },
      },
    ],
  },

  output: {
    path: webpackPaths.srcPath,
    // https://github.com/webpack/webpack/issues/1114
    library: {
      type: 'commonjs2',
    },
  },

  /**
   * Determine the array of extensions that should be used to resolve modules.
   */
  resolve: {
    extensions: ['.js', '.jsx', '.json', '.ts', '.tsx'],
    modules: [webpackPaths.srcPath, 'node_modules'],
    // There is no need to add aliases here, the paths in tsconfig get mirrored
    plugins: [new TsconfigPathsPlugins()],
  },

  plugins: [
    new webpack.EnvironmentPlugin({
      NODE_ENV: 'production',
      NOTION_POMODORO_DATABASE_ID: process.env.NOTION_POMODORO_DATABASE_ID,
      NOTION_KEY: process.env.NOTION_KEY,
    }),
  ],
};

export default configuration;
