import { css } from "@emotion/react";
import styled from "@emotion/styled";
import { IonItemSlidingCustomEvent, ItemSlidingCustomEvent } from "@ionic/core";
import {
  IonIcon,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
} from "@ionic/react";
import React, { useMemo, useRef, useState } from "react";
import { useAppSelector } from "../../../store";

const StyledIonItemSliding = styled(IonItemSliding)`
  --ion-item-border-color: transparent;
`;

const OptionContainer = styled.div<{ active: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  width: min(60px, 11vw);

  opacity: 0.5;

  ${({ active }) =>
    active &&
    css`
      opacity: 1;
    `}
`;

export type SlidingItemAction = {
  /**
   * If `string`, it's passed to IonIcon as an icon value
   */
  render: (() => React.ReactNode) | string;
  trigger: () => void;
  bgColor: string;
};

export type OptionalSlidingItemAction = SlidingItemAction | null;

export interface SlidingItemProps {
  className?: string;
  startActions: [OptionalSlidingItemAction, OptionalSlidingItemAction];
  endActions: [OptionalSlidingItemAction, OptionalSlidingItemAction];
  children?: React.ReactNode;
}

const FIRST_ACTION_RATIO = 1;
const SECOND_ACTION_RATIO = 1.75;

function createActions(
  inputActions: [OptionalSlidingItemAction, OptionalSlidingItemAction]
): [SlidingItemAction, SlidingItemAction] | [] {
  if (inputActions[0] != null && inputActions[1] != null) {
    return [inputActions[0], inputActions[1]];
  }

  if (inputActions[0] != null) {
    return [inputActions[0], inputActions[0]];
  }

  if (inputActions[1] != null) {
    return [inputActions[1], inputActions[1]];
  }

  return [];
}

export default function SlidingItem({
  startActions,
  endActions,
  className,
  children,
}: SlidingItemProps) {
  let { leftSwipeEnabled, rightSwipeEnabled } = useAppSelector(
    (state) => state.settings.appearance.swipe
  );

  const composedStartActions = createActions(startActions);
  const composedEndActions = createActions(endActions);

  leftSwipeEnabled = leftSwipeEnabled && composedEndActions.length > 0;

  rightSwipeEnabled = rightSwipeEnabled && composedStartActions.length > 0;

  /* If both left & right swipes are disabled or empty, there's no need to build the actions. */
  if (!leftSwipeEnabled && !rightSwipeEnabled) {
    return children;
  }

  const dragRef = useRef<ItemSlidingCustomEvent | undefined>();
  const [ratio, setRatio] = useState(0);
  const [dragging, setDragging] = useState(false);

  async function onIonDrag(e: IonItemSlidingCustomEvent<unknown>) {
    dragRef.current = e;

    const ratio = await e.target.getSlidingRatio();

    if (Math.round(ratio) === ratio) return;

    setRatio(ratio);
    setDragging(true);
  }

  /*
   * Start Actions
   */

  const currentStartActionIndex = ratio <= -SECOND_ACTION_RATIO ? 1 : 0;

  const startActionColor =
    composedStartActions[currentStartActionIndex]?.bgColor;

  const startActionContents = useMemo(() => {
    const render = composedStartActions[currentStartActionIndex]?.render;

    if (!render) return;
    if (typeof render === "string") return <IonIcon icon={render} />;
    return render();

    // NOTE: This caches the content so that it doesn't re-render until completely closed
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStartActionIndex, ratio]);

  /*
   * End Actions
   */

  const currentEndActionIndex = ratio >= SECOND_ACTION_RATIO ? 1 : 0;

  const endActionColor = composedEndActions[currentEndActionIndex]?.bgColor;

  const endActionContents = useMemo(() => {
    const render = composedEndActions[currentEndActionIndex]?.render;

    if (!render) return;
    if (typeof render === "string") return <IonIcon icon={render} />;
    return render();

    // NOTE: This caches the content so that it doesn't re-render until completely closed
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentEndActionIndex, ratio]);

  async function onDragStop() {
    if (!dragRef.current) return;
    if (!dragging) return;

    if (ratio <= -FIRST_ACTION_RATIO) {
      composedStartActions[currentStartActionIndex]?.trigger();
    } else if (ratio >= FIRST_ACTION_RATIO) {
      composedEndActions[currentEndActionIndex]?.trigger();
    }

    dragRef.current.target.closeOpened();
    setDragging(false);
  }

  const startActionOptions = leftSwipeEnabled ? (
    <IonItemOptions side="start">
      <IonItemOption color={startActionColor}>
        <OptionContainer active={ratio <= -FIRST_ACTION_RATIO}>
          {startActionContents}
        </OptionContainer>
      </IonItemOption>
    </IonItemOptions>
  ) : (
    <></>
  );

  const endActionOptions = rightSwipeEnabled ? (
    <IonItemOptions side="end">
      <IonItemOption color={endActionColor}>
        <OptionContainer active={ratio >= FIRST_ACTION_RATIO}>
          {endActionContents}
        </OptionContainer>
      </IonItemOption>
    </IonItemOptions>
  ) : (
    <></>
  );

  return (
    <StyledIonItemSliding
      onIonDrag={onIonDrag}
      onTouchEnd={onDragStop}
      onMouseUp={onDragStop}
      className={className}
    >
      {startActionOptions}

      {endActionOptions}

      {children}
    </StyledIonItemSliding>
  );
}
