/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { ActionEvent, Actor, ActorLike, Behavior, CollisionData, CollisionEventType, SetAnimationStateOptions, TriggerEventType } from '../..';
import { ExportedPromise } from '../../utils/exportedPromise';
import { InternalPatchable } from '../patchable';
import { InternalCollider } from './collider';
/**
 * @hidden
 */
export declare class InternalActor implements InternalPatchable<ActorLike> {
    actor: Actor;
    observing: boolean;
    patch: ActorLike;
    behavior: Behavior;
    createdPromises: ExportedPromise[];
    created: boolean;
    readonly collider: InternalCollider;
    constructor(actor: Actor);
    performAction(actionEvent: ActionEvent): void;
    collisionEventRaised(collisionEventType: CollisionEventType, collisionData: CollisionData): void;
    triggerEventRaised(triggerEventType: TriggerEventType, otherActor: Actor): void;
    setAnimationStateEventRaised(animationName: string, state: SetAnimationStateOptions): void;
    getPatchAndReset(): ActorLike;
    notifyCreated(success: boolean, reason?: any): void;
    enqueueCreatedPromise(promise: ExportedPromise): void;
}
//# sourceMappingURL=actor.d.ts.map