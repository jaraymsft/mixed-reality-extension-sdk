/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
/// <reference types="node" />
import events from 'events';
import { ActorTransform, ActorTransformLike, Appearance, AppearanceLike, Attachment, AttachmentLike, AttachPoint, Collider, ColliderLike, Light, LightLike, LookAt, LookAtLike, RigidBody, RigidBodyLike, Text, TextLike, User } from '.';
import { Context, CreateAnimationOptions, LookAtMode, PrimitiveDefinition, SetAnimationStateOptions, Vector3Like } from '../..';
import { SetSoundStateOptions } from '../../sound';
import { ForwardPromise } from '../forwardPromise';
import { InternalActor } from '../internal/actor';
import { CreateColliderType } from '../network/payloads';
import { SubscriptionType } from '../network/subscriptionType';
import { Patchable } from '../patchable';
import { ActionHandler, Behavior } from './behaviors';
import { SoundInstance } from './soundInstance';
/**
 * Describes the properties of an Actor.
 */
export interface ActorLike {
    id: string;
    parentId: string;
    name: string;
    tag: string;
    /**
     * When supplied, this actor will be unsynchronized, and only exist on the client
     * of the User with the given ID. This value can only be set at actor creation.
     * Any actors parented to this actor will also be exclusive to the given user.
     */
    exclusiveToUser: string;
    subscriptions: SubscriptionType[];
    transform: Partial<ActorTransformLike>;
    appearance: Partial<AppearanceLike>;
    light: Partial<LightLike>;
    rigidBody: Partial<RigidBodyLike>;
    collider: Partial<ColliderLike>;
    text: Partial<TextLike>;
    attachment: Partial<AttachmentLike>;
    lookAt: Partial<LookAtLike>;
    grabbable: boolean;
}
/**
 * @hidden
 */
export interface ActorSet {
    [id: string]: Actor;
}
/**
 * An actor represents an object instantiated on the host.
 */
