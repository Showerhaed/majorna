import React, { Component } from 'react';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import './App.css';
import Header from './components/Header';

class App extends Component {
  render() {
    return (
      <MuiThemeProvider>
        <div className="App">
          <Header />

          <p className="App-body">
            Time is: {(new Date()).toTimeString()}
          </p>
        </div>
      </MuiThemeProvider>
    );
  }
}

export default App;
