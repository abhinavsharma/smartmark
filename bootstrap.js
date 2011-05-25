/*
SCRIPTS = ["smartmark"];
const Cc = Components.classes;

function SmartMark() {
  Cu.reportError("starting smartmark");
  let me = this;
  let bmsvc = Cc["@mozilla.org/browser/bookmarks-service;1"]
             .getService(Ci.nsIBookmarksService);
  me.bookmarkListener = {};
  me.bmsvc.addObserver(me.bookmarkListener);
}

SmartMark.prototype.kill = function() {
  Cu.reportError("killing smartmark");
  me.bmsvc.removeObserver(me.bookmarkListener);
};

SmartMark.prototype.hello = function() {
  Cu.reportError("Hello");
};
*/

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

SmartMarkUtils.prototype.getPIDFromBID = function(bookmarkId) {
  Cu.reportError("lookup pid for bid" + bookmarkId);
  let me = this;
  let stm = Svc.History.DBConnection.createAsyncStatement(
    "SELECT fk FROM moz_bookmarks WHERE id = :bookmarkId;");
  Cu.reportError("statement createed");
  stm.params.bookmarkId = bookmarkId;
  let placeId = 0;
  Cu.reportError("going to exec query");
  Utils.queryAsync(stm, ["fk"]).forEach(function({fk}) {
    placeId = fk;
  });
  Cu.reportError("returning pid" + placeId);
  return placeId;
}

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
