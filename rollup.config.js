import svelte from 'rollup-plugin-svelte-hot'
import Hmr from 'rollup-plugin-hot'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import typescript from '@rollup/plugin-typescript'
import json from '@rollup/plugin-json'
import livereload from 'rollup-plugin-livereload'
import { terser } from 'rollup-plugin-terser'
import { copySync, removeSync } from 'fs-extra'
import { spassr } from 'spassr'
import getConfig from '@roxi/routify/lib/utils/config'
import autoPreprocess from 'svelte-preprocess'

const { distDir } = getConfig() // use Routify's distDir for SSOT
const assetsDir = 'assets'
const buildDir = `dist/build`
const isNollup = !!process.env.NOLLUP
const production = !process.env.ROLLUP_WATCH
process.env.NODE_ENV = production ? 'production' : 'development'

// clear previous builds
removeSync(distDir)
removeSync(buildDir)

const serve = () => ({
  writeBundle: async () => {
    const options = {
      assetsDir: [assetsDir, distDir],
      entrypoint: `${assetsDir}/__app.html`,
      script: `${buildDir}/main.js`,
    }

    spassr({ ...options, port: 5001 })
  },
})

const copyToDist = () => ({
  writeBundle() {
    copySync(assetsDir, distDir)
  },
})

export default {
  preserveEntrySignatures: false,
  input: ['src/main.ts'],
  output: {
    sourcemap: true,
    format: 'esm',
    dir: buildDir,
    // for performance, disabling filename hashing in development
    chunkFileNames: `[name]${(production && '-[hash]') || ''}.js`,
  },
  plugins: [
    svelte({
      dev: !production, // run-time checks
      // Extract component CSS — better performance
      css: (css) => css.write(`bundle.css`),
      hot: isNollup,
      preprocess: [
        autoPreprocess({
          postcss: require('./postcss.config.js'),
          defaults: { style: 'postcss' },
        }),
      ],
    }),

    // resolve matching modules from current working directory
    resolve({
      browser: true,
      // dedupe: (importee) => !!importee.match(/svelte(\/|$)/) && !!importee.match(/@zeainc(\/|$)/),
      dedupe: [
        'svelte',
        'svelte-dev-helper',
        'svelte-hmr',
        'svelte-loader',
        'svelte-preprocess',
        'svelte-accessible-dialog',
        'svelte-check',
        '@zeainc',
      ],
    }),
    commonjs(),
    typescript({
      sourceMap: !production,
      inlineSources: !production,
    }),

    production && terser(),
    !production && !isNollup && serve(),
    !production && !isNollup && livereload(distDir), // refresh entire window when code is updated
    !production && isNollup && Hmr({ inMemory: true, public: assetsDir }), // refresh only updated code
    {
      // provide node environment on the client
      transform: (code) => ({
        code: code.replace('process.env.NODE_ENV', `"${process.env.NODE_ENV}"`),
        map: { mappings: '' },
      }),
    },
    production && copyToDist(),

    json(),
  ],
  watch: {
    clearScreen: false,
    buildDelay: 100,
  },
}
