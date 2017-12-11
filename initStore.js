import {types} from 'mobx-state-tree'
import Editor from './domains/Editor.js'

let store = null

export default isServer => {
  if (isServer) {
    return Editor.create()
  } else {
    if (store === null) {
      store = Editor.create()
      store.init()
    }
    return store
  }
}
