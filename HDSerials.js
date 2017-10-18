/**
 * HDSerials plugin for Movian
 *
 *  Copyright (C) 2015-2017 Buksa, Wain
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program. If not, see <http://www.gnu.org/licenses/>.
 */
//ver 1.2.4
var plugin = JSON.parse(Plugin.manifest);

var PREFIX = plugin.id;
var BASE_URL = 'http://hdserials.galanov.net';
var LOGO = Plugin.path + "logo.png";
var UA = 'Android;HD Serials v.1.14.46;ru-RU;google Nexus 4;SDK 10;v.2.3.3(REL)';
var page = require('showtime/page');
var service = require("showtime/service");
var settings = require('showtime/settings');
var io = require('native/io');
var prop = require('showtime/prop');
var log = require('./src/log');
var browse = require('./src/browse');
var api = require('./src/api');

var http = require('showtime/http');
var html = require("showtime/html");
var result

var tos = "The developer has no affiliation with the sites what so ever.\n";
tos += "Nor does he receive money or any other kind of benefits for them.\n\n";
tos += "The software is intended solely for educational and testing purposes,\n";
tos += "and while it may allow the user to create copies of legitimately acquired\n";
tos += "and/or owned content, it is required that such user actions must comply\n";
tos += "with local, federal and country legislation.\n\n";
tos += "Furthermore, the author of this software, its partners and associates\n";
tos += "shall assume NO responsibility, legal or otherwise implied, for any misuse\n";
tos += "of, or for any loss that may occur while using plugin.\n\n";
tos += "You are solely responsible for complying with the applicable laws in your\n";
tos += "country and you must cease using this software should your actions during\n";
tos += "plugin operation lead to or may lead to infringement or violation of the\n";
tos += "rights of the respective content copyright holders.\n\n";
tos += "plugin is not licensed, approved or endorsed by any online resource\n ";
tos += "proprietary. Do you accept this terms?";


io.httpInspectorCreate('http.*galanov.net/.*', function(ctrl) {
  ctrl.setHeader('User-Agent', UA);
  return 0;
});
io.httpInspectorCreate('http.*moonwalk.cc/.*', function(ctrl) {
    ctrl.setHeader('User-Agent', UA);
    return 0;
});

io.httpInspectorCreate("http.*video/[a-f0-9]{16}/.*", function(ctrl) {
    ctrl.setHeader('User-Agent', UA);
    return 0;
});

io.httpInspectorCreate('http.*streamblast.cc.*', function(ctrl) {
    ctrl.setHeader('User-Agent', UA);
    ctrl.setHeader("Referer", "http://streamblast.cc");
    return 0;
});
// Create the service (ie, icon on home screen)
service.create(plugin.title, PREFIX + ":start", "video", true, LOGO);


settings.globalSettings(plugin.id, plugin.title, LOGO, plugin.synopsis);
settings.createInfo("info", LOGO, "Plugin developed by " + plugin.author + ". \n");
settings.createDivider("Settings:");
settings.createBool("tosaccepted", "Accepted TOS (available in opening the plugin):", false, function (v) {
    service.tosaccepted = v;
});
settings.createBool("debug", "Debug", false, function(v) {
  service.debug = v;
});
settings.createInt("requestQuantity", "Количество запрашиваемых данных в одном запросе", 40, 20, 100, 10, '', function(v) {
  service.requestQuantity = v;
});
settings.createBool("Show_META", "Show more info from thetvdb", true, function(v) {
  service.tvdb = v;
});

function blueStr(str) {
  //return '<font color="6699CC"> (' + str + ')</font>';
  return ' (' + str + ')'
}


function oprint(o) {
  // print an object, this should really be a Movian builtin
  print(JSON.stringify(o, null, 4));
}

var blue = "6699CC",
  orange = "FFA500";

function colorStr(str, color) {
  return ' (' + str + ')';
  //return '<font color="' + color + '">(' + str + ')</font>';
}

