/**
 * script.js
 */

const DELAY = 1500

const predefined   = document.getElementById("predefined")
const selected     = document.getElementById("selected")
const name         = document.getElementById("name")
const start        = document.getElementById("start")
const finish       = document.getElementById("finish")
const playSelected = document.getElementById("play-selected")
const set          = document.getElementById("set")
const offset       = document.getElementById("offset")
const offsetValue  = document.getElementById("offset-value")
const scale        = document.getElementById("scale")
const scaleValue   = document.getElementById("scale-value")
const stretch      = document.getElementById("stretch")
const stretchValue = document.getElementById("stretch-value")
const playAll      = document.getElementById("play-all")
const stop         = document.getElementById("stop")

const allTimings   = getAllTimings()
let timings        = []
let interval       = 0

const settings = {
  offset: 0,
  scale: 1,
  stretch: 1
}

let split
let slot


predefined.addEventListener("click", selectTime)
playSelected.addEventListener("click", playCustomClip)
playAll.addEventListener("click", playAllClips)
stop.addEventListener("click", stopPlayback)
set.addEventListener("click", updateSettings)


function selectTime({ target }) {
  split = target.closest(".split")

  if (!split) {
    // The click was in the header
    return
  }

  slot = target.closest(".name p")
  if (slot) {
    // Play the standard section
    selected.classList.add("disabled")
    playSelection(target)

  } else {
    selected.classList.remove("disabled")
    const bg = getComputedStyle(split).getPropertyValue("background-color")
    selected.style.backgroundColor = bg
    
    copyToSelected(target)
  }
}


function playSelection(target) {
  const index = Array.from(target.closest(".name").children).indexOf(target) + 1

  const times = split.querySelector(`.times p:nth-child(${index})`)

  const limits = times.children
  const begin = limits[0].innerText
  const end = limits[1].innerText

  const clip = JSON.parse(`[ ${begin}, ${end} ]`)
  playClip(clip)
}


function copyToSelected(target) {
  // Copy the name and the standard section times to #selected
  const times = target.closest(".times p")
  if (times) {
    const index = Array.from(target.closest(".times").children).indexOf(times) + 1
    const section = split.querySelector(`.name p:nth-child(${index})`).innerText

    const limits = times.children
    const begin = limits[0].innerText
    const end = limits[1].innerText

    name.innerText = section
    start.value = begin
    finish.value = end
  }
}

// playClip([99.95, 101.35])


function playCustomClip() {
  const begin = start.value
  const end = finish.value

  const clip = JSON.parse(`[ ${begin}, ${end} ]`)
  playClip(clip)
}


function updateSettings() {
  // function body
}



function getAllTimings() {
  const allTimes = Array.from(document.querySelectorAll(".times p"))

  return allTimes.map( p => {
    const limits = p.children
    const begin = limits[0].innerText
    const end = limits[1].innerText

    return JSON.parse(`[ ${begin}, ${end} ]`)
  })
}



function playAllClips(param) {
  timings = allTimings.toReversed()

  playClip(timings.shift())
  // console.log("timings.shift:", timings.shift())

  interval = setInterval(() => {
    // console.log("timings.shift():", timings.shift())
    playClip(timings.shift())

    if (!timings.length) {
      clearInterval(interval)
    }
  }, DELAY)
}


function stopPlayback(param) {
  timings.length = 0
  clearInterval(interval)
}


