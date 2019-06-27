/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
/// <reference types="node" />
import { ActionEvent, Actor, ActorLike, ActorSet, BehaviorType, CollisionEvent, Context, CreateAnimationOptions, PrimitiveDefinition, SetAnimationStateOptions, TriggerEvent, UserLike, UserSet } from '../..';
import { CreateColliderType, Payload } from '../network/payloads';
import * as Protocols from '../../protocols';
import { SetSoundStateOptions, SoundCommand } from '../../sound';
import { ForwardPromise } from '../forwardPromise';
import { SoundInstance } from '../runtime/soundInstance';
/**
 * @hidden
 */
export declare class InternalContext {
    context: Context;
    actorSet: ActorSet;
    userSet: UserSet;
    userGroupMapping: {
        [id: string]: number;
    };
    protocol: Protocols.Protocol;
    interval: NodeJS.Timer;
    generation: number;
    prevGeneration: number;
    __rpc: any;
    constructor(context: Context);
    CreateEmpty(options?: {
        actor?: Partial<ActorLike>;
    }): ForwardPromise<Actor>;
    CreateFromGltf(options: {
        resourceUrl: string;
        assetName?: string;
        colliderType?: CreateColliderType;
        actor?: Partial<ActorLike>;
    }): ForwardPromise<Actor>;
    CreateFromLibrary(options: {
        resourceId: string;
        actor?: Partial<ActorLike>;
    }): ForwardPromise<Actor>;
    CreatePrimitive(options: {
        definition: PrimitiveDefinition;
        addCollider?: boolean;
        actor?: Partial<ActorLike>;
    }): ForwardPromise<Actor>;
    CreateFromPrefab(options: {
        prefabId: string;
        actor?: Partial<ActorLike>;
    }): ForwardPromise<Actor>;
    private createActorFromPayload;
    createAnimation(actorId: string, animationName: string, options: CreateAnimationOptions): void;
    setAnimationState(actorId: string, animationName: string, state: SetAnimationStateOptions): void;
    setSoundState(soundInstance: SoundInstance, command: SoundCommand, options?: SetSoundStateOptions, soundAssetId?: string, startTimeOffset?: number): void;
    animateTo(actorId: string, value: Partial<ActorLike>, duration: number, curve: number[]): void;
    startListening(): Promise<void>;
    start(): void;
    stop(): void;
    incrementGeneration(): void;
    update(): void;
    sendDestroyActors(actorIds: string[]): void;
    updateActors(sactors: Partial<ActorLike> | Array<Partial<ActorLike>>): void;
    sendPayload(payload: Payload): void;
    receiveRPC(procName: string, channelName: string, args: any[]): void;
    onClose: () => void;
    userJoined(suser: Partial<UserLike>): void;
    userLeft(userId: string): void;
    updateUser(suser: Partial<UserLike>): void;
    performAction(actionEvent: ActionEvent): void;
    collisionEventRaised(collisionEvent: CollisionEvent): void;
    triggerEventRaised(triggerEvent: TriggerEvent): void;
    setAnimationStateEventRaised(actorId: string, animationName: string, state: SetAnimationStateOptions): void;
    localDestroyActors(actorIds: string[]): void;
    localDestroyActor(actor: Actor): void;
    destroyActor(actorId: string): void;
    sendRigidBodyCommand(actorId: string, payload: Payload): void;
    setBehavior(actorId: string, newBehaviorType: BehaviorType): void;
}
//# sourceMappingURL=context.d.ts.map