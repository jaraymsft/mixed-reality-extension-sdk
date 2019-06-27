"use strict";
/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const deepmerge_1 = __importDefault(require("deepmerge"));
const events_1 = require("events");
const _1 = require(".");
const log_1 = require("../../log");
/**
 * @hidden
 * Class for associating multiple client connections with a single app session.
 */
class Session extends events_1.EventEmitter {
    /**
     * Creates a new Session instance
     */
    // tslint:disable-next-line:variable-name
    constructor(_conn, _sessionId, _peerAuthoritative) {
        super();
        this._conn = _conn;
        this._sessionId = _sessionId;
        this._peerAuthoritative = _peerAuthoritative;
        // tslint:disable:variable-name
        this._clientSet = {};
        this._actorSet = {};
        this._assets = [];
        this._assetUpdateSet = {};
        this._userSet = {};
        this.client = (clientId) => this._clientSet[clientId];
        this.actor = (actorId) => this._actorSet[actorId];
        this.user = (userId) => this._userSet[userId];
        this.childrenOf = (parentId) => {
            return this.actors.filter(actor => actor.initialization.message.payload.actor.parentId === parentId);
        };
        this.creatableChildrenOf = (parentId) => {
            return this.actors.filter(actor => actor.initialization.message.payload.actor.parentId === parentId
                && !!actor.initialization.message.payload.type);
        };
        this.recvFromClient = (client, message) => {
            message = this.preprocessFromClient(client, message);
            if (message) {
                this.sendToApp(message);
            }
        };
        this.recvFromApp = (message) => {
            message = this.preprocessFromApp(message);
            if (message) {
                this.sendToClients(message);
            }
        };
        this.recvFromClient = this.recvFromClient.bind(this);
        this.recvFromApp = this.recvFromApp.bind(this);
        this.disconnect = this.disconnect.bind(this);
        this.leave = this.leave.bind(this);
        this._conn.on('close', this.disconnect);
        this._conn.on('error', this.disconnect);
    }
    // tslint:enable:variable-name
    get conn() { return this._conn; }
    get sessionId() { return this._sessionId; }
    get protocol() { return this._protocol; }
    get clients() {
        return Object.keys(this._clientSet).map(clientId => this._clientSet[clientId]).sort((a, b) => a.order - b.order);
    }
    get actors() { return Object.keys(this._actorSet).map(actorId => this._actorSet[actorId]); }
    get assets() { return this._assets; }
    get assetUpdates() {
        return Object.keys(this._assetUpdateSet).map(assetId => this._assetUpdateSet[assetId]);
    }
    get rootActors() {
        return Object.keys(this._actorSet)
            .filter(actorId => !this._actorSet[actorId].initialization.message.payload.actor.parentId)
            .map(actorId => this._actorSet[actorId]);
    }
    get users() { return Object.keys(this._userSet).map(userId => this._userSet[userId]); }
    get authoritativeClient() { return this.clients.find(client => client.authoritative); }
    get peerAuthoritative() { return this._peerAuthoritative; }
    get actorSet() { return this._actorSet; }
    get assetUpdateSet() { return this._assetUpdateSet; }
    get userSet() { return this._userSet; }
    /**
     * Performs handshake and sync with the app
     */
    async connect() {
        try {
            const handshake = this._protocol = new _1.SessionHandshake(this);
            await handshake.run();
            const sync = this._protocol = new _1.SessionSync(this);
            await sync.run();
            const execution = this._protocol = new _1.SessionExecution(this);
            execution.on('recv', message => this.recvFromApp(message));
            execution.startListening();
        }
        catch (e) {
            log_1.log.error('network', e);
            this.disconnect();
        }
    }
    disconnect() {
        try {
            this._conn.off('close', this.disconnect);
            this._conn.off('error', this.disconnect);
            this._conn.close();
            this.emit('close');
        }
        catch (_a) { }
    }
    /**
     * Adds the client to the session
     */
    async join(client) {
        try {
            this._clientSet[client.id] = client;
            client.on('close', () => this.leave(client.id));
            // Synchronize app state to the client.
            await client.join(this);
            // Once the client is joined, further messages from the client will be processed by the session
            // (as opposed to a protocol class).
            client.on('recv', (_, message) => this.recvFromClient(client, message));
            // If we don't have an authoritative client, make this client authoritative.
            if (!this.authoritativeClient) {
                this.setAuthoritativeClient(client.id);
            }
        }
        catch (e) {
            log_1.log.error('network', e);
            this.leave(client.id);
        }
    }
    /**
     * Removes the client from the session
     */
    leave(clientId) {
        try {
            const client = this._clientSet[clientId];
            delete this._clientSet[clientId];
            if (client) {
                // If the client is associated with a userId, inform app the user is leaving
                if (client.userId) {
                    this.protocol.sendPayload({
                        type: 'user-left',
                        userId: client.userId
                    });
                }
                // Select another client to be the authoritative peer.
                // TODO: Make selection criteria more intelligent (look at latency, prefer non-mobile, ...)
                if (client.authoritative) {
                    const nextClient = this.clients.find(c => c.isJoined());
                    if (nextClient) {
                        this.setAuthoritativeClient(nextClient.id);
                    }
                }
            }
            // If this was the last client then shutdown the session
            if (!this.clients.length) {
                this._conn.close();
            }
        }
        catch (_a) { }
    }
    setAuthoritativeClient(clientId) {
        if (!this._clientSet[clientId]) {
            // tslint:disable-next-line:no-console
            log_1.log.error('network', `[ERROR] setAuthoritativeClient: client ${clientId} does not exist.`);
        }
        this._clientSet[clientId].setAuthoritative(true);
        this.clients
            .filter(client => client.id !== clientId && client.isJoined())
            .forEach(client => client.setAuthoritative(false));
    }
    preprocessFromApp(message) {
        const rule = _1.Rules[message.payload.type] || _1.MissingRule;
        const beforeReceiveFromApp = rule.session.beforeReceiveFromApp || (() => message);
        return beforeReceiveFromApp(this, message);
    }
    preprocessFromClient(client, message) {
        // Precaution: If we don't recognize this client, drop the message.
        if (!this._clientSet[client.id]) {
            return undefined;
        }
        if (message.payload && message.payload.type && message.payload.type.length) {
            const rule = _1.Rules[message.payload.type] || _1.MissingRule;
            const beforeReceiveFromClient = rule.session.beforeReceiveFromClient || (() => message);
            message = beforeReceiveFromClient(this, client, message);
        }
        return message;
    }
    sendToApp(message) {
        this.protocol.sendMessage(message);
    }
    sendToClients(message, filterFn) {
        const clients = this.clients.filter(filterFn || (() => true));
        for (const client of clients) {
            client.send(Object.assign({}, message));
        }
    }
    sendPayloadToClients(payload, filterFn) {
        this.sendToClients({ payload }, filterFn);
    }
    findAnimation(syncActor, animationName) {
        return (syncActor.createdAnimations || []).find(item => item.message.payload.animationName === animationName);
    }
    isAnimating(syncActor) {
        if ((syncActor.createdAnimations || []).some(item => item.enabled)) {
            return true;
        }
        if (syncActor.initialization &&
            syncActor.initialization.message &&
            syncActor.initialization.message.payload &&
            syncActor.initialization.message.payload.actor) {
            const parent = this._actorSet[syncActor.initialization.message.payload.actor.parentId];
            if (parent) {
                return this.isAnimating(parent);
            }
        }
        return false;
    }
    cacheInitializeActorMessage(message) {
        if (!this.actorSet[message.payload.actor.id]) {
            const parent = this.actorSet[message.payload.actor.parentId];
            this.actorSet[message.payload.actor.id] = {
                actorId: message.payload.actor.id,
                exclusiveToUser: parent && parent.exclusiveToUser
                    || message.payload.actor.exclusiveToUser,
                initialization: deepmerge_1.default({ message }, {})
            };
        }
    }
    cacheActorUpdateMessage(message) {
        const syncActor = this.actorSet[message.payload.actor.id];
        if (syncActor) {
            // Merge the update into the existing actor.
            syncActor.initialization.message.payload.actor
                = deepmerge_1.default(syncActor.initialization.message.payload.actor, message.payload.actor);
        }
    }
    cacheCreateAssetMessage(message) {
        // TODO: Is each load-asset unique? Can the same asset be loaded twice?
        this.assets.push(message);
    }
    cacheUpdateAssetMessage(message) {
        const [updates, id] = [this.assetUpdateSet, message.payload.asset.id];
        updates[id] = deepmerge_1.default(updates[id] || {}, message.payload);
    }
}
exports.Session = Session;
//# sourceMappingURL=session.js.map