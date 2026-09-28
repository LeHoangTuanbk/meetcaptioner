const MEETING_ENDED_SELECTOR = '[data-call-ended="true"]';

/** Uses Meet's locale-independent post-call state marker. */
export const isMeetingEndedPage = (): boolean =>
  Boolean(document.querySelector(MEETING_ENDED_SELECTOR));
