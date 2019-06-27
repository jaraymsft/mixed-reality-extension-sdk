/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
/// <reference types="node" />
import { EventEmitter } from 'events';
import { Session } from '.';
import { Connection, Message } from '../..';
import * as Protocols from '../../protocols';
import * as Payloads from '../../types/network/payloads';
import { ExportedPromise } from '../../utils/exportedPromise';
/**
 * @hidden
 */
export declare type QueuedMessage = {
    message: Message;
    promise?: ExportedPromise;
};
/**
 * @hidden
 * Class representing a connection to an engine client
 */
export declare class Client extends EventEmitter {
    private _conn;
    private static orderSequence;
    private _id;
    private _session;
    private _protocol;
    private _order;
    private _queuedMessages;
    private _userExclusiveMessages;
    private _authoritative;
    readonly id: string;
    readonly order: number;
    readonly protocol: Protocols.Protocol;
    readonly session: Session;
    readonly conn: Connection;
    readonly authoritative: boolean;
    readonly queuedMessages: QueuedMessage[];
    readonly userExclusiveMessages: QueuedMessage[];
    userId: string;
    /**
     * Creates a new Client instance
     */
    constructor(_conn: Connection);
    setAuthoritative(value: boolean): void;
    /**
     * Syncs state with the client
     */
    join(session: Session): Promise<void>;
    leave(): void;
    isJoined(): boolean;
    send(message: Message, promise?: ExportedPromise): void;
    sendPayload(payload: Partial<Payloads.Payload>, promise?: ExportedPromise): void;
    queueMessage(message: Message, promise?: ExportedPromise): void;
    filterQueuedMessages(callbackfn: (value: QueuedMessage) => any): QueuedMessage[];
}
//# sourceMappingURL=client.d.ts.map