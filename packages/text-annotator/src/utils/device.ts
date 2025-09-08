import { UAParser } from 'ua-parser-js';
import { OS } from 'ua-parser-js/enums';

const ua = UAParser();
export const isMac = ua.os.is(OS.MACOS);
