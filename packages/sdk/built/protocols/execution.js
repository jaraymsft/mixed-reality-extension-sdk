"use strict";
/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const _1 = require(".");
const __1 = require("..");
const log_1 = require("./../log");
const sync_1 = require("./sync");
/**
 * @hidden
 * Class to handle operational messages with a client.
 */
class Execution extends _1.Protocol {
    constructor(context) {
        super(context.conn);
        this.context = context;
        /** @private */
        this['recv-engine2app-rpc'] = (payload) => {
            this.emit('protocol.receive-rpc', payload.procName, payload.channelName, payload.args);
        };
        /** @private */
        this['recv-object-spawned'] = (payload) => {
            this.emit('protocol.update-actors', payload.actors);
        };
        /** @private */
        this['recv-actor-update'] = (payload) => {
            this.emit('protocol.update-actors', [payload.actor]);
        };
        /** @private */
        this['recv-destroy-actors'] = (payload) => {
            this.emit('protocol.destroy-actors', payload.actorIds);
        };
        /** @private */
        this['recv-operation-result'] = (operationResult) => {
            log_1.log.log('network', operationResult.resultCode, operationResult.message);
            if (Array.isArray(operationResult.traces)) {
                operationResult.traces.forEach(trace => {
                    log_1.log.log('network', trace.severity, trace.message);
                });
            }
        };
        /** @private */
        this['recv-multi-operation-result'] = (multiOperationResult) => {
            throw new Error("Not implemented");
        };
        /** @private */
        this['recv-traces'] = (payload) => {
            payload.traces.forEach(trace => {
                log_1.log.log('network', trace.severity, trace.message);
            });
        };
        /** @private */
        this['recv-user-joined'] = (payload) => {
            const props = payload.user.properties = payload.user.properties || {};
            props.host = props.host || 'unspecified';
            props.engine = props.engine || 'unspecified';
            if (this.conn instanceof __1.WebSocket && !props.remoteAddress) {
                props.remoteAddress = this.conn.remoteAddress;
            }
            this.emit('protocol.user-joined', payload.user);
        };
        /** @private */
        this['recv-user-left'] = (payload) => {
            this.emit('protocol.user-left', payload.userId);
        };
        /** @private */
        this['recv-user-update'] = (payload) => {
            this.emit('protocol.update-user', payload.user);
        };
        /** @private */
        this['recv-sync-request'] = async (payload) => {
            // Switch over to the Sync protocol to handle this request
            this.stopListening();
            const sync = new sync_1.Sync(this.conn);
            await sync.run(); // Allow exception to propagate.
            this.startListening();
        };
        /** @private */
        this['recv-perform-action'] = (payload) => {
            this.emit('protocol.perform-action', {
                user: this.context.user(payload.userId),
                targetId: payload.targetId,
                behaviorType: payload.behaviorType,
                actionName: payload.actionName,
                actionState: payload.actionState
            });
        };
        /** @private */
        this['recv-collision-event-raised'] = (payload) => {
            this.emit('protocol.collision-event-raised', {
                colliderOwnerId: payload.actorId,
                eventType: payload.eventType,
                collisionData: payload.collisionData
            });
        };
        /** @private */
        this['recv-trigger-event-raised'] = (payload) => {
            this.emit('protocol.trigger-event-raised', {
                colliderOwnerId: payload.actorId,
                eventType: payload.eventType,
                otherColliderOwnerId: payload.otherActorId
            });
        };
        /** @private */
        this['recv-set-animation-state'] = (payload) => {
            this.emit('protocol.set-animation-state', payload.actorId, payload.animationName, payload.state);
        };
        // Behave like a server-side endpoint (send heartbeats, measure connection quality)
        this.use(new _1.ServerPreprocessing());
    }
    /** @override */
    missingPromiseForReplyMessage(message) {
        // Ignore. App receives reply messages from all clients, but only processes the first one.
    }
}
exports.Execution = Execution;
//# sourceMappingURL=execution.js.map