export declare class Actor implements ActorLike, Patchable<ActorLike> {
    private _context;
    private _id;
    private _internal;
    /** @hidden */
    readonly internal: InternalActor;
    private _emitter;
    /** @hidden */
    readonly emitter: events.EventEmitter;
    private _name;
    private _tag;
    private _exclusiveToUser;
    private _parentId;
    private _subscriptions;
    private _transform;
    private _appearance;
    private _light;
    private _rigidBody;
    private _collider;
    private _text;
    private _attachment;
    private _lookAt;
    private _grabbable;
    private _grab;
    private readonly grab;
    readonly context: Context;
    readonly id: string;
    readonly name: string;
    tag: string;
    /** @inheritdoc */
    readonly exclusiveToUser: string;
    readonly subscriptions: SubscriptionType[];
    transform: ActorTransform;
    appearance: Appearance;
    readonly light: Light;
    readonly rigidBody: RigidBody;
    readonly collider: Collider;
    readonly text: Text;
    readonly attachment: Attachment;
    readonly lookAt: LookAt;
    readonly children: Actor[];
    parent: Actor;
    parentId: string;
    grabbable: boolean;
    private constructor();
    /**
     * @hidden
     * TODO - get rid of this.
     */
    static alloc(context: Context, id: string): Actor;
    /**
     * PUBLIC METHODS
     */
    /**
     * Creates a new, empty actor without geometry.
     * @param context The SDK context object.
     * @param options.actor The initial state of the actor.
     */
    static CreateEmpty(context: Context, options?: {
        actor?: Partial<ActorLike>;
    }): ForwardPromise<Actor>;
    /**
     * Creates a new actor from a glTF resource.
     * @param context The SDK context object.
     * @param options.resourceUrl The URL of the source .gltf or .glb file.
     * @param options.assetName The name of the asset within the glTF to load. Leave empty to select the
     * first scene in the file.
     * @param options.colliderType The collider to assign to loaded objects. Leave blank for no colliders.
     * @param options.actor The initial state of the root actor.
     */
    static CreateFromGltf(context: Context, options: {
        resourceUrl: string;
        assetName?: string;
        colliderType?: CreateColliderType;
        actor?: Partial<ActorLike>;
    }): ForwardPromise<Actor>;
    /**
     * @deprecated
     * Use CreateFromGltf instead.
     */
    static CreateFromGLTF(context: Context, options: {
        resourceUrl: string;
        assetName?: string;
        colliderType?: CreateColliderType;
        actor?: Partial<ActorLike>;
    }): ForwardPromise<Actor>;
    /**
     * Creates a new actor from a library resource.
     * AltspaceVR-specific list of library resources: https://account.altvr.com/kits
     * @param context The SDK context object.
     * @param options.resourceId The id of the library resource to instantiate.
     * @param options.actor The initial state of the root actor.
     */
    static CreateFromLibrary(context: Context, options: {
        resourceId: string;
        actor?: Partial<ActorLike>;
    }): ForwardPromise<Actor>;
    /**
     * Creates a new actor with a primitive shape.
     * @param context The SDK context object.
     * @param options.definiton @see PrimitiveDefinition
     * @param options.addCollder Whether or not to add a collider to the actor.
     * @param options.actor The initial state of the actor.
     */
    static CreatePrimitive(context: Context, options: {
        definition: PrimitiveDefinition;
        addCollider?: boolean;
        actor?: Partial<ActorLike>;
    }): ForwardPromise<Actor>;
    /**
     * Creates a new actor hierarchy from the provided prefab.
     * @param context The SDK context object.
     * @param options.prefabId The ID of the prefab asset.
     * @param options.actor The initial state of the root actor.
     * given a collider type when loaded @see AssetManager.loadGltf.
     */
    static CreateFromPrefab(context: Context, options: {
        prefabId: string;
        actor?: Partial<ActorLike>;
    }): ForwardPromise<Actor>;
    /**
     * Destroys the actor.
     */
    destroy(): void;
    /**
     * Adds a light component to the actor.
     * @param light Light characteristics.
     */
    enableLight(light?: Partial<LightLike>): void;
    /**
     * Adds a rigid body component to the actor.
     * @param rigidBody Rigid body characteristics.
     */
    enableRigidBody(rigidBody?: Partial<RigidBodyLike>): void;
    /**
     * Adds a collider of the given type and parameters on the actor.
     * @param colliderType Type of the collider to enable.
     * @param isTrigger Whether the collider is a trigger volume or not.
     * @param center The center of the collider, or default of the object if none is provided.
     * @param radius The radius of the collider, or default bounding if non is provided.
     */
    setCollider(colliderType: 'sphere', isTrigger: boolean, center?: Vector3Like, radius?: number): void;
    /**
     * Adds a collider of the given type and parameters on the actor.
     * @param colliderType Type of the collider to enable.
     * @param isTrigger Whether the collider is a trigger volume or not.
     * @param center The center of the collider, or default of the object if none is provided.
     * @param size
     */
    setCollider(colliderType: 'box', isTrigger: boolean, center?: Vector3Like, size?: Vector3Like): void;
    /**
     * Adds a text component to the actor.
     * @param text Text characteristics
     */
    enableText(text?: Partial<TextLike>): void;
    /**
     * Instruct the actor to face another object, or stop facing an object.
     * @param actorOrActorId The Actor or id of the actor to face.
     * @param lookAtMode (Optional) How to face the target. @see LookUpMode.
     * @param backward (Optional) If true, actor faces away from target rather than toward.
     */
    enableLookAt(actorOrActorId: Actor | string, mode?: LookAtMode, backward?: boolean): void;
    /**
     * Attach to the user at the given attach point.
     * @param userOrUserId The User or id of user to attach to.
     * @param attachPoint Where on the user to attach.
     */
    attach(userOrUserId: User | string, attachPoint: AttachPoint): void;
    /**
     * If attached to a user, detach from it.
     */
    detach(): void;
    /**
     * Subscribe to updates from this actor.
     * @param subscription The type of subscription to add.
     */
    subscribe(subscription: SubscriptionType): void;
    /**
     * Unsubscribe from updates from this actor.
     * @param subscription The type of subscription to remove.
     */
    unsubscribe(subscription: SubscriptionType): void;
    /**
     * Add a grad handler to be called when the given action state has changed.
     * @param grabState The grab state to fire the handler on.
     * @param handler The handler to call when the grab state has changed.
     */
    onGrab(grabState: 'begin' | 'end', handler: ActionHandler): void;
    /**
     * Sets the behavior on this actor.
     * @param behavior The type of behavior to set. Pass null to clear the behavior.
     */
    setBehavior<BehaviorT extends Behavior>(behavior: {
        new (): BehaviorT;
    }): BehaviorT;
    /**
     * Starts playing a preloaded sound.
     * @param soundAssetId Name of sound asset preloaded using AssetManager.
     * @param options Adjustments to pitch and volume, and other characteristics.
     * @param startTimeOffset How many seconds to offset into the sound
     */
    startSound(soundAssetId: string, options: SetSoundStateOptions, startTimeOffset?: number): ForwardPromise<SoundInstance>;
    /**
     * Creates an animation on the actor.
     * @param animationName The name of the animation.
     * @param options The animation keyframes, events, and other characteristics.
     */
    createAnimation(animationName: string, options: CreateAnimationOptions): void;
    /**
     * Enables the animation on the actor. Animation will start playing immediately.
     * @param animationName The name of the animation.
     */
    enableAnimation(animationName: string): void;
    /**
     * Disables the animation on the actor. Animation will stop playing immediately.
     * When an animation is disabled, it is also paused (its time does not move forward).
     * @param animationName The name of the animation.
     */
    disableAnimation(animationName: string): void;
    /**
     * Starts the animation (sets animation speed to 1).
     * @param animationName The name of the animation.
     */
    resumeAnimation(animationName: string): void;
    /**
     * Stops the animation (sets animation speed to zero).
     * @param animationName The name of the animation.
     */
    pauseAnimation(animationName: string): void;
    /**
     * Sets the animation time (units are in seconds).
     * @param animationName The name of the animation.
     * @param time The desired animation time. A negative value seeks to the end of the animation.
     */
    setAnimationTime(animationName: string, time: number): void;
    /**
     * (Advanced) Sets the time, speed, and enabled state of an animation.
     * @param animationName The name of the animation.
     * @param options The time, speed and enabled state to apply. All values are optional. Only the values
     * provided will be applied.
     */
    setAnimationState(animationName: string, state: SetAnimationStateOptions): void;
    /**
     * Animate actor properties to the given value, following the specified animation curve. Actor transform
     * is the only animatable property at the moment. Other properties such as light color may become animatable
     * in the future.
     * @param value The desired final state of the animation.
     * @param duration The length of the interpolation (in seconds).
     * @param curve The cubic-bezier curve parameters. @see AnimationEaseCurves for predefined values.
     */
    animateTo(value: Partial<ActorLike>, duration: number, curve: number[]): void;
    /**
     * Finds child actors matching `name`.
     * @param name The name of the actors to find.
     * @param recurse Whether or not to search recursively.
     */
    findChildrenByName(name: string, recurse: boolean): Actor[];
    /**
     * Actor Events
     */
    /**
     * Set an event handler for the animation-disabled event.
     * @param handler The handler to call when an animation reaches the end or is otherwise disabled.
     */
    onAnimationDisabled(handler: (animationName: string) => any): this;
    /**
     * Set an event handler for the animation-enabled event.
     * @param handler The handler to call when an animation moves from the disabled to enabled state.
     */
    onAnimationEnabled(handler: (animationName: string) => any): this;
    copy(from: Partial<ActorLike>): this;
    toJSON(): ActorLike;
    /**
     * INTERNAL METHODS
     */
    /**
     * Prepare outgoing messages
     * @hidden
     */
    static sanitize(msg: ActorLike): ActorLike;
    static sanitize(msg: Partial<ActorLike>): Partial<ActorLike>;
    /** @hidden */
    actorChanged: (...path: string[]) => void;
    /**
     * PRIVATE METHODS
     */
    private generateColliderGeometry;
    private _setCollider;
}
//# sourceMappingURL=actor.d.ts.map