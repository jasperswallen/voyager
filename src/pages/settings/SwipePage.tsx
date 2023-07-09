import {
  IonBackButton,
  IonButtons,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
} from "@ionic/react";
import AppContent from "../../features/shared/AppContent";
import Swipe from "../../features/settings/appearance/Swipe";

export default function SwipePage() {
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
        <Swipe />
      </AppContent>
    </IonPage>
  );
}
