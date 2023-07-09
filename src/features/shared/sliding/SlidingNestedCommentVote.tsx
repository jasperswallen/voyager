import { arrowUndo, chevronCollapse, chevronExpand } from "ionicons/icons";
import React, { useCallback, useContext } from "react";
import { SlidingItemAction } from "./SlidingItem";
import { CommentView } from "lemmy-js-client";
import { FeedContext } from "../../feed/FeedContext";
import BaseSlidingVote, { OptionalSlidingItemAction } from "./BaseSlidingVote";
import useCollapseRootComment from "../../comment/useCollapseRootComment";
import { PageContext } from "../../auth/PageContext";

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
  const { refresh: refreshPost } = useContext(FeedContext);
  const { presentLoginIfNeeded, presentCommentReply } = useContext(PageContext);
  const collapseRootComment = useCollapseRootComment(item, rootIndex);

  const reply = useCallback(async () => {
    const commented = await presentCommentReply(item);

    if (commented) refreshPost();
  }, [item, presentCommentReply, refreshPost]);

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

  const startActions: [OptionalSlidingItemAction, OptionalSlidingItemAction] = [
    null,
    null,
  ];

  const endActions: [SlidingItemAction, SlidingItemAction] = [
    collapseAction,
    replyAction,
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
