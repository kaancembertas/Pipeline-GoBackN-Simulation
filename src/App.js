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
      pcount: 9,
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
    App.lastY = 120;
    this.ber = parseInt(this.state.ber); //Bit Error Rate 10^-ber

    this.length = parseInt(this.state.length); //Package Length
    this.packageCount = parseInt(this.state.pcount); //Number of Packages
    this.propagationDelay = parseInt(this.state.pdelay);
    this.rtt = 2 * this.propagationDelay; //Run Trip Time (ms)
    this.timeout = 2 * this.rtt; //Timeout
    this.bandwidth = this.state.bandwidth; //bits per sec
    this.windowSize = this.state.windowSize;

    //Set Devices
    this.sender = new Sender(this.propagationDelay, this.windowSize, this.packageCount);
    this.receiver = new Receiver(this.propagationDelay, this.windowSize);
    this.sender.setReceiver(this.receiver);
    this.receiver.setSender(this.sender);

    //Time variables and Counters
    this.timeoutCounter = []; //(ms)
    for (let i = 0; i < this.windowSize; i++) this.timeoutCounter.push(0);
    this.simulationTime = 0; //(ms)
    this.masterClock = 0;

    this.errorCounter = 1;
    this.bitCounter = 0;
  }

  drawWindow = () => {
    const width = 60;
    const height = 30;
    let x = (consts.WIDTH - this.windowSize * width) / 2;
    const y = 40;
    this.ctx.font = "15px Arial";
    this.ctx.fillText("Window Elements", (consts.WIDTH / 2) - 55, 20);
    for (let i = this.sender.windowIndex; i < this.sender.windowIndex + this.windowSize; i++) {
      let status = '';
      switch (this.sender.packages[i].status) {
        case 'none': status = 'n'; break;
        case 'sent': status = 's'; break;
        case 'gotAck': status = 'ack'; break;
        case 'resent': status = 'rs'; break;
      }
      this.ctx.rect(x, y, width, height);
      this.ctx.fillText("P" + this.sender.packages[i].id + " | " + status
        , x + 2, y + height - 10);
      x += width;
    }

  }

  drawSimulationData = () => {
    this.ctx.font = "15px Arial";
    this.ctx.fillText("Master Clock: " + this.masterClock, 625, 20);
    this.ctx.fillText("Simulation Time: " + this.simulationTime + "ms", 625, 40);
    this.ctx.fillText("Total Bits: " + this.bitCounter, 625, 60);
    this.ctx.fillText("Sucessfull Bits: " + (this.bitCounter - (this.errorCounter - 1) * this.length), 625, 80);
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
      if (this.state.isStartedSimulation) this.drawWindow();
      else this.drawOutput();

      this.drawSimulationData();
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
    this.sendPackageLoop = setInterval(() => {
      if (this.receiver.acknowledges.filter(ack => !ack.loss && !ack.dublicate).length === this.packageCount) {
        clearInterval(this.sendPackageLoop);
        this.setState({ isStartedSimulation: false });
        return;
      }

      //Slide window
      const index = this.sender.windowIndex;
      for (let i = index; i < index + this.windowSize; i++) {
        if (this.sender.windowIndex + this.windowSize !== this.packageCount &&
          this.sender.packages[i].status === 'gotAck') {
          this.sender.windowIndex++;
        }
      }

      for (let i = this.sender.windowIndex; i < this.sender.windowIndex + this.windowSize; i++) {

        if (this.timeoutCounter[i - this.sender.windowIndex] === this.timeout && this.sender.packages[i].status === 'sent') {
          this.timeoutCounter[i - this.sender.windowIndex] = 0;
          for (let i = this.sender.windowIndex; i < this.sender.windowIndex + this.windowSize; i++) {
            if (this.sender.packages[i].status !== "gotAck")
              this.sender.packages[i].status = 'resent';
          }
        }
        if (this.sender.packages[i].status === "none" || this.sender.packages[i].status === "resent") {
          this.bitCounter += this.length;
          this.sender.sendPackage(this.sender.packages[i].id, this.isPacketLoss(), false);
          this.sender.packages[i].status = 'sent';
          this.timeoutCounter[i - this.sender.windowIndex] = 0;
        }
        this.timeoutCounter[i - this.sender.windowIndex] += this.propagationDelay;
      }
      this.masterClock++;
      this.simulationTime += this.propagationDelay;
    }, this.propagationDelay * consts.SPEED);


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

App.lastY = 120;

