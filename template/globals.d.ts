declare module "*.svg" {
  const content: string;
  export default content;
}

declare module "*.jpg" {
  const content: string;
  export default content;
}

declare module "*.png" {
  const content: string;
  export default content;
}

declare module "*.mp3" {
  /** URL of the emitted file (tutorial narration and other audio). */
  const content: string;
  export default content;
}
