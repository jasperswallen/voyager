import styled from "@emotion/styled";
import { IonLabel, IonList, IonToggle } from "@ionic/react";
import { InsetIonItem } from "../../../pages/profile/ProfileFeedItemsPage";
import { useAppDispatch, useAppSelector } from "../../../store";
import { setLeftSwipeEnabled, setRightSwipeEnabled } from "./appearanceSlice";

const ListHeader = styled.div`
  font-size: 0.8em;
  margin: 32px 0 -8px 32px;
  text-transform: uppercase;
  color: var(--ion-color-medium);
`;

export default function SwipeOptions() {
  const dispatch = useAppDispatch();
  const { leftSwipeEnabled, rightSwipeEnabled } = useAppSelector(
    (state) => state.appearance.swipe
  );

  return (
    <>
      <ListHeader>
        <IonLabel>Swipe Gestures</IonLabel>
      </ListHeader>
      <IonList inset>
        <InsetIonItem>
          <IonLabel>Enable Left Swipes</IonLabel>
          <IonToggle
            checked={leftSwipeEnabled}
            onIonChange={(e) => dispatch(setLeftSwipeEnabled(e.detail.checked))}
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
    </>
  );
}
