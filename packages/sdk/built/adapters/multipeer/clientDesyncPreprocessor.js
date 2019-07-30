"use strict";
/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const _1 = require(".");
/**
 * Filter user-exclusive actors to a queue, then flush them after user-join
 * @hidden
 */
class ClientDesyncPreprocessor {
    constructor(client) {
        this.client = client;
    }
    /** @hidden */
    beforeSend(message, promise) {
        const payloadType = message.payload.type;
        const rule = _1.Rules[payloadType] || _1.MissingRule;
        const forUser = rule.client.shouldSendToUser(message, this.client.userId, this.client.session, this.client);
        if (forUser !== null && !this.client.userId) {
            // this message is user-exclusive, and the client's user ID is not yet settled,
            // queue and cancel send for now
            this.client.userExclusiveMessages.push({ message, promise });
        }
        else if (forUser === null || forUser === true && !!this.client.userId) {
            // this message is intended for this client's user, send now
            return message;
        }
        // this message is intended for a different user, discard
    }
    /** @hidden */
    beforeRecv(message) {
        if (message.payload.type === 'user-joined') {
            const userJoin = message.payload;
            this.client.userId = userJoin.user.id;
            while (this.client.userExclusiveMessages.length > 0) {
                const queuedMsg = this.client.userExclusiveMessages.splice(0, 1)[0];
                this.client.send(queuedMsg.message, queuedMsg.promise);
            }
        }
        return message;
    }
}
exports.ClientDesyncPreprocessor = ClientDesyncPreprocessor;
//# sourceMappingURL=clientDesyncPreprocessor.js.map