function coloredStr(str, color) {
  return str;
  //        return '<font color="' + color + '">' + str + '</font>';
}
new page.Route(PREFIX + ":news:(.*)", function(page, id) {
    page.metadata.title = 'Сериалы HD новинки';
  browse.list({
    'id': id,
  }, page);
});

new page.Route(PREFIX + ":common-categories:(.*):(.*)", function(page, id, title) {
    page.metadata.title = unescape(title);
  browse.list({
    'id': 'sub-categories',
    'parent': id,
    'start': 0
  }, page);
})

new page.Route(PREFIX + ":sub-categories:(.*):(.*)", function(page, category_id, title) {
    page.metadata.title = unescape(title);
  browse.list({
    'id': 'filter-videos',
    'category': category_id,
    'fresh': 1,
    'start': 0,
    'limit': service.requestQuantity
  }, page);
})

new page.Route(PREFIX + ":filter-videos:(.*):(.*):(.*)", function(page, id, title, filter) {
    page.metadata.title = unescape(title);
  browse.moviepage({
    'id': 'video',
    'video': id,
  }, page, filter);
})

new page.Route(PREFIX + ":search:(.*)", function(page, query) {
  page.metadata.icon = LOGO;
  page.metadata.title = 'Search results for: ' + query;
  browse.list({
    'id': 'filter-videos',
    'category': 0,
    'search': query,
    'start': 0,
    'limit': service.requestQuantity
  }, page);
});

page.Searcher(PREFIX + " - Videos", LOGO, function(page, query) {
  page.metadata.icon = LOGO;
  // page.metadata.title = 'Search results for: ' + query;
  browse.list({
    'id': 'filter-videos',
    'category': 0,
    'search': query,
    'start': 0,
    'limit': service.requestQuantity
  }, page);
});

// Landing page
new page.Route(PREFIX + ":start", function(page) {
  page.type = 'directory';
  page.metadata.title = "HDSerials";
  page.metadata.icon = LOGO;


  page.appendItem(PREFIX + ':news:news', 'directory', {
    title: 'Сериалы HD новинки',
  });
  page.appendItem(PREFIX + ':sub-categories:0:Последние обновлений на сайте', 'directory', {
    title: 'Последние обновлений на сайте',
  });


  api.call({
    'id': 'common-categories',
  }, null, function(result) {
    for (var x in result.data) {
      var item = result.data[x];
      page.appendItem(PREFIX + ':' + result.id + ':' + item.id + ':' + escape(item.title_ru), 'directory', {
        title: item.title_ru + ' (' + item.video_count + ')' //+'<font color="6699CC">blue</font>',
      });
    }
  });
});



