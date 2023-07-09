import {
  PayloadAction,
  createAsyncThunk,
  createSelector,
  createSlice,
} from "@reduxjs/toolkit";
import { merge } from "lodash";
import { AppDispatch, RootState } from "../../store";
import { MAX_DEFAULT_COMMENT_DEPTH } from "../../helpers/lemmy";
import {
  CommentThreadCollapse,
  OCommentThreadCollapse,
  OPostAppearanceType,
  PostBlurNsfwType,
  PostAppearanceType,
  OCompactThumbnailPositionType,
  CompactThumbnailPositionType,
  db,
  OPostBlurNsfw,
  CommentDefaultSort,
  OCommentDefaultSort,
  InstanceUrlDisplayMode,
  OInstanceUrlDisplayMode,
  OCommentSwipeGestures,
  CommentSwipeGestures,
  OPostSwipeGestures,
  PostSwipeGestures,
  OInboxSwipeGestures,
  InboxSwipeGestures,
} from "../../services/db";
import { get, set } from "./storage";
import { Mode } from "@ionic/core";

export {
  type CommentThreadCollapse,
  type PostAppearanceType,
  type CompactThumbnailPositionType,
  type CommentSwipeGestures,
  type PostSwipeGestures,
  type InboxSwipeGestures,
  OCommentThreadCollapse,
  OPostAppearanceType,
  OCompactThumbnailPositionType,
  OCommentSwipeGestures,
  OPostSwipeGestures,
  OInboxSwipeGestures,
} from "../../services/db";

/**
 * This is a type factory for objects that supply information about a swipe direction.
 *
 * For example, this is used to create a type that adds a callback per-direction, for updating
 * settings, as well as a description of the direction, for human interaction.
 *
 * @template T The type of the object at each direction.
 */
export interface DirectionalGestureFactory<T = null> {
  shortLeft: T;
  left: T;
  shortRight: T;
  right: T;
}

export type SwipeGestures<
  T extends CommentSwipeGestures | PostSwipeGestures | InboxSwipeGestures
> = DirectionalGestureFactory<T>;

