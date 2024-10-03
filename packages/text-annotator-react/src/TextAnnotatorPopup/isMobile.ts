// https://stackoverflow.com/questions/21741841/detecting-ios-android-operating-system
export const isMobile = () => {
  // @ts-ignore
  var userAgent: string = navigator.userAgent || navigator.vendor || window.opera;

  if (/android/i.test(userAgent)) 
    return true;

  // @ts-ignore
  // Note: as of recently, this NO LONGER DETECTS FIREFOX ON iOS!
  // This means FF/iOS will behave like on the desktop, and loose
  // selection handlebars after the popup opens.
  if (/iPad|iPhone/.test(userAgent) && !window.MSStream)
    return true;

  return false;
}