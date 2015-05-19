var logger = require("morgan");
var Youtube = require("youtube-api");
var express = require('express');
var app = express();
var cons = require('consolidate');
var when = require('when');
var sequence = require('when/sequence');
var _ = require('lodash/collection/forEach');

app.get('/', function(req, res) {
  res.send("Append the channel ID to the URL to generate the RSS feed");
});

app.get('/favicon*', function(req, res) {
  res.sendStatus(404);
});

function getChannelTitle(channelId) {
  return new Promise(function(resolve, reject) {
    Youtube.search.list({
      "part": "snippet",
      "channelId": channelId,
      "order": "date",
      "type": "channel"
    }, function(err, data) {
      if (err) {
        reject(err);
      }
      if (data) {
        resolve(data.items[0].snippet.title);
      }
    });
  });
}

function getChannelVideos(channelId) {
  return new Promise(function(resolve, reject) {
    Youtube.search.list({
      "part": "snippet",
      "channelId": channelId,
      "order": "date",
      "maxResults": 20,
      "type": "video"
    }, function(err, data) {
      if (err) {
        reject(err);
      }
      if (data) {
        resolve(data);
      }
    });
  });
}

app.get('/:channelId', function(req, res) {

  Youtube.authenticate({
    type: "key", 
    key: "***REMOVED***"
  });

  var rssObject = [];
  var rssTitle = '';
  var todayDate = new Date().toUTCString();
  var dataObject = sequence([getChannelTitle, getChannelVideos], req.params.channelId);

  dataObject.then(function(response){
    rssTitle = response[0]

    _(response[1].items, function(n, key) {
      var date = new Date(n.snippet.publishedAt).toUTCString();
      var title = n.snippet.title.replace('&', '&amp;');
      var rssItem = {
        description: n.snippet.description,
        title: title,
        date: date,
        videoId: n.id.videoId
      };
      rssObject.push(rssItem);
    });
  })
  .then(function(response) {
    cons.handlebars('rss_template.hbs', { 
      date: todayDate,
      channel: req.params.channelId,
      rss: rssObject,
      title: rssTitle
    }, function(err, html){
      if (err) throw err;
      res.set('Content-Type', 'text/xml');
      res.send(html);
    });
  });
});

app.use(logger("dev"));

module.exports = app;
