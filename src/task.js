module.exports = class Task {
  constructor(title) {
    this.title = title
    this.timer = null;
    this.memo = null;
    this.selected = false
    this.isInputtingTitle = false
    this.isInputtingTimer = false
    this.isInputtingMemo = false
  }
}