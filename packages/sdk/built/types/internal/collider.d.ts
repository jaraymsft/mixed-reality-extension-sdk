/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { Actor, Collider, ColliderEventType, CollisionData, CollisionHandler, TriggerHandler } from "../runtime";
/** @hidden */
export declare class InternalCollider {
    collider: Collider;
    private $owner;
    private _eventHandlers;
    private _eventSubCount;
    /** @hidden */
    readonly eventSubscriptions: ColliderEventType[];
    /** @hidden */
    constructor(collider: Collider, $owner: Actor);
    /** @hidden */
    on(event: ColliderEventType, handler: CollisionHandler | TriggerHandler): void;
    /** @hidden */
    off(event: ColliderEventType, handler: CollisionHandler | TriggerHandler): void;
    /** @hidden */
    eventReceived(event: ColliderEventType, payload: CollisionData | Actor): void;
    private updateEventSubscriptions;
}
//# sourceMappingURL=collider.d.ts.map