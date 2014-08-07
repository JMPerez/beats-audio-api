beats-audio-api
===============

## Calculating BPM using Javascript and the Spotify Web API

This project uses the browser's Audio API to determine the tempo of a song, processing a chunk of 30 seconds of a song. For more information, read the blog post [Beat Detection Using JavaScript and the Web Audio API](http://tech.beatport.com/2014/web-audio/beat-detection-using-web-audio), from where I've taken the code to perform the track analysis.

You can search for any track in the Spotify's catalog, and display a diagram of the detected peaks. Then, click on 'Play' to listen to the song while seeing an indicator on top of the peaks diagram. Apart from the detected tempos, the tempo provided by Echo Nest is shown.

You can see a demo on [http://jmperezperez.com/beats-audio-api](http://jmperezperez.com/beats-audio-api).
