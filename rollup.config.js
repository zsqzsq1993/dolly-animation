import resolve from "@rollup/plugin-node-resolve"
import commonjs from "@rollup/plugin-commonjs"
import pkg from "./package.json"

export default [
    // umd
    {
        input: 'src/index.js',
        output: {
            name: 'dolly-animation',
            file: pkg.browser,
            format: 'umd'
        },
        plugins: [
            resolve(),
            commonjs()
        ]
    },

    // commonJs
    {
        input: 'src/index.js',
        output: [
            { file: pkg.main, format: 'cjs' },
            { file: pkg.module, format: 'es' }
        ]
    }
]
