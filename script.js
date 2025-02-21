/**
 * script.js
 */


fetch('./timings.json')
  .then(response => response.json())
  .then(json => json.words)
  .then(initialize)
  .catch(error => console.log("error:", error))


const DELAY = 2500

// Possibly inaccurate check on userAgent
const userAgent    = (/chrome|safari|edge|firefox|opera/i.exec(navigator.userAgent) || ["chrome"])[0].toLowerCase()

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


const settings = {
  offset: 0,
  scale: 1,
  stretch: 1
}

let filesData      // { key: { url: "", word: { clip }}, ...}
let url            // file containing audio
let timing = []    // [ { label, clip: [ start, finish ]}, ... ]
let timings = []   // [ [ start, finish ], ... ] for Play All
let index          // of item in timing that was clicked
let clip = [0, 0]  // [ start, finish ] of clicked item in timing
let interval       // integer value from clearInterval

first.value = userAgent
let using = first.value


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


function initialize(words) {
  filesData = words

  // Create a select menu to choose which file to treat
  const keys = Object.keys(words)
  const options = keys.forEach( key => {
    const option = document.createElement("option")
    option.value = key
    option.innerText = filesData[key].url.replace(/^[./]+/, "")
    selectFile.append(option)
  })

  changeFile({ target: { value: keys[0] }})
}


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

  generateList()
}


function setComparison({ target }) {
  const { id, value } = target

  if (id === "first"){
    using = value
  }

  generateList()
}


function generateList() {
  while (predefined.firstChild) {
    predefined.removeChild(predefined.lastChild);
  }

  timing.forEach(( timingData, index ) => {
    const { label, clip } = timingData
    const left = first.value
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

      // Standard
      {
        const [ start, finish ] = timingData[left]
        // Determine the red/blue shift with respect to expected
        const centre = parseInt((start + finish) * 500, 10) / 1000
        const bg = getShift(centre - mid)

        const times = document.createElement("span")
        times.classList.add(left, "button")
        times.style.backgroundColor = bg

        const begin = document.createElement("span")
        begin.classList.add("begin")
        begin.innerText = start.toFixed(2)
        const to = document.createElement("span")
        to.classList.add("to")
        to.innerText = "-"
        const end = document.createElement("span")
        end.classList.add("end")
        end.innerText = finish.toFixed(2)

        times.append(begin)
        times.append(to)
        times.append(end)
        line.append(times)
      }

     {
        const [ start, finish ] = timingData[right]

        // Determine the red/blue shift with respect to expected
        const centre = parseInt((start + finish) * 500, 10) / 1000
        const bg = getShift(centre - mid)

        const times = document.createElement("span")
        times.classList.add(right, "button")
        times.style.backgroundColor = bg
        const begin = document.createElement("span")
        begin.classList.add("begin")
        begin.innerText = start.toFixed(2)
        const to = document.createElement("span")
        to.classList.add("to")
        to.innerText = "-"
        const end = document.createElement("span")
        end.classList.add("end")
        end.innerText = finish.toFixed(2)

        times.append(begin)
        times.append(to)
        times.append(end)
        line.append(times)
      }

      predefined.append(line)
    }
  })
}


function getShift(delta) {
  let r = 0,
      b = 0

  if (delta < 0) { // min -1.4 => f
    b = Math.round(-11 * delta).toString(16)
  } else if (delta > 0) { // 0.625 => 7
    r = Math.round(11 * delta).toString(16)
  }

  const shift = (r || b)
    ? `#${r}0${b}`
    : "#222"

  return shift
}


function selectTime({ target }) {
  const line = target.closest("li")
  index = Array.from(predefined.children).indexOf(line) + 1
  const data = timing[index]

  if (target.closest(".label")) {
    playClip(url, data[using])

  } else {
    const column = target.closest(".button")
    // Assume className only contains "button <key>"
    const key = column.className.replace(/\s*button\s*/, "")
    copyToSelected(data, key)
  }
}


function copyToSelected(data, key) {
  clip = [ ...data[key] ]
  const [ begin, end ] = clip
  label.innerText = data.label
  start.value = begin
  finish.value = end

  playClip(url, clip)
}


function updateClip({ target }) {
  const { id, value } = target
  const index = ( id === "finish" ) + 0
  clip[index] = parseFloat(value)
}


function playAllClips() {
  timings = timing.map( timingData => (
    timingData[using] || timingData
  ))
  const url = timings.shift()

  let index = -1
  playMark.classList.add("playing")

  const playNext = () => {
    index += 1
    playMark.style.top = `${index * 2.4}em`

    clip = timings.shift()
    playClip(url, clip)

    if (!timings.length) {
      stopPlayback()
    }
  }

  interval = setInterval(playNext, DELAY)
  playNext()
}


function stopPlayback(param) {
  clearInterval(interval)
  playMark.classList.remove("playing")
}


function playCustomClip() {
  playClip(url, clip)
}


function updateSettings() {
  const { label, clip: original } = timing[index]
  const expected = (original[0]+ original[1]) / 2
  const actual   = (clip[0] + clip[1]) / 2
  const delta = Math.round((actual - expected) * 1000) / 1000

  let stretch = (clip[1] - clip[0]) / (original[1] - original[0])
  stretch = Math.round(stretch * 1000) / 1000

  console.log(label, clip[0], "-", clip[1], ", delta:", delta, ", stretch:", stretch)
}
