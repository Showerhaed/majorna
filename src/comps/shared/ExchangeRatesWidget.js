import React, { Component } from 'react'
import server from '../../data/server'
import { fm } from '../../data/utils'

export default class extends Component {
  state = {
    btcMj: 0,
    ethMj: 0
  }

  componentDidMount = async () => {
    const resBtc = await server.coinbase.price('BTC-USD')
    const btcData = await resBtc.json()
    const resEth = await server.coinbase.price('ETH-USD')
    const ethData = await resEth.json()
    this.setState({
      btcMj: fm(Math.round(btcData.data.amount / this.props.mjMetaDoc.val)),
      ethMj: fm(Math.round(ethData.data.amount / this.props.mjMetaDoc.val))
    })
  }

  render = () =>
    <div className="flex-column">
      <strong>Exchange Rates</strong>
      {!this.state.btcMj ?
        <div className="mj-box center-all spinner"/> :
        <div>
          1 Bitcoin = {this.state.btcMj} mj <br/>
          1 Ethereum = {this.state.ethMj} mj
        </div>
      }
    </div>
}