interface SettingsState {
  ready: boolean;
  appearance: {
    font: {
      fontSizeMultiplier: number;
      useSystemFontSize: boolean;
    };
    general: {
      userInstanceUrlDisplay: InstanceUrlDisplayMode;
    };
    posts: {
      blurNsfw: PostBlurNsfwType;
      type: PostAppearanceType;
    };
    compact: {
      thumbnailsPosition: CompactThumbnailPositionType;
      showVotingButtons: boolean;
    };
    dark: {
      usingSystemDarkMode: boolean;
      userDarkMode: boolean;
    };
    deviceMode: Mode;
    swipe: {
      leftSwipeEnabled: boolean;
      rightSwipeEnabled: boolean;

      commentActions: SwipeGestures<CommentSwipeGestures>;
      postActions: SwipeGestures<PostSwipeGestures>;
      inboxActions: SwipeGestures<InboxSwipeGestures>;
    };
  };
  general: {
    comments: {
      collapseCommentThreads: CommentThreadCollapse;
      sort: CommentDefaultSort;
    };
    posts: {
      disableMarkingRead: boolean;
      markReadOnScroll: boolean;
      showHideReadButton: boolean;
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
  DEVICE_MODE: "appearance--device-mode",
} as const;

const initialState: SettingsState = {
  ready: false,
  appearance: {
    font: {
      fontSizeMultiplier: 1,
      useSystemFontSize: false,
    },
    general: {
      userInstanceUrlDisplay: OInstanceUrlDisplayMode.Never,
    },
    posts: {
      blurNsfw: OPostBlurNsfw.InFeed,
      type: OPostAppearanceType.Large,
    },
    compact: {
      thumbnailsPosition: OCompactThumbnailPositionType.Left,
      showVotingButtons: true,
    },
    dark: {
      usingSystemDarkMode: true,
      userDarkMode: false,
    },
    deviceMode: "ios",
    swipe: {
      leftSwipeEnabled: true,
      rightSwipeEnabled: true,

      commentActions: {
        shortLeft: OCommentSwipeGestures.Upvote,
        left: OCommentSwipeGestures.Downvote,
        shortRight: OCommentSwipeGestures.Collapse,
        right: OCommentSwipeGestures.Reply,
      },
      postActions: {
        shortLeft: OPostSwipeGestures.Upvote,
        left: OPostSwipeGestures.Downvote,
        shortRight: OPostSwipeGestures.Reply,
        right: OPostSwipeGestures.Hide,
      },
      inboxActions: {
        shortLeft: OInboxSwipeGestures.Upvote,
        left: OInboxSwipeGestures.Downvote,
        shortRight: OInboxSwipeGestures.Reply,
        right: OInboxSwipeGestures["Mark Read/Unread"],
      },
    },
  },
  general: {
    comments: {
      collapseCommentThreads: OCommentThreadCollapse.Never,
      sort: OCommentDefaultSort.Hot,
    },
    posts: {
      disableMarkingRead: false,
      markReadOnScroll: false,
      showHideReadButton: false,
    },
  },
};

// We continue using localstorage for specific items because indexeddb is slow
// and we don't want to wait for it to load before rendering the app and cause flickering
const stateWithLocalstorageItems: SettingsState = merge(initialState, {
  appearance: {
    font: {
      fontSizeMultiplier: get(LOCALSTORAGE_KEYS.FONT.FONT_SIZE_MULTIPLIER),
      useSystemFontSize: get(LOCALSTORAGE_KEYS.FONT.USE_SYSTEM),
    },
    dark: {
      usingSystemDarkMode: get(LOCALSTORAGE_KEYS.DARK.USE_SYSTEM),
      userDarkMode: get(LOCALSTORAGE_KEYS.DARK.USER_MODE),
    },
    deviceMode: get(LOCALSTORAGE_KEYS.DEVICE_MODE),
  },
});

export const defaultCommentDepthSelector = createSelector(
  [
    (state: RootState) =>
      state.settings.general.comments.collapseCommentThreads,
  ],
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
      (_, action: PayloadAction<SettingsState>) => action.payload
    );
  },
  reducers: {
    setFontSizeMultiplier(state, action: PayloadAction<number>) {
      state.appearance.font.fontSizeMultiplier = action.payload;
      set(LOCALSTORAGE_KEYS.FONT.FONT_SIZE_MULTIPLIER, action.payload);
    },
    setUseSystemFontSize(state, action: PayloadAction<boolean>) {
      state.appearance.font.useSystemFontSize = action.payload;
      set(LOCALSTORAGE_KEYS.FONT.USE_SYSTEM, action.payload);
    },
    setUserInstanceUrlDisplay(
      state,
      action: PayloadAction<InstanceUrlDisplayMode>
    ) {
      state.appearance.general.userInstanceUrlDisplay = action.payload;
      db.setSetting("user_instance_url_display", action.payload);
    },
    setCommentsCollapsed(state, action: PayloadAction<CommentThreadCollapse>) {
      state.general.comments.collapseCommentThreads = action.payload;
      db.setSetting("collapse_comment_threads", action.payload);
    },
    setPostAppearance(state, action: PayloadAction<PostAppearanceType>) {
      state.appearance.posts.type = action.payload;
      db.setSetting("post_appearance_type", action.payload);
    },
    setNsfwBlur(state, action: PayloadAction<PostBlurNsfwType>) {
      state.appearance.posts.blurNsfw = action.payload;
      // Per user setting is updated in StoreProvider
    },
    setShowVotingButtons(state, action: PayloadAction<boolean>) {
      state.appearance.compact.showVotingButtons = action.payload;
      db.setSetting("compact_show_voting_buttons", action.payload);
    },
    setThumbnailPosition(
      state,
      action: PayloadAction<CompactThumbnailPositionType>
    ) {
      state.appearance.compact.thumbnailsPosition = action.payload;
      db.setSetting("compact_thumbnail_position_type", action.payload);
    },
    setUserDarkMode(state, action: PayloadAction<boolean>) {
      state.appearance.dark.userDarkMode = action.payload;
      set(LOCALSTORAGE_KEYS.DARK.USER_MODE, action.payload);
    },
    setUseSystemDarkMode(state, action: PayloadAction<boolean>) {
      state.appearance.dark.usingSystemDarkMode = action.payload;
      set(LOCALSTORAGE_KEYS.DARK.USE_SYSTEM, action.payload);
    },
    setDeviceMode(state, action: PayloadAction<Mode>) {
      state.appearance.deviceMode = action.payload;

      set(LOCALSTORAGE_KEYS.DEVICE_MODE, action.payload);
    },
    setDefaultCommentSort(state, action: PayloadAction<CommentDefaultSort>) {
      state.general.comments.sort = action.payload;
      db.setSetting("default_comment_sort", action.payload);
    },
    setDisableMarkingPostsRead(state, action: PayloadAction<boolean>) {
      state.general.posts.disableMarkingRead = action.payload;
      db.setSetting("disable_marking_posts_read", action.payload);
    },
    setMarkPostsReadOnScroll(state, action: PayloadAction<boolean>) {
      state.general.posts.markReadOnScroll = action.payload;

      db.setSetting("mark_read_on_scroll", action.payload);
    },
    setShowHideReadButton(state, action: PayloadAction<boolean>) {
      state.general.posts.showHideReadButton = action.payload;

      db.setSetting("show_hide_read_button", action.payload);
    },

    setLeftSwipeEnabled(state, action: PayloadAction<boolean>) {
      state.appearance.swipe.leftSwipeEnabled = action.payload;

      db.setSetting("left_swipe_enabled", action.payload);
    },
    setRightSwipeEnabled(state, action: PayloadAction<boolean>) {
      state.appearance.swipe.rightSwipeEnabled = action.payload;

      db.setSetting("right_swipe_enabled", action.payload);
    },

    setShortLeftCommentGesture(
      state,
      action: PayloadAction<CommentSwipeGestures>
    ) {
      state.appearance.swipe.commentActions.shortLeft = action.payload;

      db.setSetting("short_left_comment_action", action.payload);
    },
    setLeftCommentGesture(state, action: PayloadAction<CommentSwipeGestures>) {
      state.appearance.swipe.commentActions.left = action.payload;

      db.setSetting("left_comment_action", action.payload);
    },
    setShortRightCommentGesture(
      state,
      action: PayloadAction<CommentSwipeGestures>
    ) {
      state.appearance.swipe.commentActions.shortRight = action.payload;

      db.setSetting("short_right_comment_action", action.payload);
    },
    setRightCommentGesture(state, action: PayloadAction<CommentSwipeGestures>) {
      state.appearance.swipe.commentActions.right = action.payload;

      db.setSetting("right_comment_action", action.payload);
    },

    setShortLeftPostGesture(state, action: PayloadAction<PostSwipeGestures>) {
      state.appearance.swipe.postActions.shortLeft = action.payload;

      db.setSetting("short_left_post_action", action.payload);
    },
    setLeftPostGesture(state, action: PayloadAction<PostSwipeGestures>) {
      state.appearance.swipe.postActions.left = action.payload;

      db.setSetting("left_post_action", action.payload);
    },
    setShortRightPostGesture(state, action: PayloadAction<PostSwipeGestures>) {
      state.appearance.swipe.postActions.shortRight = action.payload;

      db.setSetting("short_right_post_action", action.payload);
    },
    setRightPostGesture(state, action: PayloadAction<PostSwipeGestures>) {
      state.appearance.swipe.postActions.right = action.payload;

      db.setSetting("right_post_action", action.payload);
    },

    setShortLeftInboxGesture(state, action: PayloadAction<InboxSwipeGestures>) {
      state.appearance.swipe.inboxActions.shortLeft = action.payload;

      db.setSetting("short_left_inbox_action", action.payload);
    },
    setLeftInboxGesture(state, action: PayloadAction<InboxSwipeGestures>) {
      state.appearance.swipe.inboxActions.left = action.payload;

      db.setSetting("left_inbox_action", action.payload);
    },
    setShortRightInboxGesture(
      state,
      action: PayloadAction<InboxSwipeGestures>
    ) {
      state.appearance.swipe.inboxActions.shortRight = action.payload;

      db.setSetting("short_right_inbox_action", action.payload);
    },
    setRightInboxGesture(state, action: PayloadAction<InboxSwipeGestures>) {
      state.appearance.swipe.inboxActions.right = action.payload;

      db.setSetting("right_inbox_action", action.payload);
    },

    resetSettings: () => ({
      ...initialState,
      ready: true,
    }),

    settingsReady: (state) => {
      state.ready = true;
    },
  },
});

