const path = require('path')
const webpack = require('webpack')
const { merge } = require('webpack-merge')
const TerserPlugin = require('terser-webpack-plugin')

const library = 'WebmStream'
const base = {
  entry: {
    'webm-stream': './src/index.js',
  },
  mode: 'production',
  devtool: 'source-map',
  output: {
    path: path.join(__dirname, 'dist'),
    filename: '[name].js',
    library: {},
  },
  optimization: {
    minimize: false,
  },
}

const full = {
  resolve: {
    alias: {
      stream: "stream-browserify",
    },
    fallback: {
      "stream": require.resolve("stream-browserify"),
      "buffer": require.resolve("buffer/"),
    }
  },
  plugins: [
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
    }),
  ],
}

const min = {
  optimization: {
    minimize: true,
    minimizer: [new TerserPlugin({ extractComments: false })],
  },
}
const extern = {
  externals: {
    'ebml.js': {
      commonjs: 'ebml.js',
      commonjs2: 'ebml.js',
      root: 'EBML',
    },
    'ebml-demuxer': {
      commonjs: 'ebml-demuxer',
      commonjs2: 'ebml-demuxer',
      root: 'EBMLDemux',
    }
  },
}
const iife = {
  output: {
    library: {
      name: library,
      type: 'window',
    },
    iife: true,
  },
}
const umd = {
  output: {
    library: {
      name: library,
      type: 'umd',
    },
    globalObject: 'this',
  },
}
const cjs = {
  output: {
    library: {
      type: 'commonjs2',
    },
  },
}

const configs = [
  merge(base, iife, full, min, {
    output: {
      filename: '[name].iife.full.min.js',
    },
  }),
  merge(base, iife, full, {
    output: {
      filename: '[name].iife.full.js',
    },
  }),
  merge(base, iife, min, extern, {
    output: {
      filename: '[name].iife.min.js',
    },
  }),
  merge(base, iife, extern, {
    output: {
      filename: '[name].iife.js',
    },
  }),
  merge(base, umd, full, min, {
    output: {
      filename: '[name].umd.full.min.js',
    },
  }),
  merge(base, umd, full, {
    output: {
      filename: '[name].umd.full.js',
    },
  }),
  merge(base, umd, min, extern, {
    output: {
      filename: '[name].umd.min.js',
    },
  }),
  merge(base, umd, extern, {
    output: {
      filename: '[name].umd.js',
    },
  }),
  // merge(base, cjs, extern, {
  //   output: {
  //     filename: '[name].cjs.js',
  //   },
  // }),
  // merge(base, cjs, min, extern, {
  //   output: {
  //     filename: '[name].cjs.min.js',
  //   },
  // }),
]

module.exports = [
  ...configs,
]