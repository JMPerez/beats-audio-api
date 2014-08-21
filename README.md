Calculating BPM using Javascript and the Spotify Web API
========================================================

This project uses the browser's Audio API to guess the tempo of a song, processing a chunk of 30 seconds of music. For more information, read the blog post [Beat Detection Using JavaScript and the Web Audio API](http://tech.beatport.com/2014/web-audio/beat-detection-using-web-audio), from where I've taken the code to perform the track analysis. I have also written a [post explaining the project more in depth](http://jmperezperez.com/bpm-detection-javascript/).

## Demo

You can see a **demo** on [http://jmperezperez.com/beats-audio-api](http://jmperezperez.com/beats-audio-api)

You can search for any track in the Spotify's catalog, and display a diagram of the detected peaks. Then, click on 'Play' to listen to the song while seeing an indicator on top of the peaks diagram. Apart from the detected tempos, the tempo provided by Echo Nest is shown.

<img align="center" src="http://jmperezperez.com/assets/images/posts/bpm-detection-example.png" alt="Screenshot of the BPM detector">

## Run it yourself

There are no dependencies to install, and you don't need to register any app on Spotify or Echo Nest. Just clone the project and start a server.

