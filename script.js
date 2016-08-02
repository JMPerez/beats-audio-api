/*
  The code for finding out the BPM / tempo is taken from this post:
  http://tech.beatport.com/2014/web-audio/beat-detection-using-web-audio/
 */
var spotifyApi = new SpotifyWebApi();
spotifyApi.getToken().then(function(response) {
  spotifyApi.setAccessToken(response.token);
});

var queryInput = document.querySelector('#query'),
    result = document.querySelector('#result'),
    text = document.querySelector('#text'),
    audioTag = document.querySelector('#audio'),
    playButton = document.querySelector('#play');

function updateProgressState() {
  if (audioTag.paused) {
    return;
  }
  var progressIndicator = document.querySelector('#progress');
  if (progressIndicator && audioTag.duration) {
    progressIndicator.setAttribute('x', (audioTag.currentTime * 100 / audioTag.duration) + '%');
  }
  requestAnimationFrame(updateProgressState);
}

audioTag.addEventListener('play', updateProgressState);
audioTag.addEventListener('playing', updateProgressState);

function updatePlayLabel() {
  playButton.innerHTML = audioTag.paused ? 'Play track' : 'Pause track';
}

audioTag.addEventListener('play', updatePlayLabel);
audioTag.addEventListener('playing', updatePlayLabel);
audioTag.addEventListener('pause', updatePlayLabel);
audioTag.addEventListener('ended', updatePlayLabel);

playButton.addEventListener('click', function() {
  if (audioTag.paused) {
    audioTag.play();
  } else {
    audioTag.pause();
  }
});

result.style.display = 'none';

document.querySelector('form').addEventListener('submit', function(e) {
  e.preventDefault();
  result.style.display = 'none';
  spotifyApi.searchTracks(
    queryInput.value.trim(), {limit: 1})
    .then(function(results) {
      var track = results.tracks.items[0];
      var previewUrl = track.preview_url;
      audioTag.src = track.preview_url;

      var context = new (window.AudioContext || window.webkitAudioContext) ();
      var request = new XMLHttpRequest();
      request.open('GET', previewUrl, true);
      request.responseType = 'arraybuffer';
      request.onload = function() {

        // Create offline context
        var OfflineContext = window.OfflineAudioContext || window.webkitOfflineAudioContext;
        var offlineContext = new OfflineContext(1, 2, 44100);

        offlineContext.decodeAudioData(request.response, function(buffer) {

          // Create buffer source
          var source = offlineContext.createBufferSource();
          source.buffer = buffer;

          // Create filter
          var filter = offlineContext.createBiquadFilter();
          filter.type = "lowpass";

          // Pipe the song into the filter, and the filter into the offline context
          source.connect(filter);
          filter.connect(offlineContext.destination);

          // Schedule the song to start playing at time:0
          source.start(0);

          var peaks,
              initialThresold = 0.9,
              thresold = initialThresold,
              minThresold = 0.3,
              minPeaks = 30;

          do {
            peaks = getPeaksAtThreshold(buffer.getChannelData(0), thresold);
            thresold -= 0.05;
          } while (peaks.length < minPeaks && thresold >= minThresold);

          var svg = document.querySelector('#svg');
          svg.innerHTML = '';
          var svgNS = 'http://www.w3.org/2000/svg';
          peaks.forEach(function(peak) {
            var rect = document.createElementNS(svgNS, 'rect');
            rect.setAttributeNS(null, 'x', (100 * peak / buffer.length) + '%');
            rect.setAttributeNS(null, 'y', 0);
            rect.setAttributeNS(null, 'width', 1);
            rect.setAttributeNS(null, 'height', '100%');
            svg.appendChild(rect);
          });

          var rect = document.createElementNS(svgNS, 'rect');
          rect.setAttributeNS(null, 'id', 'progress');
          rect.setAttributeNS(null, 'y', 0);
          rect.setAttributeNS(null, 'width', 1);
          rect.setAttributeNS(null, 'height', '100%');
          svg.appendChild(rect);

          svg.innerHTML = svg.innerHTML;  // force repaint in some browsers

          var intervals = countIntervalsBetweenNearbyPeaks(peaks);

          var groups = groupNeighborsByTempo(intervals, buffer.sampleRate);

          var top = groups.sort(function(intA, intB) {
            return intB.count - intA.count;
          }).splice(0,5);

          text.innerHTML = '<div id="guess">Guess for track <strong>' + track.name + '</strong> by ' +
            '<strong>' + track.artists[0].name + '</strong> is <strong>' + Math.round(top[0].tempo) + ' BPM</strong>' +
            ' with ' + top[0].count + ' samples.</div>';

          text.innerHTML += '<div class="small">Other options are ' +
            top.slice(1).map(function(group, index) {
              return group.tempo + ' BPM (' + group.count + ')';
            }).join(', ') +
            '</div>';

          var printENBPM = function(tempo) {
            text.innerHTML += '<div class="small">The tempo according to Spotify is ' +
                  tempo + ' BPM</div>';
          };
          spotifyApi.getAudioFeaturesForTrack(track.id)
            .then(function(result) {
              printENBPM(result.tempo);
            });

          result.style.display = 'block';
        });
      };
      request.send();
    });
});

// Function to identify peaks
function getPeaksAtThreshold(data, threshold) {
  var peaksArray = [];
  var length = data.length;
  for(var i = 0; i < length;) {
    if (data[i] > threshold) {
      peaksArray.push(i);
      // Skip forward ~ 1/4s to get past this peak.
      i += 10000;
    }
    i++;
  }
  return peaksArray;
}

// Function used to return a histogram of peak intervals
function countIntervalsBetweenNearbyPeaks(peaks) {
  var intervalCounts = [];
  peaks.forEach(function(peak, index) {
    for(var i = 0; i < 10; i++) {
      var interval = peaks[index + i] - peak;
      var foundInterval = intervalCounts.some(function(intervalCount) {
        if (intervalCount.interval === interval)
          return intervalCount.count++;
      });
      if (!foundInterval) {
        intervalCounts.push({
          interval: interval,
          count: 1
        });
      }
    }
  });
  return intervalCounts;
}

// Function used to return a histogram of tempo candidates.
function groupNeighborsByTempo(intervalCounts, sampleRate) {
  var tempoCounts = [];
  intervalCounts.forEach(function(intervalCount, i) {
    if (intervalCount.interval !== 0) {
      // Convert an interval to tempo
      var theoreticalTempo = 60 / (intervalCount.interval / sampleRate );

      // Adjust the tempo to fit within the 90-180 BPM range
      while (theoreticalTempo < 90) theoreticalTempo *= 2;
      while (theoreticalTempo > 180) theoreticalTempo /= 2;

      theoreticalTempo = Math.round(theoreticalTempo);
      var foundTempo = tempoCounts.some(function(tempoCount) {
        if (tempoCount.tempo === theoreticalTempo)
          return tempoCount.count += intervalCount.count;
      });
      if (!foundTempo) {
        tempoCounts.push({
          tempo: theoreticalTempo,
          count: intervalCount.count
        });
      }
    }
  });
  return tempoCounts;
}
