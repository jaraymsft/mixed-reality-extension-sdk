/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { Protocol } from '.';
import { Context, Message } from '..';
import { ActorUpdate, CollisionEventRaised, DestroyActors, EngineToAppRPC, MultiOperationResult, ObjectSpawned, OperationResult, PerformAction, SetAnimationState, SyncRequest, Traces, TriggerEventRaised, UserJoined, UserLeft, UserUpdate } from '../types/network/payloads';
/**
 * @hidden
 * Class to handle operational messages with a client.
 */
export declare class Execution extends Protocol {
    private context;
    constructor(context: Context);
    /** @override */
    protected missingPromiseForReplyMessage(message: Message): void;
    /** @private */
    'recv-engine2app-rpc': (payload: EngineToAppRPC) => void;
    /** @private */
    'recv-object-spawned': (payload: ObjectSpawned) => void;
    /** @private */
    'recv-actor-update': (payload: ActorUpdate) => void;
    /** @private */
    'recv-destroy-actors': (payload: DestroyActors) => void;
    /** @private */
    'recv-operation-result': (operationResult: OperationResult) => void;
    /** @private */
    'recv-multi-operation-result': (multiOperationResult: MultiOperationResult) => never;
    /** @private */
    'recv-traces': (payload: Traces) => void;
    /** @private */
    'recv-user-joined': (payload: UserJoined) => void;
    /** @private */
    'recv-user-left': (payload: UserLeft) => void;
    /** @private */
    'recv-user-update': (payload: UserUpdate) => void;
    /** @private */
    'recv-sync-request': (payload: SyncRequest) => Promise<void>;
    /** @private */
    'recv-perform-action': (payload: PerformAction) => void;
    /** @private */
    'recv-collision-event-raised': (payload: CollisionEventRaised) => void;
    /** @private */
    'recv-trigger-event-raised': (payload: TriggerEventRaised) => void;
    /** @private */
    'recv-set-animation-state': (payload: SetAnimationState) => void;
}
//# sourceMappingURL=execution.d.ts.map