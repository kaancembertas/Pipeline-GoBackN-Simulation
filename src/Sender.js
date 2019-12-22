import consts from './Constants';
import App from './App';

export default class Sender {

    constructor(propagationDelay, windowSize, packageCount) {
        this.coords = {
            X: (consts.WIDTH - consts.RECT_WIDTH - consts.SPACE) / 2,
            Y: 100,
            lineX: ((consts.WIDTH - consts.RECT_WIDTH - consts.SPACE) / 2) + consts.RECT_WIDTH / 2
        }
        this.packagesSent = []; //Packages Sent
        this.packages = [];

        //Set Packages Queue
        for (let i = 0; i < packageCount; i++) {
            this.packages.push({
                id: i + 1,
                status: 'none'
            });
        }

        this.propagationDelay = propagationDelay;
        this.yCounter = 0;
        this.windowSize = windowSize;
        this.windowIndex = 0;
        this.lastPackageSent = { id: -1, loss: false };
    }

    setReceiver = (r) => {
        this.receiver = r;
    }

    sendPackage = (id, loss, dublicate) => {

        this.lastPackageSent = {
            id: id,
            loss: loss,
            fromX: this.coords.lineX,
            fromY: App.getY(),
            toX: this.receiver.coords.lineX,
            toY: App.getY(),
            dublicate: dublicate,
            status: 'none'
        };
        this.packagesSent.push(this.lastPackageSent);

        if (!this.lastPackageSent.loss)
            this.receiver.getPackage(this.lastPackageSent);
    }

    getAcknowledge = (ack) => {
        this.lastAcknowledge = ack;
        this.packages[ack.id - 1].status = 'gotAck';
    }

    drawSender = (ctx) => {
        //Draw Box
        ctx.rect(this.coords.X, this.coords.Y, consts.RECT_WIDTH, consts.RECT_HEIGHT);
        //Draw Text
        ctx.font = "20px Arial";
        ctx.fillText("Sender", this.coords.X + 15, this.coords.Y + (consts.RECT_HEIGHT / 2) + 8);
        //Draw Line
        ctx.moveTo(this.coords.X + consts.RECT_WIDTH / 2, this.coords.Y + consts.RECT_HEIGHT);
        ctx.lineTo(this.coords.X + consts.RECT_WIDTH / 2, consts.HEIGHT - this.coords.Y + consts.RECT_HEIGHT);
    }

    drawSentPackages = (ctx) => {

        this.packagesSent.forEach((p) => {
            //Draw Line
            ctx.moveTo(p.fromX, p.fromY);
            ctx.lineTo(p.toX, p.toY);
            //Draw Package
            let box = {
                X: (this.coords.X + this.receiver.coords.X) / 2,
                Y: (p.fromY + p.toY) / 2 - 14
            };
            ctx.rect(box.X - 5, box.Y - 15, 40, 20);
            ctx.font = "15px Arial";
            ctx.fillText("P" + p.id, box.X, box.Y);

            if (p.loss) {
                ctx.moveTo(box.X - 5, box.Y - 15);
                ctx.lineTo(box.X + 35, box.Y + 5);
                ctx.moveTo(box.X + 35, box.Y - 15);
                ctx.lineTo(box.X - 5, box.Y + 5);
            }
            else if (p.dublicate) {
                ctx.fillText("Discard dublicate frame", p.toX + 5, p.toY + 5);
            }
            else if (p.status === 'discardFromReceiver') {
                ctx.fillText("Discard from receiver", p.toX + 5, p.toY + 5);
            }

        });
    }

    draw = (ctx) => {
        this.drawSender(ctx);
        this.drawSentPackages(ctx);
    }

}