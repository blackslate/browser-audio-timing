const { readFileSync, writeFileSync } = require('fs')
const { join } = require('path')
const file = join(__dirname, 'updated.json')

const ORIGINAL = 
/\{"clip":\[([0-9,.]+)\],"firefox":\[([0-9,.]+)\],"chrome":\[([0-9,.]+)\],"safari":\[([0-9,.]+)\],"edge":\[([0-9,.]+)\],"opera":\[([0-9,.]+)\]\}(,?)/


const TIMING_REGEX = 
/\{\\"clip\\":\[([0-9,.]+)\],\\"firefox\\":\[([0-9,.]+)\],\\"chrome\\":\[([0-9,.]+)\],\\"safari\\":\[([0-9,.]+)\],\\"edge\\":\[([0-9,.]+)\],\\"opera\\":\[([0-9,.]+)\]\}(,?)/gi

const TIMING_REPLACE = `{
      "clip": [ $1 ],
      "firefox": [ $2 ],
      "chrome": [ $3 ],
      "safari": [ $4 ],
      "edge": [ $5 ],
      "opera": [ $6 ]
    }$7
    `
const START_REGEX = /\{\\"([a-z_.-]+)\\":\{\\"url\\":\\"(.\/[a-z0-9_.-]+)\\",\\"([a-z_.-]+)\\":\{/

const START_REPLACE = `{
  "$1": {
    "url": "$2",
    "$3": {`

const QUOTE_REGEX = /\\\"/g
const QUOTE_REPLACE = `"`

const SPACE_REGEX = /\":\s*\{/g
const SPACE_REPLACE= '": {'

const COMMA_REGEX = /(\d),\s*/g
const COMMA_REPLACE= '$1, '

const END_REGEX = /\}\n    \}\}\"/
const END_REPLACE = `}
  }
}`

let text = readFileSync(file, "utf-8")

const next = text
.replace(TIMING_REGEX, TIMING_REPLACE)
.replace(START_REGEX, START_REPLACE)
.replace(QUOTE_REGEX, QUOTE_REPLACE)
.replace(SPACE_REGEX, SPACE_REPLACE)
.replace(COMMA_REGEX, COMMA_REPLACE)
.replace(END_REGEX, END_REPLACE)

writeFileSync(file, next, "utf-8")