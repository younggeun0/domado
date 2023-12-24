/**
 * Base webpack config used across other specific configs
 */

import webpack from 'webpack'
import TsconfigPathsPlugins from 'tsconfig-paths-webpack-plugin'
import dotenv from 'dotenv'
import webpackPaths from './webpack.paths'
import { dependencies as externals } from '../../release/app/package.json'

// When building for production, we want to load the .env file for setting default notion keys
dotenv.config()

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
      NOTION_POMODORO_DATABASE_ID:
        process.env.NOTION_POMODORO_DATABASE_ID || null,
      NOTION_KEY: process.env.NOTION_KEY || null,
    }),
  ],
}

export default configuration
