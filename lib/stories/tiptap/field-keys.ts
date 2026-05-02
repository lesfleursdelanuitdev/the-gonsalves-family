export type StoryFieldKey = "title" | "subtitle" | "author";

export function isStoryFieldKey(v: string): v is StoryFieldKey {
  return v === "title" || v === "subtitle" || v === "author";
}
