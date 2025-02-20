/**
 * script.js
 */


fetch('./timings.json')
  .then(response => response.json())
  .then(json => json.words)
  .then(initialize)
  .catch(error => console.log("error:", error))


const DELAY = 1500

const selectFile   = document.getElementById("select-file")
const browser      = document.getElementById("browser")
const inUse        = document.getElementById("in-use")
const predefined   = document.getElementById("predefined")
const selected     = document.getElementById("selected")
const label        = document.getElementById("label")
const start        = document.getElementById("start")
const finish       = document.getElementById("finish")
const playSelected = document.getElementById("play-selected")
const set          = document.getElementById("set")


const settings = {
  offset: 0,
  scale: 1,
  stretch: 1
}

let filesData      // { key: { url: "", word: { clip }}, ...}
let url            // file containing audio
let timing = []    // [ { label, clip: [ start, finish ]}, ... ]
let index          // of item in timing that was clicked
let clip = [0, 0]  // [ start, finish ] of clicked item in timing
let using = browser.value


selectFile.addEventListener("change", changeFile)
browser.addEventListener("change", setCompatibility)
predefined.addEventListener("click", selectTime)
playSelected.addEventListener("click", playCustomClip)
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
  timing = timing.map(([ label, { clip, firefox } ] ) => {
    return { label, clip, firefox }
  })

  generateList()
}


function setCompatibility({ target }) {
  using = target.value
  generateList()
}


function generateList() {
  while (predefined.firstChild) {
    predefined.removeChild(predefined.lastChild);
  }

  timing.forEach(( timingData, index ) => {
    const {  label, clip } = timingData

    if (index) {
      const line = document.createElement("li")
      const header = document.createElement("span")
      header.classList.add("label", "button")
      header.innerText = label
      line.append(header)

      let mid

      // Standard
      {
        const [ start, finish ] = clip
        mid = parseInt((start + finish) * 500, 10) / 1000
        const times = document.createElement("span")
        times.classList.add("clip", "button")
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

      if (using !== "clip") {
        const [ start, finish ] = timingData[using]

        // Determine the red/blue shift with respect to expected
        const centre = parseInt((start + finish) * 500, 10) / 1000
        const delta = centre - mid

        let r = 0,
            b = 0

        if (delta < 0) { // min -1.4 => f
          b = Math.round(-11 * delta).toString(16)
        } else if (delta > 0) { // 0.625 => 7
          r = Math.round(11 * delta).toString(16)
        }

        const bg = (r || b)
          ? `#${r}0${b}`
          : "transparent"

        const times = document.createElement("span")
        times.classList.add("firefox", "button")
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

  const action = (using === "clip")
    ? "add"
    : "remove"
  inUse.classList[action]("mp3")
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
}


function updateClip({ target }) {
  const { id, value } = target
  const index = ( id === "finish" ) + 0
  clip[index] = parseFloat(value)
}


function playCustomClip() {
  playClip(url, clip)
}


function updateSettings() {
  const { label, clip: original } = timing[index]
  const expected = (original[0]+ original[1]) / 2
  const actual   = (clip[0] + clip[1]) / 2
  const delta = Math.round((actual - expected) * 1000) / 1000

  if (index === 1) {
    settings.offset = delta
    offset.value = delta
    offsetValue.value = delta

  } else { // if (index > timing.length - 9) {
    // Use last or second last to set time scale

    let stretch = (clip[1] - clip[0]) / (original[1] - original[0])
    stretch = Math.round(stretch * 1000) / 1000

    console.log(label, clip[0], "-", clip[1], ", delta:", delta, ", stretch:", stretch)
  }
}
