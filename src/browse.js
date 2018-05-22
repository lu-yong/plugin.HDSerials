function populatePageFromResults(page, result) {
    for (var i = 0; i < result.data.length; i++) {
        var item = result.data[i];
        if (result.data[i].video_id || result.data[i].id) {
            switch (result.id) {
                case "news":
                    page.appendItem(PREFIX + ":filter-videos:" + result.data[i].video_id + ":" + escape(result.data[i].video_title_ru + (result.data[i].video_season ? " " + result.data[i].video_season : "")) + ":" + undefined, "directory", {
                        title: result.data[i].video_title_ru + (result.data[i].video_title_en ? " / " + result.data[i].video_title_en : "") + (result.data[i].video_season ? " " + result.data[i].video_season : ""),
                        description: '<p align="justify">' + coloredStr("Обнавлено: ", orange) + result.data[i].date + " " + result.data[i].title + "</p>" + "\n" + coloredStr("Название: ", orange) + result.data[i].video_title_ru + (result.data[i].video_title_en ? " / " + result.data[i].video_title_en : "") + (result.data[i].video_season ? " " + result.data[i].video_season : ""),
                        icon: result.data[i].video_image_file
                    });
                    break;
                case "sub-categories":
                    page.appendItem(PREFIX + ":" + result.id + ":" + result.data[i].id + ":" + escape(result.data[i].title_ru) + ":" + result.data[i].video_count, "directory", {
                        title: result.data[i].title_ru + blueStr(result.data[i].video_count)
                    });
                    break;
                case "filter-videos":
                    page.appendItem(PREFIX + ":" + result.id + ":" + result.data[i].id + ":" + escape(result.data[i].title_ru + (result.data[i].season ? " " + result.data[i].season : "")) + ":" + undefined, "directory", {
                        title: unescape(result.data[i].title_ru) + (result.data[i].title_en ? " / " + result.data[i].title_en : "") + (result.data[i].season ? " " + result.data[i].season : ""),
                        year: +parseInt(result.data[i].year, 10),
                        icon: unescape(result.data[i].image_file)
                    });
                    break;
                default:
                    var videoParams = {
                        sources: [{
                            url: "null",
                        }],
                        no_subtitle_scan: true,
                        subtitles: []
                    }
                    page.appendItem("videoparams:" + JSON.stringify(videoParams), "video", {title: "No Content",});
                    print("Unknown id in result: " + result.id);
                    //print(JSON.stringify(item, null, 4));
                    return;
            }
            page.entries++
        }
    }
}
exports.list = function(params, page) {
    page.loading = true;
    page.type = "directory";
    page.entries = 0;

    function loader() {
        api.call(params, page, function(result) {
            if (result.id && result.data.length === 0) {
                page.type = "empty";
                var videoParams = {
                    sources: [{
                        url: "null",
                    }],
                    no_subtitle_scan: true,
                    subtitles: []
                }
                page.appendItem("videoparams:" + JSON.stringify(videoParams), "video", {title: "No Content",});
                return;
            }
            populatePageFromResults(page, result);
            if (params["start"] !== null) {
                params["start"] = params["start"] + params["limit"];
            }
            page.haveMore(result.endOfData !== undefined && !result.endOfData);
        });
    }
    //page.loading = true;
    //page.type = "directory";
    //page.entries = 0;
    loader();
    page.paginator = loader;
};
exports.moviepage = function(params, page, filter) {
    console.log('moviepage');
    if (filter == "undefined") {
        var URL = "http://hdserials.galanov.net/backend/model.php";
        var opts = {
            method: "POST",
            headers: {
                "User-Agent": UA
            },
            args: [params || {}],
            debug: service.debug,
            noFail: false,
            compression: true,
            caching: true
        };
        result = http.request(URL, opts);
        page.loading = false;
        result = JSON.parse(result);
    }

    page.metadata.title = (result.data.info.title_en !== "" ? result.data.info.title_en : result.data.info.title_ru) + (' (' + result.data.info.year + ')' || '') + (filter !== "undefined" ? ' | ' + filter : '')
    page.metadata.logo = result.data.info.image_file || LOGO;
    page.loading = true;
    page.type = 'directory';
    if (result.data.genres) {
        genres = "";
        for (i in result.data.genres) {
            genres += result.data.genres[i].title_ru;
            if (i < result.data.genres.length - 1) {
                genres += ", ";
            }
        }
    }
    if (result.data.countries) {
        countries = "";
        for (i in result.data.countries) {
            countries += result.data.countries[i].title_ru;
            if (i < result.data.countries.length - 1) {
                countries += ", ";
            }
        }
    }
    if (result.data.actors) {
        actors = "";
        for (i in result.data.actors) {
            actors += result.data.actors[i].title_ru;
            if (i < result.data.actors.length - 1) {
                actors += ", ";
            }
        }
    }
    if (result.data.directors) {
        directors = "";
        for (i in result.data.directors) {
            directors += result.data.directors[i].title_ru;
            if (i < result.data.directors.length - 1) {
                directors += ", ";
            }
        }
    }
    if (result.data.files) {
        tmp = "";
        var i = 0;
        var f = 1;
        if (filter === 'undefined'){
            for (; i < result.data.files.length; i++) {
                if (tmp !== result.data.files[i].season_translation && result.data.files[i].season_translation !== null) {
                    tmp = result.data.files[i].season_translation;
                    page.appendItem(PREFIX + ":filter-videos:" + result.data.info.id + ":" + "title" + ":" + result.data.files[i].season_translation, "directory", {
                        title: result.data.files[i].season_translation
                    });
                }
            }
        }
    }
    if (result.data.files.length > 1) {
        for (j in result.data.files) {
            if (result.data.files[j].season_translation == filter || result.data.files[j].season_translation == undefined) {
                data = {
                    title: result.data.info.title_en !== "" ? result.data.info.title_en : result.data.info.title_ru,
                    year: result.data.info.year,
                    season: +result.data.files[j].season < 10 ? "0" + result.data.files[j].season : result.data.files[j].season,
                    episode: +result.data.files[j].episode < 10 ? "0" + result.data.files[j].episode : result.data.files[j].episode,
                    url: result.data.files[j].url,
                    icon: result.data.info.image_file ? result.data.info.image_file : ""
                };
                //log.p(result.data.files[j].season);
                item = page.appendItem(PREFIX + ":" + result.id + ":" + escape(JSON.stringify(data)), "directory", {
                    title: result.data.files[j].title + (result.data.files[j].season_translation ? " (" + result.data.files[j].season_translation + ")" : ""),
                    description: (result.data.info.translation ? coloredStr("Перевод: ", orange) + result.data.info.translation + (result.data.files[j].season_translation ? ", " + result.data.files[j].season_translation : "") + "\n" : "") + (countries ? coloredStr("Страна: ", orange) + countries + "\n" : "") + (directors ? coloredStr("Режиссер: ", orange) + directors + " " : "") + (actors ? "\n" + coloredStr("В ролях актеры: ",
                        orange) + actors + "\n" : "") + (result.data.info.description ? coloredStr("Описание: ", orange) + result.data.info.description : ""),
                    duration: result.data.info.duration ? result.data.info.duration : "",
                    rating: result.data.info.hd_rating * 10,
                    genre: genres ? genres : "",
                    year: result.data.info.year ? parseInt(result.data.info.year, 10) : "",
                    icon: result.data.info.image_file ? result.data.info.image_file : ""
                });
                if (service.tvdb) {
                    item.bindVideoMetadata({
                        title: data.title + " S" + data.season + "E" + data.episode
                    });
                }
            }
        }
    } else {
        for (i in result.data.files) {
            log.p(result.data.info.title_en);
            data = {
                title: result.data.info.title_en !== "" ? result.data.info.title_en : result.data.info.title_ru,
                year: result.data.info.year,
                season: result.data.files[i].season,
                episode: result.data.files[i].episode,
                url: result.data.files[i].url,
                icon: result.data.info.image_file ? result.data.info.image_file : ""
            };
            log.d(PREFIX + ":" + result.id + ":" + JSON.stringify(data))

            item = page.appendItem(PREFIX + ":" + result.id + ":" + escape(JSON.stringify(data)), "directory", {
                title: result.data.files[i].title,
                description: (result.data.info.translation ? coloredStr("Перевод: ", orange) + result.data.info.translation + "\n" : "") + (countries ? coloredStr("Страна: ", orange) + countries + "\n" : "") + (directors ? coloredStr("Режиссер: ", orange) + directors + " " : "") + (actors ? "\n" + coloredStr("В ролях актеры: ", orange) + actors +
                    "\n" : "") + (result.data.info.description ? coloredStr("Описание: ", orange) + result.data.info.description : ""),
                duration: result.data.info.duration ? result.data.info.duration : "",
                rating: result.data.info.hd_rating * 10,
                genre: genres ? genres : "",
                year: result.data.info.year ? parseInt(result.data.info.year, 10) : "",
                icon: result.data.info.image_file ? unescape(result.data.info.image_file) : ""
            });
        }
    }

    page.loading = false;
};
