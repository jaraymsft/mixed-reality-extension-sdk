/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { OperationResultCode, Trace } from '..';
import { CreateAnimationOptions, SetAnimationStateOptions } from '../../..';
import { SetSoundStateOptions, SoundCommand } from '../../../sound';
import { PrimitiveDefinition } from '../../primitiveTypes';
import { ActorLike, ColliderType, TransformLike, UserLike } from '../../runtime';
import { ActionState, BehaviorType } from '../../runtime/behaviors';
import { OperatingModel } from '../operatingModel';
/**
 * @hidden
 * *** KEEP ENTRIES SORTED ***
 */
export declare type PayloadType = 'ack-payload' | 'actor-correction' | 'actor-update' | 'app2engine-rpc' | 'asset-update' | 'assets-loaded' | 'collision-event-raised' | 'create-animation' | 'create-asset' | 'create-empty' | 'create-from-gltf' | 'create-from-library' | 'create-from-prefab' | 'create-primitive' | 'destroy-actors' | 'engine2app-rpc' | 'handshake' | 'handshake-complete' | 'handshake-reply' | 'heartbeat' | 'heartbeat-reply' | 'interpolate-actor' | 'load-assets' | 'multi-operation-result' | 'object-spawned' | 'operation-result' | 'perform-action' | 'rigidbody-add-force' | 'rigidbody-add-force-at-position' | 'rigidbody-add-relative-torque' | 'rigidbody-add-torque' | 'rigidbody-commands' | 'rigidbody-move-position' | 'rigidbody-move-rotation' | 'set-animation-state' | 'set-authoritative' | 'set-behavior' | 'set-sound-state' | 'sync-animations' | 'sync-complete' | 'sync-request' | 'test-payload' | 'timer-payload' | 'traces' | 'trigger-event-raised' | 'user-joined' | 'user-left' | 'user-update';
/**
 * @hidden
 * Base interface for Payloads.
 */
export declare type Payload = {
    type: PayloadType;
    traces?: Trace[];
};
/**
 * @hidden
 * Engine to app. Contains a set of trace messages.
 */
export declare type Traces = Payload & {
    type: 'traces';
};
/**
 * @hidden
 * Engine to app. The result of an operation.
 */
export declare type OperationResult = Payload & {
    type: 'operation-result';
    resultCode: OperationResultCode;
    message: string;
};
/**
 * @hidden
 * Engine to app. The result of multiple operations.
 */
export declare type MultiOperationResult = Payload & {
    type: 'multi-operation-result';
    results: OperationResult[];
};
/**
 * @hidden
 * Engine to app. Handshake initiation.
 */
export declare type Handshake = Payload & {
    type: 'handshake';
};
/**
 * @hidden
 * App to engine. Response to Handshake.
 */
export declare type HandshakeReply = Payload & {
    type: 'handshake-reply';
    sessionId: string;
    operatingModel: OperatingModel;
};
/**
 * @hidden
 * Engine to app. Handshake process is complete.
 */
export declare type HandshakeComplete = Payload & {
    type: 'handshake-complete';
};
/**
 * @hidden
 */
export declare type Heartbeat = Payload & {
    type: 'heartbeat';
};
/**
 * @hidden
 */
export declare type HeartbeatReply = Payload & {
    type: 'heartbeat-reply';
};
/**
 * @hidden
 */
export declare type AppToEngineRPC = Payload & {
    type: 'app2engine-rpc';
    userId?: string;
    procName: string;
    args: any[];
};
/**
 * @hidden
 */
export declare type EngineToAppRPC = Payload & {
    type: 'engine2app-rpc';
    channelName?: string;
    procName: string;
    args: any[];
};
/**
 * @hidden
 */
export declare type CreateActorCommon = Payload & {
    actor: Partial<ActorLike>;
};
/**
 * @hidden
 * App to engine. Request for engine to load a game object from the host library.
 * Response is an ObjectSpawned payload.
 */
export declare type CreateFromLibrary = CreateActorCommon & {
    type: 'create-from-library';
    resourceId: string;
};
/**
 * @hidden
 * App to engine. Request for engine to load a game object from a glTF file.
 * Response is an ObjectSpawned payload.
 */
export declare type CreateFromGltf = CreateActorCommon & {
    type: 'create-from-gltf';
    resourceUrl: string;
    assetName: string;
    colliderType: ColliderType;
};
/**
 * @hidden
 * App to engine. Create an empty game object.
 * Response is an ObjectSpawned payload.
 */
export declare type CreateEmpty = CreateActorCommon & {
    type: 'create-empty';
};
/**
 * @hidden
 * App to engine. Creates a primitive shape.
 * Response is an ObjectSpawned payload.
 */
