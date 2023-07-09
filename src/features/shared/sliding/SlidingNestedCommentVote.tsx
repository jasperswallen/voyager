import { arrowUndo, chevronCollapse, chevronExpand } from "ionicons/icons";
import React, { useCallback, useContext } from "react";
import SlidingItem, {
  OptionalSlidingItemAction,
  SlidingItemAction,
} from "./SlidingItem";
import { CommentView } from "lemmy-js-client";
import { CommentsContext } from "../../comment/CommentsContext";
import voteSlidingActions from "./SlidingVotes";
import useCollapseRootComment from "../../comment/useCollapseRootComment";
import { PageContext } from "../../auth/PageContext";
import {
  CommentSwipeGestures,
  OCommentSwipeGestures,
} from "../../settings/settingsSlice";
import { useAppSelector } from "../../../store";

interface SlidingVoteProps {
  children: React.ReactNode;
  className?: string;
  item: CommentView;
  rootIndex: number | undefined;
  collapsed: boolean;
}

export default function SlidingNestedCommentVote({
  children,
  className,
  item,
  rootIndex,
  collapsed,
}: SlidingVoteProps) {
  const { prependComments } = useContext(CommentsContext);
  const { presentLoginIfNeeded, presentCommentReply } = useContext(PageContext);
  const collapseRootComment = useCollapseRootComment(item, rootIndex);
  const commentGestures = useAppSelector(
    (state) => state.settings.appearance.swipe.commentActions
  );

  const reply = useCallback(async () => {
    const reply = await presentCommentReply(item);

    if (reply) prependComments([reply]);
  }, [item, presentCommentReply, prependComments]);

  const collapseAction: SlidingItemAction = {
    render: collapsed ? chevronExpand : chevronCollapse,
    trigger: () => {
      collapseRootComment();
    },
    bgColor: "tertiary",
  };

  const replyAction: SlidingItemAction = {
    render: arrowUndo,
    trigger: () => {
      if (presentLoginIfNeeded()) return;

      reply();
    },
    bgColor: "primary",
  };

  const [upvoteAction, downvoteAction] = voteSlidingActions(item);

  function identifyActionToUse(selectedGesture: CommentSwipeGestures) {
    switch (selectedGesture) {
      case OCommentSwipeGestures.Upvote:
        return upvoteAction;
      case OCommentSwipeGestures.Downvote:
        return downvoteAction;
      case OCommentSwipeGestures.Collapse:
        return collapseAction;
      case OCommentSwipeGestures.Reply:
        return replyAction;
      case OCommentSwipeGestures.None:
        return null;
    }

    return null;
  }

  const startActions: [OptionalSlidingItemAction, OptionalSlidingItemAction] = [
    identifyActionToUse(commentGestures.shortLeft),
    identifyActionToUse(commentGestures.left),
  ];

  const endActions: [OptionalSlidingItemAction, OptionalSlidingItemAction] = [
    identifyActionToUse(commentGestures.shortRight),
    identifyActionToUse(commentGestures.right),
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
