"use strict";
/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const v4_1 = __importDefault(require("uuid/v4"));
const _1 = require(".");
const log_1 = require("../../log");
const filterEmpty_1 = __importDefault(require("../../utils/filterEmpty"));
/**
 * @hidden
 * Class representing a connection to an engine client
 */
class Client extends events_1.EventEmitter {
    /**
     * Creates a new Client instance
     */
    // tslint:disable-next-line:variable-name
    constructor(_conn) {
        super();
        this._conn = _conn;
        this._queuedMessages = [];
        this._userExclusiveMessages = [];
        this._authoritative = false;
        this._id = v4_1.default();
        this._order = Client.orderSequence++;
        this.leave = this.leave.bind(this);
        this._conn.on('close', this.leave);
        this._conn.on('error', this.leave);
    }
    // tslint:enable:variable-name
    get id() { return this._id; }
    get order() { return this._order; }
    get protocol() { return this._protocol; }
    get session() { return this._session; }
    get conn() { return this._conn; }
    get authoritative() { return this._authoritative; }
    get queuedMessages() { return this._queuedMessages; }
    get userExclusiveMessages() { return this._userExclusiveMessages; }
    setAuthoritative(value) {
        this._authoritative = value;
        this.protocol.sendPayload({
            type: 'set-authoritative',
            authoritative: value
        });
    }
    /**
     * Syncs state with the client
     */
    async join(session) {
        try {
            this._session = session;
            // Sync state to the client
            const sync = this._protocol = new _1.ClientSync(this);
            await sync.run();
            // Join the session as a user
            const execution = this._protocol = new _1.ClientExecution(this);
            execution.on('recv', (message) => this.emit('recv', this, message));
            execution.startListening();
        }
        catch (e) {
            log_1.log.error('network', e);
            this.leave();
        }
    }
    leave() {
        try {
            if (this._protocol) {
                this._protocol.stopListening();
                this._protocol = undefined;
            }
            this._conn.off('close', this.leave);
            this._conn.off('error', this.leave);
            this._conn.close();
            this._session = undefined;
            this.emit('close');
        }
        catch (_a) { }
    }
    isJoined() {
        return this.protocol && this.protocol.constructor.name === "ClientExecution";
    }
    send(message, promise) {
        if (this.protocol) {
            this.protocol.sendMessage(message, promise);
        }
        else {
            // tslint:disable-next-line:no-console
            log_1.log.error('network', `[ERROR] No protocol for message send: ${message.payload.type}`);
        }
    }
    sendPayload(payload, promise) {
        if (this.protocol) {
            this.protocol.sendPayload(payload, promise);
        }
        else {
            // tslint:disable-next-line:no-console
            log_1.log.error('network', `[ERROR] No protocol for payload send: ${payload.type}`);
        }
    }
    queueMessage(message, promise) {
        const rule = _1.Rules[message.payload.type] || _1.MissingRule;
        const beforeQueueMessageForClient = rule.client.beforeQueueMessageForClient || (() => message);
        message = beforeQueueMessageForClient(this.session, this, message, promise);
        if (message) {
            // tslint:disable-next-line:max-line-length
            log_1.log.verbose('network', `Client ${this.id.substr(0, 8)} queue id:${message.id.substr(0, 8)}, type:${message.payload.type}`);
            log_1.log.verbose('network-content', JSON.stringify(message, (key, value) => filterEmpty_1.default(value)));
            this.queuedMessages.push({ message, promise });
        }
    }
    filterQueuedMessages(callbackfn) {
        const filteredMessages = [];
        this._queuedMessages = this._queuedMessages.filter((value) => {
            const allow = callbackfn(value);
            if (allow) {
                filteredMessages.push(value);
            }
            return !allow;
        });
        return filteredMessages;
    }
}
Client.orderSequence = 0;
exports.Client = Client;
//# sourceMappingURL=client.js.map