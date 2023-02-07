const crypto = require("crypto")
module.exports = class Task {
  constructor() {
    this.id = crypto.randomUUID()
    this.title = ""
    this.timer = null;
    this.memo = null;
    this.selected = false
    this.isInputtingTitle = false
    this.isInputtingTimer = false
    this.isInputtingMemo = false
    this.children = []
  }
}