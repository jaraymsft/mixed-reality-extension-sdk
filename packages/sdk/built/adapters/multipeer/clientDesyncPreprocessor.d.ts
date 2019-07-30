/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { Client } from '.';
import { Message } from '../..';
import { Middleware } from '../../protocols';
import { ExportedPromise } from '../../utils/exportedPromise';
/**
 * Filter user-exclusive actors to a queue, then flush them after user-join
 * @hidden
 */
export declare class ClientDesyncPreprocessor implements Middleware {
    private client;
    constructor(client: Client);
    /** @hidden */
    beforeSend(message: Message, promise?: ExportedPromise): Message;
    /** @hidden */
    beforeRecv(message: Message): Message;
}
//# sourceMappingURL=clientDesyncPreprocessor.d.ts.map