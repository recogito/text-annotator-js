import { UAParser } from 'ua-parser-js';
import { OSName } from 'ua-parser-js/enums';

const ua = UAParser();
export const isMac = ua.os.is(OSName.MACOS);
