"use strict";
/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const v4_1 = __importDefault(require("uuid/v4"));
const __1 = require("../..");
const log_1 = require("../../log");
const execution_1 = require("../../protocols/execution");
const handshake_1 = require("../../protocols/handshake");
const resolveJsonValues_1 = __importDefault(require("../../utils/resolveJsonValues"));
const safeAccessPath_1 = __importDefault(require("../../utils/safeAccessPath"));
const forwardPromise_1 = require("../forwardPromise");
const operatingModel_1 = require("../network/operatingModel");
/**
 * @hidden
 */
class InternalContext {
    constructor(context) {
        this.context = context;
        this.actorSet = {};
        this.userSet = {};
        this.userGroupMapping = { default: 1 };
        this.generation = 0;
        this.prevGeneration = 0;
        this.onClose = () => {
            this.stop();
        };
        // Handle connection close events.
        this.onClose = this.onClose.bind(this);
        this.context.conn.on('close', this.onClose);
    }
    CreateEmpty(options) {
        options = Object.assign({}, options);
        options = Object.assign({}, options, { actor: Object.assign({}, options.actor, { id: v4_1.default() }) });
        const payload = Object.assign({}, options, { type: 'create-empty' });
        return this.createActorFromPayload(payload);
    }
    CreateFromGltf(options) {
        options = Object.assign({}, options);
        options = Object.assign({ colliderType: 'none' }, options, { actor: Object.assign({}, options.actor, { id: v4_1.default() }) });
        const payload = Object.assign({}, options, { type: 'create-from-gltf' });
        return this.createActorFromPayload(payload);
    }
    CreateFromLibrary(options) {
        options = Object.assign({}, options);
        options = Object.assign({}, options, { actor: Object.assign({}, options.actor, { id: v4_1.default() }) });
        const payload = Object.assign({}, options, { type: 'create-from-library' });
        return this.createActorFromPayload(payload);
    }
    CreatePrimitive(options) {
        options = Object.assign({}, options);
        options = Object.assign({ addCollider: false }, options, { actor: Object.assign({}, options.actor, { id: v4_1.default() }) });
        const payload = Object.assign({}, options, { type: 'create-primitive' });
        return this.createActorFromPayload(payload);
    }
    CreateFromPrefab(options) {
        options = Object.assign({}, options);
        options = Object.assign({}, options, { actor: Object.assign({}, options.actor, { id: v4_1.default() }) });
        return this.createActorFromPayload(Object.assign({}, options, { type: 'create-from-prefab' }));
    }
    createActorFromPayload(payload) {
        // Resolve by-reference values now, ensuring they won't change in the
        // time between now and when this message is actually sent.
        payload.actor = __1.Actor.sanitize(payload.actor);
        // Create the actor locally.
        this.updateActors(payload.actor);
        // Get a reference to the new actor.
        const actor = this.context.actor(payload.actor.id);
        // If we have a parent, make sure it is done getting created first.
        return forwardPromise_1.createForwardPromise(actor, new Promise((resolve, reject) => {
            // Send a message to the engine to instantiate the object.
            this.protocol.sendPayload(payload, {
                resolve: (replyPayload) => {
                    this.protocol.recvPayload(replyPayload);
                    let success;
                    let message;
                    if (replyPayload.type === 'operation-result') {
                        success = replyPayload.resultCode !== 'error';
                        message = replyPayload.message;
                    }
                    else {
                        success = replyPayload.result.resultCode !== 'error';
                        message = replyPayload.result.message;
                        for (const createdActorLike of replyPayload.actors) {
                            const createdActor = this.actorSet[createdActorLike.id];
                            if (createdActor) {
                                createdActor.internal.notifyCreated(success, replyPayload.result.message);
                            }
                        }
                    }
                    if (success) {
                        if (!actor.collider && actor.internal.behavior) {
                            log_1.log.warning('app', 'Behaviors will not function on Unity host apps without adding a'
                                + ' collider to this actor first. Recommend adding a primitive collider'
                                + ' to this actor.');
                        }
                        resolve(actor);
                    }
                    else {
                        reject(message);
                    }
                },
                reject
            });
        }));
    }
    createAnimation(actorId, animationName, options) {
        const actor = this.actorSet[actorId];
        if (!actor) {
            log_1.log.error('app', `Failed to create animation on ${animationName}. Actor ${actorId} not found.`);
        }
        options = Object.assign({ wrapMode: __1.AnimationWrapMode.Once }, options);
        // Transform animations must be specified in local space
        for (const frame of options.keyframes) {
            if (frame.value.transform && !safeAccessPath_1.default(frame.value, 'transform', 'local')) {
                throw new Error("Transform animations must be specified in local space");
            }
        }
        // Resolve by-reference values now, ensuring they won't change in the
        // time between now and when this message is actually sent.
        options.keyframes = resolveJsonValues_1.default(options.keyframes);
        this.protocol.sendPayload(Object.assign({ type: 'create-animation', actorId,
            animationName }, options));
    }
    setAnimationState(actorId, animationName, state) {
        const actor = this.actorSet[actorId];
        if (!actor) {
            log_1.log.error('app', `Failed to set animation state on ${animationName}. Actor ${actorId} not found.`);
        }
        else {
            this.protocol.sendPayload({
                type: 'set-animation-state',
                actorId,
                animationName,
                state
            });
        }
    }
    setSoundState(soundInstance, command, options, soundAssetId, startTimeOffset) {
        this.protocol.sendPayload({
            type: 'set-sound-state',
            id: soundInstance.id,
            actorId: soundInstance.actor.id,
            soundAssetId,
            soundCommand: command,
            options,
            startTimeOffset
        });
    }
    animateTo(actorId, value, duration, curve) {
        const actor = this.actorSet[actorId];
        if (!actor) {
            log_1.log.error('app', `Failed animateTo. Actor ${actorId} not found.`);
        }
        else if (!Array.isArray(curve) || curve.length !== 4) {
            // tslint:disable-next-line:max-line-length
            log_1.log.error('app', '`curve` parameter must be an array of four numbers. Try passing one of the predefined curves from `AnimationEaseCurves`');
        }
        else {
            this.protocol.sendPayload({
                type: 'interpolate-actor',
                actorId,
                animationName: v4_1.default(),
                value,
                duration,
                curve,
                enabled: true
            });
        }
    }
    async startListening() {
        try {
            // Startup the handshake protocol.
            const handshake = this.protocol =
                new handshake_1.Handshake(this.context.conn, this.context.sessionId, operatingModel_1.OperatingModel.ServerAuthoritative);
            await handshake.run();
            // Switch to execution protocol.
            const execution = this.protocol = new execution_1.Execution(this.context);
            this.updateActors = this.updateActors.bind(this);
            this.localDestroyActors = this.localDestroyActors.bind(this);
            this.userJoined = this.userJoined.bind(this);
            this.userLeft = this.userLeft.bind(this);
            this.updateUser = this.updateUser.bind(this);
            this.performAction = this.performAction.bind(this);
            this.receiveRPC = this.receiveRPC.bind(this);
            this.collisionEventRaised = this.collisionEventRaised.bind(this);
            this.triggerEventRaised = this.triggerEventRaised.bind(this);
            this.setAnimationStateEventRaised = this.setAnimationStateEventRaised.bind(this);
            execution.on('protocol.update-actors', this.updateActors);
            execution.on('protocol.destroy-actors', this.localDestroyActors);
            execution.on('protocol.user-joined', this.userJoined);
            execution.on('protocol.user-left', this.userLeft);
            execution.on('protocol.update-user', this.updateUser);
            execution.on('protocol.perform-action', this.performAction);
            execution.on('protocol.receive-rpc', this.receiveRPC);
            execution.on('protocol.collision-event-raised', this.collisionEventRaised);
            execution.on('protocol.trigger-event-raised', this.triggerEventRaised);
            execution.on('protocol.set-animation-state', this.setAnimationStateEventRaised);
            // Startup the execution protocol
            execution.startListening();
        }
        catch (e) {
            log_1.log.error('app', e);
        }
    }
    start() {
        if (!this.interval) {
            this.interval = setInterval(() => this.update(), 0);
            this.context.emitter.emit('started');
        }
    }
    stop() {
        try {
            if (this.interval) {
                this.protocol.stopListening();
                clearInterval(this.interval);
                this.interval = undefined;
                this.context.emitter.emit('stopped');
                this.context.emitter.removeAllListeners();
            }
        }
        catch (_a) { }
    }
    incrementGeneration() {
        this.generation++;
    }
    update() {
        // Early out if no state changes occurred.
        if (this.generation === this.prevGeneration) {
            return;
        }
        this.prevGeneration = this.generation;
        const syncObjects = [
            ...Object.values(this.actorSet),
            ...Object.values(this.context.assetManager.assets),
            ...Object.values(this.userSet)
        ];
        for (const patchable of syncObjects) {
            const patch = patchable.internal.getPatchAndReset();
            if (!patch) {
                continue;
            }
            if (patchable instanceof __1.Actor) {
                this.protocol.sendPayload({
                    type: 'actor-update',
                    actor: patch
                });
            }
            else if (patchable instanceof __1.Asset) {
                this.protocol.sendPayload({
                    type: 'asset-update',
                    asset: patch
                });
            }
            else if (patchable instanceof __1.User) {
                this.protocol.sendPayload({
                    type: 'user-update',
                    user: patch
                });
            }
        }
    }
    sendDestroyActors(actorIds) {
        if (actorIds.length) {
            this.protocol.sendPayload({
                type: 'destroy-actors',
                actorIds,
            });
        }
    }
    updateActors(sactors) {
        if (!sactors) {
            return;
        }
        if (!Array.isArray(sactors)) {
            sactors = [sactors];
        }
        const newActorIds = [];
        // Instantiate and store each actor.
        sactors.forEach(sactor => {
            const isNewActor = !this.actorSet[sactor.id];
            const actor = isNewActor ? __1.Actor.alloc(this.context, sactor.id) : this.actorSet[sactor.id];
            this.actorSet[sactor.id] = actor;
            actor.copy(sactor);
            if (isNewActor) {
                newActorIds.push(actor.id);
            }
        });
        newActorIds.forEach(actorId => {
            const actor = this.actorSet[actorId];
            this.context.emitter.emit('actor-created', actor);
        });
    }
    sendPayload(payload) {
        this.protocol.sendPayload(payload);
    }
    receiveRPC(procName, channelName, args) {
        this.context.emitter.emit('context.receive-rpc', procName, channelName, args);
    }
    userJoined(suser) {
        if (!this.userSet[suser.id]) {
            const user = this.userSet[suser.id] = new __1.User(this.context, suser.id);
            user.copy(suser);
            this.context.emitter.emit('user-joined', user);
        }
    }
    userLeft(userId) {
        const user = this.userSet[userId];
        if (user) {
            delete this.userSet[userId];
            this.context.emitter.emit('user-left', user);
        }
    }
    updateUser(suser) {
        const isNewUser = !this.userSet[suser.id];
        const user = isNewUser ? new __1.User(this.context, suser.id) : this.userSet[suser.id];
        user.copy(suser);
        this.userSet[user.id] = user;
        if (isNewUser) {
            this.context.emitter.emit('user-joined', user);
        }
        else {
            this.context.emitter.emit('user-updated', user);
        }
    }
    performAction(actionEvent) {
        if (actionEvent.user) {
            const targetActor = this.actorSet[actionEvent.targetId];
            if (targetActor) {
                targetActor.internal.performAction(actionEvent);
            }
        }
    }
    collisionEventRaised(collisionEvent) {
        const actor = this.actorSet[collisionEvent.colliderOwnerId];
        const otherActor = this.actorSet[(collisionEvent.collisionData.otherActorId)];
        if (actor && otherActor) {
            // Update the collision data to contain the actual other actor.
            collisionEvent.collisionData = Object.assign({}, collisionEvent.collisionData, { otherActor });
            actor.internal.collisionEventRaised(collisionEvent.eventType, collisionEvent.collisionData);
        }
    }
    triggerEventRaised(triggerEvent) {
        const actor = this.actorSet[triggerEvent.colliderOwnerId];
        const otherActor = this.actorSet[triggerEvent.otherColliderOwnerId];
        if (actor && otherActor) {
            actor.internal.triggerEventRaised(triggerEvent.eventType, otherActor);
        }
    }
    setAnimationStateEventRaised(actorId, animationName, state) {
        const actor = this.context.actor(actorId);
        if (actor) {
            actor.internal.setAnimationStateEventRaised(animationName, state);
        }
    }
    localDestroyActors(actorIds) {
        for (const actorId of actorIds) {
            if (this.actorSet[actorId]) {
                this.localDestroyActor(this.actorSet[actorId]);
            }
        }
    }
    localDestroyActor(actor) {
        // Collect this actor and all the children recursively
        const actorIds = [];
        // Recursively destroy children first
        (actor.children || []).forEach(child => {
            this.localDestroyActor(child);
        });
        // Remove actor from _actors
        delete this.actorSet[actor.id];
        // Raise event
        this.context.emitter.emit('actor-destroyed', actor);
    }
    destroyActor(actorId) {
        const actor = this.actorSet[actorId];
        if (actor) {
            // Tell engine to destroy the actor (will destroy all children too)
            this.sendDestroyActors([actorId]);
            // Clean up the actor locally
            this.localDestroyActor(actor);
        }
    }
    sendRigidBodyCommand(actorId, payload) {
        this.protocol.sendPayload({
            type: 'rigidbody-commands',
            actorId,
            commandPayloads: [payload]
        });
    }
    setBehavior(actorId, newBehaviorType) {
        const actor = this.actorSet[actorId];
        if (actor) {
            this.protocol.sendPayload({
                type: 'set-behavior',
                actorId,
                behaviorType: newBehaviorType || 'none'
            });
        }
    }
}
exports.InternalContext = InternalContext;
//# sourceMappingURL=context.js.map