import { arrowUndo, eyeOffOutline, eyeOutline } from "ionicons/icons";
import React, { useContext } from "react";
import { SlidingItemAction } from "./SlidingItem";
import { CommentView, PostView } from "lemmy-js-client";
import { FeedContext } from "../../feed/FeedContext";
import BaseSlidingVote, { OptionalSlidingItemAction } from "./BaseSlidingVote";
import { useAppSelector } from "../../../store";
import { postHiddenByIdSelector } from "../../post/postSlice";
import { PageContext } from "../../auth/PageContext";

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
  const { refresh: refreshPost } = useContext(FeedContext);
  const isHidden = useAppSelector(postHiddenByIdSelector)[item.post?.id];
  const postGestures = useAppSelector(
    (state) => state.appearance.swipe.postGestures
  );

  const { presentLoginIfNeeded, presentCommentReply } = useContext(PageContext);

  const replyAction: SlidingItemAction = {
    render: arrowUndo,
    trigger: async () => {
      if (presentLoginIfNeeded()) return;

      const replied = await presentCommentReply(item);

      if (replied) refreshPost();
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

  let startActions: [OptionalSlidingItemAction, OptionalSlidingItemAction] = [
    null,
    null,
  ];

  let endActions: [OptionalSlidingItemAction, OptionalSlidingItemAction] = [
    replyAction,
    hideAction,
  ];

  return (
    <BaseSlidingVote
      otherStartActions={startActions}
      otherEndActions={endActions}
      className={className}
      item={item}
    >
      {children}
    </BaseSlidingVote>
  );
}
