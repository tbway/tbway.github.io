var nVer = navigator.appVersion;
var nAgt = navigator.userAgent;
var browserName  = navigator.appName;
var fullVersion  = ''+parseFloat(navigator.appVersion); 
var majorVersion = parseInt(navigator.appVersion,10);
var nameOffset,verOffset,ix,detectedString;

function isIE() { return ((navigator.appName == 'Microsoft Internet Explorer') || ((navigator.appName == 'Netscape') && (new RegExp("Trident/.*rv:([0-9]{1,}[\.0-9]{0,})").exec(navigator.userAgent) != null))); }

function getInternetExplorerVersion()
{
  var rv = -1;
  if (navigator.appName == 'Microsoft Internet Explorer')
  {
    var ua = navigator.userAgent;
    var re = new RegExp("MSIE ([0-9]{1,}[\\.0-9]{0,})");
    if (re.exec(ua) != null)
      rv = parseFloat( RegExp.$1 );
  }
  else if (navigator.appName == 'Netscape')
  {
    var ua = navigator.userAgent;
    var re  = new RegExp("Trident/.*rv:([0-9]{1,}[\\.0-9]{0,})");
    if (re.exec(ua) != null)
      rv = parseFloat( RegExp.$1 );
  }
  return rv;
}

function isCanvasSupported(){
  var elem = document.createElement('canvas');
  return !!(elem.getContext && elem.getContext('2d'));
}

function isGetUserMediaSupported(){
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        return true;
    } else {
        return false;
    }
}

function supportsVideoType(type) {
  let video;

  // Allow user to create shortcuts, i.e. just "webm"
  let formats = {
    ogg: 'video/ogg; codecs="theora"',
    h264_1: 'video/mp4; codecs="avc1.42E01E"',
    h264_2: 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"',
    webm: 'video/webm; codecs="vp8, vorbis"',
    vp9: 'video/webm; codecs="vp9"',
    hls: 'application/x-mpegURL; codecs="avc1.42E01E"',
    mp4: 'video/mp4; codecs="mp4v.20.8"'
  };

  if(!video) {
    video = document.createElement('video')
  }

  return video.canPlayType(formats[type] || type);
}

// Usage
function supportsH264_1() {
 if(supportsVideoType('h264_1') === "probably") {
   // Set the video to webm
   return true;
 }
 else {
   // Set the video to mpeg or mp4
   return false;
 }
}

function supportsH264_2() {
 if(supportsVideoType('h264_2') === "probably") {
   // Set the video to webm
   return true;
 }
 else {
   // Set the video to mpeg or mp4
   return false;
 }
}

function supportsVideoTags() {
   // look here
   // https://stackoverflow.com/questions/3570502/how-to-check-for-html5-video-support
}


// In Opera 15+, the true version is after "OPR/" 
if ((verOffseisIEt=nAgt.indexOf("Edge/"))!=-1) {
 detectedString = "Edge/";
 browserName = "Microsoft Edge";
 fullVersion = nAgt.substring(verOffset+5);
}
// In Opera 15+, the true version is after "OPR/" 
else if ((verOffset=nAgt.indexOf("OPR/"))!=-1) {
 detectedString = "OPR/";
 browserName = "Opera";
 fullVersion = nAgt.substring(verOffset+4);
}
// In older Opera, the true version is after "Opera" or after "Version"
else if ((verOffset=nAgt.indexOf("Opera"))!=-1) {
 detectedString = "Opera";
 browserName = "Opera";
 fullVersion = nAgt.substring(verOffset+6);
 if ((verOffset=nAgt.indexOf("Version"))!=-1) 
   fullVersion = nAgt.substring(verOffset+8);
}
// In MSIE, the true version is after "MSIE" in userAgent
else if ((verOffset=nAgt.indexOf("MSIE"))!=-1) {
 browserName = "Microsoft Internet Explorer";
 fullVersion = nAgt.substring(verOffset+5);
}
// In Chrome, the true version is after "Chrome" 
else if ((verOffset=nAgt.indexOf("Chrome"))!=-1) {
 detectedString = "Chrome";
 browserName = "Google Chrome";
 fullVersion = nAgt.substring(verOffset+7);
}
// In Safari, the true version is after "Safari" or after "Version" 
else if ((verOffset=nAgt.indexOf("Safari"))!=-1) {
 detectedString = "Safari";
 browserName = "Safari";
 fullVersion = nAgt.substring(verOffset+7);
 if ((verOffset=nAgt.indexOf("Version"))!=-1) 
   fullVersion = nAgt.substring(verOffset+8);
}
// In Firefox, the true version is after "Firefox" 
else if ((verOffset=nAgt.indexOf("Firefox"))!=-1) {
 detectedString = "Firefox";
 browserName = "Mozilla Firefox";
 fullVersion = nAgt.substring(verOffset+8);
}
// In most other browsers, "name/version" is at the end of userAgent 
else if ( (nameOffset=nAgt.lastIndexOf(' ')+1) < (verOffset=nAgt.lastIndexOf('/')) ) 
{
 detectedString = "none, relying on final name/version string";
 browserName = nAgt.substring(nameOffset,verOffset);
 fullVersion = nAgt.substring(verOffset+1);
 if (browserName.toLowerCase()==browserName.toUpperCase()) {
  browserName = navigator.appName;
 }
}
// Internet explorer 11 got harder to detect
else if (isIE()) {
 detectedString = "appName==Netscape and userAgent==Trident/";
 browserName = "Microsoft Internet Explorer";
 fullVersion = getInternetExplorerVersion()
}
// trim the fullVersion string at semicolon/space if present
//if ((ix=fullVersion.indexOf(';'))!=-1) fullVersion=fullVersion.substring(0,ix);
//if ((ix=fullVersion.indexOf(' '))!=-1) fullVersion=fullVersion.substring(0,ix);

majorVersion = parseInt(''+fullVersion,10);
if (isNaN(majorVersion)) {
 fullVersion  = ''+parseFloat(navigator.appVersion); 
 majorVersion = parseInt(navigator.appVersion,10);
}

