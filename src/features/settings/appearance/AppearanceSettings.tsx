import TextSize from "./TextSize";
import Posts from "./posts/Posts";
import System from "./system/System";
import CompactSettings from "./CompactSettings";
import GeneralAppearance from "./General";
import { SwipeSetting } from "./Swipe";

export default function AppearanceSettings() {
  return (
    <>
      <TextSize />
      <GeneralAppearance />
      <Posts />
      <CompactSettings />
      <System />
      <SwipeSetting />
    </>
  );
}
