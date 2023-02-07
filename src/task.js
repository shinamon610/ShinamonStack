const crypto = require("crypto")
module.exports = class Task {
  constructor() {
    this.title = ""
    this.timer = null;
    this.memo = "";
    this.selected = false
    this.isInputtingTitle = false
    this.isInputtingTimer = false
    this.isInputtingMemo = false
    this.children = []
  }
}