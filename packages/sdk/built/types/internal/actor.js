"use strict";
/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const __1 = require("../..");
/**
 * @hidden
 */
class InternalActor {
    constructor(actor) {
        this.actor = actor;
        this.observing = true;
    }
    get collider() {
        return this.actor.collider ? this.actor.collider.internal : undefined;
    }
    performAction(actionEvent) {
        const behavior = (this.behavior && this.behavior.behaviorType === actionEvent.behaviorType)
            ? this.behavior : undefined;
        if (behavior && behavior._supportsAction(actionEvent.actionName)) {
            behavior._performAction(actionEvent.actionName, actionEvent.actionState, actionEvent.user);
        }
        else {
            const action = this.actor[actionEvent.actionName.toLowerCase()];
            if (action) {
                action._setState(actionEvent.user, actionEvent.actionState);
            }
        }
    }
    collisionEventRaised(collisionEventType, collisionData) {
        if (this.collider) {
            this.collider.eventReceived(collisionEventType, collisionData);
        }
    }
    triggerEventRaised(triggerEventType, otherActor) {
        if (this.collider) {
            this.collider.eventReceived(triggerEventType, otherActor);
        }
    }
    setAnimationStateEventRaised(animationName, state) {
        if (this.actor) {
            if (state.enabled !== undefined) {
                if (state.enabled) {
                    this.actor.emitter.emit('animation-enabled', animationName);
                }
                else {
                    this.actor.emitter.emit('animation-disabled', animationName);
                }
            }
        }
    }
    getPatchAndReset() {
        const patch = this.patch;
        if (patch) {
            patch.id = this.actor.id;
            delete this.patch;
            return __1.Actor.sanitize(patch);
        }
    }
    notifyCreated(success, reason) {
        this.created = true;
        if (this.createdPromises) {
            const createdPromises = this.createdPromises.splice(0);
            this.createdPromises = undefined;
            for (const promise of createdPromises) {
                if (success) {
                    promise.resolve();
                }
                else {
                    promise.reject(reason);
                }
            }
        }
    }
    enqueueCreatedPromise(promise) {
        if (!this.createdPromises) {
            this.createdPromises = [];
        }
        this.createdPromises.push(promise);
    }
}
exports.InternalActor = InternalActor;
//# sourceMappingURL=actor.js.map