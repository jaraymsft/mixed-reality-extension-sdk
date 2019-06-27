"use strict";
/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
/** @hidden */
class InternalCollider {
    /** @hidden */
    constructor(collider, $owner) {
        this.collider = collider;
        this.$owner = $owner;
        // tslint:disable:variable-name
        this._eventHandlers = new events_1.EventEmitter();
        this._eventSubCount = 0;
    }
    // tslint:enable:variable-name
    /** @hidden */
    get eventSubscriptions() {
        return this._eventHandlers.eventNames();
    }
    /** @hidden */
    on(event, handler) {
        this._eventHandlers.addListener(event, handler);
        this.updateEventSubscriptions();
    }
    /** @hidden */
    off(event, handler) {
        this._eventHandlers.removeListener(event, handler);
        this.updateEventSubscriptions();
    }
    /** @hidden */
    eventReceived(event, payload) {
        this._eventHandlers.emit(event, payload);
    }
    updateEventSubscriptions() {
        const newSubCount = this._eventHandlers.eventNames().length;
        if (this._eventSubCount !== newSubCount) {
            // Notifty that event handler subscriptions has changed.
            this.$owner.actorChanged('collider', 'eventSubscriptions');
            this._eventSubCount = newSubCount;
        }
    }
}
exports.InternalCollider = InternalCollider;
//# sourceMappingURL=collider.js.map