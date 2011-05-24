const {classes: Cc, interfaces: Ci, utils: Cu} = Components;
Cu.import("resource://gre/modules/AddonManager.jsm");
Cu.import("resource://gre/modules/Services.jsm");
const global = this;
SCRIPTS = ["smartmark"];

function startup(data, reason) {
  Cu.reportError("Hi!");
  let id = data.id;
  AddonManager.getAddonByID(id, function(addon) {
    SCRIPTS.forEach(function(fileName) {
      let fileURI = addon.getResourceURI("scripts/"+fileName+".js");
      Services.scriptloader.loadSubScript(fileURI.spec, global);
    });
  let smartmark = new SmartMark();
  smartmark.hello();
  });
}

function shutdown(data, reason) {

}

function install (data, reason) {}

function uninstall (data, reason) {}
