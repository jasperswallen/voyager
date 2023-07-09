import { arrowUndo, eyeOffOutline, eyeOutline } from "ionicons/icons";
import React, { useContext } from "react";
import SlidingItem, {
  OptionalSlidingItemAction,
  SlidingItemAction,
} from "./SlidingItem";
import { CommentView, PostView } from "lemmy-js-client";
import voteSlidingActions from "./SlidingVotes";
import { useAppSelector } from "../../../store";
import { postHiddenByIdSelector } from "../../post/postSlice";
import { PageContext } from "../../auth/PageContext";
import {
  OPostSwipeGestures,
  PostSwipeGestures,
} from "../../settings/settingsSlice";

interface SlidingVoteProps {
  children: React.ReactNode;
  className?: string;
  item: CommentView | PostView;
  onHide: () => void;
}

export default function SlidingVote({
  children,
  className,
  item,
  onHide,
}: SlidingVoteProps) {
  const isHidden = useAppSelector(postHiddenByIdSelector)[item.post?.id];
  const postGestures = useAppSelector(
    (state) => state.settings.appearance.swipe.postActions
  );

  const { presentLoginIfNeeded, presentCommentReply } = useContext(PageContext);

  const replyAction: SlidingItemAction = {
    render: arrowUndo,
    trigger: async () => {
      if (presentLoginIfNeeded()) return;

      presentCommentReply(item);
    },
    bgColor: "primary",
  };

  const hideAction: OptionalSlidingItemAction =
    "post" in item
      ? {
          render: isHidden ? eyeOutline : eyeOffOutline,
          trigger: () => {
            if (presentLoginIfNeeded()) return;

            onHide();
          },
          bgColor: isHidden ? "tertiary" : "danger",
        }
      : null;

  const [upvoteAction, downvoteAction] = voteSlidingActions(item);

  function identifyActionToUse(selectedGesture: PostSwipeGestures) {
    switch (selectedGesture) {
      case OPostSwipeGestures.Upvote:
        return upvoteAction;
      case OPostSwipeGestures.Downvote:
        return downvoteAction;
      case OPostSwipeGestures.Hide:
        return hideAction;
      case OPostSwipeGestures.Reply:
        return replyAction;
      case OPostSwipeGestures.None:
        return null;
    }

    return null;
  }

  const startActions: [OptionalSlidingItemAction, OptionalSlidingItemAction] = [
    identifyActionToUse(postGestures.shortLeft),
    identifyActionToUse(postGestures.left),
  ];

  const endActions: [OptionalSlidingItemAction, OptionalSlidingItemAction] = [
    identifyActionToUse(postGestures.shortRight),
    identifyActionToUse(postGestures.right),
  ];

  return (
    <SlidingItem
      startActions={startActions}
      endActions={endActions}
      className={className}
    >
      {children}
    </SlidingItem>
  );
}
