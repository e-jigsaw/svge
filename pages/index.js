import {Component} from 'react'
import initStore from '../initStore.js'
import {Provider} from 'mobx-react'
import ControlPanel from '../components/ContolPanel'
import Canvas from '../components/Canvas'

export default class extends Component {
  static getInitialProps ({req}) {
    const isServer = !!req
    const store = initStore(isServer)
    return {isServer}
  }

  constructor (props) {
    super(props)
    this.store = initStore(props.isServer)
  }

  render () {
    console.log(this.store)
    return (
      <Provider store={this.store}>
        <div>
          <style global jsx>{`
            body {
              background-color: #fefefe;
            }
          `}</style>
          <ControlPanel />
          <Canvas />
        </div>
      </Provider>
    )
  }
}
