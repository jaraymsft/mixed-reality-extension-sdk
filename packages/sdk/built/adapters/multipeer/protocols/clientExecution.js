"use strict";
/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const __1 = require("..");
const Protocols = __importStar(require("../../../protocols"));
/**
 * @hidden
 * Class for routing messages between the client and the session
 */
class ClientExecution extends Protocols.Protocol {
    constructor(client) {
        super(client.conn);
        this.client = client;
        this.beforeRecv = (message) => {
            if (this.promises[message.replyToId]) {
                // If we have a queued promise for this message, let it through
                return message;
            }
            else {
                // Notify listeners we received a message.
                this.emit('recv', message);
                // Cancel the message
                return undefined;
            }
        };
        // Set timeout a little shorter than the app/session connection, ensuring we don't
        // cause an app/session message timeout - which is not a supported scenario (there
        // is no reconnect).
        this.timeoutSeconds = Protocols.DefaultConnectionTimeoutSeconds * 2 / 3;
        this.heartbeat = new Protocols.Heartbeat(this);
        this.beforeRecv = this.beforeRecv.bind(this);
        // Behave like a server-side endpoint (send heartbeats, measure connection quality)
        this.use(new Protocols.ServerPreprocessing());
        // Filter user-exclusive actors
        this.use(new __1.ClientDesyncPreprocessor(client));
        // Use middleware to pipe client messages to the session.
        this.use(this);
    }
    /** @override */
    get name() { return `${this.constructor.name} client ${this.client.id.substr(0, 8)}`; }
    startListening() {
        super.startListening();
        if (!this.heartbeatTimer) {
            // Periodically measure connection latency.
            this.heartbeatTimer = this.setHeartbeatTimer();
        }
    }
    stopListening() {
        clearTimeout(this.heartbeatTimer);
        this.heartbeatTimer = undefined;
        super.stopListening();
    }
    setHeartbeatTimer() {
        return setTimeout(async () => {
            if (this.heartbeatTimer) {
                try {
                    await this.heartbeat.send();
                    this.heartbeatTimer = this.setHeartbeatTimer();
                }
                catch (_a) {
                    this.client.leave();
                    this.resolve();
                }
            }
            // Irregular heartbeats are a good thing in this instance.
        }, 1000 * (5 + 5 * Math.random()));
    }
}
exports.ClientExecution = ClientExecution;
//# sourceMappingURL=clientExecution.js.map