const { ipcRenderer } = require("electron");
const Task = require("./task")

const getContainerElement = () => {
  return document.getElementsByClassName("container")[0]
}
const getTitleElement = () => {
  return document.getElementsByClassName("title")[0]
}

const getMemoElement = () => {
  return document.getElementsByClassName("memo")[0]
}

const getInputtingElement = () => {
  const i = document.getElementsByClassName("inputting")
  if (i.length > 0) {
    return i[0]
  } else {
    return null
  }
}

//titleを削除してからarrayを表示しなおす
const arrayToItem = (taskArray) => {
  const titleElement = getTitleElement()
  const newTitleElement = titleElement.cloneNode(false)

  //titleを更新
  taskArray.forEach(task => {
    let div = document.createElement("input")
    if (task.selected) {
      div.className = "selected-item"
    } else {
      div.className = "item"
    }
    if (task.isInputtingTitle) {
      div.className += " inputting"
    } else {
      div.setAttribute("disabled", "disabled")
    }
    div.value = task.title
    newTitleElement.appendChild(div)
  });
  titleElement.remove()
  getContainerElement().prepend(newTitleElement)

  //memoを更新
  const memoElement = getMemoElement()
  const newMemoElement = document.createElement("textarea")
  if (taskArray.length === 0) {
    newMemoElement.className = "memo"
    newMemoElement.setAttribute("disabled", "disabled")
  } else {
    const selectedTask = taskArray[getSelectedIndex(taskArray)]
    if (selectedTask.isInputtingMemo) {
      newMemoElement.className = "memo inputting"
    } else {
      newMemoElement.className = "memo"
      newMemoElement.setAttribute("disabled", "disabled")
    }
    newMemoElement.value = taskArray[getSelectedIndex(taskArray)].memo
  }
  memoElement.remove()
  getContainerElement().append(newMemoElement)

  //inputting中のelementにfocusをあてる
  const inputtingElement = getInputtingElement()
  if (inputtingElement !== null) {
    inputtingElement.focus()
  }
}

const getSelectedIndex = (taskArray) => {
  return taskArray.findIndex((task) => {
    return task.selected
  })
}

//indexのタスクを選択する
//indeXがnullのとき何も選択しない
//taskArrayがからのときは何もしない
//indexが大きすぎたら0を選択する
//indexが小さすぎたら末尾を選択する
const selectTask = (taskArray, index) => {
  if (taskArray.length == 0) {
    return
  }
  taskArray.forEach(task => {
    task.selected = false
  })
  if (index !== null) {
    if (index < 0) {
      taskArray[taskArray.length - 1].selected = true
    } else if (index > taskArray.length - 1) {
      taskArray[0].selected = true
    } else {
      taskArray[index].selected = true
    }
  }
}

//下のタスクを選択する
const selectTaskBelow = (taskArray) => {
  const currentIndex = getSelectedIndex(taskArray)
  selectTask(taskArray, currentIndex + 1)
}

//上のタスクを選択する
const selectTaskAbove = (taskArray) => {
  const currentIndex = getSelectedIndex(taskArray)
  selectTask(taskArray, currentIndex - 1)
}
//indexがnullのとき、taskArrayが空のとき、indexが不正なときはなにもしない
//新しいarrayを返す
const swapTask = (taskArray, index) => {
  if (taskArray.length === 0 || index === null || index < 0 || index > taskArray.length - 1) {
    return taskArray
  }
  const currentIndex = getSelectedIndex(taskArray)
  let newTaskArray = []
  for (let i = 0; i < taskArray.length; i++) {
    if (i === currentIndex) {
      newTaskArray.push(taskArray[index])
    } else if (i === index) {
      newTaskArray.push(taskArray[currentIndex])
    } else {
      newTaskArray.push(taskArray[i])
    }
  }
  return newTaskArray
}

//下のタスクと入れ替える
//新しいarrayを返す
const swapTaskBelow = (taskArray) => {
  const currentIndex = getSelectedIndex(taskArray)
  return swapTask(taskArray, currentIndex + 1)
}

//上のタスクと入れ替える
//新しいarrayを返す
const swapTaskAbove = (taskArray) => {
  const currentIndex = getSelectedIndex(taskArray)
  return swapTask(taskArray, currentIndex - 1)
}
//titleの入力を開始する
const startInputtingTitle = (taskArray, index) => {
  taskArray.forEach(task => {
    task.isInputtingTitle = false
  })
  if (index !== null && taskArray.length > index) {
    taskArray[index].isInputtingTitle = true
  }
}

//入力を終了する
const finishInputting = (taskArray) => {
  startInputtingTitle(taskArray, null)
  startInputtingMemo(taskArray, null)
}

//memoの入力を開始する
const startInputtingMemo = (taskArray, index) => {
  taskArray.forEach(task => {
    task.isInputtingMemo = false
  })
  if (index !== null && taskArray.length > index) {
    taskArray[index].isInputtingMemo = true
  }
}

