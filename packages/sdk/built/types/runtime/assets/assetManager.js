"use strict";
/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const v4_1 = __importDefault(require("uuid/v4"));
const _1 = require(".");
const resolveJsonValues_1 = __importDefault(require("../../../utils/resolveJsonValues"));
const forwardPromise_1 = require("../../forwardPromise");
// tslint:disable-next-line:variable-name
const ManualId = '__manual__';
/**
 * A per-context singleton that manages all of an app's assets. Create a new asset group
 * by calling a load method (e.g. [[loadGltf]]), view the group's assets via [[groups]],
 * and use the assets by ID on actors (e.g. [[Actor.CreateFromPrefab]]).
 */
class AssetManager {
    // tslint:enable:variable-name
    /** @hidden */
    constructor(context) {
        this.context = context;
        // tslint:disable:variable-name
        this._assets = {};
        this._groups = {};
        this._ready = Promise.resolve();
        this._loadAssetPromises = {};
        this._groups[ManualId] = new _1.AssetGroup(ManualId, null);
    }
    cleanup() {
    }
    /** Fetch a group by name. */
    get groups() { return Object.freeze(Object.assign({}, this._groups)); }
    /** Get the group of individually-created assets */
    get manualGroup() { return this._groups[ManualId]; }
    /** Fetch an asset by id. */
    get assets() { return Object.freeze(Object.assign({}, this._assets)); }
    /**
     * @returns A promise that resolves when all pending asset load requests have been
     * settled, successfully or otherwise. Listen to the individual load promises to
     * catch failures.
     */
    get ready() { return this._ready; }
    /**
     * Generate a new material
     * @param name The new material's name
     * @param definition The initial material properties
     */
    createMaterial(name, definition) {
        return this.sendCreateAsset(new _1.Material(this, {
            id: v4_1.default(),
            name,
            material: resolveJsonValues_1.default(definition)
        }));
    }
    /**
     * Load an image file and generate a new texture asset
     * @param name The new texture's name
     * @param definition The initial texture properties. The `uri` property is required.
     */
    createTexture(name, definition) {
        return this.sendCreateAsset(new _1.Texture(this, {
            id: v4_1.default(),
            name,
            texture: resolveJsonValues_1.default(definition)
        }));
    }
    /**
     * Load an audio file and generate a new sound asset
     * @param name The new sound's name
     * @param definition The initial sound properties. The `uri` property is required.
     */
    createSound(name, definition) {
        return this.sendCreateAsset(new _1.Sound(this, {
            id: v4_1.default(),
            name,
            sound: resolveJsonValues_1.default(definition)
        }));
    }
    sendCreateAsset(asset) {
        this.manualGroup.add(asset);
        this._assets[asset.id] = asset;
        this.enqueueLoadAssetPromise(asset.id, {
            resolve: () => { },
            reject: () => { },
        });
        const promise = this.sendLoadAssetsPayload({
            type: 'create-asset',
            definition: resolveJsonValues_1.default(asset)
        })
            .then(payload => {
            if (payload.failureMessage || payload.assets.length !== 1) {
                this.notifyAssetLoaded(asset.id, false, payload.failureMessage);
                return Promise.reject(`Creation/Loading of asset ${asset.name} failed: ${payload.failureMessage}`);
            }
            this.notifyAssetLoaded(asset.id, true);
            return asset.copy(payload.assets[0]);
        });
        this.registerLoadPromise(promise);
        return forwardPromise_1.createForwardPromise(asset, promise);
    }
    unloadAsset(asset) {
    }
    notifyAssetLoaded(assetId, success, reason) {
        if (!!this._loadAssetPromises && !!this._loadAssetPromises[assetId]) {
            const loadAssetPromises = this._loadAssetPromises[assetId].splice(0);
            delete this._loadAssetPromises[assetId];
            for (const promise of loadAssetPromises) {
                if (success) {
                    promise.resolve();
                }
                else {
                    promise.reject(reason);
                }
            }
        }
    }
    enqueueLoadAssetPromise(assetId, promise) {
        if (!this._loadAssetPromises[assetId]) {
            this._loadAssetPromises[assetId] = [];
        }
        this._loadAssetPromises[assetId].push(promise);
    }
    /**
     * A promise that resolves when a specific asset has settled, successfully or otherwise
     * @param assetId The asset's id
     */
    assetLoaded(assetId) {
        if (!this._loadAssetPromises || !this._loadAssetPromises[assetId]) {
            return Promise.resolve();
        }
        else {
            return new Promise((resolve, reject) => this.enqueueLoadAssetPromise(assetId, { resolve, reject }));
        }
    }
    /**
     * Load the assets in a glTF model by URL, and populate a new group with the result.
     * @param groupName The name of the group to create.
     * @param uri The URI to a glTF model.
     * @returns The promise of a new asset group.
     */
    loadGltf(groupName, uri, colliderType = 'none') {
        const p = this.loadGltfHelper(groupName, uri, colliderType);
        this.registerLoadPromise(p);
        return p;
    }
    async loadGltfHelper(groupName, uri, colliderType) {
        const id = v4_1.default();
        this.enqueueLoadAssetPromise(id, {
            resolve: () => { },
            reject: () => { },
        });
        let group;
        if (this.groups[groupName]) {
            group = this.groups[groupName];
            if (group.source.containerType === 'gltf' && group.source.uri === uri) {
                return group;
            }
            else {
                throw new Error(`Group name ${groupName} is already in use. Unload the old group, or choose a different name.`);
            }
        }
        group = new _1.AssetGroup(groupName, {
            containerType: 'gltf',
            uri
        });
        this._groups[groupName] = group;
        const payload = {
            type: 'load-assets',
            source: group.source,
            colliderType
        };
        const response = await this.sendLoadAssetsPayload(payload);
        if (response.failureMessage) {
            this.notifyAssetLoaded(id, false, response.failureMessage);
            throw new Error(response.failureMessage);
        }
        for (const def of response.assets) {
            def.source = group.source;
            const asset = _1.Asset.Parse(this, def);
            group.add(asset);
            this._assets[def.id] = asset;
        }
        this.notifyAssetLoaded(id, true);
        return group;
    }
    registerLoadPromise(promise) {
        const ignoreFailure = promise
            .then(() => Promise.resolve())
            .catch(() => Promise.resolve());
        this._ready = this._ready.then(() => ignoreFailure);
    }
    sendLoadAssetsPayload(payload) {
        return new Promise((resolve, reject) => {
            this.context.internal.protocol.sendPayload(payload, { resolve, reject });
        });
    }
}
exports.AssetManager = AssetManager;
//# sourceMappingURL=assetManager.js.map