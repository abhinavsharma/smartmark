const Cu = Components.utils;
const Cc = Components.classes;
const Ci = Components.interfaces;
const global = this;

Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://services-sync/util.js");

function SmartMarkUtils() {
  Cu.reportError("smartmark utils init");
  let me = this;
}

SmartMarkUtils.prototype.getData = function(fields, conditions, table) {
  //Cu.reportError("looking for data");
  let me = this;
  let queryString = "SELECT ";
  queryString += fields.join(',') + ' FROM ' + table + ' WHERE ';
  for (let key in conditions) {
    queryString += key + " = :" + key;
  }
  //Cu.reportError("query string constructed" + queryString);
  let stm = Svc.History.DBConnection.createAsyncStatement(queryString);
  //Cu.reportError("statement created, parametrizing");
  for (let k in  conditions) {
    stm.params[k] = conditions[k];
  }
  //Cu.reportError("params are" + JSON.stringify(stm.params));
  let ret = [];
  //Cu.reportError("executing statement");
  Utils.queryAsync(stm, fields).forEach(function(row) {
    ret.push(row);
  });
  //Cu.reportError("returing " + JSON.stringify(ret));
  return ret;
};

SmartMarkUtils.prototype.mergeCountDicts = function(d1, d2) {
  Cu.reportError("merging dicts : " );
  let d = {};
  for (let k1 in d1) {
    d[k1] = d1[k1]
  }
  for (let k2 in d2) {
    if (k2 in d) {
      d[k2] += d2[k2];
    } else {
      d[k2] = d2[k2];
    }
  }
  Cu.reportError("returning merged" + JSON.stringify(d));
  return d;
};

SmartMarkUtils.prototype.getTagsFromPID = function(placeId) {

  Cu.reportError("getting tags for pid" + placeId);
  let me = this;
  function getTagsFromTitle(title) {
    return title.split(/[\s|\-\_\/]+/)
           .map(function(s){return s.toLowerCase();})
           .filter(function(e) {return (e.length > 0);});
  }
  
  let info = me.getData(["url", "title"], {"id":placeId}, "moz_places")[0];
  let result = getTagsFromTitle(info["title"]);
  Cu.reportError("returning tags " + JSON.stringify(result));
  return result;
};

SmartMarkUtils.prototype.getSearchTagsFromPID = function(placeId) {
  let me = this;
  function getSearchTagsFromURL(url) {
    return (function() {
      var query = {};
      var pair;
      var search = url.split(/https*:\/\/.*?\/(.*)/)[1].split('&');
      Cu.reportError("serach string is" + search);
      var i = search.length;
      while (i--) {
        pair = search[i].split("=");
        if (pair[1]) {
          if (pair[0].indexOf('?') > -1) {
            pair[0] = pair[0].split('?')[1];
          }
          query[pair[0]] = decodeURIComponent(pair[1]);
        }
       }
       return query;
   })();
  }

  let uri = me.getData(["url"], {"id":placeId}, "moz_places")[0]["url"];
  let resRaw = getSearchTagsFromURL(uri);
  let tags = {};
  ["q", "search", "query", "search_query"].forEach(function(k) {
    if (k in resRaw) {
      resRaw[k].split(/[\s|\+\-\_]/g).forEach(function(tag) {
        if (tag in tags) {
          tags[tag] += 1;
        } else {
          tags[tag] = 1;
        }
      });
    }
  });
  Cu.reportError(JSON.stringify(tags));
  return tags;
};

SmartMarkUtils.prototype.getSearchTagsRecursive = function(hid) {
  Cu.reportError("in getSearchTagsRecursive with hid " +hid );
  let me = this;
  if (hid == 0) {
    return {};
  }
  let placeId = me.getData(["place_id"], {"id": hid}, "moz_historyvisits")[0]["place_id"];
  Cu.reportError("pid for hid " + hid + " is " + placeId);
  let tagList = me.getSearchTagsFromPID(placeId);
  Cu.reportError("tag list is " + JSON.stringify(tagList));

  function numKeys(d) {
    let c = 0;
    for (let k in d) {
      c++;
    }
    return c;
  }

  if (numKeys(tagList) > 0) {
    return tagList;
  }
  Cu.reportError("getting from visit");
  let fromVisit = me.getData(["from_visit"], {"id": hid}, "moz_historyvisits")[0]["from_visit"];
  Cu.reportError("from visit is " + fromVisit + "fod hid: " + hid + "now recursing");
  return me.getSearchTagsRecursive(fromVisit);

  // get url and title, extract tags, return tf dict
  // if has keywords, return tf dict
  // otherwise, recurse on from_visit
};

SmartMarkUtils.prototype.getTagsFromHIDS = function(hids) {
  let me = this;
  Cu.reportError("getting tags for multiple hids");
  let keys = {};
  hids.forEach(function(hid) {
    Cu.reportError("calling getSearchTagsRecursive");
    let newKeys = me.getSearchTagsRecursive(hid);
    Cu.reportError("new tags are" + JSON.stringify(newKeys));
    keys = me.mergeCountDicts(keys, newKeys);
  });
  return keys;
};

SmartMarkUtils.prototype.getSearchTags = function(placeId) {
  Cu.reportError("getting search tags");
  let me = this;
  let hids = me.getData(["id"], {"place_id":placeId}, "moz_historyvisits")
             .map(function(elem) {return elem["id"]});
  Cu.reportError("hids are " + hids);
  return me.getTagsFromHIDS(hids);
};

function SmartMark() {
  Components.utils.reportError("smartmark init");
  let me = this;
  me.utils = new SmartMarkUtils();
  me.bmsvc = Cc["@mozilla.org/browser/nav-bookmarks-service;1"]
             .getService(Ci.nsINavBookmarksService);
  me.tagsvc = Cc["@mozilla.org/browser/tagging-service;1"]
              .getService(Ci.nsITaggingService);
  me.bookmarkListener = {
    onItemAdded: function(aItemId, aFolder, aIndex) {
      try{
      me.handleSmartmark(aItemId);
      }
      catch(ex){Cu.reportError(ex);}
    },

    onItemChanged: function(){},
    onItemRemoved: function() {},
    onItemVisited: function(){},
    onBeginUpdateBatch: function() {},
    onItemMoved: function(){},
    onBeforeItemRemoved: function(){},
    onBeginUpdateBatch: function() {},
    onEndUpdateBatch: function(){},

    QueryInterface: XPCOMUtils.generateQI([Ci.nsINavBookmarkObserver])
  };
  me.bmsvc.addObserver(me.bookmarkListener, false);
}

SmartMark.prototype.kill = function() {
  let me = this;
  me.bmsvc.removeObserver(me.bookmarkListener);
}

SmartMark.prototype.handleSmartmark = function(aItemId) {
  let me = this;
  Cu.reportError("Handle Smartmark" + aItemId);
  let placeId = me.utils.getData(["fk"], {"id":aItemId}, "moz_bookmarks")[0]["fk"];


  Cu.reportError("place ID is " + placeId);
  let searchTags = me.utils.getSearchTags(placeId);
  Cu.reportError(JSON.stringify(searchTags));
  let tagArray = [];
  for (let k in searchTags) {
    tagArray.push(k);
  }
  let bookmarkURI = me.bmsvc.getBookmarkURI(aItemId);
  me.tagsvc.tagURI(bookmarkURI, tagArray);
};

function startup(data, reason) {
  global.sm = new SmartMark();
}

function shutdown(data, reason) {
  Cu.reportError("smartmark die");
  global.sm.kill();
}

function install (data, reason) {}

function uninstall (data, reason) {}
