import { Realtime, Types } from "ably/promises";
import { JSON_Stringify } from "./utility";
import EventEmitter = require("events");
import { MachineData } from "./types";

export class Transceiver extends EventEmitter {
    private realtimeAbly: Types.RealtimePromise;
    private realtimeChannel: Types.RealtimeChannelPromise;

    constructor(key: string, _md: MachineData) {
        super();

        this.realtimeAbly = new Realtime.Promise({
            clientId: `package|${_md.id}`,
            key,
        });

        this.realtimeAbly.connection.once("connected").then(() => {
            this.realtimeChannel = this.realtimeAbly.channels.get(_md.id);
            this.realtimeChannel.subscribe((event) => this.emit("msg", event.name, event.data));
            
            this.realtimeChannel.presence.enter("package");
            
            this.realtimeChannel.presence.subscribe((pm) => {
                const isActive = pm.action === "enter" || pm.action === "present" || pm.action === "update";
                if (pm.clientId.startsWith("web|") && pm.clientId.split("|")[1] === _md.id)
                    this.emit("state", isActive);
            });
        });
    }

    async ensureConnected() {
        if (this.realtimeAbly.connection.state !== "connected")
            await this.realtimeAbly.connection.once("connected");
    }

    async pub(name: string, data?: any, stringify: boolean = false) {
        if (!this.realtimeChannel || this.realtimeAbly.connection.state !== "connected") return false;
        if (stringify) data = JSON_Stringify(data);

        await this.realtimeChannel.publish(name, data);
    }
}
