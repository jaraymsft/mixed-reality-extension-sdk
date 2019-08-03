"use strict";
/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const deepmerge_1 = __importDefault(require("deepmerge"));
const __1 = require("../..");
const log_1 = require("../../log");
const sound_1 = require("../../sound");
/**
 * @hidden
 * The DefaultRule provides reasonable default rule settings, ensuring all fields are assigned.
 */
exports.DefaultRule = {
    synchronization: {
        stage: 'always',
        before: 'allow',
        during: 'allow',
        after: 'allow'
    },
    client: {
        beforeQueueMessageForClient: (session, client, message, promise) => {
            return message;
        },
        shouldSendToUser: () => null,
    },
    session: {
        beforeReceiveFromApp: (session, message) => {
            return message;
        },
        beforeReceiveFromClient: (session, client, message) => {
            return message;
        }
    }
};
/**
 * @hidden
 * MissingRule alerts the SDK developer that they need to define a Rule for the payload.
 */
exports.MissingRule = Object.assign({}, exports.DefaultRule, { client: Object.assign({}, exports.DefaultRule.client, { beforeQueueMessageForClient: (session, client, message, promise) => {
            log_1.log.error('app', `[ERROR] No rule defined for payload ${message.payload.type}! Add an entry in rules.ts.`);
            return message;
        } }), session: Object.assign({}, exports.DefaultRule.session, { beforeReceiveFromApp: (session, message) => {
            log_1.log.error('app', `[ERROR] No rule defined for payload ${message.payload.type}! Add an entry in rules.ts.`);
            return message;
        }, beforeReceiveFromClient: (session, client, message) => {
            log_1.log.error('app', `[ERROR] No rule defined for payload ${message.payload.type}! Add an entry in rules.ts.`);
            return message;
        } }) });
/**
 * @hidden
 * Handling for client-only messages.
 */
const ClientOnlyRule = Object.assign({}, exports.DefaultRule, { synchronization: {
        stage: 'always',
        before: 'error',
        during: 'error',
        after: 'error'
    }, client: Object.assign({}, exports.DefaultRule.client, { beforeQueueMessageForClient: (session, client, message, promise) => {
            log_1.log.error('network', `[ERROR] session tried to queue a client-only message: ${message.payload.type}!`);
            return message;
        } }), session: Object.assign({}, exports.DefaultRule.session, { beforeReceiveFromApp: (session, message) => {
            log_1.log.error('network', `[ERROR] app tried to send a client-only message: ${message.payload.type}!`);
            return undefined;
        } }) });
/**
 * @hidden
 * Handling for actor creation messages
 */
const CreateActorRule = Object.assign({}, exports.DefaultRule, { synchronization: {
        stage: 'create-actors',
        before: 'ignore',
        during: 'queue',
        after: 'allow'
    }, client: Object.assign({}, exports.DefaultRule.client, { shouldSendToUser: (message, userId, session, client) => {
            const exclusiveUser = session.actorSet[message.payload.actor.id].exclusiveToUser;
            return exclusiveUser ? exclusiveUser === userId : null;
        } }), session: Object.assign({}, exports.DefaultRule.session, { beforeReceiveFromApp: (session, message) => {
            session.cacheInitializeActorMessage(message);
            return message;
        } }) });
/**
 * @hidden
 * A global collection of message rules used by different parts of the multipeer adapter.
 * Getting a compiler error here? It is likely that `Rules` is missing a rule for the new payload type you added.
 * *** KEEP ENTRIES SORTED ***
 */
