/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { Actor, ColliderGeometry } from '.';
import { InternalCollider } from '../internal/collider';
import { CollisionHandler, TriggerHandler } from './physics';
import { ColliderEventType, CollisionEventType, TriggerEventType } from './physics/collisionEventType';
/**
 * Describes the properties of a collider.
 */
export interface ColliderLike {
    enabled: boolean;
    isTrigger: boolean;
    colliderGeometry: ColliderGeometry;
    eventSubscriptions: ColliderEventType[];
}
/**
 * A collider represents the abstraction of a physics collider object on the host.
 */
export declare class Collider implements ColliderLike {
    private $owner;
    $DoNotObserve: string[];
    private _colliderGeometry;
    private _internal;
    enabled: boolean;
    isTrigger: boolean;
    /** @hidden */
    readonly internal: InternalCollider;
    /**
     * The current event subscriptions that are active on this collider.
     */
    readonly eventSubscriptions: ColliderEventType[];
    /**
     * The collider geometry that the collider was initialized with.  These are a
     * readonly structure and are not able to be updated after creation.
     */
    readonly colliderGeometry: Readonly<import("./physics/colliderGeometry").SphereColliderGeometry> | Readonly<import("./physics/colliderGeometry").BoxColliderGeometry> | Readonly<import("./physics/colliderGeometry").MeshColliderGeometry>;
    /**
     * @hidden
     * Creates a new Collider instance.
     * @param $owner The owning actor instance. Field name is prefixed with a dollar sign so that it is ignored by
     * @param initFrom The collider like to use to init from.
     * the actor patch detection system.
     */
    constructor($owner: Actor, initFrom: Partial<ColliderLike>);
    /**
     * Add a collision event handler for the given collision event state.
     * @param eventType The type of the collision event.
     * @param handler The handler to call when a collision event with the matching
     * collision event state is received.
     */
    onCollision(eventType: CollisionEventType, handler: CollisionHandler): void;
    /**
     * Remove the collision handler for the given collision event state.
     * @param eventType The type of the collision event.
     * @param handler The handler to remove.
     */
    offCollision(eventType: CollisionEventType, handler: CollisionHandler): void;
    /**
     * Add a trigger event handler for the given collision event state.
     * @param eventType The type of the trigger event.
     * @param handler The handler to call when a trigger event with the matching
     * collision event state is received.
     */
    onTrigger(eventType: TriggerEventType, handler: TriggerHandler): void;
    /**
     * Remove the trigger handler for the given collision event state.
     * @param eventType The type of the trigger event.
     * @param handler The handler to remove.
     */
    offTrigger(eventType: TriggerEventType, handler: TriggerHandler): void;
    /** @hidden */
    toJSON(): ColliderLike;
}
//# sourceMappingURL=collider.d.ts.map