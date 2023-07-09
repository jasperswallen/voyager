import styled from "@emotion/styled";
import {
  ActionSheetButton,
  IonActionSheet,
  IonIcon,
  IonLabel,
  IonList,
  IonToggle,
} from "@ionic/react";
import {
  arrowBackOutline,
  arrowForwardOutline,
  chevronBackOutline,
  chevronForwardOutline,
} from "ionicons/icons";
import {
  CommentSwipeGestures,
  DirectionalGestureFactory,
  InboxSwipeGestures,
  OCommentSwipeGestures,
  OInboxSwipeGestures,
  OPostSwipeGestures,
  PostSwipeGestures,
  SwipeGestures,
  setLeftCommentGesture,
  setLeftInboxGesture,
  setLeftPostGesture,
  setLeftSwipeEnabled,
  setRightCommentGesture,
  setRightInboxGesture,
  setRightPostGesture,
  setRightSwipeEnabled,
  setShortLeftCommentGesture,
  setShortLeftInboxGesture,
  setShortLeftPostGesture,
  setShortRightCommentGesture,
  setShortRightInboxGesture,
  setShortRightPostGesture,
} from "../settingsSlice";
import { IonActionSheetCustomEvent, OverlayEventDetail } from "@ionic/core";
import { Dispatch, SetStateAction, useState } from "react";
import { startCase } from "lodash";
import { InsetIonItem } from "../../user/Profile";
import { useAppDispatch, useAppSelector } from "../../../store";

const ListHeader = styled.div`
  font-size: 0.8em;
  margin: 32px 0 -8px 32px;
  text-transform: uppercase;
  color: var(--ion-color-medium);
`;

type SwipeSettingsCallbacks<
  T extends CommentSwipeGestures | PostSwipeGestures | InboxSwipeGestures
> = DirectionalGestureFactory<(gesture: T) => void>;

type OpenState = DirectionalGestureFactory<
  [boolean, Dispatch<SetStateAction<boolean>>]
>;

const DIRECTION_OPTIONS: DirectionalGestureFactory<string> = {
  shortLeft: "Short Left",
  left: "Left",
  shortRight: "Short Right",
  right: "Right",
};

const DIRECTION_ICONS: DirectionalGestureFactory<string> = {
  shortLeft: chevronForwardOutline,
  left: arrowForwardOutline,
  shortRight: chevronBackOutline,
  right: arrowBackOutline,
};

/**
 * For every direction ([short] left, [short] right), create an action sheet.
 *
 * Each of these action sheets will contain the possible actions when a swipe in that direction is
 * triggered (upvote, downvote, reply, ...).
 *
 * @param possibleActions The actions that may be selected at any direction.
 * @param currentActions The actions that are currently set, for each direction.
 * @param swipeSettingsCallbacks The callback to set an action's setting, for each direction.
 * @returns
 */
function createActionSheets<
  T extends CommentSwipeGestures | PostSwipeGestures | InboxSwipeGestures
>(
  possibleActions:
    | typeof OCommentSwipeGestures
    | typeof OPostSwipeGestures
    | typeof OInboxSwipeGestures,
  currentActions: SwipeGestures<T>,
  swipeSettingsCallbacks: SwipeSettingsCallbacks<T>,
  openState: OpenState,
  leftSwipeEnabled: boolean,
  rightSwipeEnabled: boolean
) {
  let ionActionSheets: JSX.Element[] = [];

  for (const direction in DIRECTION_OPTIONS) {
    /* direction=shortLeft | left | ... */
    const directionKey = direction as keyof DirectionalGestureFactory;
    if (
      ((directionKey === "left" || directionKey === "shortLeft") &&
        !leftSwipeEnabled) ||
      ((directionKey === "right" || directionKey === "shortRight") &&
        !rightSwipeEnabled)
    ) {
      /* Don't make an action sheet if the swipe direction is disabled. */
      continue;
    }

    const directionTitle = DIRECTION_OPTIONS[directionKey];
    const directionIcon = DIRECTION_ICONS[directionKey];
    const currentAction = currentActions[directionKey];
    const swipeSettingsCallback = swipeSettingsCallbacks[directionKey];

    let directionButtons: ActionSheetButton<T>[] = [];

    for (const possibleAction in possibleActions) {
      /* possibleAction=Upvote | Downvote | ... */
      const possibleActionKey = possibleAction as keyof typeof possibleActions;
      const possibleActionSettings = possibleActions[possibleActionKey] as T;

      directionButtons.push({
        text: possibleAction,
        data: possibleActionSettings,
      });
    }

    const [open, setOpen] = openState[directionKey];
    ionActionSheets.push(
      <InsetIonItem button onClick={() => setOpen(true)} key={directionKey}>
        <IonIcon aria-hidden="true" icon={directionIcon} />
        <IonLabel>{directionTitle}</IonLabel>
        <IonLabel slot="end" color="medium">
          {startCase(currentAction)}
        </IonLabel>
        <IonActionSheet
          cssClass="left-align-buttons"
          isOpen={open}
          onDidDismiss={() => setOpen(false)}
          onWillDismiss={(
            e: IonActionSheetCustomEvent<OverlayEventDetail<T>>
          ) => {
            if (e.detail.data) {
              swipeSettingsCallback(e.detail.data);
            }
          }}
          header={directionTitle}
          buttons={directionButtons.map((b) => ({
            ...b,
            role: currentAction === b.data ? "selected" : undefined,
          }))}
        />
      </InsetIonItem>
    );
  }

  return ionActionSheets;
}