export const markReadOnScrollSelector = (state: RootState) => {
  return (
    !state.settings.general.posts.disableMarkingRead &&
    state.settings.general.posts.markReadOnScroll
  );
};

export const setBlurNsfwState =
  (blurNsfw: PostBlurNsfwType) =>
  async (dispatch: AppDispatch, getState: () => RootState) => {
    const userHandle = getState().auth.accountData?.activeHandle;

    dispatch(setNsfwBlur(blurNsfw));

    db.setSetting("blur_nsfw", blurNsfw, {
      user_handle: userHandle,
    });
  };

export const getBlurNsfw =
  () => async (dispatch: AppDispatch, getState: () => RootState) => {
    const userHandle = getState().auth.accountData?.activeHandle;

    const blurNsfw = await db.getSetting("blur_nsfw", {
      user_handle: userHandle,
    });

    dispatch(setNsfwBlur(blurNsfw ?? initialState.appearance.posts.blurNsfw));
  };

export const fetchSettingsFromDatabase = createAsyncThunk<SettingsState>(
  "appearance/fetchSettingsFromDatabase",
  async (_, thunkApi) => {
    const result = db.transaction("r", db.settings, async () => {
      const state = thunkApi.getState() as RootState;
      const collapse_comment_threads = await db.getSetting(
        "collapse_comment_threads"
      );
      const user_instance_url_display = await db.getSetting(
        "user_instance_url_display"
      );
      const post_appearance_type = await db.getSetting("post_appearance_type");
      const blur_nsfw = await db.getSetting("blur_nsfw");
      const compact_thumbnail_position_type = await db.getSetting(
        "compact_thumbnail_position_type"
      );
      const compact_show_voting_buttons = await db.getSetting(
        "compact_show_voting_buttons"
      );
      const default_comment_sort = await db.getSetting("default_comment_sort");
      const disable_marking_posts_read = await db.getSetting(
        "disable_marking_posts_read"
      );
      const mark_read_on_scroll = await db.getSetting("mark_read_on_scroll");
      const show_hide_read_button = await db.getSetting(
        "show_hide_read_button"
      );

      const left_swipe_enabled = await db.getSetting("left_swipe_enabled");
      const right_swipe_enabled = await db.getSetting("right_swipe_enabled");

      const short_left_comment_action = await db.getSetting(
        "short_left_comment_action"
      );
      const left_comment_action = await db.getSetting("left_comment_action");
      const short_right_comment_action = await db.getSetting(
        "short_right_comment_action"
      );
      const right_comment_action = await db.getSetting("right_comment_action");

      const short_left_post_action = await db.getSetting(
        "short_left_post_action"
      );
      const left_post_action = await db.getSetting("left_post_action");
      const short_right_post_action = await db.getSetting(
        "short_right_post_action"
      );
      const right_post_action = await db.getSetting("right_post_action");

      const short_left_inbox_action = await db.getSetting(
        "short_left_inbox_action"
      );
      const left_inbox_action = await db.getSetting("left_inbox_action");
      const short_right_inbox_action = await db.getSetting(
        "short_right_inbox_action"
      );
      const right_inbox_action = await db.getSetting("right_inbox_action");

      return {
        ...state.settings,
        ready: true,
        appearance: {
          ...state.settings.appearance,
          general: {
            userInstanceUrlDisplay:
              user_instance_url_display ??
              initialState.appearance.general.userInstanceUrlDisplay,
          },
          posts: {
            type: post_appearance_type ?? initialState.appearance.posts.type,
            blurNsfw: blur_nsfw ?? initialState.appearance.posts.blurNsfw,
          },
          compact: {
            thumbnailsPosition:
              compact_thumbnail_position_type ??
              initialState.appearance.compact.thumbnailsPosition,
            showVotingButtons:
              compact_show_voting_buttons ??
              initialState.appearance.compact.showVotingButtons,
          },
          swipe: {
            leftSwipeEnabled:
              left_swipe_enabled ??
              initialState.appearance.swipe.leftSwipeEnabled,
            rightSwipeEnabled:
              right_swipe_enabled ??
              initialState.appearance.swipe.rightSwipeEnabled,

            commentActions: {
              shortLeft:
                short_left_comment_action ??
                initialState.appearance.swipe.commentActions.shortLeft,
              left:
                left_comment_action ??
                initialState.appearance.swipe.commentActions.left,
              shortRight:
                short_right_comment_action ??
                initialState.appearance.swipe.commentActions.shortRight,
              right:
                right_comment_action ??
                initialState.appearance.swipe.commentActions.right,
            },
            postActions: {
              shortLeft:
                short_left_post_action ??
                initialState.appearance.swipe.postActions.shortLeft,
              left:
                left_post_action ??
                initialState.appearance.swipe.postActions.left,
              shortRight:
                short_right_post_action ??
                initialState.appearance.swipe.postActions.shortRight,
              right:
                right_post_action ??
                initialState.appearance.swipe.postActions.right,
            },
            inboxActions: {
              shortLeft:
                short_left_inbox_action ??
                initialState.appearance.swipe.inboxActions.shortLeft,
              left:
                left_inbox_action ??
                initialState.appearance.swipe.inboxActions.left,
              shortRight:
                short_right_inbox_action ??
                initialState.appearance.swipe.inboxActions.shortRight,
              right:
                right_inbox_action ??
                initialState.appearance.swipe.inboxActions.right,
            },
          },
        },
        general: {
          comments: {
            collapseCommentThreads:
              collapse_comment_threads ??
              initialState.general.comments.collapseCommentThreads,
            sort: default_comment_sort ?? initialState.general.comments.sort,
          },
          posts: {
            disableMarkingRead:
              disable_marking_posts_read ??
              initialState.general.posts.disableMarkingRead,
            markReadOnScroll:
              mark_read_on_scroll ??
              initialState.general.posts.markReadOnScroll,
            showHideReadButton:
              show_hide_read_button ??
              initialState.general.posts.showHideReadButton,
          },
        },
      };
    });

    try {
      return await result;
    } catch (error) {
      // In the event of a database error, attempt to render the UI anyways
      thunkApi.dispatch(settingsReady());

      throw error;
    }
  }
);

export const {
  setFontSizeMultiplier,
  setUseSystemFontSize,
  setUserInstanceUrlDisplay,
  setCommentsCollapsed,
  setNsfwBlur,
  setPostAppearance,
  setThumbnailPosition,
  setShowVotingButtons,
  setUserDarkMode,
  setUseSystemDarkMode,
  setDeviceMode,
  setDefaultCommentSort,
  settingsReady,
  setDisableMarkingPostsRead,
  setMarkPostsReadOnScroll,
  setShowHideReadButton,
  setLeftSwipeEnabled,
  setRightSwipeEnabled,
  setShortLeftCommentGesture,
  setLeftCommentGesture,
  setShortRightCommentGesture,
  setRightCommentGesture,
  setShortLeftPostGesture,
  setLeftPostGesture,
  setShortRightPostGesture,
  setRightPostGesture,
  setShortLeftInboxGesture,
  setLeftInboxGesture,
  setShortRightInboxGesture,
  setRightInboxGesture,
} = appearanceSlice.actions;

export default appearanceSlice.reducer;

export function getDeviceMode(): Mode {
  // md mode is beta, so default ios for all devices
  return get(LOCALSTORAGE_KEYS.DEVICE_MODE) ?? "ios";
}
