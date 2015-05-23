var logger = require("morgan");
var Youtube = require("youtube-api");
var express = require('express');
var app = express();
var cons = require('consolidate');
var when = require('when');
var sequence = require('when/sequence');
var _ = require('lodash/collection/forEach');
var routes = require('./components/routes.js');

Youtube.authenticate({
  type: "key", 
  key: "***REMOVED***"
});

app.use('/public', express.static(__dirname + '/public'));

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

function getChannelID(query) {
  return new Promise(function(resolve, reject) {
    Youtube.channels.list({
      "part": "id",
      "forUsername": query,
      "maxResults": 1
    }, function(err, data) {
      if (err) {
        reject(err);
      }
      if (data) {
        if (data.items.length < 1) {
          Youtube.search.list({
            "part": "snippet",
            "channelId": query,
            "order": "date",
            "maxResults": 1,
            "type": "video"
          }, function(err, data) {
            if (err) {
              reject(err);
            }
            if (data) {
              if (data.pageInfo.totalResults > 0) {
                resolve(query);
              } else {
                reject(null);
              }
            }
          });
        } else {
          resolve(data.items[0].id);
        }
      }
    });
  });
}

app.post('/feed', function(req, res) {
  var formData = "";
  req.on("data", function(data) {
    formData += data;
  });
  req.on("end", function(data) {
    var query = formData.split('=')[1];
    getChannelID(query).then(function(response) {
      console.log(response);
    }, function(error) {
      if (error = null) {
        console.log("ID not valid");
      } else {
        console.log("Username not valid");
      }
    });
    //res.redirect('/feed/'+ID);
  });
});

app.use(routes());

app.get('/feed/:channelId', function(req, res) {
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
    cons.handlebars('templates/rss_template.hbs', { 
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
