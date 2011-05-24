function SmartMark() {
  let me = this;
}

SmartMark.prototype.hello = function() {
  Cu.reportError("Hello");
};
