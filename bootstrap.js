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

SmartMarkUtils.prototype.getPIDFromBID = function(bookmarkId) {
  let me = this;
  return me.getData(["fk"], {"id":bookmarkId}, "moz_bookmarks")[0]["fk"];
};

SmartMarkUtils.prototype.mergeCountDicts = function(d1, d2) {
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
  return d;
};

SmartMarkUtils.prototype.getSearchTagsRecursive = function(hid) {
  if (hid == 0) {
    return {};
  }

  // get url and title, extract tags, return tf dict
  // if has keywords, return tf dict
  // otherwise, recurse on from_visit
};

SmartMarkUtils.prototype.getTagsFromHIDS = function(hids) {
  let keys = {};
  hids.forEach(function(hid) {
    let newKeys = me.getSearchTagsRecursive(hid);
    keys = me.mergeCountDicts(keys, newKeys);
  });
  return keys;
};

SmartMarkUtils.prototype.getSearchTags = function(placeId) {
  let me = this;
  let hids = me.getData(["id"], {"place_id":placeId}, "moz_historyvisits")
             .map(function(elem) {return elem["id"]});
  return me.getTagsFromHIDS(hids);
};

function SmartMark() {
  Components.utils.reportError("smartmark init");
  let me = this;
  me.utils = new SmartMarkUtils();
  me.bmsvc = Cc["@mozilla.org/browser/nav-bookmarks-service;1"]
             .getService(Ci.nsINavBookmarksService);
  me.bookmarkListener = {
    onItemAdded: function(aItemId, aFolder, aIndex) {
      me.handleSmartmark(aItemId);
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
  Cu.reportError("Handle Smartmark" + aItemId);
  let me = this;
  let placeId = me.utils.getPIDFromBID(aItemId);
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
