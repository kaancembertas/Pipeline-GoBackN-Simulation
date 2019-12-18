import consts from './Constants.js';
import App from './App';

export default class Receiver {
    constructor(propagationDelay) {
        this.coords = {
            X: (consts.WIDTH - consts.RECT_WIDTH + consts.SPACE) / 2,
            Y: 20,
            lineX: ((consts.WIDTH - consts.RECT_WIDTH + consts.SPACE) / 2) + consts.RECT_WIDTH / 2
        }

        this.acknowledges = []; //Acknowledges Sent
        this.propagationDelay = propagationDelay;
        this.packagesGot = [];

    }

    setSender = (s) => {
        this.sender = s;
    }
    getPackage = (p) => {
        setTimeout(() => {
            this.sendAcknowledge(p);
            this.packagesGot.push(p.id);
        }, this.propagationDelay * consts.SPEED);
    }

    isLossAck = () => {
        if (Math.random() <= consts.LOSS_ACK_PROB)
            return true;
        return false;
    }

    sendAcknowledge = (p) => {
        const loss = this.isLossAck();
        const ack = {
            id: p.id,
            loss: loss,
            fromX: this.coords.lineX,
            fromY: p.toY,
            toX: this.sender.coords.lineX,
            toY: App.getReceiverY()
        };

        this.acknowledges.push(ack);

        if (!ack.loss)
            this.sender.getAcknowledge(ack);
        else {
            App.getY();
            App.getY();
        }

    }

    drawReceiver = (ctx) => {
        //Draw Box
        ctx.rect(this.coords.X, this.coords.Y, consts.RECT_WIDTH, consts.RECT_HEIGHT);
        //Draw Text
        ctx.font = "20px Arial";
        ctx.fillText("Receiver", this.coords.X + 10, this.coords.Y + (consts.RECT_HEIGHT / 2) + 8);
        //Draw Line
        ctx.moveTo(this.coords.X + consts.RECT_WIDTH / 2, this.coords.Y + consts.RECT_HEIGHT);
        ctx.lineTo(this.coords.X + consts.RECT_WIDTH / 2, consts.HEIGHT - this.coords.Y + consts.RECT_HEIGHT);
    }

    drawAcknowledges = (ctx) => {
        this.acknowledges.forEach((a) => {
            //Draw Line
            if (a.loss) {
                ctx.moveTo(a.fromX, a.fromY);
                ctx.lineTo(a.toX + consts.SPACE / 2, a.toY - 15);
            }
            else {
                ctx.moveTo(a.fromX, a.fromY);
                ctx.lineTo(a.toX, a.toY);
            }


            //Draw Package
            let box = {
                X: (this.sender.coords.X + this.coords.X) / 1.7,
                Y: (a.fromY + a.toY) / 2 - 14
            };
            ctx.rect(box.X - 3, box.Y - 15, 30, 20);
            ctx.font = "15px Arial";
            ctx.fillText("A" + a.id, box.X, box.Y);



        });
    }

    draw = (ctx) => {
        this.drawReceiver(ctx);
        this.drawAcknowledges(ctx);
    }
}