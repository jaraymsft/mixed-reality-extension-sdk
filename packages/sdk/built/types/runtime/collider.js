"use strict";
/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const collider_1 = require("../internal/collider");
/**
 * A collider represents the abstraction of a physics collider object on the host.
 */
class Collider {
    /**
     * @hidden
     * Creates a new Collider instance.
     * @param $owner The owning actor instance. Field name is prefixed with a dollar sign so that it is ignored by
     * @param initFrom The collider like to use to init from.
     * the actor patch detection system.
     */
    constructor($owner, initFrom) {
        this.$owner = $owner;
        this.$DoNotObserve = ['_internal'];
        // tslint:enable:variable-name
        this.enabled = true;
        this.isTrigger = false;
        if (initFrom) {
            if (!initFrom.colliderGeometry && !initFrom.colliderGeometry.colliderType) {
                throw new Error("Must provide valid collider params containing a valid collider type");
            }
            this._internal = new collider_1.InternalCollider(this, $owner);
            if (initFrom.colliderGeometry !== undefined)
                this._colliderGeometry = initFrom.colliderGeometry;
            if (initFrom.enabled !== undefined)
                this.enabled = initFrom.enabled;
            if (initFrom.isTrigger !== undefined)
                this.isTrigger = initFrom.isTrigger;
            // if (initFrom.collisionLayer !== undefined) this.collisionLayer = initFrom.collisionLayer;
        }
        else {
            throw new Error("Must provide a valid collider like to init from.");
        }
    }
    // public collisionLayer = CollisionLayer.Object;
    /** @hidden */
    get internal() { return this._internal; }
    /**
     * The current event subscriptions that are active on this collider.
     */
    get eventSubscriptions() {
        return this.internal.eventSubscriptions;
    }
    /**
     * The collider geometry that the collider was initialized with.  These are a
     * readonly structure and are not able to be updated after creation.
     */
    get colliderGeometry() { return this._colliderGeometry; }
    /**
     * Add a collision event handler for the given collision event state.
     * @param eventType The type of the collision event.
     * @param handler The handler to call when a collision event with the matching
     * collision event state is received.
     */
    onCollision(eventType, handler) {
        this.internal.on(eventType, handler);
    }
    /**
     * Remove the collision handler for the given collision event state.
     * @param eventType The type of the collision event.
     * @param handler The handler to remove.
     */
    offCollision(eventType, handler) {
        this.internal.off(eventType, handler);
    }
    /**
     * Add a trigger event handler for the given collision event state.
     * @param eventType The type of the trigger event.
     * @param handler The handler to call when a trigger event with the matching
     * collision event state is received.
     */
    onTrigger(eventType, handler) {
        this.internal.on(eventType, handler);
    }
    /**
     * Remove the trigger handler for the given collision event state.
     * @param eventType The type of the trigger event.
     * @param handler The handler to remove.
     */
    offTrigger(eventType, handler) {
        this.internal.off(eventType, handler);
    }
    /** @hidden */
    toJSON() {
        return {
            enabled: this.enabled,
            isTrigger: this.isTrigger,
            // collisionLayer: this.collisionLayer,
            colliderGeometry: this._colliderGeometry,
            eventSubscriptions: this.eventSubscriptions
        };
    }
}
exports.Collider = Collider;
//# sourceMappingURL=collider.js.map