//inputting中のものをtaskに反映させる
const refrection = (taskArray) => {
  const inputtingElement = getInputtingElement()
  if (inputtingElement !== null) {
    taskArray.forEach(task => {
      if (task.isInputtingTitle) {
        task.title = inputtingElement.value
        return
      }
      if (task.isInputtingMemo) {
        task.memo = inputtingElement.value
        return
      }
    })
  }
}

const State = {
  normal: 0,
  inputtingTitle: 1,
  inputtingTimer: 2,
  inputtingMemo: 3,
}

const getCurrentState = (taskArray) => {
  const selectedTask = taskArray.find(task => task.selected)
  if (selectedTask !== null && selectedTask !== undefined) {
    if (selectedTask.isInputtingTitle) {
      return State.inputtingTitle
    } else if (selectedTask.isInputtingTimer) {
      return State.inputtingTimer
    } else if (selectedTask.isInputtingMemo) {
      return State.inputtingMemo
    } else {
      return State.normal
    }
  } else {
    return State.normal
  }
}

const process = (taskArray, parent_id) => {

}

window.onload = () => {
  taskArray = ipcRenderer.sendSync("getInitialArray")
  undoArray = []
  selectTask(taskArray, 0)
  arrayToItem(taskArray)
  document.body.onkeydown = (e) => {
    e = e || window.event
    if (e.key === "n") {
      if (getCurrentState(taskArray) === State.normal) {
        //push動作
        taskArray.unshift(new Task())
        selectTask(taskArray, 0)
        startInputtingTitle(taskArray, 0)
        e.preventDefault()
        //再描写
        arrayToItem(taskArray)
      }
    } else if (e.key === "y") {
      if (getCurrentState(taskArray) === State.normal) {
        if (taskArray.length == 0) return;
        //pop動作
        undoArray.unshift(taskArray.shift())
        selectTask(taskArray, 0)
        e.preventDefault()
        //再描写
        arrayToItem(taskArray)
      }
    }
    else if (e.key === "Enter") {
      //変換確定のEnterのときはなにもしない
      if (e.isComposing) return
      if (getCurrentState(taskArray) === State.inputtingTitle) {
        //入力タイトルを確定する
        refrection(taskArray)
        finishInputting(taskArray)
        //再描写
        arrayToItem(taskArray)
      }
    }
    else if (e.key === "j" || e.key === "ArrowDown") {
      if (getCurrentState(taskArray) === State.normal) {
        //下のtaskを選択する
        selectTaskBelow(taskArray)
        //再描写
        arrayToItem(taskArray)
      }
    } else if (e.key === "k" || e.key === "ArrowUp") {
      if (getCurrentState(taskArray) === State.normal) {
        //上のタスクを選択する
        selectTaskAbove(taskArray)
        //再描写
        arrayToItem(taskArray)
      }
    }
    else if (e.key === "h" || e.key === "ArrowLeft") {
      if (getCurrentState(taskArray) === State.normal) {
        //下のタスクと入れ替える
        taskArray = swapTaskBelow(taskArray)
        //再描写
        arrayToItem(taskArray)
      }
    }
    else if (e.key === "l" || e.key === "ArrowRight") {
      if (getCurrentState(taskArray) === State.normal) {
        //上のタスクと入れ替える
        taskArray = swapTaskAbove(taskArray)
        //再描写
        arrayToItem(taskArray)
      }
    }
    else if (e.key === "r") {
      if (getCurrentState(taskArray) === State.normal) {
        //titleをrename
        startInputtingTitle(taskArray, getSelectedIndex(taskArray))
        e.preventDefault()
        //再描写
        arrayToItem(taskArray)
      }
    }
    else if (e.key === "m") {
      if (getCurrentState(taskArray) === State.normal) {
        //メモをinput
        startInputtingMemo(taskArray, getSelectedIndex(taskArray))
        e.preventDefault()
        //再描写
        arrayToItem(taskArray)
      }
    }
    else if (e.key === "Escape") {
      if (getCurrentState(taskArray) !== State.normal) {
        //inputting memoを終了
        refrection(taskArray)
        finishInputting(taskArray)
        e.preventDefault()
        //再描写
        arrayToItem(taskArray)
      }
    }
    else if (e.key === "u") {
      if (getCurrentState(taskArray) === State.normal) {
        //undoする
        if (undoArray.length == 0) return;
        taskArray.unshift(undoArray.shift())
        selectTask(taskArray, 0)
        e.preventDefault()

        //再描写
        arrayToItem(taskArray)
      }
    }

    //taskArrayをMainと同期する
    saveTaskArray(taskArray);
  }
}

const saveTaskArray = (taskArray) => {
  ipcRenderer.send("saveTaskArray", taskArray)
}