/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { Asset, AssetGroup, Material, MaterialLike, Sound, SoundLike, Texture, TextureLike } from '.';
import { Context } from '..';
import { ForwardPromise } from '../../forwardPromise';
import { CreateColliderType } from '../../network/payloads';
/**
 * A per-context singleton that manages all of an app's assets. Create a new asset group
 * by calling a load method (e.g. [[loadGltf]]), view the group's assets via [[groups]],
 * and use the assets by ID on actors (e.g. [[Actor.CreateFromPrefab]]).
 */
export declare class AssetManager {
    context: Context;
    private _assets;
    private _groups;
    private _ready;
    private _loadAssetPromises;
    /** @hidden */
    constructor(context: Context);
    cleanup(): void;
    /** Fetch a group by name. */
    readonly groups: Readonly<{
        [x: string]: AssetGroup;
    }>;
    /** Get the group of individually-created assets */
    readonly manualGroup: AssetGroup;
    /** Fetch an asset by id. */
    readonly assets: Readonly<{
        [x: string]: Asset;
    }>;
    /**
     * @returns A promise that resolves when all pending asset load requests have been
     * settled, successfully or otherwise. Listen to the individual load promises to
     * catch failures.
     */
    readonly ready: Promise<void>;
    /**
     * Generate a new material
     * @param name The new material's name
     * @param definition The initial material properties
     */
    createMaterial(name: string, definition: Partial<MaterialLike>): ForwardPromise<Material>;
    /**
     * Load an image file and generate a new texture asset
     * @param name The new texture's name
     * @param definition The initial texture properties. The `uri` property is required.
     */
    createTexture(name: string, definition: Partial<TextureLike>): ForwardPromise<Texture>;
    /**
     * Load an audio file and generate a new sound asset
     * @param name The new sound's name
     * @param definition The initial sound properties. The `uri` property is required.
     */
    createSound(name: string, definition: Partial<SoundLike>): ForwardPromise<Sound>;
    private sendCreateAsset;
    unloadAsset<T extends Asset>(asset: T): void;
    private notifyAssetLoaded;
    private enqueueLoadAssetPromise;
    /**
     * A promise that resolves when a specific asset has settled, successfully or otherwise
     * @param assetId The asset's id
     */
    assetLoaded(assetId: string): Promise<void>;
    /**
     * Load the assets in a glTF model by URL, and populate a new group with the result.
     * @param groupName The name of the group to create.
     * @param uri The URI to a glTF model.
     * @returns The promise of a new asset group.
     */
    loadGltf(groupName: string, uri: string, colliderType?: CreateColliderType): Promise<AssetGroup>;
    private loadGltfHelper;
    private registerLoadPromise;
    private sendLoadAssetsPayload;
}
//# sourceMappingURL=assetManager.d.ts.map