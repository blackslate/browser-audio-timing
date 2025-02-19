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
const playAll      = document.getElementById("play-all")
const stop         = document.getElementById("stop")

const allTimings   = getAllTimings()
let timings        = []
let interval       = 0


predefined.addEventListener("click", selectTime)
playSelected.addEventListener("click", playCustomClip)
playAll.addEventListener("click", playAllClips)
stop.addEventListener("click", stopPlayback)


function selectTime({ target }) {
  const split = target.closest(".split")

  if (!split) {
    // The click was in the header
    return
  }

  const name = target.closest(".name p")
  if (name) {
    // Play the standard section
    selected.classList.add("disabled")
    playSelection(split, target)

  } else {
    selected.classList.remove("disabled")
    const bg = getComputedStyle(split).getPropertyValue("background-color")
    selected.style.backgroundColor = bg
    
    copyToSelected(split, target)
  }
}


function playSelection(split, target) {
  const index = Array.from(target.closest(".name").children).indexOf(target) + 1

  const times = split.querySelector(`.times p:nth-child(${index})`)

  const limits = times.children
  const begin = limits[0].innerText
  const end = limits[1].innerText

  const clip = JSON.parse(`[ ${begin}, ${end} ]`)
  playClip(clip)
}


function copyToSelected(split, target) {
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