export function SwipeSetting() {
  return (
    <>
      <ListHeader>
        <IonLabel>Gestures</IonLabel>
      </ListHeader>
      <IonList inset>
        <InsetIonItem routerLink="/settings/appearance/swipe">
          <IonLabel>Swipe Gestures</IonLabel>
        </InsetIonItem>
      </IonList>
    </>
  );
}

export default function Swipe() {
  const dispatch = useAppDispatch();
  const {
    leftSwipeEnabled,
    rightSwipeEnabled,
    commentActions,
    postActions,
    inboxActions,
  } = useAppSelector((state) => state.settings.appearance.swipe);

  const commentActionSheets = createActionSheets<CommentSwipeGestures>(
    OCommentSwipeGestures,
    commentActions,
    {
      shortLeft: (gesture) => {
        dispatch(setShortLeftCommentGesture(gesture));
      },
      left: (gesture) => {
        dispatch(setLeftCommentGesture(gesture));
      },
      shortRight: (gesture) => {
        dispatch(setShortRightCommentGesture(gesture));
      },
      right: (gesture) => {
        dispatch(setRightCommentGesture(gesture));
      },
    },
    {
      shortLeft: useState(false),
      left: useState(false),
      shortRight: useState(false),
      right: useState(false),
    },
    leftSwipeEnabled,
    rightSwipeEnabled
  );

  const postActionSheets = createActionSheets<PostSwipeGestures>(
    OPostSwipeGestures,
    postActions,
    {
      shortLeft: (gesture) => {
        dispatch(setShortLeftPostGesture(gesture));
      },
      left: (gesture) => {
        dispatch(setLeftPostGesture(gesture));
      },
      shortRight: (gesture) => {
        dispatch(setShortRightPostGesture(gesture));
      },
      right: (gesture) => {
        dispatch(setRightPostGesture(gesture));
      },
    },
    {
      shortLeft: useState(false),
      left: useState(false),
      shortRight: useState(false),
      right: useState(false),
    },
    leftSwipeEnabled,
    rightSwipeEnabled
  );

  const inboxActionSheets = createActionSheets<InboxSwipeGestures>(
    OInboxSwipeGestures,
    inboxActions,
    {
      shortLeft: (gesture) => {
        dispatch(setShortLeftInboxGesture(gesture));
      },
      left: (gesture) => {
        dispatch(setLeftInboxGesture(gesture));
      },
      shortRight: (gesture) => {
        dispatch(setShortRightInboxGesture(gesture));
      },
      right: (gesture) => {
        dispatch(setRightInboxGesture(gesture));
      },
    },
    {
      shortLeft: useState(false),
      left: useState(false),
      shortRight: useState(false),
      right: useState(false),
    },
    leftSwipeEnabled,
    rightSwipeEnabled
  );

  return (
    <>
      <ListHeader>
        <IonLabel>Global Enable/Disable</IonLabel>
      </ListHeader>
      <IonList inset>
        <InsetIonItem>
          <IonIcon aria-hidden="true" icon={DIRECTION_ICONS.left} />
          <IonLabel>Enable Left Swipes</IonLabel>
          <IonToggle
            checked={leftSwipeEnabled}
            onIonChange={(e) => dispatch(setLeftSwipeEnabled(e.detail.checked))}
          >
            Left Swipes
          </IonToggle>
        </InsetIonItem>
        <InsetIonItem>
          <IonIcon aria-hidden="true" icon={DIRECTION_ICONS.right} />
          <IonLabel>Enable Right Swipes</IonLabel>
          <IonToggle
            checked={rightSwipeEnabled}
            onIonChange={(e) =>
              dispatch(setRightSwipeEnabled(e.detail.checked))
            }
          >
            Right Swipes
          </IonToggle>
        </InsetIonItem>
      </IonList>
      <ListHeader>
        <IonLabel>Comments</IonLabel>
      </ListHeader>
      <IonList inset>{commentActionSheets} </IonList>
      <ListHeader>
        <IonLabel>Posts</IonLabel>
      </ListHeader>
      <IonList inset>{postActionSheets} </IonList>
      <ListHeader>
        <IonLabel>Inbox</IonLabel>
      </ListHeader>
      <IonList inset>{inboxActionSheets} </IonList>
    </>
  );
}
