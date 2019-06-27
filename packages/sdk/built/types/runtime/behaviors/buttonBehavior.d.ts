/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { ActionHandler, BehaviorType, DiscreteAction, TargetBehavior } from '.';
import { User } from '..';
/**
 * Button behavior class containing the target behavior actions.
 */
export declare class ButtonBehavior extends TargetBehavior {
    private _hover;
    private _click;
    private _button;
    /** @inheritdoc */
    readonly behaviorType: BehaviorType;
    readonly hover: DiscreteAction;
    readonly click: DiscreteAction;
    readonly button: DiscreteAction;
    /**
     * Add a hover handler to be called when the given hover state is triggered.
     * @param hoverState The hover state to fire the handler on.
     * @param handler The handler to call when the hover state is triggered.
     * @return This button behavior.
     */
    onHover(hoverState: 'enter' | 'exit', handler: ActionHandler): this;
    /**
     * Add a click handler to be called when the given click state is triggered.
     * @param handler The handler to call when the click state is triggered.
     * @return This button behavior.
     */
    onClick(handler: ActionHandler): this;
    /**
     * Add a button handler to be called when a complete button click has occured.
     * @param buttonState The button state to fire the handler on.
     * @param handler The handler to call when the click state is triggered.
     * @return This button behavior.
     */
    onButton(buttonState: 'pressed' | 'released', handler: ActionHandler): this;
    /**
     * Gets whether the button is being hovered over by the given user, or at all if no user id is given.
     * @param user The user to check whether they are hovering over this button behavior.
     * @return True if the user is hovering over, false if not.  In the case where no user id is given, this
     * returns true if any user is hovering over, false if none are.
     */
    isHoveredOver(user?: User): boolean;
    /**
     * Gets whether the button is being clicked by the given user, or at all if no user id is given.
     * @param user The user to check whether they are clicking this button behavior.
     * @return True if the user is clicking, false if not.  In the case where no user id is given, this
     * returns true if any user is clicking, false if none are.
     */
    isClicked(user?: User): boolean;
}
//# sourceMappingURL=buttonBehavior.d.ts.map