export declare type CreatePrimitive = CreateActorCommon & {
    type: 'create-primitive';
    definition: PrimitiveDefinition;
    addCollider: boolean;
    actor: Partial<ActorLike>;
};
/**
 * @hidden
 * Engine to app. Response from LoadFromAssetBundle (and similar).
 */
export declare type ObjectSpawned = Payload & {
    type: 'object-spawned';
    actors: Array<Partial<ActorLike>>;
    result: OperationResult;
};
/**
 * @hidden
 * Bi-directional. Changed properties of an actor object (sparsely populated).
 */
export declare type ActorUpdate = Payload & {
    type: 'actor-update';
    actor: Partial<ActorLike>;
};
/**
 * @hidden
 * Engine to app.  Actor correction that should be lerped on the other clients.
 */
export declare type ActorCorrection = Payload & {
    type: 'actor-correction';
    actorId: string;
    appTransform: TransformLike;
};
/**
 * @hidden
 * Bi-directional. Command to destroy an actor (and its children).
 */
export declare type DestroyActors = Payload & {
    type: 'destroy-actors';
    actorIds: string[];
};
/**
 * @hidden
 * Engine to app. Engine wants all the application state.
 */
export declare type SyncRequest = Payload & {
    type: 'sync-request';
};
/**
 * @hidden
 * App to engine. Done sending engine the application state.
 */
export declare type SyncComplete = Payload & {
    type: 'sync-complete';
};
/**
 * @hidden
 * App to engine. Specific to multi-peer adapter. Set whether the client is "authoritative". The authoritative client
 * sends additional updates back to the app such as rigid body updates and animation events.
 */
export declare type SetAuthoritative = Payload & {
    type: 'set-authoritative';
    authoritative: boolean;
};
/**
 * @hidden
 * App to engine. The user has joined the app.
 */
export declare type UserJoined = Payload & {
    type: 'user-joined';
    user: Partial<UserLike>;
};
/**
 * @hidden
 * Engine to app. The user has left the app.
 */
export declare type UserLeft = Payload & {
    type: 'user-left';
    userId: string;
};
/**
 * @hidden
 * Engine to app. Update to the user's state.
 * Only received for users who have joined the app.
 */
export declare type UserUpdate = Payload & {
    type: 'user-update';
    user: Partial<UserLike>;
};
/**
 * @hidden
 * Engine to app. The user is performing an action for a behavior.
 */
export declare type PerformAction = Payload & {
    type: 'perform-action';
    userId: string;
    targetId: string;
    behaviorType: BehaviorType;
    actionName: string;
    actionState: ActionState;
};
/**
 * @hidden
 * App to engine. Set the behavior on the actor with
 * the given actor id.
 */
export declare type SetBehavior = Payload & {
    type: 'set-behavior';
    actorId: string;
    behaviorType: BehaviorType;
};
/**
 * @hidden
 * App to engine. Create an animation and associate it with an actor.
 */
export declare type CreateAnimation = Payload & CreateAnimationOptions & {
    type: 'create-animation';
    actorId: string;
    animationName: string;
};
/**
 * @hidden
 * App to engine. Sets animation state.
 */
export declare type SetAnimationState = Payload & {
    type: 'set-animation-state';
    actorId: string;
    animationName: string;
    state: SetAnimationStateOptions;
};
/**
 * @hidden
 * Bidirectional. Sync animation state.
 */
export declare type SyncAnimations = Payload & {
    type: 'sync-animations';
    animationStates: SetAnimationState[];
};
/**
 * @hidden
 * App to engine. Starts playing a sound.
 */
export declare type SetSoundState = Payload & {
    type: 'set-sound-state';
    id: string;
    actorId: string;
    soundAssetId: string;
    soundCommand: SoundCommand;
    options: SetSoundStateOptions;
    startTimeOffset: number;
};
/**
 * @hidden
 * App to engine. Interpolate the actor's transform.
 */
export declare type InterpolateActor = Payload & {
    type: 'interpolate-actor';
    actorId: string;
    animationName: string;
    value: Partial<ActorLike>;
    duration: number;
    curve: number[];
    enabled: boolean;
};
/**
 * @hidden
 * Bidirectional. Sync transform for an actor.
 */
export declare type TestPayload = Payload & {
    type: 'test-payload';
    userId: string;
    position: number[];
    rotation: number[];
};
/**
 * @hidden
 * Bidirectional. Sync transform for an actor.
 */
export declare type TimerPayload = Payload & {
    type: 'timer-payload';
    userId: string;
    millis: number;
};
/**
 * @hidden
 * Bidirectional. Sync transform for an actor.
 */
export declare type AckPayload = Payload & {
    type: 'ack-payload';
    userId: string;
};
//# sourceMappingURL=payloads.d.ts.map