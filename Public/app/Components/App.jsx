class App extends React.Component {

  //What happens on instantiation
  constructor(props) {

    //Short hand for calling React.component.call(props)
    super(props);

    //State defaults
    this.state = {
      currency: {
        text: 'Currency: BTC',
        val: 'BTC'
      },
      resolution: {
        text: 'Resolution: all',
        val: 'all'
      },
      exchange: {
        BTC: {
          last: 1,
          symbol: 'BTC'
        }
      },
      synced: false,
      history: []
    };
  }

  //componenetDidMount is called once for the very first render
  componentDidMount() {
    console.log('It mounted: ', this.props);

    //Set state must be async? When passing this.state instead of data it the old defaults
    this.getPrefs((data) => {
      this.setState(JSON.parse(data));  
      console.log('############## UPDATED STATE ########### \n', this.state);
    });
  }

  // Used to visually display a successful save
  synced() {
    this.setState({
      synced: true
    });

    setTimeout(function() {
      console.log(this.state);
      this.setState({
        synced: false
      });
    }.bind(this), 3000);
  }



  //AJAX Methods
  savePrefs(callback) {
    var context = this;

    $.ajax({
      // TODO: Test url in Deployment Environment
      url: 'http://localhost:3000/users/preferences', 
      method: 'POST',
      data: JSON.stringify(this.state),
      success: (data) => {
        if (callback) { callback(data); }
        console.log('Prefs saved!');
      },
      error: (error) => console.log('An error occurred!: ', error)
    });
  }


  // TODO: test this helper
  getPrefs(callback) {
    console.log('Getting prefs now', this.state);

    $.ajax({
      // TODO: Test url in Deployment Environment
      url: 'http://localhost:3000/users/preferences',
      method: 'GET',
      success: (data) => callback(JSON.parse(data)),
      error: (error) => console.log('An error occurred!: ', error)
    });
  }


  //Gets the most recent data on the exchange rates
  getExchange(callback) {
    //use blockchain api to get most up to date exchange prices
    $.ajax({
      url: 'https://blockchain.info/ticker?cors=true',
      method: 'GET',
      success: (data) => callback(data),
      error: (error) => console.log('An error occurred!: ', error)
    });
  }

  //Changes the currency we are currently looking at
  currencyHandler(curr) {

    //change the state: triggers the button text to change
    this.setState({
      currency: {
        text: 'Currency: ' + curr,
        val: curr
      }
    });

    //get the current exchange rates, then pass to rescale
    this.getExchange((data) => {
      this.setState({
        exchange: data
      });
      this.props.graph.rescale(curr, data);
    });
  }

  //Handles how long into the past we are seeing
  resHandler(res) {
    this.setState({
      resolution: {
        text: 'Resolution: ' + res + 'min',
        val: res
      }
    });

    this.props.graph.updateRes(res);
  }

  //Handles transaction history update
  updateHistory(tx) {
    var newHistory = this.state.history;
    console.log("************initial history**********", this.state.history);
    newHistory.push(tx);

    this.setState({
      history: newHistory
    });
    console.log("************new history**********", newHistory);

  }

  logout() {
    console.log('Closing websocket connections on logout ... ');
    sockets.forEach( socket => { socket.close(); });
  }

  //Renders the graph to the page
  //Along with the buttons which define preferences
  render() {
    return (
      <div className="target">
        <NavBar logout={this.logout} savePrefs={this.savePrefs.bind(this)} synced={this.synced.bind(this)} syncState={this.state.synced} />

        <div className="col-md-8">    
          <WorldMap />
          <Main currencies={this.props.currencies} currencyState={this.state.currency.text} resState={this.state.resolution.text} currHandler={this.currencyHandler.bind(this)} resHandler={this.resHandler.bind(this)}/>
          <HistoricalData />
          <Transactions />
          <Exchanges currencies={this.props.currencies} currHandler={this.currencyHandler.bind(this)} currencyState={this.state.currency.text}/>
        </div>
        
        <div className="col-md-4">
          <div className="panel panel-primary height-full">
            <div className="panel-heading"> Cryptocurrency Dashboard</div>
            <div className="panel-body">
              <TxMaker savePrefs={this.savePrefs.bind(this)} getPrefs={this.getPrefs.bind(this)} history={this.state.history} updateHistory={this.updateHistory.bind(this)} />
            </div>
            <div className="panel-footer">
              Made with <img src="./assets/heart.png" height="5" width="5"/> at Hack Reactor.
            </div>
          </div>    
        </div>
      </div>
    );
  }
}


// ES6 makes you expose things to the window, similar to in Node
window.App = App;
