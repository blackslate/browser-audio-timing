# Browser Audio Timing #

[Live Demo](https://blackslate.github.io/browser-audio-timing/)

MP3 files can be generated with different _bit rate modes_.

## Constant vs bandwidth
The _constant_ bit rate mode will produce the biggest files for a given quality, so other modes are usually preferable. However, if you want to jump to specific points in the audio file, using JavaScript's `audio.currentTime`, then only the constant bit rate mode will give you consistent results, both in different browsers and in different places in the same audio file.

This project uses an MP3 file at a constant 96kbps, and it requires 2.4 MB

## Variable vs seek accuracy

Variable bit rate generally gives the most efficient compression, and thus the smallest file sizes.

This project uses an MP3 file at a variable bit rate between 65 and 105 kbps, and it requires only 880 KB. It's about a third of the size of the constant bit rate file, but the bit rate is higher where it's needed and lowest for the silences.

When different browsers are asked to use audio.currentTime to find then start of a particular sequence in a variable bit rate MP3 file, they do it with different degrees of inaccuracy.

This project shows how Firefox can jump to over a second too late or over half a second too early, at different places in the same audio file. Other browsers are less inaccurate, but are equally chaotic, sometimes too early, sometimes too late.

The good news is that the inaccuracies are predictable. A given browser will make the same error at the same place in an audio file every time, to within a few milliseconds.

> NOTE
> Inaccuracies of 2 - 100 ms are to be expected for all audio and video files. This is a feature, not a bug. Precise accuracy good allow bad actors to use the specific behaviour of your browser on your computer to generate a fingerprint so they can track you without the need for cookies. Firefox, for example, allows you to set an option to delay the start of playback by up to 100 milliseconds, to foil such bad actors. By default, accuracy is within 2 milliseconds.

This demo highlights predictable inaccuracies of +1400 milliseconds or -625 milliseconds in Firefox, and +350 to -100 milliseconds on other browsers. At specific points in an audio file, the difference between playback on one browser and another can be well over a second.

---

## A use case where accurate timing is essential

In an application to help language learners improve their pronunciation, I have recorded a series of individual words in an MP3 file. I want to use audio.currentTime to start playback of the file at a specific place for each word. I want each word to play immediately when the user triggers playback.

I also want to use the least bandwidth, so I want to use a variable bit rate.

If I use the same start time on all browsers, I must leave over a second of silence between each word, and the end user may have to wait over a second before certain words are played. That's not acceptable.

This project provides a tool to customize the start and end times for each clip for different browsers. In fact, Chrome, Edge and Opera all more or less agree with each other, and Safari is not _too_ different, so it would be possible to generate just two timings: a tight one for Firefox, and a slightly looser one which works for all the other browsers.
