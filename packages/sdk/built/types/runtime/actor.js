"use strict";
/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = __importDefault(require("events"));
const _1 = require(".");
const constants_1 = require("../../constants");
const log_1 = require("../../log");
const observe_1 = require("../../utils/observe");
const readPath_1 = __importDefault(require("../../utils/readPath"));
const resolveJsonValues_1 = __importDefault(require("../../utils/resolveJsonValues"));
const actor_1 = require("../internal/actor");
const behaviors_1 = require("./behaviors");
const soundInstance_1 = require("./soundInstance");
/**
 * An actor represents an object instantiated on the host.
 */
class Actor {
    // tslint:disable-next-line:variable-name
    constructor(_context, _id) {
        this._context = _context;
        this._id = _id;
        // tslint:disable:variable-name
        this._internal = new actor_1.InternalActor(this);
        this._emitter = new events_1.default.EventEmitter();
        this._parentId = constants_1.ZeroGuid;
        this._subscriptions = [];
        this._transform = new _1.ActorTransform();
        this._appearance = new _1.Appearance(this);
        this._grabbable = false;
        /** @hidden */
        this.actorChanged = (...path) => {
            if (this.internal.observing) {
                this.internal.patch = this.internal.patch || {};
                readPath_1.default(this, this.internal.patch, ...path);
                this.context.internal.incrementGeneration();
            }
        };
        // Actor patching: Observe the transform for changed values.
        observe_1.observe({
            target: this._transform,
            targetName: 'transform',
            notifyChanged: (...path) => this.actorChanged(...path)
        });
        // Observe changes to the looks of this actor
        observe_1.observe({
            target: this._appearance,
            targetName: 'appearance',
            notifyChanged: (...path) => this.actorChanged(...path)
        });
    }
    /** @hidden */
    get internal() { return this._internal; }
    /** @hidden */
    get emitter() { return this._emitter; }
    // tslint:enable:variable-name
    get grab() { this._grab = this._grab || new behaviors_1.DiscreteAction(); return this._grab; }
    /*
     * PUBLIC ACCESSORS
     */
    get context() { return this._context; }
    get id() { return this._id; }
    get name() { return this._name; }
    get tag() { return this._tag; }
    set tag(value) { this._tag = value; this.actorChanged('tag'); }
    /** @inheritdoc */
    get exclusiveToUser() { return this._exclusiveToUser; }
    get subscriptions() { return this._subscriptions; }
    get transform() { return this._transform; }
    set transform(value) { this._transform.copy(value); }
    get appearance() { return this._appearance; }
    set appearance(value) { this._appearance.copy(value); }
    get light() { return this._light; }
    get rigidBody() { return this._rigidBody; }
    get collider() { return this._collider; }
    get text() { return this._text; }
    get attachment() { return this._attachment; }
    get lookAt() { return this._lookAt; }
    get children() { return this.context.actors.filter(actor => actor.parentId === this.id); }
    get parent() { return this._context.actor(this._parentId); }
    set parent(value) { this.parentId = value && value.id || constants_1.ZeroGuid; }
    get parentId() { return this._parentId; }
    set parentId(value) {
        const parentActor = this.context.actor(value);
        if (!value || value.startsWith('0000') || !parentActor) {
            value = constants_1.ZeroGuid;
        }
        if (parentActor && parentActor.exclusiveToUser && parentActor.exclusiveToUser !== this.exclusiveToUser) {
            throw new Error(`User-exclusive actor ${this.id} can only be parented to inclusive actors ` +
                "and actors that are exclusive to the same user.");
        }
        if (this._parentId !== value) {
            this._parentId = value;
            this.actorChanged('parentId');
        }
    }
    get grabbable() { return this._grabbable; }
    set grabbable(value) {
        if (value !== this._grabbable) {
            this._grabbable = value;
            this.actorChanged('grabbable');
        }
    }
    /**
     * @hidden
     * TODO - get rid of this.
     */
    static alloc(context, id) {
        return new Actor(context, id);
    }
    /**
     * PUBLIC METHODS
     */
    /**
     * Creates a new, empty actor without geometry.
     * @param context The SDK context object.
     * @param options.actor The initial state of the actor.
     */
    static CreateEmpty(context, options) {
        return context.internal.CreateEmpty(options);
    }
    /**
     * Creates a new actor from a glTF resource.
     * @param context The SDK context object.
     * @param options.resourceUrl The URL of the source .gltf or .glb file.
     * @param options.assetName The name of the asset within the glTF to load. Leave empty to select the
     * first scene in the file.
     * @param options.colliderType The collider to assign to loaded objects. Leave blank for no colliders.
     * @param options.actor The initial state of the root actor.
     */
    static CreateFromGltf(context, options) {
        return context.internal.CreateFromGltf(options);
    }
    /**
     * @deprecated
     * Use CreateFromGltf instead.
     */
    static CreateFromGLTF(context, options) {
        return context.internal.CreateFromGltf(options);
    }
    /**
     * Creates a new actor from a library resource.
     * AltspaceVR-specific list of library resources: https://account.altvr.com/kits
     * @param context The SDK context object.
     * @param options.resourceId The id of the library resource to instantiate.
     * @param options.actor The initial state of the root actor.
     */
    static CreateFromLibrary(context, options) {
        return context.internal.CreateFromLibrary(options);
    }
    /**
     * Creates a new actor with a primitive shape.
     * @param context The SDK context object.
     * @param options.definiton @see PrimitiveDefinition
     * @param options.addCollder Whether or not to add a collider to the actor.
     * @param options.actor The initial state of the actor.
     */
    static CreatePrimitive(context, options) {
        return context.internal.CreatePrimitive(options);
    }
    /**
     * Creates a new actor hierarchy from the provided prefab.
     * @param context The SDK context object.
     * @param options.prefabId The ID of the prefab asset.
     * @param options.actor The initial state of the root actor.
     * given a collider type when loaded @see AssetManager.loadGltf.
     */
    static CreateFromPrefab(context, options) {
        return context.internal.CreateFromPrefab(options);
    }
    /**
     * Destroys the actor.
     */
    destroy() {
        this.context.internal.destroyActor(this.id);
    }
    /**
     * Adds a light component to the actor.
     * @param light Light characteristics.
     */
    enableLight(light) {
        if (!this._light) {
            this._light = new _1.Light();
            // Actor patching: Observe the light component for changed values.
            observe_1.observe({
                target: this._light,
                targetName: 'light',
                notifyChanged: (...path) => this.actorChanged(...path),
                // Trigger notifications for every observed leaf node to ensure we get all values in the initial patch.
                triggerNotificationsNow: true
            });
        }
        // Copying the new values will trigger an actor update and enable/update the light component.
        this._light.copy(light);
    }
    /**
     * Adds a rigid body component to the actor.
     * @param rigidBody Rigid body characteristics.
     */
    enableRigidBody(rigidBody) {
        if (!this._rigidBody) {
            this._rigidBody = new _1.RigidBody(this);
            // Actor patching: Observe the rigid body component for changed values.
            observe_1.observe({
                target: this._rigidBody,
                targetName: 'rigidBody',
                notifyChanged: (...path) => this.actorChanged(...path),
                // Trigger notifications for every observed leaf node to ensure we get all values in the initial patch.
                triggerNotificationsNow: true
            });
        }
        // Copying the new values will trigger an actor update and enable/update the rigid body component.
        this._rigidBody.copy(rigidBody);
    }
    /** @ignore */
    setCollider(colliderType, 
    // collisionLayer: CollisionLayer,
    isTrigger, center, size) {
        const colliderGeometry = this.generateColliderGeometry(colliderType, center, size);
        if (colliderGeometry) {
            this._setCollider({
                enabled: true,
                isTrigger,
                // collisionLayer,
                colliderGeometry
            });
        }
    }
    /**
     * Adds a text component to the actor.
     * @param text Text characteristics
     */
    enableText(text) {
        if (!this._text) {
            this._text = new _1.Text();
            // Actor patching: Observe the text component for changed values.
            observe_1.observe({
                target: this._text,
                targetName: 'text',
                notifyChanged: (...path) => this.actorChanged(...path),
                // Trigger notifications for every observed leaf node to ensure we get all values in the initial patch.
                triggerNotificationsNow: true
            });
        }
        // Copying the new values will trigger an actor update and enable/update the text component.
        this._text.copy(text);
    }
    /**
     * Instruct the actor to face another object, or stop facing an object.
     * @param actorOrActorId The Actor or id of the actor to face.
     * @param lookAtMode (Optional) How to face the target. @see LookUpMode.
     * @param backward (Optional) If true, actor faces away from target rather than toward.
     */
    enableLookAt(actorOrActorId, mode, backward) {
        // Resolve the actorId value.
        let actorId = constants_1.ZeroGuid;
        if (typeof (actorOrActorId) === 'object' && actorOrActorId.id !== undefined) {
            actorId = actorOrActorId.id;
        }
        else if (typeof (actorOrActorId) === 'string') {
            actorId = actorOrActorId;
        }
        // Allocate component if necessary.
        if (!this._lookAt) {
            this._lookAt = new _1.LookAt();
            // Actor patching: Observe the lookAt component for changed values.
            observe_1.observe({
                target: this._lookAt,
                targetName: 'lookAt',
                notifyChanged: (...path) => this.actorChanged(...path),
                // Trigger notifications for every observed leaf node to ensure we get all values in the
                // initial patch.
                triggerNotificationsNow: true
            });
        }
        // Set component values.
        this._lookAt.copy({
            actorId,
            mode,
            backward
        });
    }
    /**
     * Attach to the user at the given attach point.
     * @param userOrUserId The User or id of user to attach to.
     * @param attachPoint Where on the user to attach.
     */
    attach(userOrUserId, attachPoint) {
        const userId = typeof userOrUserId === 'string' ? userOrUserId : userOrUserId.id;
        if (!this._attachment) {
            // Actor patching: Observe the attachment for changed values.
            this._attachment = new _1.Attachment();
            observe_1.observe({
                target: this._attachment,
                targetName: 'attachment',
                notifyChanged: (...path) => this.actorChanged(...path)
            });
        }
        this._attachment.userId = userId;
        this._attachment.attachPoint = attachPoint;
    }
    /**
     * If attached to a user, detach from it.
     */
    detach() {
        this._attachment.userId = constants_1.ZeroGuid;
        this._attachment.attachPoint = 'none';
    }
    /**
     * Subscribe to updates from this actor.
     * @param subscription The type of subscription to add.
     */
    subscribe(subscription) {
        this._subscriptions.push(subscription);
        this.actorChanged('subscriptions');
    }
    /**
     * Unsubscribe from updates from this actor.
     * @param subscription The type of subscription to remove.
     */
    unsubscribe(subscription) {
        this._subscriptions = this._subscriptions.filter(value => value !== subscription);
        this.actorChanged('subscriptions');
    }
    /**
     * Add a grad handler to be called when the given action state has changed.
     * @param grabState The grab state to fire the handler on.
     * @param handler The handler to call when the grab state has changed.
     */
    onGrab(grabState, handler) {
        const actionState = (grabState === 'begin') ? 'started' : 'stopped';
        this.grab.on(actionState, handler);
    }
    /**
     * Sets the behavior on this actor.
     * @param behavior The type of behavior to set. Pass null to clear the behavior.
     */
    setBehavior(behavior) {
        if (behavior) {
            const newBehavior = new behavior();
            this.internal.behavior = newBehavior;
            this.context.internal.setBehavior(this.id, this.internal.behavior.behaviorType);
            return newBehavior;
        }
        this.internal.behavior = null;
        this.context.internal.setBehavior(this.id, null);
        return null;
    }
    /**
     * Starts playing a preloaded sound.
     * @param soundAssetId Name of sound asset preloaded using AssetManager.
     * @param options Adjustments to pitch and volume, and other characteristics.
     * @param startTimeOffset How many seconds to offset into the sound
     */
    startSound(soundAssetId, options, startTimeOffset) {
        return new soundInstance_1.SoundInstance(this, soundAssetId).start(options, startTimeOffset);
    }
    /**
     * Creates an animation on the actor.
     * @param animationName The name of the animation.
     * @param options The animation keyframes, events, and other characteristics.
     */
    createAnimation(animationName, options) {
        this.context.internal.createAnimation(this.id, animationName, options);
    }
    /**
     * Enables the animation on the actor. Animation will start playing immediately.
     * @param animationName The name of the animation.
     */
    enableAnimation(animationName) {
        this.setAnimationState(animationName, { enabled: true });
    }
    /**
     * Disables the animation on the actor. Animation will stop playing immediately.
     * When an animation is disabled, it is also paused (its time does not move forward).
     * @param animationName The name of the animation.
     */
    disableAnimation(animationName) {
        this.setAnimationState(animationName, { enabled: false });
    }
    /**
     * Starts the animation (sets animation speed to 1).
     * @param animationName The name of the animation.
     */
    resumeAnimation(animationName) {
        this.setAnimationState(animationName, { enabled: true });
    }
    /**
     * Stops the animation (sets animation speed to zero).
     * @param animationName The name of the animation.
     */
    pauseAnimation(animationName) {
        this.setAnimationState(animationName, { enabled: false });
    }
    /**
     * Sets the animation time (units are in seconds).
     * @param animationName The name of the animation.
     * @param time The desired animation time. A negative value seeks to the end of the animation.
     */
    setAnimationTime(animationName, time) {
        this.setAnimationState(animationName, { time });
    }
    /**
     * (Advanced) Sets the time, speed, and enabled state of an animation.
     * @param animationName The name of the animation.
     * @param options The time, speed and enabled state to apply. All values are optional. Only the values
     * provided will be applied.
     */
    setAnimationState(animationName, state) {
        return this.context.internal.setAnimationState(this.id, animationName, state);
    }
    /**
     * Animate actor properties to the given value, following the specified animation curve. Actor transform
     * is the only animatable property at the moment. Other properties such as light color may become animatable
     * in the future.
     * @param value The desired final state of the animation.
     * @param duration The length of the interpolation (in seconds).
     * @param curve The cubic-bezier curve parameters. @see AnimationEaseCurves for predefined values.
     */
    animateTo(value, duration, curve) {
        this.context.internal.animateTo(this.id, value, duration, curve);
    }
    /**
     * Finds child actors matching `name`.
     * @param name The name of the actors to find.
     * @param recurse Whether or not to search recursively.
     */
    findChildrenByName(name, recurse) {
        const namedChildren = this.children.filter(actor => actor.name === name);
        if (!recurse) {
            return namedChildren;
        }
        for (const child of this.children) {
            namedChildren.push(...child.findChildrenByName(name, recurse));
        }
        return namedChildren;
    }
    /**
     * Actor Events
     */
    /**
     * Set an event handler for the animation-disabled event.
     * @param handler The handler to call when an animation reaches the end or is otherwise disabled.
     */
    onAnimationDisabled(handler) {
        this.emitter.addListener('animation-disabled', handler);
        return this;
    }
    /**
     * Set an event handler for the animation-enabled event.
     * @param handler The handler to call when an animation moves from the disabled to enabled state.
     */
    onAnimationEnabled(handler) {
        this.emitter.addListener('animation-enabled', handler);
        return this;
    }
    copy(from) {
        // Pause change detection while we copy the values into the actor.
        const wasObserving = this.internal.observing;
        this.internal.observing = false;
        if (!from)
            return this;
        if (from.id)
            this._id = from.id;
        if (from.parentId)
            this._parentId = from.parentId;
        if (from.name)
            this._name = from.name;
        if (from.tag)
            this._tag = from.tag;
        if (from.exclusiveToUser || from.parentId) {
            this._exclusiveToUser = this.parent && this.parent.exclusiveToUser || from.exclusiveToUser;
        }
        if (from.transform)
            this._transform.copy(from.transform);
        if (from.attachment)
            this.attach(from.attachment.userId, from.attachment.attachPoint);
        if (from.appearance)
            this._appearance.copy(from.appearance);
        if (from.light)
            this.enableLight(from.light);
        if (from.rigidBody)
            this.enableRigidBody(from.rigidBody);
        if (from.collider)
            this._setCollider(from.collider);
        if (from.text)
            this.enableText(from.text);
        if (from.lookAt)
            this.enableLookAt(from.lookAt.actorId, from.lookAt.mode);
        if (from.grabbable)
            this._grabbable = from.grabbable;
        this.internal.observing = wasObserving;
        return this;
    }
    toJSON() {
        return {
            id: this._id,
            parentId: this._parentId,
            name: this._name,
            tag: this._tag,
            exclusiveToUser: this._exclusiveToUser,
            transform: this._transform.toJSON(),
            appearance: this._appearance.toJSON(),
            attachment: this._attachment ? this._attachment.toJSON() : undefined,
            light: this._light ? this._light.toJSON() : undefined,
            rigidBody: this._rigidBody ? this._rigidBody.toJSON() : undefined,
            collider: this._collider ? this._collider.toJSON() : undefined,
            text: this._text ? this._text.toJSON() : undefined,
            lookAt: this._lookAt ? this._lookAt.toJSON() : undefined,
            grabbable: this._grabbable
        };
    }
    static sanitize(msg) {
        msg = resolveJsonValues_1.default(msg);
        if (msg.appearance) {
            msg.appearance = _1.Appearance.sanitize(msg.appearance);
        }
        return msg;
    }
    /**
     * PRIVATE METHODS
     */
    generateColliderGeometry(colliderType, center, size) {
        switch (colliderType) {
            case 'box':
                return {
                    colliderType: 'box',
                    center,
                    size: size
                };
            case 'sphere':
                return {
                    colliderType: 'sphere',
                    center,
                    radius: size
                };
            default:
                log_1.log.error(null, 'Trying to enable a collider on the actor with an invalid collider geometry type.' +
                    `Type given is ${colliderType}`);
                return undefined;
        }
    }
    _setCollider(collider) {
        if (this._collider) {
            observe_1.unobserve(this._collider);
            this._collider = undefined;
        }
        this._collider = new _1.Collider(this, collider);
        observe_1.observe({
            target: this._collider,
            targetName: 'collider',
            notifyChanged: (...path) => this.actorChanged(...path),
            // Trigger notifications for every observed leaf node to ensure we get all values in the initial patch.
            triggerNotificationsNow: true
        });
    }
}
exports.Actor = Actor;
//# sourceMappingURL=actor.js.map