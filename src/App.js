import React, { Component } from 'react';
import './App.css';
import Sender from './Sender';
import Receiver from './Receiver';
import consts from './Constants.js';


export default class App extends Component {

  constructor(props) {
    super(props);
    this.canvasRef = React.createRef();
    this.state = {
      isStartedSimulation: false,
      //Inputs
      ber: 1000,
      length: 400,
      pcount: 3,
      pdelay: 15,
      bandwidth: 8000,
      windowSize: 4
    }
  }

  componentDidMount = () => {
    this.ctx = this.canvasRef.current.getContext("2d");
    this.ctx.strokeStyle = 'black';
    this.startSimulation();
  }

  startSimulation = () => {
    if (this.state.ber === '' || this.state.length === '' || this.state.pcount === '' || this.state.pdelay === '') return;

    this.setState({ isStartedSimulation: true });
    this.initialize();
    this.startSimulatorLoop();
    this.startSendingPackages();
  }

  initialize = () => {
    //INPUTS
    App.lastY = 30;
    this.ber = parseInt(this.state.ber); //Bit Error Rate 10^-ber

    this.length = parseInt(this.state.length); //Package Length
    this.packageCount = parseInt(this.state.pcount); //Number of Packages
    this.propagationDelay = parseInt(this.state.pdelay);
    this.rtt = 2 * this.propagationDelay; //Run Trip Time (ms)
    this.timeout = 2 * this.rtt; //Timeout
    this.bandwidth = this.state.bandwidth; //bits per sec
    this.windowSize = this.state.windowSize;

    //Set Devices
    this.sender = new Sender(this.propagationDelay);
    this.receiver = new Receiver(this.propagationDelay);
    this.sender.setReceiver(this.receiver);
    this.receiver.setSender(this.sender);

    //this.lastY = this.sender.coords.Y + consts.RECT_HEIGHT; STATIC

    //Time variables and Counters
    this.timeoutCounter = 0; //(ms)
    this.simulationTime = 0; //(ms)
    this.masterClock = 0;

    this.errorCounter = 1;
    this.bitCounter = 0;
  }

  drawPackageQueue = () => {
    const width = 60;
    const height = 30;
    const x = 5;
    let y = 20;

    this.ctx.font = "15px Arial";
    this.ctx.fillText("Package Queue", x, y);
    y += 8;
    this.packageQueue.forEach((p) => {
      this.ctx.rect(x, y, width, height);
      this.ctx.fillText("P" + p.id, x + 10, y + height - 8);
      y += height;

    });
  }

  drawSimulationData = () => {
    this.ctx.font = "15px Arial";
    this.ctx.fillText("Master Clock: " + this.masterClock, 625, 20);
    this.ctx.fillText("Simulation Time: " + this.simulationTime + "ms", 625, 40);
    this.ctx.fillText("Total Bits: " + this.bitCounter, 625, 60);
    this.ctx.fillText("Sucessfull Bits: " + (this.bitCounter - (this.errorCounter - 1) * this.length), 625, 80);
    this.ctx.fillText("Timeout Counter: " + this.timeoutCounter + "ms", 625, 100);
  }

  drawOutput = () => {
    this.ctx.fillText("OUTPUT", 5, 20);
    this.ctx.fillText("Utilization: " + ((this.length / this.bandwidth) / (this.rtt + (this.length / this.bandwidth))).toFixed(6), 5, 40);
    this.ctx.fillText("Throughput: " + (this.bitCounter / this.simulationTime).toFixed(3), 5, 60);
    this.ctx.fillText("Goodput: " + ((this.bitCounter - (this.errorCounter - 1) * this.length) / this.simulationTime).toFixed(3), 5, 80);
  }

  startSimulatorLoop = () => {
    this.simulatorLoop = setInterval(() => {
      this.ctx.clearRect(0, 0, consts.WIDTH, consts.HEIGHT);
      this.ctx.beginPath();
      //if (this.state.isStartedSimulation) this.drawPackageQueue();
      //else this.drawOutput();

      //this.drawSimulationData();
      this.sender.draw(this.ctx);
      this.receiver.draw(this.ctx);
      this.ctx.stroke();
    }, 1000 / 10);
  }

  isPacketLoss = () => {
    if (this.bitCounter >= this.errorCounter * this.ber) {
      this.errorCounter++;
      return true;
    }
    return false;
  }

  startSendingPackages = () => {
    this.sender.sendPackage(1, false, false);
    this.sender.sendPackage(2, false, false);
    this.sender.sendPackage(3, false, false);
    console.log(this.sender.packages);
  }

  static getY = () => {
    this.lastY += 30;
    return this.lastY;
  }

  static getReceiverY = () => {
    this.lastY += 60;
    return this.lastY;
  }

  render = () => {
    const form = <div style={{ marginTop: 5 }}>
      <label>Bit Error Rate (error/bits): </label>
      <input disabled={this.state.isStartedSimulation} type="number"
        onChange={(e) => this.setState({ ber: e.target.value })} />

      <label>  Package Length: </label>
      <input disabled={this.state.isStartedSimulation} type="number"
        onChange={(e) => this.setState({ length: e.target.value })} />
      <br />
      <br />
      <label>Package Count: </label>
      <input disabled={this.state.isStartedSimulation} type="number"
        onChange={(e) => this.setState({ pcount: e.target.value })} />

      <label>  Propagation Delay(ms): </label>
      <input disabled={this.state.isStartedSimulation} type="number"
        onChange={(e) => this.setState({ pdelay: e.target.value })} />
      <br />
      <br />
      <label>  Bandwidth(bits/sec): </label>
      <input disabled={this.state.isStartedSimulation} type="number"
        onChange={(e) => this.setState({ bandwidth: e.target.value })} />
      <br />
      <br />
      <input disabled={this.state.isStartedSimulation} type="button" value="Start Simulation" onClick={() => this.startSimulation()} />


    </div>;

    return (
      <div className="App">

        <canvas
          ref={this.canvasRef}
          id="canvas"
          width={consts.WIDTH}
          height={consts.HEIGHT}
          style={{ marginTop: '10px', border: '1px solid #c3c3c3' }}>
        </canvas>
      </div>
    );
  }
}

App.lastY = 60;

