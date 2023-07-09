import styled from "@emotion/styled";
import {
  IonActionSheet,
  IonBackButton,
  IonButtons,
  IonHeader,
  IonLabel,
  IonList,
  IonPage,
  IonTitle,
  IonToggle,
  IonToolbar,
} from "@ionic/react";
import { InsetIonItem } from "../../../pages/profile/ProfileFeedItemsPage";
import { useAppDispatch, useAppSelector } from "../../../store";
import {
  setGestureActions,
  setLeftSwipeEnabled,
  setRightSwipeEnabled,
} from "./appearanceSlice";
import AppContent from "../../shared/AppContent";
import {
  ActionSheetButton,
  IonActionSheetCustomEvent,
  OverlayEventDetail,
} from "@ionic/core";
import { Dispatch, SetStateAction, useMemo, useState } from "react";
import { startCase } from "lodash";

const ListHeader = styled.div`
  font-size: 0.8em;
  margin: 32px 0 -8px 32px;
  text-transform: uppercase;
  color: var(--ion-color-medium);
`;

interface ActionSelector {
  text: string;
  action: string;
}

interface SwipeSelector {
  title: string;
  settingSelector(settingAction: string): void;
}

const SharedActions: ActionSelector[] = [
  { text: "Upvote", action: "upvote" },
  { text: "Downvote", action: "downvote" },
  { text: "Reply", action: "reply" },
];
const CommentActions: ActionSelector[] = [
  { text: "Collapse", action: "collapse" },
];
const InboxActions: ActionSelector[] = [
  { text: "Mark Read/Unread", action: "unread" },
];
const PostActions: ActionSelector[] = [{ text: "Hide", action: "hide" }];

function createDropdown(
  actions: ActionSelector[],
  swipeSelector: SwipeSelector,
  currentSelection: string,
  openState: [boolean, Dispatch<SetStateAction<boolean>>]
) {
  let buttons: ActionSheetButton<ActionSelector>[] = [];
  for (const action of actions) {
    buttons.push({
      text: action.text,
      data: action,
    } as ActionSheetButton<ActionSelector>);
  }

  const [open, setOpen] = openState;

  return (
    <InsetIonItem button onClick={() => setOpen(true)}>
      <IonLabel>{swipeSelector.title}</IonLabel>
      <IonLabel slot="end" color="medium">
        {startCase(currentSelection)}
      </IonLabel>
      <IonActionSheet
        cssClass="left-align-buttons"
        isOpen={open}
        onDidDismiss={() => setOpen(false)}
        onWillDismiss={(
          e: IonActionSheetCustomEvent<OverlayEventDetail<ActionSelector>>
        ) => {
          if (e.detail.data) {
            swipeSelector.settingSelector(e.detail.data.action);
          }
        }}
        header={swipeSelector.title}
        buttons={buttons.map((b) => ({
          ...b,
          role: currentSelection === b.data?.action ? "selected" : undefined,
        }))}
      />
    </InsetIonItem>
  );
}

export default function SwipePage() {
  const dispatch = useAppDispatch();
  const {
    leftSwipeEnabled,
    rightSwipeEnabled,
    commentGestures,
    postGestures,
    inboxGestures,
  } = useAppSelector((state) => state.appearance.swipe);

  /* Is there a better way to do this? Almost certainly. But I'm not a React dev, and Hooks are
   * hard, and this works, so... */
  const openState = [
    [useState(false), useState(false), useState(false), useState(false)],
    [useState(false), useState(false), useState(false), useState(false)],
    [useState(false), useState(false), useState(false), useState(false)],
  ];
  const gestures = [commentGestures, postGestures, inboxGestures];
  const actions = [
    SharedActions.concat(CommentActions),
    SharedActions.concat(PostActions),
    SharedActions.concat(InboxActions),
  ];
  const names: ("comment" | "post" | "inbox")[] = ["comment", "post", "inbox"];

  const options = useMemo(() => {
    let opt: JSX.Element[][] = [];

    gestures.forEach((reactionType, idx) => {
      opt.push([
        leftSwipeEnabled ? (
          createDropdown(
            actions[idx],
            {
              title: "Short Left",
              settingSelector: (a) => {
                dispatch(setGestureActions([names[idx], "sl", a]));
              },
            },
            reactionType.shortLeftGesture,
            openState[idx][0]
          )
        ) : (
          <></>
        ),
        leftSwipeEnabled ? (
          createDropdown(
            actions[idx],
            {
              title: "Left",
              settingSelector: (a) => {
                dispatch(setGestureActions([names[idx], "l", a]));
              },
            },
            reactionType.leftGesture,
            openState[idx][1]
          )
        ) : (
          <></>
        ),
        rightSwipeEnabled ? (
          createDropdown(
            actions[idx],
            {
              title: "Short Right",
              settingSelector: (a) => {
                dispatch(setGestureActions([names[idx], "sr", a]));
              },
            },
            reactionType.shortRightGesture,
            openState[idx][2]
          )
        ) : (
          <></>
        ),
        rightSwipeEnabled ? (
          createDropdown(
            actions[idx],
            {
              title: "Right",
              settingSelector: (a) => {
                dispatch(setGestureActions([names[idx], "r", a]));
              },
            },
            reactionType.rightGesture,
            openState[idx][3]
          )
        ) : (
          <></>
        ),
      ]);
    });

    return opt;
  }, [gestures, leftSwipeEnabled, rightSwipeEnabled]);

  return (
    <IonPage className="grey-bg">
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton
              defaultHref="/settings/appearance"
              text="Appearance"
            />
          </IonButtons>

          <IonTitle>Swipe Gestures</IonTitle>
        </IonToolbar>
      </IonHeader>
      <AppContent scrollY>
        <ListHeader>
          <IonLabel>Global Enable/Disable</IonLabel>
        </ListHeader>
        <IonList inset>
          <InsetIonItem>
            <IonLabel>Enable Left Swipes</IonLabel>
            <IonToggle
              checked={leftSwipeEnabled}
              onIonChange={(e) =>
                dispatch(setLeftSwipeEnabled(e.detail.checked))
              }
            />
          </InsetIonItem>
          <InsetIonItem>
            <IonLabel>Enable Right Swipes</IonLabel>
            <IonToggle
              checked={rightSwipeEnabled}
              onIonChange={(e) =>
                dispatch(setRightSwipeEnabled(e.detail.checked))
              }
            />
          </InsetIonItem>
        </IonList>

        <ListHeader>
          <IonLabel>Comments</IonLabel>
        </ListHeader>
        <IonList inset>{options[0]} </IonList>
        <ListHeader>
          <IonLabel>Posts</IonLabel>
        </ListHeader>
        <IonList inset>{options[1]} </IonList>
        <ListHeader>
          <IonLabel>Inbox</IonLabel>
        </ListHeader>
        <IonList inset>{options[2]} </IonList>
      </AppContent>
    </IonPage>
  );
}
