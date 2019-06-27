"use strict";
/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const _1 = require(".");
/**
 * Button behavior class containing the target behavior actions.
 */
class ButtonBehavior extends _1.TargetBehavior {
    constructor() {
        super(...arguments);
        // tslint:disable:variable-name
        this._hover = new _1.DiscreteAction();
        this._click = new _1.DiscreteAction();
        this._button = new _1.DiscreteAction();
    }
    // tslint:enable:variable-name
    /** @inheritdoc */
    get behaviorType() { return 'button'; }
    get hover() { return this._hover; }
    get click() { return this._click; }
    get button() { return this._button; }
    /**
     * Add a hover handler to be called when the given hover state is triggered.
     * @param hoverState The hover state to fire the handler on.
     * @param handler The handler to call when the hover state is triggered.
     * @return This button behavior.
     */
    onHover(hoverState, handler) {
        const actionState = (hoverState === 'enter') ? 'started' : 'stopped';
        this._hover.on(actionState, handler);
        return this;
    }
    /**
     * Add a click handler to be called when the given click state is triggered.
     * @param handler The handler to call when the click state is triggered.
     * @return This button behavior.
     */
    onClick(handler) {
        this._click.on('started', handler);
        return this;
    }
    /**
     * Add a button handler to be called when a complete button click has occured.
     * @param buttonState The button state to fire the handler on.
     * @param handler The handler to call when the click state is triggered.
     * @return This button behavior.
     */
    onButton(buttonState, handler) {
        const actionState = (buttonState === 'pressed') ? 'started' : 'stopped';
        this._button.on(actionState, handler);
        return this;
    }
    /**
     * Gets whether the button is being hovered over by the given user, or at all if no user id is given.
     * @param user The user to check whether they are hovering over this button behavior.
     * @return True if the user is hovering over, false if not.  In the case where no user id is given, this
     * returns true if any user is hovering over, false if none are.
     */
    isHoveredOver(user) {
        return this._hover.isActive(user);
    }
    /**
     * Gets whether the button is being clicked by the given user, or at all if no user id is given.
     * @param user The user to check whether they are clicking this button behavior.
     * @return True if the user is clicking, false if not.  In the case where no user id is given, this
     * returns true if any user is clicking, false if none are.
     */
    isClicked(user) {
        return this._click.isActive(user);
    }
}
exports.ButtonBehavior = ButtonBehavior;
//# sourceMappingURL=buttonBehavior.js.map