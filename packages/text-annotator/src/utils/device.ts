export const isMac = typeof navigator !== 'undefined' &&
  // @ts-ignore
  /mac/i.test(navigator.userAgentData ? navigator.userAgentData.platform : navigator.platform);
