import { useIonToast } from "@ionic/react";
import { arrowUndo, mailUnread } from "ionicons/icons";
import React, { useCallback, useContext } from "react";
import SlidingItem, {
  OptionalSlidingItemAction,
  SlidingItemAction,
} from "./SlidingItem";
import { CommentReplyView, PersonMentionView } from "lemmy-js-client";
import { CommentsContext } from "../../comment/CommentsContext";
import { getInboxItemId, markRead } from "../../inbox/inboxSlice";
import { useAppDispatch, useAppSelector } from "../../../store";
import { PageContext } from "../../auth/PageContext";
import voteSlidingActions from "./SlidingVotes";
import {
  InboxSwipeGestures,
  OInboxSwipeGestures,
} from "../../settings/settingsSlice";

interface SlidingInboxProps {
  children: React.ReactNode;
  className?: string;
  item: PersonMentionView | CommentReplyView;
}

export default function SlidingInbox({
  children,
  className,
  item,
}: SlidingInboxProps) {
  const [present] = useIonToast();
  const dispatch = useAppDispatch();
  const { refresh: refreshPost } = useContext(CommentsContext);
  const { presentCommentReply } = useContext(PageContext);
  const readByInboxItemId = useAppSelector(
    (state) => state.inbox.readByInboxItemId
  );
  const inboxGestures = useAppSelector(
    (state) => state.settings.appearance.swipe.inboxActions
  );

  const markUnread = useCallback(async () => {
    try {
      await dispatch(markRead(item, !readByInboxItemId[getInboxItemId(item)]));
    } catch (error) {
      present({
        message: "Failed to mark item as unread",
        duration: 3500,
        position: "bottom",
        color: "danger",
      });

      throw error;
    }
  }, [dispatch, item, present, readByInboxItemId]);

  const markUnreadAction: SlidingItemAction = {
    render: mailUnread,
    trigger: markUnread,
    bgColor: "tertiary",
  };

  const replyAction: SlidingItemAction = {
    render: arrowUndo,
    trigger: async () => {
      const replied = await presentCommentReply(item);
      if (replied) refreshPost();
    },
    bgColor: "primary",
  };

  const [upvoteAction, downvoteAction] = voteSlidingActions(item);

  function identifyActionToUse(selectedGesture: InboxSwipeGestures) {
    switch (selectedGesture) {
      case OInboxSwipeGestures.Upvote:
        return upvoteAction;
      case OInboxSwipeGestures.Downvote:
        return downvoteAction;
      case OInboxSwipeGestures["Mark Read/Unread"]:
        return markUnreadAction;
      case OInboxSwipeGestures.Reply:
        return replyAction;
      case OInboxSwipeGestures.None:
        return null;
    }

    return null;
  }

  const startActions: [OptionalSlidingItemAction, OptionalSlidingItemAction] = [
    identifyActionToUse(inboxGestures.shortLeft),
    identifyActionToUse(inboxGestures.left),
  ];

  const endActions: [OptionalSlidingItemAction, OptionalSlidingItemAction] = [
    identifyActionToUse(inboxGestures.shortRight),
    identifyActionToUse(inboxGestures.right),
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
