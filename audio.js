/**
 * src/components/AudioContext
 *
 * An audio clip is defined as a file path and a begin and end point in
 * that file. measured in seconds. For example:
 *
 * { url: "audio/ɑ.mp3"
 * , "clip": [2.450, 3.550]
 * }
 *
 * For any minimal pair, there will be two audio clips, for example: for
 * "staff" and for "stuff". Each of these will be stored in a separate
 * file, with a separate url. Switching from one recording to the other
 * will mean loading a different audio file.
 */



const audio = new Audio()
audio.src = "./test.mp3"

let playing = false // will temporarily become truthy relative path
let timeOut

const stopPlaying = () => {
  audio.pause()
  playing = false
}

const playClip = (clip) => {
  if (playing) {
    return // Let this sound play to the end
  }

  console.log("clip:", clip)

  const [ startTime, endTime ] = clip
  const duration = (endTime - startTime) * 1000 // ms

  audio.currentTime = startTime                 // s
  clearTimeout(timeOut)
  timeOut = setTimeout(stopPlaying, duration)

  audio.play()
       .then(result => {
         playing = true
       }).catch(error => {
         console.log("Audio.play() error:)", error, url)
       })
}