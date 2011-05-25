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

function SmartMark() {
  Components.utils.reportError("smartmark init");
  let me = this;
  me.bmsvc = Cc["@mozilla.org/browser/nav-bookmarks-service;1"]
             .getService(Ci.nsINavBookmarksService);
  me.bookmarkListener = {
    onItemAdded: function(aItemId, aFolder, aIndex) {
      Cu.reportError("Yay, bookmark added");
      me.handleSmartmark(aItemId);
    },

    QueryInterface: XPCOMUtils.generateQI([Ci.nsINavBookmarkObserver])
  };
  me.bmsvc.addObserver(me.bookmarkListener, false);
}

SmartMark.prototype.kill = function() {
  let me = this;
  me.bmsvc.removeObserver(me.bookmarkListener);
}

SmartMark.prototype.handleSmartmark = function(aItemId) {
  Cu.reportError("Handle Smartmark");
  let me = this;
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
