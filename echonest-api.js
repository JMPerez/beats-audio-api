var EchonestApi = (function() {

  'use strict';
  var _baseUri = 'http://developer.echonest.com/api/v4';

  var _apiKey = 'NZCLQY5QPNROJCWNT';

  var _promiseProvider = function(promiseFunction) {
    return new window.Promise(promiseFunction);
  };

  var _checkParamsAndPerformRequest = function(requestData, options, callback) {
    var opt = {};
    var cb = null;

    if (typeof options === 'object') {
      opt = options;
      cb = callback;
    } else if (typeof options === 'function') {
      cb = options;
    }
    _extend(requestData.params, opt);
    return _performRequest(requestData, cb);
  };

  var _performRequest = function(requestData, callback) {
    var promiseFunction = function(resolve, reject) {
      var req = new XMLHttpRequest();
      var type = requestData.type || 'GET';
      if (type === 'GET') {
        req.open(type,
          _buildUrl(requestData.url, requestData.params),
          true);
      } else {
        req.open(type, _buildUrl(requestData.url));
      }

      req.onreadystatechange = function() {
        if (req.readyState === 4) {
          var data = null;
          try {
            data = req.responseText ? JSON.parse(req.responseText) : '';
          } catch (e) {}

          if (req.status === 200 || req.status === 201) {
            if (resolve) {
              resolve(data);
            }
            if (callback) {
              callback(null, data);
            }
          } else {
            if (reject) {
              reject(req);
            }
            if (callback) {
              callback(req, null);
            }
          }
        }
      };

      if (type === 'GET') {
        req.send(null);
      } else {
        req.send(JSON.stringify(requestData.postData));
      }
    };

    if (callback) {
      promiseFunction();
      return null;
    } else {
      return _promiseProvider(promiseFunction);
    }
  };

  var _extend = function() {
    var args = Array.prototype.slice.call(arguments);
    var target = args[0];
    var objects = args.slice(1);
    target = target || {};
    for (var i = 0; i < objects.length; i++) {
      for (var j in objects[i]) {
        target[j] = objects[i][j];
      }
    }
    return target;
  };

  var _buildUrl = function(url, parameters){
    var qs = '';
    for (var key in parameters) {
      if (parameters.hasOwnProperty(key)) {
        var value = parameters[key];
        qs += encodeURIComponent(key) + '=' + encodeURIComponent(value) + '&';
      }
    }
    if (qs.length > 0){
      qs = qs.substring(0, qs.length - 1); //chop off last '&'
      url = url + '?' + qs;
    }
    return url;
  };

  var Constr = function() {};

  Constr.prototype = {
    constructor: EchonestApi
  };

  Constr.prototype.searchSongs = function(artist, title, callback) {
    var requestData = {
      url: _baseUri + '/song/search',
      params: {
        artist: artist,
        title: title,
        api_key: _apiKey,
        results: 1
      }
    };
    return _checkParamsAndPerformRequest(requestData, {}, callback);
  };

  Constr.prototype.getSongAudioSummaryById = function(songId, callback) {
    var requestData = {
      url: _baseUri + '/song/profile',
      params: {
        id: songId,
        bucket: 'audio_summary',
        api_key: _apiKey
      }
    };
    return _checkParamsAndPerformRequest(requestData, {}, callback);
  };

  Constr.prototype.getSongAudioSummaryBySpotifyUri = function(spotifyUri, callback) {
    var requestData = {
      url: _baseUri + '/song/profile',
      params: {
        track_id: spotifyUri,
        bucket: 'audio_summary',
        api_key: _apiKey
      }
    };
    return _checkParamsAndPerformRequest(requestData, {}, callback);
  };

  return Constr;
})();
