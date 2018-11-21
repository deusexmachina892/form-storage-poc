import React, { Component } from "react";
import SimpleStorageContract from "./contracts/SimpleStorage.json";
import getWeb3 from "./utils/getWeb3";
import truffleContract from "truffle-contract";
import ipfs from './ipfs';

import "./App.css";

class App extends Component {
  state = { 
    id: null,
    remarks: null,
    ipfsHash: null,
    buffer: null,
    web3: null, 
    accounts: null, 
    contract: null,
    transacted: false
  };

  componentDidMount = async () => {
    try {
      // Get network provider and web3 instance.
      const web3 = await getWeb3();

      // Use web3 to get the user's accounts.
      const accounts = await web3.eth.getAccounts();

      // Get the contract instance.
      const Contract = truffleContract(SimpleStorageContract);
      Contract.setProvider(web3.currentProvider);
      const instance = await Contract.deployed();
      const result = await instance.get();
      // Set web3, accounts, and contract to the state, and then proceed with an
      // example of interacting with the contract's methods.
      console.log(result)
      this.setState({ web3, accounts, contract: instance });
    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`
      );
      console.log(error);
    }
  };

  runExample = async () => {
    const { accounts, contract } = this.state;

    // Stores a given value, 5 by default.
    await contract.set(5, 'rohan', 'rohan', {from: accounts[0]});

    // Get the value from the contract to prove it worked.
    const response = await contract.get();

    // Update state with the result.
    this.setState({ storageValue: response.toNumber() });
  };
  onSubmit(e){
    e.preventDefault();
    const {contract, accounts, id, remarks} = this.state;
    ipfs.files.add(this.state.buffer, async (error, result)=>{
      if(error){
        console.log(error);
        return;
      }
      if(contract){
        await contract.set(parseInt(id), remarks, result[0].hash,{from: accounts[0]})
        this.setState({ipfsHash: result[0].hash, transacted: true})
      }
      
    })
  }
  captureData(e){
    const file = e.target.files[0];
    const reader = new window.FileReader();
    reader.readAsArrayBuffer(file);
    reader.onloadend = ()=>{
      this.setState({buffer: Buffer(reader.result)})
      console.log(this.state.buffer)
    }
  }
  render() {
    if (!this.state.web3) {
      return <div>Loading Web3, accounts, and contract...</div>;
    }
    return (
      <div className="App">
        <h1>Insurance Claim Interface</h1>
        <form onSubmit ={this.onSubmit.bind(this)}>
        <div style={{margin:'10px', padding:'10px'}}>
          <label htmlFor="id" style={{margin:'35px', padding:'10px'}}>Id:</label>
          <input type="text" name="id" onChange={(e)=>this.setState({id: e.target.value})}/><br/>
        </div>
        <div style={{margin:'10px', padding:'10px'}}>
          <label htmlFor="remarks" style={{margin:'10px', padding:'10px'}}>Remarks:</label>
          <input type="textarea" name="remarks" onChange={(e)=>this.setState({remarks: e.target.value})}/><br/>
        </div>
        <div style={{margin:'10px', padding:'10px'}}>
          <label htmlFor="picture" style={{margin:'17px', padding:'10px'}}>Picture:</label>
          <input type="file" name="picture" onChange={this.captureData.bind(this)}/>
        </div>
        <input type="submit" />
        </form>
        {this.state.transacted &&
        <div>
          <h1>The following information has been deployed on Blockchain</h1>
          <div>ID: {this.state.id}</div>
          <div>Remarks: {this.state.remarks}</div>
          <img src={`https://ipfs.io/ipfs/${this.state.ipfsHash}`} style={{width:'200px', height:'400px'}}/>
        </div>}
      </div>
    );
  }
}

export default App;
