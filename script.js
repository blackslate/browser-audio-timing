/**
 * script.js
 */


// Load timings from external JSON file
fetch('./timings.json')
  .then(response => response.json())
  .then(json => json.words || json)
  .then(initialize)
  .catch(error => console.log("error:", error))


// <<< HARD-CODED constants
const DELAY = 2500

// Calculating red/blue shift
const MAX   = 1.5  // max observed = 1.4 for 182 on Firefox
const PEAK  = 255  // "FF"
const N     = 1  // use 0.5 to exaggerate color at lower deltas
const SCALE = Math.pow(PEAK, 1/N) / MAX

// Calculating top of play-mark div for Play All First Column
const FONT_SIZE = 16
const RATIO     = 2.4
const JUMP      = FONT_SIZE * RATIO
// HARD-CODED >>>


// Possibly inaccurate check on userAgent
const userAgent = navigator.userAgent.match(/Edg\//i)
  ? "edge"
  : navigator.userAgent.match(/Opera|OPR\//i)
    ? "opera"
    : (/opr|chrome|safari|edge|firefox|opera/i.exec(navigator.userAgent) || ["chrome"])[0].toLowerCase()


// Get pointers to interactive DOM elements
const selectFile = document.getElementById("select-file")
const first      = document.getElementById("first")
const second     = document.getElementById("second")
const predefined = document.getElementById("predefined")
const playMark   = document.getElementById("play-mark")
const playAll    = document.getElementById("play-all")
const stopPlay   = document.getElementById("stop")

const selected   = document.getElementById("selected")
const label      = document.getElementById("label")
const start      = document.getElementById("start")
const finish     = document.getElementById("finish")
const playOne    = document.getElementById("play-one")
const set        = document.getElementById("set")

const scroll     = document.getElementById("scroll")
const logTiming  = document.getElementById("log-timing")


// Adopt detected browser in first select element
first.value = userAgent
let using = first.value

let filesData     // { key: { url: "", word: { clip }}, ...}
let url           // file containing audio
let timing = []   // [ "url": "./audio.file",
                  //   { label,
                  //     clip: [ start, finish ],
                  //     <browser>: [ start, finish ] },
                  //     ...
                  //   },
                  //   ...
                  // ]
let timings = []  // [ [ start, finish ], ... ] for Play All
let index = 1     // of item in timing that was chosen
let clip = [0, 0] // [ start, finish ] of clicked item in timing
let interval      // integer value from clearInterval


// Event listeners
selectFile.addEventListener("change", changeFile)
first.addEventListener("change", setComparison)
second.addEventListener("change", setComparison)
predefined.addEventListener("click", selectTime)
playAll.addEventListener("click", playAllClips)
stopPlay.addEventListener("click", stopPlayback)

playOne.addEventListener("click", playCustomClip)
start.addEventListener("change", updateClip)
finish.addEventListener("change", updateClip)
set.addEventListener("click", updateSettings)

scroll.addEventListener("click", tweakNext)
logTiming.addEventListener("click", logTimingData)


/**
 * Called when fetch promise is resolved.
 *
 * @param {object} json was read from timings.json
 *
 * Create option for the select menu to choose which file to treat
 */
function initialize(json) {
  filesData = json

  const keys = Object.keys(json)
  if (keys.length > 1) {
    // Multiple options
    const options = keys.forEach( key => {
      const option = document.createElement("option")
      option.value = key
      option.innerText = filesData[key].url.replace(/^.*\//, "")
      selectFile.append(option)
    })

  } else {
    // Only one file defined in timings.json: use span, not select
    const nameSpan = document.createElement("span")
    const data = filesData[keys[0]]
    nameSpan.innerText = data.url.replace(/^[./]+/, "")
    selectFile.replaceWith(nameSpan)
  }

  // Load the first file defined in timings.json
  changeFile({ target: { value: keys[0] }})
}


/**
 * Called when the selectFile option is changed. Loads the data
 * associated with the new audio file.
 *
 * Creates the timing object, with the format...
 *
 *   [ "url": "./audio.file",
 *     { label,
 *       "clip": [ start, finish ],
 *       <browser>: [ start, finish ],
 *       ...
 *     },
 *     ...
 *   ]
 *
 * ... and generates a DOM list to display the snippets, and
 * options for the select menus to choose comparisons
 */
function changeFile({ target }) {
  const file = target.value
  timing = Object.entries(filesData[file])
  url = timing[0][1]

  timing = timing.map(([ label, timing ] ) => {
    if (typeof timing === "object") {
      return { label, ...timing }
    } else {
      return timing // actually the audio url
    }
  })

  generateOptions() // so generateList() can read the first.value
  generateList()
}


/**
 * Called by either the first or second comparison selector
 *
 * @param {object} onChange event
 *
 * Regenerates the timing list for the requested browser or source
 */
function setComparison({ target }) {
  const { id, value } = target

  if (id === "first"){
    using = value
  }

  generateList()
}


function generateOptions() {
  const options = Object.keys(timing[1])
  // ['label', 'clip', <browser>, ... ]

  empty(first)
  empty(second)

  options.forEach( browser => {
    if (browser !== "label") {
      const title = (browser === "clip")
        ? "MP3"
        : (browser === "browser")
          ? "All browsers"
          : browser[0].toUpperCase() + browser.substring(1)

      const option = document.createElement("option")
      option.value = browser
      option.innerText = title

      first.append(option)
      second.append(option.cloneNode(true))
    }
  })

  const selection = (options.indexOf(userAgent) < 0)
    ? (options.indexOf("browser") < 0)
      ? "clip"
      : "browser"
    : userAgent

  first.value = selection
}


/**
 * Called by changeFile() and setComparison(), when the audio
 * file or the browser to compare changes
 *
 * Generates a list of interactive items, each with three parts:
 *
 *            first comparison     second comparison
 *   -----    -----------------    -----------------
 *   label    [ start, finish ]    [ start, finish ]
 *
 * The start-finish buttons may be coloured blue or red depending
 * on whether the timing of the playback requestsneeds to be
 * earlier or later than the audio file's actual timing.
 */
function generateList() {
  empty(predefined)

  timing.forEach(( timingData, index ) => {
    const { label, clip } = timingData
    const left  = first.value
    const right = second.value

    if (index) {
      const line = document.createElement("li")
      const header = document.createElement("span")
      header.classList.add("label")
      header.innerText = label
      line.append(header)

      // Get expected mid time of clip
      const [ start, finish ] = clip
      const mid = parseInt((start + finish) * 500, 10) / 1000

      // Create two columns for comparison
      ;[left, right].forEach(( side, index )=> {
        const times = getTimes(side, timingData, mid, !index)
        line.append(times)
      })

      predefined.append(line)
    }
  })
}


/**
 * Called by generateList() and updateSettings()
 * @param {string} side:      "clip" | "chrome" | <browser>
 * @param {array} timingData: [ start, finish ] (seconds)
 * @param {number} mid:       actual middle of clip in audio file
 * @param {boolean} isActive: true if element is for first column
 *
 * @returns a span element with a structure like...
 *
 * <span
 *   class="firefox button active"
 *   style="background-color: rgb(32, 0, 0);"
 * >
 *   <span>0.95</span>
 *   <span>-</span>
 *   <span>2.15</span>
 * </span>
 *
 * The background-color indicates if the timing request should be
 * earlier or later than the audio file's own data expects.
 */
function getTimes(side, timingData, mid, isActive) {
  const [ start, finish ] = timingData[side]

  // Determine the red/blue shift with respect to expected
  const centre = parseInt((start + finish) * 500, 10) / 1000
  const bg = getShift(centre - mid)

  const times = document.createElement("span")
  times.classList.add(side, "button")
  if (isActive) {
    times.classList.add("active")
  }

  times.style.backgroundColor = bg

  const begin = document.createElement("span")
  begin.innerText = start.toFixed(2)
  const to = document.createElement("span")
  to.innerText = "-"
  const end = document.createElement("span")
  end.innerText = finish.toFixed(2)

  times.append(begin)
  times.append(to)
  times.append(end)

  return times
}


/**
 * Called by getTimes()
 * @param {number} delta will be the number of seconds (±)
 *                 differences between the expected clip timing
 *                 and the effective timing for this browser
 * @returns a color in the format "#rr00bb", where either rr or bb
 *                 will be "00", and the other not, or possibly
 *                 "#222" if delta is zero.
 */
function getShift(delta) {
  let r = "00",
      b = "00"

  if (delta < 0) {        // min -1.4 => "ff"
    b = hex(-delta)
  } else if (delta > 0) { // max 0.625 => "aa"
    r = hex(delta)
  }

  // Show tiny shifts as no shift, in grey
  const shift = (Math.abs(delta) > 0.0011)
    ? `#${r}00${b}`
    : "#222"

  return shift

  function hex(dec) {
    dec = Math.round(Math.pow(dec * SCALE, N)) // 0 - 255
    return (dec < 16
      ? "0"
      : ""
    )
    + dec.toString(16) // "00" - "ff"
  }
}


/**
 * Called by a click anywhere on the #predefined list or by
 * tweakNext()
 *
 * @param {target} will be the element in an `li` item that
 * was selected.
 */
function selectTime({ target }) {
  const line = target.closest("li")
  index = Array.from(predefined.children).indexOf(line) + 1
  const data = timing[index]

  if (target.closest(".label")) {
    playClip(url, data[using])

  } else {
    const column = target.closest(".button")
    // Assume className only contains "button <key> active"
    const key = column.className.replace(
      /\s*(button|active)\s*/g, ""
    )
    copyToSelected(data, key)
  }
}


/**
 * Called by selectTime() after a click on a column in #predefined
 *
 * @param {object} data: { label: <spoken number>,
 *                         <browser>: [ { timingData }, ... ],
 *                         ...
 *                       }
 * @param {string} key: name of browser/mp3 timing source
 *
 * Copies the label, start and end times to the Tweak zone
 * Plays the given clip of the audio file
 * Enables the Play, Set and Log buttons
 */
function copyToSelected(data, key) {
  clip = [ ...(data[key] || data.browser) ]
  const [ begin, end ] = clip
  label.innerText = data.label
  start.value = begin
  finish.value = end

  playClip(url, clip)

  playOne.removeAttribute("disabled")
  set.removeAttribute("disabled")
  logTiming.removeAttribute("disabled")
}


/**
 * Called when the value of the #start or the #finish number input
 * changes
 *
 * @param {object} target is the number input whose value changed
 *
 * Updates the value in the globally available clip object,
 * but does not affect the interface or the values in fileData
 */
function updateClip({ target }) {
  const { id, value } = target
  const index = ( id === "finish" ) + 0
  clip[index] = parseFloat(value)
}


/**
 * Sent by a click on the Play All First Column button
 *
 * Shows the play-mark div behind the first entry
 * Creates a local copy of specific timing data
 * Uses setInterval to play the first clip from the timing data
 * until the timing data array is empty
 *
 * NOTE: timings and interval are global, so that the Stop button
 * can use them to stop playback early.
 */
function playAllClips() {
  timings = timing.map( timingData => (
    timingData[using] || timingData.browser || timingData
  ))
  const url = timings.shift()

  let index = -1
  playMark.classList.add("playing")

  const playNext = () => {
    index += 1
    const { scrollTop } = predefined
    const top = (index * JUMP) - scrollTop
    playMark.style.top = `${top}px`

    clip = timings.shift()
    playClip(url, clip)

    if (!timings.length) {
      stopPlayback()
    }
  }

  interval = setInterval(playNext, DELAY)
  playNext()
}


/**
 * Sent by a click on the Stop button
 * Hides the play-mark div
 * Clears the interval set by playAllClips(), so playback stops
 * @param {*} param
 */
function stopPlayback(param) {
  clearInterval(interval)
  playMark.classList.remove("playing")
}


/**
 * Sent by a click on the Play button
 * Plays the currently defined clip of the active audio file
 */
function playCustomClip() {
  playClip(url, clip)
}


/**
 * Sent by a clic on the Set button
 *
 * Update the appropriate entry in the global filesData object
 * through its active timingData sub-object
 * Updates the timing span in #predefined
 */
function updateSettings() {
  const timingData = timing[index]

  // Update the appropriate entry in the timings object
  const {
    label,
    clip: original,
    [using]: altered
  } = timingData
  const [ begin, end ] = clip
  altered[0] = begin
  altered[1] = end

  // // <<< Temporary logging
  // const expected = (original[0]+ original[1]) / 2
  // const actual   = (clip[0] + clip[1]) / 2
  // const delta = Math.round((actual - expected) * 1000) / 1000

  // let stretch = (clip[1] - clip[0]) / (original[1] - original[0])
  // stretch = Math.round(stretch * 1000) / 1000

  // console.log(label, begin, "-", end, ", delta:", delta, ", stretch:", stretch)
  // // Temporary >>>

  // Update the timing span
  const [ start, finish ] = original
  const mid = parseInt((start + finish) * 500, 10) / 1000

  const selector = `#predefined li:nth-child(${index}) .${using}`
  const was = document.querySelector(selector)
  const is = getTimes(using, timingData, mid)

  was.replaceWith(is)
}


/**
 * Sent by a click on an Up or Down arrow
 * @param {object} target will be the img or the button that was
 *                 clicked
 * Selects (and plays) the next clip in the given direction
 */
function tweakNext({ target }) {
  const { id } = target.closest("[id]")

  // << HACK to get the right line number
  const direction = (id === "down") * 2
  const rows = Array.from(predefined.children)

  const line = Math.max(
    2,
    Math.min(
      index + direction,
      rows.length + 1
    )
  ) - 1
  // HACK >>

  if (line === index) { return }

  const button = rows[line - 1].querySelector(".button")

  selectTime({ target: button })
}


/**
 * Sent by a click on the Log Timing Data button
 *
 * Logs filesData to the browser console, so that it can be copied
 * and pasted into timings.json
 */
function logTimingData() {
  console.log("filesData", JSON.stringify(filesData));
}


function empty(element) {
  while (element.firstChild) {
    element.removeChild(element.lastChild);
  }
}