exports.Rules = {
    // ========================================================================
    'ack-payload': Object.assign({}, exports.DefaultRule, { synchronization: {
            stage: 'always',
            before: 'allow',
            during: 'allow',
            after: 'allow'
        }, client: Object.assign({}, exports.DefaultRule.client, { shouldSendToUser: (message, userId, session, client) => {
                const exclusiveUser = message.payload.userId;
                // return exclusiveUser ? exclusiveUser === userId : null;
                return null;
            } }), session: Object.assign({}, exports.DefaultRule.session, { beforeReceiveFromClient: (session, client, message) => {
                // Sync the change to the other clients.
                // session.sendPayloadToClients(message.payload, (value) => value.id !== client.id);
                session.sendPayloadToClients(message.payload, (value) => true);
                return undefined;
            } }) }),
    // ========================================================================
    'actor-correction': Object.assign({}, exports.DefaultRule, { synchronization: {
            stage: 'create-actors',
            before: 'ignore',
            during: 'queue',
            after: 'allow'
        }, client: Object.assign({}, exports.DefaultRule.client, { beforeQueueMessageForClient: (session, client, message, promise) => {
                // Coalesce this actor correction with the previously queued update if it exists, maintaining a single
                // update for this actor rather than queuing a series of them.  This is fine, as we do not need to lerp
                // an actor correction on a late join user.  It can just be the updated actor values.
                const payload = message.payload;
                const queuedMessage = client.queuedMessages
                    .filter(value => value.message.payload.type === 'actor-update' &&
                    value.message.payload.actor.id === payload.actorId).shift();
                if (queuedMessage) {
                    const existingPayload = queuedMessage.message.payload;
                    existingPayload.actor = deepmerge_1.default(existingPayload.actor, {
                        payload: {
                            actor: {
                                transform: {
                                    app: message.payload.appTransform
                                }
                            }
                        }
                    });
                    // We have merged the actor correction in to an existing actor update.  We do not want to
                    // propagate the correction message further.
                    return undefined;
                }
                return message;
            } }), session: Object.assign({}, exports.DefaultRule.session, { beforeReceiveFromClient: (session, client, message) => {
                const syncActor = session.actorSet[message.payload.actorId];
                if (syncActor && (client.authoritative || syncActor.grabbedBy === client.id)) {
                    const correctionPayload = message.payload;
                    // Synthesize an actor update message and add in the transform from the correction payload.
                    // Send this to the cacheActorUpdateMessage call.
                    const updateMessage = {
                        payload: {
                            actor: {
                                transform: {
                                    app: correctionPayload.appTransform
                                }
                            }
                        }
                    };
                    // Merge the update into the existing actor.
                    session.cacheActorUpdateMessage(updateMessage);
                    // Sync the change to the other clients.
                    session.sendPayloadToClients(correctionPayload, (value) => value.id !== client.id);
                    // Determine whether to forward the message to the app based on subscriptions.
                    let shouldSendToApp = false;
                    const subscriptions = syncActor.initialization.message.payload.actor.subscriptions || [];
                    if (correctionPayload.appTransform &&
                        Object.keys(correctionPayload.appTransform) &&
                        subscriptions.includes('transform')) {
                        shouldSendToApp = true;
                    }
                    // If we should sent to the app, then send the synthesized actor update instead, as correction
                    // messages are just for clients.
                    return shouldSendToApp ? updateMessage : undefined;
                }
            } }) }),
    // ========================================================================
    'actor-update': Object.assign({}, exports.DefaultRule, { synchronization: {
            stage: 'create-actors',
            before: 'ignore',
            during: 'queue',
            after: 'allow'
        }, client: Object.assign({}, exports.DefaultRule.client, { beforeQueueMessageForClient: (session, client, message, promise) => {
                // Coalesce this update with the previously queued update if it exists, maintaining a single
                // update for this actor rather than queuing a series of them.
                const payload = message.payload;
                const queuedMessage = client.queuedMessages
                    .filter(value => value.message.payload.type === 'actor-update' &&
                    value.message.payload.actor.id === payload.actor.id).shift();
                if (queuedMessage) {
                    const existingPayload = queuedMessage.message.payload;
                    existingPayload.actor = deepmerge_1.default(existingPayload.actor, payload.actor);
                    // We have merged the actor update in to an existing actor update.  We do not want to
                    // propagate the update message further.
                    return undefined;
                }
                return message;
            }, shouldSendToUser: (message, userId, session, client) => {
                const exclusiveUser = session.actorSet[message.payload.actor.id].exclusiveToUser;
                return exclusiveUser ? exclusiveUser === userId : null;
            } }), session: Object.assign({}, exports.DefaultRule.session, { beforeReceiveFromApp: (session, message) => {
                session.cacheActorUpdateMessage(message);
                return message;
            }, beforeReceiveFromClient: (session, client, message) => {
                const syncActor = session.actorSet[message.payload.actor.id];
                if (syncActor && (client.authoritative || syncActor.grabbedBy === client.id)) {
                    // Merge the update into the existing actor.
                    session.cacheActorUpdateMessage(message);
                    // Make a copy of the message so we can modify it.
                    const payloadForClients = deepmerge_1.default(message.payload, {});
                    // If animating, don't sync transform changes with other clients (animations are desynchronized)
                    if (session.isAnimating(syncActor)) {
                        delete payloadForClients.actor.transform;
                    }
                    // Don't sync to other clients if the actor patch is empty.
                    // (if keys.length === 1, it only contains the actor.id field)
                    if (Object.keys(payloadForClients.actor).length > 1) {
                        // Sync the change to the other clients.
                        session.sendPayloadToClients(payloadForClients, (value) => value.id !== client.id);
                    }
                    // Determine whether to forward the message to the app based on subscriptions.
                    let shouldSendToApp = false;
                    const subscriptions = syncActor.initialization.message.payload.actor.subscriptions || [];
                    if (message.payload.actor.transform &&
                        Object.keys(message.payload.actor.transform) &&
                        subscriptions.includes('transform')) {
                        shouldSendToApp = true;
                    }
                    else if (message.payload.actor.rigidBody &&
                        Object.keys(message.payload.actor.rigidBody) &&
                        subscriptions.includes('rigidbody')) {
                        shouldSendToApp = true;
                    }
                    return shouldSendToApp ? message : undefined;
                }
            } }) }),
    // ========================================================================
    'app2engine-rpc': Object.assign({}, exports.DefaultRule, { synchronization: {
            stage: 'always',
            before: 'queue',
            during: 'queue',
            after: 'allow'
        }, client: Object.assign({}, exports.DefaultRule.client, { shouldSendToUser: (message, userId, session, client) => {
                const exclusiveUser = message.payload.userId;
                return exclusiveUser ? exclusiveUser === userId : null;
            } }) }),
    // ========================================================================
    'asset-update': Object.assign({}, exports.DefaultRule, { synchronization: {
            stage: 'load-assets',
            before: 'ignore',
            during: 'queue',
            after: 'allow'
        }, session: Object.assign({}, exports.DefaultRule.session, { beforeReceiveFromApp: (session, message) => {
                session.cacheUpdateAssetMessage(message);
                return message;
            } }) }),
    // ========================================================================
    'assets-loaded': Object.assign({}, ClientOnlyRule, { session: Object.assign({}, ClientOnlyRule.session, { beforeReceiveFromClient: (session, client, message) => {
                if (client.authoritative) {
                    return message;
                }
                else if (message.payload.failureMessage && message.payload.failureMessage.length) {
                    // TODO: Propagate to app as a general failure message once
                    // we have created the error event handler message path.
                }
            } }) }),
    // ========================================================================
    'collision-event-raised': Object.assign({}, ClientOnlyRule),
    // ========================================================================
    'create-animation': Object.assign({}, exports.DefaultRule, { synchronization: {
            stage: 'create-animations',
            before: 'ignore',
            during: 'allow',
            after: 'allow'
        }, client: Object.assign({}, exports.DefaultRule.client, { shouldSendToUser: (message, userId, session, client) => {
                const exclusiveUser = session.actorSet[message.payload.actorId].exclusiveToUser;
                return exclusiveUser ? exclusiveUser === userId : null;
            } }), session: Object.assign({}, exports.DefaultRule.session, { beforeReceiveFromApp: (session, message) => {
                const syncActor = session.actorSet[message.payload.actorId];
                if (syncActor) {
                    const enabled = message.payload.initialState && !!message.payload.initialState.enabled;
                    syncActor.createdAnimations = syncActor.createdAnimations || [];
                    syncActor.createdAnimations.push({ message, enabled });
                }
                return message;
            } }) }),
    // ========================================================================
    'create-asset': Object.assign({}, exports.DefaultRule, { synchronization: {
            stage: 'load-assets',
            before: 'ignore',
            during: 'queue',
            after: 'allow'
        }, session: Object.assign({}, exports.DefaultRule.session, { beforeReceiveFromApp: (session, message) => {
                session.cacheCreateAssetMessage(message);
                return message;
            } }) }),
    // ========================================================================
    'create-empty': CreateActorRule,
    // ========================================================================
    'create-from-gltf': CreateActorRule,
    // ========================================================================
    'create-from-library': CreateActorRule,
    // ========================================================================
    'create-primitive': CreateActorRule,
    // ========================================================================
    'create-from-prefab': CreateActorRule,
    // ========================================================================
    'destroy-actors': Object.assign({}, exports.DefaultRule, { synchronization: {
            stage: 'create-actors',
            before: 'ignore',
            during: 'queue',
            after: 'allow'
        }, session: Object.assign({}, exports.DefaultRule.session, { beforeReceiveFromApp: (session, message) => {
                for (const actorId of message.payload.actorIds) {
                    delete session.actorSet[actorId];
                }
                return message;
            } }) }),
    // ========================================================================
    'engine2app-rpc': ClientOnlyRule,
    // ========================================================================
    'handshake': ClientOnlyRule,
    // ========================================================================
    'handshake-complete': ClientOnlyRule,
    // ========================================================================
    'handshake-reply': Object.assign({}, exports.DefaultRule, { synchronization: {
            stage: 'always',
            before: 'error',
            during: 'error',
            after: 'error'
        } }),
    // ========================================================================
    'heartbeat': Object.assign({}, exports.DefaultRule, { synchronization: {
            stage: 'always',
            before: 'allow',
            during: 'allow',
            after: 'allow',
        } }),
    // ========================================================================
    'heartbeat-reply': ClientOnlyRule,
    // ========================================================================
    'interpolate-actor': Object.assign({}, exports.DefaultRule, { synchronization: {
            stage: 'create-animations',
            before: 'queue',
            during: 'allow',
            after: 'allow'
        }, client: Object.assign({}, exports.DefaultRule.client, { shouldSendToUser: (message, userId, session, client) => {
                const exclusiveUser = session.actorSet[message.payload.actorId].exclusiveToUser;
                return exclusiveUser ? exclusiveUser === userId : null;
            } }), session: Object.assign({}, exports.DefaultRule.session, { beforeReceiveFromApp: (session, message) => {
                const syncActor = session.actorSet[message.payload.actorId];
                if (syncActor) {
                    syncActor.activeInterpolations = syncActor.activeInterpolations || [];
                    syncActor.activeInterpolations.push(deepmerge_1.default({}, message.payload));
                }
                return message;
            } }) }),
    // ========================================================================
    'load-assets': Object.assign({}, exports.DefaultRule, { synchronization: {
            stage: 'load-assets',
            before: 'ignore',
            during: 'queue',
            after: 'allow'
        }, session: Object.assign({}, exports.DefaultRule.session, { beforeReceiveFromApp: (session, message) => {
                session.cacheCreateAssetMessage(message);
                return message;
            } }) }),
    // ========================================================================
    'multi-operation-result': ClientOnlyRule,
    // ========================================================================
    'object-spawned': Object.assign({}, ClientOnlyRule, { session: Object.assign({}, exports.DefaultRule.session, { beforeReceiveFromClient: (session, client, message) => {
                // Check that this is the authoritative client
                const exclusiveUser = session.actorSet[message.payload.actors[0].id].exclusiveToUser;
                if (client.authoritative || client.userId && client.userId === exclusiveUser) {
                    // Create local representations of the actors.
                    for (const spawned of message.payload.actors) {
                        session.cacheInitializeActorMessage({
                            payload: {
                                type: 'actor-update',
                                actor: spawned
                            }
                        });
                    }
                    // Allow the message to propagate to the app.
                    return message;
                }
            } }) }),
    // ========================================================================
    'operation-result': Object.assign({}, ClientOnlyRule, { session: Object.assign({}, exports.DefaultRule.session) }),
    // ========================================================================
    'perform-action': Object.assign({}, ClientOnlyRule, { session: Object.assign({}, exports.DefaultRule.session, { beforeReceiveFromClient: (session, client, message) => {
                // Store the client id of the client that is performing the grab.
                const payload = message.payload;
                const syncActor = session.actorSet[payload.targetId];
                if (syncActor && payload.actionName.toLowerCase() === 'grab' &&
                    (syncActor.grabbedBy === client.id || syncActor.grabbedBy === undefined)) {
                    syncActor.grabbedBy = payload.actionState === 'started' ? client.id : undefined;
                }
                return message;
            } }) }),
    // ========================================================================
    'rigidbody-add-force': Object.assign({}, exports.DefaultRule, { synchronization: {
            stage: 'create-actors',
            before: 'queue',
            during: 'queue',
            after: 'allow'
        } }),
    // ========================================================================
    'rigidbody-add-force-at-position': Object.assign({}, exports.DefaultRule, { synchronization: {
            stage: 'create-actors',
            before: 'queue',
            during: 'queue',
            after: 'allow'
        } }),
    // ========================================================================
    'rigidbody-add-relative-torque': Object.assign({}, exports.DefaultRule, { synchronization: {
            stage: 'create-actors',
            before: 'queue',
            during: 'queue',
            after: 'allow'
        } }),
    // ========================================================================
    'rigidbody-add-torque': Object.assign({}, exports.DefaultRule, { synchronization: {
            stage: 'create-actors',
            before: 'queue',
            during: 'queue',
            after: 'allow'
        } }),
    // ========================================================================
    'rigidbody-commands': Object.assign({}, exports.DefaultRule, { synchronization: {
            stage: 'create-actors',
            before: 'queue',
            during: 'queue',
            after: 'allow'
        }, client: Object.assign({}, exports.DefaultRule.client, { shouldSendToUser: (message, userId, session, client) => {
                const exclusiveUser = session.actorSet[message.payload.actorId].exclusiveToUser;
                return exclusiveUser ? exclusiveUser === userId : null;
            } }) }),
    // ========================================================================
    'rigidbody-move-position': Object.assign({}, exports.DefaultRule, { synchronization: {
            stage: 'create-actors',
            before: 'queue',
            during: 'queue',
            after: 'allow'
        } }),
    // ========================================================================
    'rigidbody-move-rotation': Object.assign({}, exports.DefaultRule, { synchronization: {
            stage: 'create-actors',
            before: 'queue',
            during: 'queue',
            after: 'allow'
        } }),
    // ========================================================================
    'set-animation-state': Object.assign({}, exports.DefaultRule, { synchronization: {
            stage: 'create-animations',
            before: 'ignore',
            during: 'queue',
            after: 'allow'
        }, client: Object.assign({}, exports.DefaultRule.client, { shouldSendToUser: (message, userId, session, client) => {
                const exclusiveUser = session.actorSet[message.payload.actorId].exclusiveToUser;
                return exclusiveUser ? exclusiveUser === userId : null;
            } }), session: Object.assign({}, exports.DefaultRule.session, { beforeReceiveFromApp: (session, message) => {
                // If the app enabled or disabled the animation, update our local sync state to match.
                if (message.payload.state.enabled !== undefined) {
                    const syncActor = session.actorSet[message.payload.actorId];
                    if (syncActor) {
                        const animation = session.findAnimation(syncActor, message.payload.animationName);
                        if (animation) {
                            animation.enabled = message.payload.state.enabled;
                        }
                    }
                }
                return message;
            }, beforeReceiveFromClient: (session, client, message) => {
                // Check that this is the authoritative client
                const exclusiveUser = session.actorSet[message.payload.actorId].exclusiveToUser;
                if (client.authoritative || client.userId && client.userId === exclusiveUser) {
                    // Check that the actor exists.
                    const syncActor = session.actorSet[message.payload.actorId];
                    if (syncActor) {
                        // If the animation was disabled on the client, notify other clients and also
                        // update our local sync state.
                        if (message.payload.state.enabled !== undefined && !message.payload.state.enabled) {
                            const createdAnimation = (syncActor.createdAnimations || []).filter(item => item.message.payload.animationName === message.payload.animationName).shift();
                            if (createdAnimation) {
                                createdAnimation.enabled = message.payload.state.enabled;
                                // Propagate to other clients.
                                session.sendToClients(message, (value) => value.id !== client.id);
                            }
                            // Remove the completed interpolation.
                            syncActor.activeInterpolations =
                                (syncActor.activeInterpolations || []).filter(item => item.animationName !== message.payload.animationName);
                        }
                    }
                    // Allow the message to propagate to the app.
                    return message;
                }
            } }) }),
    // ========================================================================
    'set-authoritative': Object.assign({}, exports.DefaultRule, { synchronization: {
            stage: 'always',
            before: 'error',
            during: 'error',
            after: 'error'
        } }),
    // ========================================================================
    'set-behavior': Object.assign({}, exports.DefaultRule, { synchronization: {
            stage: 'set-behaviors',
            before: 'ignore',
            during: 'allow',
            after: 'allow'
        }, client: Object.assign({}, exports.DefaultRule.client, { shouldSendToUser: (message, userId, session, client) => {
                const exclusiveUser = session.actorSet[message.payload.actorId].exclusiveToUser;
                return exclusiveUser ? exclusiveUser === userId : null;
            } }), session: Object.assign({}, exports.DefaultRule.session, { beforeReceiveFromApp: (session, message) => {
                const syncActor = session.actorSet[message.payload.actorId];
                if (syncActor) {
                    syncActor.behavior = message.payload.behaviorType;
                }
                else {
                    console.log(`[ERROR] Sync: set-behavior on unknown actor ${message.payload.actorId}`);
                }
                return message;
            } }) }),
    // ========================================================================
    'set-sound-state': Object.assign({}, exports.DefaultRule, { synchronization: {
            stage: 'active-sound-instances',
            before: 'ignore',
            during: 'queue',
            after: 'allow'
        }, client: Object.assign({}, exports.DefaultRule.client, { shouldSendToUser: (message, userId, session, client) => {
                const exclusiveUser = session.actorSet[message.payload.actorId].exclusiveToUser;
                return exclusiveUser ? exclusiveUser === userId : null;
            } }), session: Object.assign({}, exports.DefaultRule.session, { beforeReceiveFromApp: (session, message) => {
                const syncActor = session.actorSet[message.payload.actorId];
                if (syncActor) {
                    syncActor.activeSoundInstances = syncActor.activeSoundInstances || [];
                    const basisTime = Date.now() / 1000.0;
                    if (message.payload.soundCommand === sound_1.SoundCommand.Start) {
                        syncActor.activeSoundInstances.push({ message, basisTime });
                    }
                    else {
                        // find the existing message that needs to be updated
                        const activeSoundInstance = syncActor.activeSoundInstances.filter(item => item.message.payload.id === message.payload.id).shift();
                        // if sound expired then skip this message completely
                        if (!activeSoundInstance) {
                            return undefined;
                        }
                        // Remove the existing sound instance (we'll add an updated one below).
                        syncActor.activeSoundInstances =
                            syncActor.activeSoundInstances.filter(item => item.message.payload.id !== message.payload.id);
                        // store the updated sound instance if sound isn't stopping
                        if (message.payload.soundCommand !== sound_1.SoundCommand.Stop) {
                            // update startimeoffset and update basistime in oldmessage.
                            const targetTime = Date.now() / 1000.0;
                            if (activeSoundInstance.message.payload.options.paused !== true) {
                                let timeOffset = (targetTime - activeSoundInstance.basisTime);
                                if (activeSoundInstance.message.payload.options.pitch !== undefined) {
                                    timeOffset *= Math.pow(2.0, (activeSoundInstance.message.payload.options.pitch / 12.0));
                                }
                                if (activeSoundInstance.message.payload.startTimeOffset === undefined) {
                                    activeSoundInstance.message.payload.startTimeOffset = 0.0;
                                }
                                activeSoundInstance.message.payload.startTimeOffset += timeOffset;
                            }
                            // merge existing message and new message
                            activeSoundInstance.message.payload.options = Object.assign({}, activeSoundInstance.message.payload.options, message.payload.options);
                            syncActor.activeSoundInstances.push({ message: activeSoundInstance.message, basisTime });
                        }
                    }
                }
                return message;
            } }) }),
    // ========================================================================
    'sync-animations': Object.assign({}, exports.DefaultRule, { synchronization: {
            stage: 'sync-animations',
            before: 'error',
            during: 'allow',
            after: 'error'
        } }),
    // ========================================================================
    'sync-complete': Object.assign({}, exports.DefaultRule, { synchronization: {
            stage: 'always',
            before: 'error',
            during: 'error',
            after: 'allow'
        } }),
    // ========================================================================
    'sync-request': ClientOnlyRule,
    // ========================================================================
    'transform-payload': Object.assign({}, exports.DefaultRule, { synchronization: {
            stage: 'always',
            before: 'allow',
            during: 'allow',
            after: 'allow'
        }, client: Object.assign({}, exports.DefaultRule.client, { shouldSendToUser: (message, userId, session, client) => {
                const exclusiveUser = message.payload.userId;
                return exclusiveUser ? exclusiveUser !== userId : null;
            } }), session: Object.assign({}, exports.DefaultRule.session, { beforeReceiveFromClient: (session, client, message) => {
                // Sync the change to the other clients.
                session.sendPayloadToClients(message.payload, (value) => value.id !== client.id);
                return undefined;
            } }) }),
    // ========================================================================
    'traces': ClientOnlyRule,
    // ========================================================================
    'trigger-event-raised': Object.assign({}, ClientOnlyRule),
    // ========================================================================
    'user-joined': Object.assign({}, ClientOnlyRule, { session: Object.assign({}, ClientOnlyRule.session, { beforeReceiveFromClient: (session, client, message) => {
                // Add remote ip address to the joining user.
                const props = message.payload.user.properties = message.payload.user.properties || {};
                if (client.conn instanceof __1.WebSocket && !props.remoteAddress) {
                    props.remoteAddress = client.conn.remoteAddress;
                }
                return message;
            } }) }),
    // ========================================================================
    'user-left': ClientOnlyRule,
    // ========================================================================
    'user-update': Object.assign({}, exports.DefaultRule, { session: Object.assign({}, exports.DefaultRule.session, { beforeReceiveFromApp: (session, message) => {
                const client = session.clients.find(c => c.userId === message.payload.user.id);
                if (client) {
                    client.send(message);
                }
                return null;
            } }) })
};
//# sourceMappingURL=rules.js.map