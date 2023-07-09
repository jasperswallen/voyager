import {
  PayloadAction,
  createAsyncThunk,
  createSelector,
  createSlice,
} from "@reduxjs/toolkit";
import { merge } from "lodash";
import { RootState } from "../../../store";
import { MAX_DEFAULT_COMMENT_DEPTH } from "../../../helpers/lemmy";
import {
  CommentThreadCollapse,
  OCommentThreadCollapse,
  OPostAppearanceType,
  PostAppearanceType,
  db,
} from "../../../services/db";
import { get, set } from "../storage";

export {
  type CommentThreadCollapse,
  type PostAppearanceType,
  OCommentThreadCollapse,
  OPostAppearanceType,
} from "../../../services/db";

interface AppearanceState {
  font: {
    fontSizeMultiplier: number;
    useSystemFontSize: boolean;
  };
  comments: {
    collapseCommentThreads: CommentThreadCollapse;
  };
  posts: {
    type: PostAppearanceType;
  };
  dark: {
    usingSystemDarkMode: boolean;
    userDarkMode: boolean;
  };
  swipe: {
    leftSwipeEnabled: boolean;
    rightSwipeEnabled: boolean;
    commentGestures: {
      shortLeftGesture: string;
      leftGesture: string;
      shortRightGesture: string;
      rightGesture: string;
    };
    postGestures: {
      shortLeftGesture: string;
      leftGesture: string;
      shortRightGesture: string;
      rightGesture: string;
    };
    inboxGestures: {
      shortLeftGesture: string;
      leftGesture: string;
      shortRightGesture: string;
      rightGesture: string;
    };
  };
}

const LOCALSTORAGE_KEYS = {
  FONT: {
    FONT_SIZE_MULTIPLIER: "appearance--font-size-multiplier",
    USE_SYSTEM: "appearance--font-use-system",
  },
  DARK: {
    USE_SYSTEM: "appearance--dark-use-system",
    USER_MODE: "appearance--dark-user-mode",
  },
} as const;

const initialState: AppearanceState = {
  font: {
    fontSizeMultiplier: 1,
    useSystemFontSize: false,
  },
  comments: {
    collapseCommentThreads: OCommentThreadCollapse.Never,
  },
  posts: {
    type: OPostAppearanceType.Large,
  },
  dark: {
    usingSystemDarkMode: true,
    userDarkMode: false,
  },
  swipe: {
    leftSwipeEnabled: true,
    rightSwipeEnabled: true,
    commentGestures: {
      shortLeftGesture: "upvote",
      leftGesture: "downvote",
      shortRightGesture: "collapse",
      rightGesture: "reply",
    },
    postGestures: {
      shortLeftGesture: "upvote",
      leftGesture: "downvote",
      shortRightGesture: "reply",
      rightGesture: "hide",
    },
    inboxGestures: {
      shortLeftGesture: "upvote",
      leftGesture: "downvote",
      shortRightGesture: "unread",
      rightGesture: "reply",
    },
  },
};

// We continue using localstorage for specific items because indexeddb is slow
// and we don't want to wait for it to load before rendering the app and cause flickering
const stateWithLocalstorageItems: AppearanceState = merge(initialState, {
  font: {
    fontSizeMultiplier: get(LOCALSTORAGE_KEYS.FONT.FONT_SIZE_MULTIPLIER),
    useSystemFontSize: get(LOCALSTORAGE_KEYS.FONT.USE_SYSTEM),
  },
  dark: {
    usingSystemDarkMode: get(LOCALSTORAGE_KEYS.DARK.USE_SYSTEM),
    userDarkMode: get(LOCALSTORAGE_KEYS.DARK.USER_MODE),
  },
});

export const defaultCommentDepthSelector = createSelector(
  [(state: RootState) => state.appearance.comments.collapseCommentThreads],
  (collapseCommentThreads): number => {
    switch (collapseCommentThreads) {
      case OCommentThreadCollapse.Always:
        return 1;
      case OCommentThreadCollapse.Never:
        return MAX_DEFAULT_COMMENT_DEPTH;
    }
  }
);

