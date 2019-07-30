/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { BehaviorType, Message } from '../..';
import * as Payloads from '../../types/network/payloads';
/** @hidden */
export declare type InitializeActorMessage = Message<Payloads.CreateActorCommon | Payloads.ActorUpdate>;
/**
 * @hidden
 */
export declare type InitializeActor = {
    message: InitializeActorMessage;
};
/**
 * @hidden
 */
export declare type CreateAnimation = {
    message: Message<Payloads.CreateAnimation>;
    enabled: boolean;
};
/**
 * @hidden
 */
export declare type ActiveSoundInstance = {
    message: Message<Payloads.SetSoundState>;
    basisTime: number;
};
/**
 * @hidden
 */
export declare type SyncActor = {
    actorId: string;
    initialization: InitializeActor;
    createdAnimations: CreateAnimation[];
    activeSoundInstances: ActiveSoundInstance[];
    activeInterpolations: Payloads.InterpolateActor[];
    behavior: BehaviorType;
    grabbedBy: string;
    exclusiveToUser: string;
};
//# sourceMappingURL=syncActor.d.ts.map