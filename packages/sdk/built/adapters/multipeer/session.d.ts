/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
/// <reference types="node" />
import { EventEmitter } from 'events';
import { Client, InitializeActorMessage, SyncActor } from '.';
import { Connection, Message, UserLike } from '../..';
import * as Protocols from '../../protocols';
import * as Payloads from '../../types/network/payloads';
/**
 * @hidden
 * Class for associating multiple client connections with a single app session.
 */
export declare class Session extends EventEmitter {
    private _conn;
    private _sessionId;
    private _peerAuthoritative;
    private _clientSet;
    private _actorSet;
    private _assets;
    private _assetUpdateSet;
    private _userSet;
    private _protocol;
    readonly conn: Connection;
    readonly sessionId: string;
    readonly protocol: Protocols.Protocol;
    readonly clients: Client[];
    readonly actors: Partial<SyncActor>[];
    readonly assets: Message<Payloads.LoadAssets | Payloads.CreateAsset>[];
    readonly assetUpdates: Partial<Payloads.AssetUpdate>[];
    readonly rootActors: Partial<SyncActor>[];
    readonly users: Partial<UserLike>[];
    readonly authoritativeClient: Client;
    readonly peerAuthoritative: boolean;
    readonly actorSet: {
        [id: string]: Partial<SyncActor>;
    };
    readonly assetUpdateSet: {
        [id: string]: Partial<Payloads.AssetUpdate>;
    };
    readonly userSet: {
        [id: string]: Partial<UserLike>;
    };
    client: (clientId: string) => Client;
    actor: (actorId: string) => Partial<SyncActor>;
    user: (userId: string) => Partial<UserLike>;
    childrenOf: (parentId: string) => Partial<SyncActor>[];
    creatableChildrenOf: (parentId: string) => Partial<SyncActor>[];
    /**
     * Creates a new Session instance
     */
    constructor(_conn: Connection, _sessionId: string, _peerAuthoritative: boolean);
    /**
     * Performs handshake and sync with the app
     */
    connect(): Promise<void>;
    disconnect(): void;
    /**
     * Adds the client to the session
     */
    join(client: Client): Promise<void>;
    /**
     * Removes the client from the session
     */
    leave(clientId: string): void;
    private setAuthoritativeClient;
    private recvFromClient;
    private recvFromApp;
    preprocessFromApp(message: Message): Message;
    preprocessFromClient(client: Client, message: Message): Message;
    sendToApp(message: Message): void;
    sendToClients(message: Message, filterFn?: (value: Client, index: number) => any): void;
    sendPayloadToClients(payload: Partial<Payloads.Payload>, filterFn?: (value: Client, index: number) => any): void;
    findAnimation(syncActor: Partial<SyncActor>, animationName: string): import("./syncActor").CreateAnimation;
    isAnimating(syncActor: Partial<SyncActor>): boolean;
    cacheInitializeActorMessage(message: InitializeActorMessage): void;
    cacheActorUpdateMessage(message: Message<Payloads.ActorUpdate>): void;
    cacheCreateAssetMessage(message: Message<Payloads.LoadAssets | Payloads.CreateAsset>): void;
    cacheUpdateAssetMessage(message: Message<Payloads.AssetUpdate>): void;
}
//# sourceMappingURL=session.d.ts.map