export const appearanceSlice = createSlice({
  name: "appearance",
  initialState: stateWithLocalstorageItems,
  extraReducers: (builder) => {
    builder.addCase(
      fetchSettingsFromDatabase.fulfilled,
      (_, action: PayloadAction<AppearanceState>) => action.payload
    );
  },
  reducers: {
    setFontSizeMultiplier(state, action: PayloadAction<number>) {
      state.font.fontSizeMultiplier = action.payload;

      set(LOCALSTORAGE_KEYS.FONT.FONT_SIZE_MULTIPLIER, action.payload);
    },
    setUseSystemFontSize(state, action: PayloadAction<boolean>) {
      state.font.useSystemFontSize = action.payload;

      set(LOCALSTORAGE_KEYS.FONT.USE_SYSTEM, action.payload);
    },
    setCommentsCollapsed(state, action: PayloadAction<CommentThreadCollapse>) {
      state.comments.collapseCommentThreads = action.payload;

      db.setSetting("collapse_comment_threads", action.payload);
    },
    setPostAppearance(state, action: PayloadAction<PostAppearanceType>) {
      state.posts.type = action.payload;

      db.setSetting("post_appearance_type", action.payload);
    },
    setUserDarkMode(state, action: PayloadAction<boolean>) {
      state.dark.userDarkMode = action.payload;

      set(LOCALSTORAGE_KEYS.DARK.USER_MODE, action.payload);
    },
    setUseSystemDarkMode(state, action: PayloadAction<boolean>) {
      state.dark.usingSystemDarkMode = action.payload;

      set(LOCALSTORAGE_KEYS.DARK.USE_SYSTEM, action.payload);
    },
    setLeftSwipeEnabled(state, action: PayloadAction<boolean>) {
      state.swipe.leftSwipeEnabled = action.payload;

      db.setSetting("left_swipe_enabled", action.payload);
    },
    setRightSwipeEnabled(state, action: PayloadAction<boolean>) {
      state.swipe.rightSwipeEnabled = action.payload;

      db.setSetting("right_swipe_enabled", action.payload);
    },
    setGestureActions(
      state,
      action: PayloadAction<
        ["comment" | "post" | "inbox", "sl" | "l" | "sr" | "r", string]
      >
    ) {
      const [actionType, direction, swipeAction] = action.payload;

      if (actionType === "comment") {
        if (direction === "sl") {
          state.swipe.commentGestures.shortLeftGesture = swipeAction;
        } else if (direction === "l") {
          state.swipe.commentGestures.leftGesture = swipeAction;
        } else if (direction === "sr") {
          state.swipe.commentGestures.shortRightGesture = swipeAction;
        } else if (direction === "r") {
          state.swipe.commentGestures.rightGesture = swipeAction;
        }

        db.setSetting("comment_gestures", {
          short_left_gesture: state.swipe.commentGestures.shortLeftGesture,
          left_gesture: state.swipe.commentGestures.leftGesture,
          short_right_gesture: state.swipe.commentGestures.shortRightGesture,
          right_gesture: state.swipe.commentGestures.rightGesture,
        });
      } else if (actionType === "post") {
        if (direction === "sl") {
          state.swipe.postGestures.shortLeftGesture = swipeAction;
        } else if (direction === "l") {
          state.swipe.postGestures.leftGesture = swipeAction;
        } else if (direction === "sr") {
          state.swipe.postGestures.shortRightGesture = swipeAction;
        } else if (direction === "r") {
          state.swipe.postGestures.rightGesture = swipeAction;
        }

        db.setSetting("post_gestures", {
          short_left_gesture: state.swipe.postGestures.shortLeftGesture,
          left_gesture: state.swipe.postGestures.leftGesture,
          short_right_gesture: state.swipe.postGestures.shortRightGesture,
          right_gesture: state.swipe.postGestures.rightGesture,
        });
      } else {
        if (direction === "sl") {
          state.swipe.inboxGestures.shortLeftGesture = swipeAction;
        } else if (direction === "l") {
          state.swipe.inboxGestures.leftGesture = swipeAction;
        } else if (direction === "sr") {
          state.swipe.inboxGestures.shortRightGesture = swipeAction;
        } else if (direction === "r") {
          state.swipe.inboxGestures.rightGesture = swipeAction;
        }
        db.setSetting("inbox_gestures", {
          short_left_gesture: state.swipe.inboxGestures.shortLeftGesture,
          left_gesture: state.swipe.inboxGestures.leftGesture,
          short_right_gesture: state.swipe.inboxGestures.shortRightGesture,
          right_gesture: state.swipe.inboxGestures.rightGesture,
        });
      }
    },

    resetAppearance: () => initialState,
  },
});

export const fetchSettingsFromDatabase = createAsyncThunk<AppearanceState>(
  "appearance/fetchSettingsFromDatabase",
  async (_, thunkApi) => {
    return db.transaction("r", db.settings, async () => {
      const state = thunkApi.getState() as RootState;
      const collapse_comment_threads = await db.getSetting(
        "collapse_comment_threads"
      );
      const post_appearance_type = await db.getSetting("post_appearance_type");
      const left_swipe_enabled = await db.getSetting("left_swipe_enabled");
      const right_swipe_enabled = await db.getSetting("right_swipe_enabled");
      const comment_gestures = await db.getSetting("comment_gestures");
      const post_gestures = await db.getSetting("post_gestures");
      const inbox_gestures = await db.getSetting("inbox_gestures");

      return {
        ...state.appearance,
        comments: {
          collapseCommentThreads: collapse_comment_threads,
        },
        posts: {
          type: post_appearance_type,
        },
        swipe: {
          commentGestures: {
            shortLeftGesture: comment_gestures.short_left_gesture,
            leftGesture: comment_gestures.left_gesture,
            shortRightGesture: comment_gestures.short_right_gesture,
            rightGesture: comment_gestures.right_gesture,
          },
          postGestures: {
            shortLeftGesture: post_gestures.short_left_gesture,
            leftGesture: post_gestures.left_gesture,
            shortRightGesture: post_gestures.short_right_gesture,
            rightGesture: post_gestures.right_gesture,
          },
          inboxGestures: {
            shortLeftGesture: inbox_gestures.short_left_gesture,
            leftGesture: inbox_gestures.left_gesture,
            shortRightGesture: inbox_gestures.short_right_gesture,
            rightGesture: inbox_gestures.right_gesture,
          },
          leftSwipeEnabled: left_swipe_enabled,
          rightSwipeEnabled: right_swipe_enabled,
        },
      };
    });
  }
);

export const {
  setFontSizeMultiplier,
  setUseSystemFontSize,
  setCommentsCollapsed,
  setPostAppearance,
  setUserDarkMode,
  setUseSystemDarkMode,
  setLeftSwipeEnabled,
  setRightSwipeEnabled,
  setGestureActions,
} = appearanceSlice.actions;

export default appearanceSlice.reducer;
