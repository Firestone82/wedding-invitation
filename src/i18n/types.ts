/** Every text shown on the page. Each language in `src/i18n/messages/` provides all of them. */
export interface Messages {
  /** Browser tab title. */
  title: string;
  /** Description for search engines and link previews. */
  description: string;
  /** Small heading above the envelope. */
  kicker: string;
  /** Hint under the envelope. */
  tapTheSeal: string;
  /** Accessible names. */
  envelope: string;
  openLetter: string;
  /** Heading above the scrollable photos. */
  ourStory: string;
  scrollDown: string;
  skip: string;
  photos: string;
  photo: string;
  enlargePhoto: string;
  enlargeInvitation: string;
  /** Description of the Save the Date picture for screen readers. */
  invitationAlt: string;
  googleCalendar: string;
  appleOutlook: string;
  map: string;
  viewPhotosAgain: string;
  close: string;
  previous: string;
  next: string;
  musicOn: string;
  musicOff: string;
  /** Accessible name of the language switch. */
  language: string;
}