function videoPage(page, data) {

  page.loading = true;
  var canonicalUrl = PREFIX + ":video:" + data;
  data = JSON.parse(unescape(data));

  var videoparams = {
    canonicalUrl: canonicalUrl,
    no_fs_scan: true,
    icon: data.icon,
    title: unescape(data.title),
    year: data.year ? data.year : '',
    season: data.season ? data.season : '',
    episode: data.episode ? data.episode : '',
    sources: [{
        url: []
        }],
    subtitles: []
  };

  if (data.url.match(/http:\/\/.+?iframe/)) {
    //log.p('Open url:' + data.url.match(/http:\/\/.+?iframe/));
    //log.p("Open url:" + data.url);
    resp = http.request(data.url, {
      method: "GET",
      headers: {
                Referer: 'http://moonwalk.cc'
            }
        }).toString();

        VideoBalancer = /new VideoBalancer\(([^\;]+\})/.exec(resp)[1];
     //   console.log(eval('options = ' + VideoBalancer))
        eval('options = ' + VideoBalancer);
        url = (options.proto + options.host + /script src="([^"]+)/.exec(resp)[1])
        resp = http.request(url, { debug: service.debug })
       // console.log(eval('post_data =' + (/(\{mw_key[^\}]+.)/.exec(resp)[1]).replace(/this./g, '')));
        eval('post_data =' + (/(\{mw_key[^\}]+.)/.exec(resp)[1]).replace(/this./g, ''));
        header = /(headers:[^}]+)/.exec(resp)[1].replace(':{', '[').replace(':', ']=');
      //  console.log(eval('post_url=' + /url:("[^,]+)/.exec(resp)[1].replace('this.', '')));
        eval('post_url=' + /url:("[^,]+)/.exec(resp)[1].replace('this.', ''));
        headers = {
            "Origin": "http://moonwalk.cc",
            "Accept-Encoding": "gzip, deflate",
            "Accept-Language": "en-US,en;q=0.8,ru;q=0.6",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36",
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            "Accept": "application/json, text/javascript, */*; q=0.01",
            "Referer": data.url,
            "X-Requested-With": "XMLHttpRequest",
        }
        eval(header)
        post = {
            debug: 0,
            headers: headers,
            postdata: post_data
        };
      //  log.d(post)
      //  log.d(options.proto + options.host + post_url)
        var responseText = http.request(options.proto + options.host + post_url, post).toString();
       // log.d('manifesty')
       // log.d(JSON.parse(responseText));
        manifest_m3u8 = JSON.parse(responseText.match(/"manifest_m3u8":("[^"]+")/)[1]);
        //log.p(manifest_m3u8);
        result_url = manifest_m3u8;
        videoparams.sources = [{
            url: manifest_m3u8
          }
        ];
        video = "videoparams:" + JSON.stringify(videoparams);
        page.appendItem(video, "video", {
          title: "Auto",
          icon: data.icon
        });
        //m3u8 HLS
        try {
            if (null != manifest_m3u8) {
                var video_urls = http.request(manifest_m3u8, { header: { "User-Agent": UA } }).toString();
                var myRe = /RESOLUTION=([^,]+)[\s\S]+?(http.*)/g;
                var myArray, i = 0;
                while ((myArray = myRe.exec(video_urls)) !== null) {
                    videoparams.sources = [{
                        url: myArray[2]
                    }];
                    video = "videoparams:" + JSON.stringify(videoparams);
                    page.appendItem(video, "video", {
                        title: myArray[1],
                        icon: data.icon
                    });
                    i++;
                };
            }
        } catch (error) {
            log.e('oshibka pri vyvode variantov m3u8');
            log.e(error.stack);
        }
        //MP4
        try {
            if (null != JSON.parse(responseText).mans.manifest_mp4) {
                var video_urls = http.request(JSON.parse(responseText).mans.manifest_mp4, { header: { "User-Agent": UA } }).toString()
            //    log.p(video_urls = (JSON.parse(video_urls)));
                video_urls = JSON.parse(video_urls);
                for (key in video_urls) {
                    videoparams.sources = [{
                        url: video_urls[key]
                    }];
                    video = "videoparams:" + JSON.stringify(videoparams);
                    page.appendItem(video, "video", {
                        title: key + "-MP4",
                        icon: data.icon
                    });
                }
            }
        } catch (error) {
            log.e('oshibks v MP4');
            log.e(error.stack);
        }


    }
  page.type = "directory";
  page.contents = "contents";
  page.metadata.logo = data.icon;
  page.loading = false;
};

function post(url, postdata) {
    return {
        url: url,
        data: postdata
    }
}

function parser(a, c, e) {
  var d = "",
    b = a.indexOf(c);
  0 < b && (a = a.substr(b + c.length), b = a.indexOf(e), 0 < b && (d = a.substr(0, b)));
  return d;
}

function trim(s) {
  if (s) return s.replace(/(\r\n|\n|\r)/gm, "").replace(/(^\s*)|(\s*$)/gi, "").replace(/[ ]{2,}/gi, " ").replace(/\t/g, '');
  return '';
}

new page.Route(PREFIX + ":video:(.*)", videoPage);
