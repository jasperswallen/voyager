import styled from "@emotion/styled";
import {
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
import { setLeftSwipeEnabled, setRightSwipeEnabled } from "./appearanceSlice";
import AppContent from "../../shared/AppContent";

const ListHeader = styled.div`
  font-size: 0.8em;
  margin: 32px 0 -8px 32px;
  text-transform: uppercase;
  color: var(--ion-color-medium);
`;

export default function SwipePage() {
  const dispatch = useAppDispatch();
  const { leftSwipeEnabled, rightSwipeEnabled } = useAppSelector(
    (state) => state.appearance.swipe
  );

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

        {/* */}
      </AppContent>
    </IonPage>
  );
}
