import { Configuration } from 'webpack';
import mergeWebpack from 'webpack-merge';
import nodeExternals from 'webpack-node-externals';
import TerserPlugin from 'terser-webpack-plugin';

import { BuildElectronBuilderOptions } from '../builders/build/build.impl';
import { getBaseWebpackPartial } from './config';

function getElectronPartial(options: BuildElectronBuilderOptions): Configuration {
  const webpackConfig: Configuration = {
    output: {
      libraryTarget: 'commonjs'
    },
    target: 'electron-main',
    node: false
  };

  if (options.optimization) {
    webpackConfig.optimization = {
      minimize: false,
      concatenateModules: false
    };
  }

  if (options.obfuscate) {
    const obfuscationOptimization = {
      minimize: true,
      minimizer: [
        new TerserPlugin({
          chunkFilter: (chunk) => {
            // Exclude uglification for the `vendor` chunk
            if (chunk.name === 'vendor') {
              return false;
            }
  
            return true;
          },
          parallel: true,
          terserOptions: {
            mangle: true,
            keep_fnames: false,
            toplevel: true,
          }
        }),
      ],
    };

    if (webpackConfig.optimization) {
      webpackConfig.optimization = Object.assign(webpackConfig.optimization, obfuscationOptimization);
    } else {
      webpackConfig.optimization = obfuscationOptimization;
    }
  }

  if (options.externalDependencies === 'all') {
    webpackConfig.externals = [nodeExternals()];
  } else if (Array.isArray(options.externalDependencies)) {
    webpackConfig.externals = [
      function(context, request, callback: Function) {
        if (options.externalDependencies.includes(request)) {
          // not bundled
          return callback(null, 'commonjs ' + request);
        }
        // bundled
        callback();
      }
    ];
  }
  return webpackConfig;
}

export function getElectronWebpackConfig(options: BuildElectronBuilderOptions) {
  return mergeWebpack(getBaseWebpackPartial(options), getElectronPartial(options)); // was array
}
