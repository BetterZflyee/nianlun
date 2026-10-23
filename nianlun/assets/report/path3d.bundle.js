(()=>{/**
 * @license
 * Copyright 2010-2026 Three.js Authors
 * SPDX-License-Identifier: MIT
 */var Hc=0,nl=1,Wc=2;var Is=1,Xc=2,Fr=3,Hi=0,Pt=1,pi=2,mi=0,Br=1,ol=2,ll=3,cl=4,jc=5;var ar=100,qc=101,Yc=102,Zc=103,Jc=104,Kc=200,$c=201,Qc=202,eh=203,hl=204,ul=205,th=206,ih=207,rh=208,sh=209,ah=210,nh=211,oh=212,lh=213,ch=214,xa=0,ya=1,Sa=2,wr=3,Ma=4,ba=5,Ta=6,wa=7,bn=0,hh=1,uh=2,ii=0,dl=1,pl=2,ml=3,fl=4,gl=5,_l=6,vl=7;var xl=300,Wi=301,nr=302,Tn=303,wn=304,Ps=306,Ea=1e3,ci=1001,Aa=1002,bt=1003,dh=1004;var Ls=1005;var wt=1006,En=1007;var Xi=1008;var Ot=1009,yl=1010,Sl=1011,zr=1012,An=1013,ri=1014,si=1015,ai=1016,Cn=1017,Rn=1018,Gr=1020,Ml=35902,bl=35899,Tl=1021,wl=1022,Yt=1023,ui=1026,ji=1027,El=1028,In=1029,qi=1030,Pn=1031;var Ln=1033,Ns=33776,Us=33777,Ds=33778,Os=33779,Nn=35840,Un=35841,Dn=35842,On=35843,Fn=36196,Bn=37492,zn=37496,Gn=37488,Vn=37489,Fs=37490,kn=37491,Hn=37808,Wn=37809,Xn=37810,jn=37811,qn=37812,Yn=37813,Zn=37814,Jn=37815,Kn=37816,$n=37817,Qn=37818,eo=37819,to=37820,io=37821,ro=36492,so=36494,ao=36495,no=36283,oo=36284,Bs=36285,lo=36286;var is=2300,Ca=2301,ga=2302,Zo=2303,Jo=2400,Ko=2401,$o=2402;var ph=3200;var co=0,mh=1,Ri="",zt="srgb",rs="srgb-linear",ss="linear",st="srgb";var _a=7680;var fh=519,gh=512,_h=513,vh=514,ho=515,xh=516,yh=517,uo=518,Sh=519,Mh=35044;var Al="300 es",Xt=2e3,Er=2001;function gu(r){for(let e=r.length-1;e>=0;--e)if(r[e]>=65535)return!0;return!1}function _u(r){return ArrayBuffer.isView(r)&&!(r instanceof DataView)}function as(r){return document.createElementNS("http://www.w3.org/1999/xhtml",r)}function bh(){let r=as("canvas");return r.style.display="block",r}var hc={},Ar=null;function Cl(...r){let e="THREE."+r.shift();Ar?Ar("log",e,...r):console.log(e,...r)}function Th(r){let e=r[0];if(typeof e=="string"&&e.startsWith("TSL:")){let t=r[1];t&&t.isStackTrace?r[0]+=" "+t.getLocation():r[1]='Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.'}return r}function Ue(...r){r=Th(r);let e="THREE."+r.shift();if(Ar)Ar("warn",e,...r);else{let t=r[0];t&&t.isStackTrace?console.warn(t.getError(e)):console.warn(e,...r)}}function Fe(...r){r=Th(r);let e="THREE."+r.shift();if(Ar)Ar("error",e,...r);else{let t=r[0];t&&t.isStackTrace?console.error(t.getError(e)):console.error(e,...r)}}function er(...r){let e=r.join(" ");e in hc||(hc[e]=!0,Ue(...r))}function wh(r,e,t){return new Promise(function(i,s){function a(){switch(r.clientWaitSync(e,r.SYNC_FLUSH_COMMANDS_BIT,0)){case r.WAIT_FAILED:s();break;case r.TIMEOUT_EXPIRED:setTimeout(a,t);break;default:i()}}setTimeout(a,t)})}var Eh={[xa]:ya,[Sa]:Ta,[Ma]:wa,[wr]:ba,[ya]:xa,[Ta]:Sa,[wa]:Ma,[ba]:wr},di=class{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});let i=this._listeners;i[e]===void 0&&(i[e]=[]),i[e].indexOf(t)===-1&&i[e].push(t)}hasEventListener(e,t){let i=this._listeners;return i===void 0?!1:i[e]!==void 0&&i[e].indexOf(t)!==-1}removeEventListener(e,t){let i=this._listeners;if(i===void 0)return;let s=i[e];if(s!==void 0){let a=s.indexOf(t);a!==-1&&s.splice(a,1)}}dispatchEvent(e){let t=this._listeners;if(t===void 0)return;let i=t[e.type];if(i!==void 0){e.target=this;let s=i.slice(0);for(let a=0,n=s.length;a<n;a++)s[a].call(this,e);e.target=null}}},At=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"];var va=Math.PI/180,Ra=180/Math.PI;function Vr(){let r=Math.random()*4294967295|0,e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,i=Math.random()*4294967295|0;return(At[r&255]+At[r>>8&255]+At[r>>16&255]+At[r>>24&255]+"-"+At[e&255]+At[e>>8&255]+"-"+At[e>>16&15|64]+At[e>>24&255]+"-"+At[t&63|128]+At[t>>8&255]+"-"+At[t>>16&255]+At[t>>24&255]+At[i&255]+At[i>>8&255]+At[i>>16&255]+At[i>>24&255]).toLowerCase()}function Ke(r,e,t){return Math.max(e,Math.min(t,r))}function vu(r,e){return(r%e+e)%e}function Mo(r,e,t){return(1-t)*r+t*e}function qr(r,e){switch(e.constructor){case Float32Array:return r;case Uint32Array:return r/4294967295;case Uint16Array:return r/65535;case Uint8Array:case Uint8ClampedArray:return r/255;case Int32Array:return Math.max(r/2147483647,-1);case Int16Array:return Math.max(r/32767,-1);case Int8Array:return Math.max(r/127,-1);default:throw new Error("THREE.MathUtils: Invalid component type.")}}function Lt(r,e){switch(e.constructor){case Float32Array:return r;case Uint32Array:return Math.round(r*4294967295);case Uint16Array:return Math.round(r*65535);case Uint8Array:case Uint8ClampedArray:return Math.round(r*255);case Int32Array:return Math.round(r*2147483647);case Int16Array:return Math.round(r*32767);case Int8Array:return Math.round(r*127);default:throw new Error("THREE.MathUtils: Invalid component type.")}}var Ul=class Ul{constructor(e=0,t=0){this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw new Error("THREE.Vector2: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw new Error("THREE.Vector2: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){let t=this.x,i=this.y,s=e.elements;return this.x=s[0]*t+s[3]*i+s[6],this.y=s[1]*t+s[4]*i+s[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=Ke(this.x,e.x,t.x),this.y=Ke(this.y,e.y,t.y),this}clampScalar(e,t){return this.x=Ke(this.x,e,t),this.y=Ke(this.y,e,t),this}clampLength(e,t){let i=this.length();return this.divideScalar(i||1).multiplyScalar(Ke(i,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let i=this.dot(e)/t;return Math.acos(Ke(i,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,i=this.y-e.y;return t*t+i*i}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){let i=Math.cos(t),s=Math.sin(t),a=this.x-e.x,n=this.y-e.y;return this.x=a*i-n*s+e.x,this.y=a*s+n*i+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}};Ul.prototype.isVector2=!0;var ae=Ul,qt=class{constructor(e=0,t=0,i=0,s=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=i,this._w=s}static slerpFlat(e,t,i,s,a,n,o){let l=i[s+0],c=i[s+1],h=i[s+2],m=i[s+3],u=a[n+0],d=a[n+1],g=a[n+2],S=a[n+3];if(m!==S||l!==u||c!==d||h!==g){let f=l*u+c*d+h*g+m*S;f<0&&(u=-u,d=-d,g=-g,S=-S,f=-f);let p=1-o;if(f<.9995){let y=Math.acos(f),E=Math.sin(y);p=Math.sin(p*y)/E,o=Math.sin(o*y)/E,l=l*p+u*o,c=c*p+d*o,h=h*p+g*o,m=m*p+S*o}else{l=l*p+u*o,c=c*p+d*o,h=h*p+g*o,m=m*p+S*o;let y=1/Math.sqrt(l*l+c*c+h*h+m*m);l*=y,c*=y,h*=y,m*=y}}e[t]=l,e[t+1]=c,e[t+2]=h,e[t+3]=m}static multiplyQuaternionsFlat(e,t,i,s,a,n){let o=i[s],l=i[s+1],c=i[s+2],h=i[s+3],m=a[n],u=a[n+1],d=a[n+2],g=a[n+3];return e[t]=o*g+h*m+l*d-c*u,e[t+1]=l*g+h*u+c*m-o*d,e[t+2]=c*g+h*d+o*u-l*m,e[t+3]=h*g-o*m-l*u-c*d,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,i,s){return this._x=e,this._y=t,this._z=i,this._w=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){let i=e._x,s=e._y,a=e._z,n=e._order,o=Math.cos,l=Math.sin,c=o(i/2),h=o(s/2),m=o(a/2),u=l(i/2),d=l(s/2),g=l(a/2);switch(n){case"XYZ":this._x=u*h*m+c*d*g,this._y=c*d*m-u*h*g,this._z=c*h*g+u*d*m,this._w=c*h*m-u*d*g;break;case"YXZ":this._x=u*h*m+c*d*g,this._y=c*d*m-u*h*g,this._z=c*h*g-u*d*m,this._w=c*h*m+u*d*g;break;case"ZXY":this._x=u*h*m-c*d*g,this._y=c*d*m+u*h*g,this._z=c*h*g+u*d*m,this._w=c*h*m-u*d*g;break;case"ZYX":this._x=u*h*m-c*d*g,this._y=c*d*m+u*h*g,this._z=c*h*g-u*d*m,this._w=c*h*m+u*d*g;break;case"YZX":this._x=u*h*m+c*d*g,this._y=c*d*m+u*h*g,this._z=c*h*g-u*d*m,this._w=c*h*m-u*d*g;break;case"XZY":this._x=u*h*m-c*d*g,this._y=c*d*m-u*h*g,this._z=c*h*g+u*d*m,this._w=c*h*m+u*d*g;break;default:Ue("Quaternion: .setFromEuler() encountered an unknown order: "+n)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){let i=t/2,s=Math.sin(i);return this._x=e.x*s,this._y=e.y*s,this._z=e.z*s,this._w=Math.cos(i),this._onChangeCallback(),this}setFromRotationMatrix(e){let t=e.elements,i=t[0],s=t[4],a=t[8],n=t[1],o=t[5],l=t[9],c=t[2],h=t[6],m=t[10],u=i+o+m;if(u>0){let d=.5/Math.sqrt(u+1);this._w=.25/d,this._x=(h-l)*d,this._y=(a-c)*d,this._z=(n-s)*d}else if(i>o&&i>m){let d=2*Math.sqrt(1+i-o-m);this._w=(h-l)/d,this._x=.25*d,this._y=(s+n)/d,this._z=(a+c)/d}else if(o>m){let d=2*Math.sqrt(1+o-i-m);this._w=(a-c)/d,this._x=(s+n)/d,this._y=.25*d,this._z=(l+h)/d}else{let d=2*Math.sqrt(1+m-i-o);this._w=(n-s)/d,this._x=(a+c)/d,this._y=(l+h)/d,this._z=.25*d}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let i=e.dot(t)+1;return i<1e-8?(i=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=i):(this._x=0,this._y=-e.z,this._z=e.y,this._w=i)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=i),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(Ke(this.dot(e),-1,1)))}rotateTowards(e,t){let i=this.angleTo(e);if(i===0)return this;let s=Math.min(1,t/i);return this.slerp(e,s),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){let i=e._x,s=e._y,a=e._z,n=e._w,o=t._x,l=t._y,c=t._z,h=t._w;return this._x=i*h+n*o+s*c-a*l,this._y=s*h+n*l+a*o-i*c,this._z=a*h+n*c+i*l-s*o,this._w=n*h-i*o-s*l-a*c,this._onChangeCallback(),this}slerp(e,t){let i=e._x,s=e._y,a=e._z,n=e._w,o=this.dot(e);o<0&&(i=-i,s=-s,a=-a,n=-n,o=-o);let l=1-t;if(o<.9995){let c=Math.acos(o),h=Math.sin(c);l=Math.sin(l*c)/h,t=Math.sin(t*c)/h,this._x=this._x*l+i*t,this._y=this._y*l+s*t,this._z=this._z*l+a*t,this._w=this._w*l+n*t,this._onChangeCallback()}else this._x=this._x*l+i*t,this._y=this._y*l+s*t,this._z=this._z*l+a*t,this._w=this._w*l+n*t,this.normalize();return this}slerpQuaternions(e,t,i){return this.copy(e).slerp(t,i)}random(){let e=2*Math.PI*Math.random(),t=2*Math.PI*Math.random(),i=Math.random(),s=Math.sqrt(1-i),a=Math.sqrt(i);return this.set(s*Math.sin(e),s*Math.cos(e),a*Math.sin(t),a*Math.cos(t))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}},Dl=class Dl{constructor(e=0,t=0,i=0){this.x=e,this.y=t,this.z=i}set(e,t,i){return i===void 0&&(i=this.z),this.x=e,this.y=t,this.z=i,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw new Error("THREE.Vector3: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("THREE.Vector3: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(uc.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(uc.setFromAxisAngle(e,t))}applyMatrix3(e){let t=this.x,i=this.y,s=this.z,a=e.elements;return this.x=a[0]*t+a[3]*i+a[6]*s,this.y=a[1]*t+a[4]*i+a[7]*s,this.z=a[2]*t+a[5]*i+a[8]*s,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){let t=this.x,i=this.y,s=this.z,a=e.elements,n=1/(a[3]*t+a[7]*i+a[11]*s+a[15]);return this.x=(a[0]*t+a[4]*i+a[8]*s+a[12])*n,this.y=(a[1]*t+a[5]*i+a[9]*s+a[13])*n,this.z=(a[2]*t+a[6]*i+a[10]*s+a[14])*n,this}applyQuaternion(e){let t=this.x,i=this.y,s=this.z,a=e.x,n=e.y,o=e.z,l=e.w,c=2*(n*s-o*i),h=2*(o*t-a*s),m=2*(a*i-n*t);return this.x=t+l*c+n*m-o*h,this.y=i+l*h+o*c-a*m,this.z=s+l*m+a*h-n*c,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){let t=this.x,i=this.y,s=this.z,a=e.elements;return this.x=a[0]*t+a[4]*i+a[8]*s,this.y=a[1]*t+a[5]*i+a[9]*s,this.z=a[2]*t+a[6]*i+a[10]*s,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=Ke(this.x,e.x,t.x),this.y=Ke(this.y,e.y,t.y),this.z=Ke(this.z,e.z,t.z),this}clampScalar(e,t){return this.x=Ke(this.x,e,t),this.y=Ke(this.y,e,t),this.z=Ke(this.z,e,t),this}clampLength(e,t){let i=this.length();return this.divideScalar(i||1).multiplyScalar(Ke(i,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this.z=e.z+(t.z-e.z)*i,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){let i=e.x,s=e.y,a=e.z,n=t.x,o=t.y,l=t.z;return this.x=s*l-a*o,this.y=a*n-i*l,this.z=i*o-s*n,this}projectOnVector(e){let t=e.lengthSq();if(t===0)return this.set(0,0,0);let i=e.dot(this)/t;return this.copy(e).multiplyScalar(i)}projectOnPlane(e){return bo.copy(this).projectOnVector(e),this.sub(bo)}reflect(e){return this.sub(bo.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let i=this.dot(e)/t;return Math.acos(Ke(i,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,i=this.y-e.y,s=this.z-e.z;return t*t+i*i+s*s}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,i){let s=Math.sin(t)*e;return this.x=s*Math.sin(i),this.y=Math.cos(t)*e,this.z=s*Math.cos(i),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,i){return this.x=e*Math.sin(t),this.y=i,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){let t=this.setFromMatrixColumn(e,0).length(),i=this.setFromMatrixColumn(e,1).length(),s=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=i,this.z=s,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let e=Math.random()*Math.PI*2,t=Math.random()*2-1,i=Math.sqrt(1-t*t);return this.x=i*Math.cos(e),this.y=t,this.z=i*Math.sin(e),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}};Dl.prototype.isVector3=!0;var R=Dl,bo=new R,uc=new qt,Ol=class Ol{constructor(e,t,i,s,a,n,o,l,c){this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,i,s,a,n,o,l,c)}set(e,t,i,s,a,n,o,l,c){let h=this.elements;return h[0]=e,h[1]=s,h[2]=o,h[3]=t,h[4]=a,h[5]=l,h[6]=i,h[7]=n,h[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){let t=this.elements,i=e.elements;return t[0]=i[0],t[1]=i[1],t[2]=i[2],t[3]=i[3],t[4]=i[4],t[5]=i[5],t[6]=i[6],t[7]=i[7],t[8]=i[8],this}extractBasis(e,t,i){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),i.setFromMatrix3Column(this,2),this}setFromMatrix4(e){let t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let i=e.elements,s=t.elements,a=this.elements,n=i[0],o=i[3],l=i[6],c=i[1],h=i[4],m=i[7],u=i[2],d=i[5],g=i[8],S=s[0],f=s[3],p=s[6],y=s[1],E=s[4],x=s[7],T=s[2],b=s[5],A=s[8];return a[0]=n*S+o*y+l*T,a[3]=n*f+o*E+l*b,a[6]=n*p+o*x+l*A,a[1]=c*S+h*y+m*T,a[4]=c*f+h*E+m*b,a[7]=c*p+h*x+m*A,a[2]=u*S+d*y+g*T,a[5]=u*f+d*E+g*b,a[8]=u*p+d*x+g*A,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){let e=this.elements,t=e[0],i=e[1],s=e[2],a=e[3],n=e[4],o=e[5],l=e[6],c=e[7],h=e[8];return t*n*h-t*o*c-i*a*h+i*o*l+s*a*c-s*n*l}invert(){let e=this.elements,t=e[0],i=e[1],s=e[2],a=e[3],n=e[4],o=e[5],l=e[6],c=e[7],h=e[8],m=h*n-o*c,u=o*l-h*a,d=c*a-n*l,g=t*m+i*u+s*d;if(g===0)return this.set(0,0,0,0,0,0,0,0,0);let S=1/g;return e[0]=m*S,e[1]=(s*c-h*i)*S,e[2]=(o*i-s*n)*S,e[3]=u*S,e[4]=(h*t-s*l)*S,e[5]=(s*a-o*t)*S,e[6]=d*S,e[7]=(i*l-c*t)*S,e[8]=(n*t-i*a)*S,this}transpose(){let e,t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){let t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,i,s,a,n,o){let l=Math.cos(a),c=Math.sin(a);return this.set(i*l,i*c,-i*(l*n+c*o)+n+e,-s*c,s*l,-s*(-c*n+l*o)+o+t,0,0,1),this}scale(e,t){return er("Matrix3: .scale() is deprecated. Use .makeScale() instead."),this.premultiply(To.makeScale(e,t)),this}rotate(e){return er("Matrix3: .rotate() is deprecated. Use .makeRotation() instead."),this.premultiply(To.makeRotation(-e)),this}translate(e,t){return er("Matrix3: .translate() is deprecated. Use .makeTranslation() instead."),this.premultiply(To.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){let t=Math.cos(e),i=Math.sin(e);return this.set(t,-i,0,i,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){let t=this.elements,i=e.elements;for(let s=0;s<9;s++)if(t[s]!==i[s])return!1;return!0}fromArray(e,t=0){for(let i=0;i<9;i++)this.elements[i]=e[i+t];return this}toArray(e=[],t=0){let i=this.elements;return e[t]=i[0],e[t+1]=i[1],e[t+2]=i[2],e[t+3]=i[3],e[t+4]=i[4],e[t+5]=i[5],e[t+6]=i[6],e[t+7]=i[7],e[t+8]=i[8],e}clone(){return new this.constructor().fromArray(this.elements)}};Ol.prototype.isMatrix3=!0;var ke=Ol,To=new ke,dc=new ke().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),pc=new ke().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function xu(){let r={enabled:!0,workingColorSpace:rs,spaces:{},convert:function(s,a,n){return this.enabled===!1||a===n||!a||!n||(this.spaces[a].transfer===st&&(s.r=Ti(s.r),s.g=Ti(s.g),s.b=Ti(s.b)),this.spaces[a].primaries!==this.spaces[n].primaries&&(s.applyMatrix3(this.spaces[a].toXYZ),s.applyMatrix3(this.spaces[n].fromXYZ)),this.spaces[n].transfer===st&&(s.r=Tr(s.r),s.g=Tr(s.g),s.b=Tr(s.b))),s},workingToColorSpace:function(s,a){return this.convert(s,this.workingColorSpace,a)},colorSpaceToWorking:function(s,a){return this.convert(s,a,this.workingColorSpace)},getPrimaries:function(s){return this.spaces[s].primaries},getTransfer:function(s){return s===Ri?ss:this.spaces[s].transfer},getToneMappingMode:function(s){return this.spaces[s].outputColorSpaceConfig.toneMappingMode||"standard"},getLuminanceCoefficients:function(s,a=this.workingColorSpace){return s.fromArray(this.spaces[a].luminanceCoefficients)},define:function(s){Object.assign(this.spaces,s)},_getMatrix:function(s,a,n){return s.copy(this.spaces[a].toXYZ).multiply(this.spaces[n].fromXYZ)},_getDrawingBufferColorSpace:function(s){return this.spaces[s].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(s=this.workingColorSpace){return this.spaces[s].workingColorSpaceConfig.unpackColorSpace},fromWorkingColorSpace:function(s,a){return er("ColorManagement: .fromWorkingColorSpace() has been renamed to .workingToColorSpace()."),r.workingToColorSpace(s,a)},toWorkingColorSpace:function(s,a){return er("ColorManagement: .toWorkingColorSpace() has been renamed to .colorSpaceToWorking()."),r.colorSpaceToWorking(s,a)}},e=[.64,.33,.3,.6,.15,.06],t=[.2126,.7152,.0722],i=[.3127,.329];return r.define({[rs]:{primaries:e,whitePoint:i,transfer:ss,toXYZ:dc,fromXYZ:pc,luminanceCoefficients:t,workingColorSpaceConfig:{unpackColorSpace:zt},outputColorSpaceConfig:{drawingBufferColorSpace:zt}},[zt]:{primaries:e,whitePoint:i,transfer:st,toXYZ:dc,fromXYZ:pc,luminanceCoefficients:t,outputColorSpaceConfig:{drawingBufferColorSpace:zt}}}),r}var et=xu();function Ti(r){return r<.04045?r*.0773993808:Math.pow(r*.9478672986+.0521327014,2.4)}function Tr(r){return r<.0031308?r*12.92:1.055*Math.pow(r,.41666)-.055}var ur,Ia=class{static getDataURL(e,t="image/png"){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>"u")return e.src;let i;if(e instanceof HTMLCanvasElement)i=e;else{ur===void 0&&(ur=as("canvas")),ur.width=e.width,ur.height=e.height;let s=ur.getContext("2d");e instanceof ImageData?s.putImageData(e,0,0):s.drawImage(e,0,0,e.width,e.height),i=ur}return i.toDataURL(t)}static sRGBToLinear(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap){let t=as("canvas");t.width=e.width,t.height=e.height;let i=t.getContext("2d");i.drawImage(e,0,0,e.width,e.height);let s=i.getImageData(0,0,e.width,e.height),a=s.data;for(let n=0;n<a.length;n++)a[n]=Ti(a[n]/255)*255;return i.putImageData(s,0,0),t}else if(e.data){let t=e.data.slice(0);for(let i=0;i<t.length;i++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[i]=Math.floor(Ti(t[i]/255)*255):t[i]=Ti(t[i]);return{data:t,width:e.width,height:e.height}}else return Ue("ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),e}},yu=0,Cr=class{constructor(e=null){this.isTextureSource=!0,Object.defineProperty(this,"id",{value:yu++}),this.uuid=Vr(),this.data=e,this.dataReady=!0,this.version=0}getSize(e){let t=this.data;return typeof HTMLVideoElement<"u"&&t instanceof HTMLVideoElement?e.set(t.videoWidth,t.videoHeight,0):typeof VideoFrame<"u"&&t instanceof VideoFrame?e.set(t.displayWidth,t.displayHeight,0):t!==null?e.set(t.width,t.height,t.depth||0):e.set(0,0,0),e}set needsUpdate(e){e===!0&&this.version++}toJSON(e){let t=e===void 0||typeof e=="string";if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];let i={uuid:this.uuid,url:""},s=this.data;if(s!==null){let a;if(Array.isArray(s)){a=[];for(let n=0,o=s.length;n<o;n++)s[n].isDataTexture?a.push(wo(s[n].image)):a.push(wo(s[n]))}else a=wo(s);i.url=a}return t||(e.images[this.uuid]=i),i}};function wo(r){return typeof HTMLImageElement<"u"&&r instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&r instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&r instanceof ImageBitmap?Ia.getDataURL(r):r.data?{data:Array.from(r.data),width:r.width,height:r.height,type:r.data.constructor.name}:(Ue("Texture: Unable to serialize Texture."),{})}var Su=0,Eo=new R,Ut=class r extends di{constructor(e=r.DEFAULT_IMAGE,t=r.DEFAULT_MAPPING,i=ci,s=ci,a=wt,n=Xi,o=Yt,l=Ot,c=r.DEFAULT_ANISOTROPY,h=Ri){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:Su++}),this.uuid=Vr(),this.name="",this.source=new Cr(e),this.mipmaps=[],this.mapping=t,this.channel=0,this.wrapS=i,this.wrapT=s,this.magFilter=a,this.minFilter=n,this.anisotropy=c,this.format=o,this.internalFormat=null,this.type=l,this.offset=new ae(0,0),this.repeat=new ae(1,1),this.center=new ae(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new ke,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=h,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(e&&e.depth&&e.depth>1),this.pmremVersion=0,this.normalized=!1}get width(){return this.source.getSize(Eo).x}get height(){return this.source.getSize(Eo).y}get depth(){return this.source.getSize(Eo).z}get image(){return this.source.data}set image(e){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.normalized=e.normalized,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.renderTarget=e.renderTarget,this.isRenderTargetTexture=e.isRenderTargetTexture,this.isArrayTexture=e.isArrayTexture,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}setValues(e){for(let t in e){let i=e[t];if(i===void 0){Ue(`Texture.setValues(): parameter '${t}' has value of undefined.`);continue}let s=this[t];if(s===void 0){Ue(`Texture.setValues(): property '${t}' does not exist.`);continue}s&&i&&s.isVector2&&i.isVector2||s&&i&&s.isVector3&&i.isVector3||s&&i&&s.isMatrix3&&i.isMatrix3?s.copy(i):this[t]=i}}toJSON(e){let t=e===void 0||typeof e=="string";if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];let i={metadata:{version:4.7,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,normalized:this.normalized,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(i.userData=this.userData),t||(e.textures[this.uuid]=i),i}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(e){if(this.mapping!==xl)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case Ea:e.x=e.x-Math.floor(e.x);break;case ci:e.x=e.x<0?0:1;break;case Aa:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x=e.x-Math.floor(e.x);break}if(e.y<0||e.y>1)switch(this.wrapT){case Ea:e.y=e.y-Math.floor(e.y);break;case ci:e.y=e.y<0?0:1;break;case Aa:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y=e.y-Math.floor(e.y);break}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(e){e===!0&&this.pmremVersion++}};Ut.DEFAULT_IMAGE=null,Ut.DEFAULT_MAPPING=xl,Ut.DEFAULT_ANISOTROPY=1;var Fl=class Fl{constructor(e=0,t=0,i=0,s=1){this.x=e,this.y=t,this.z=i,this.w=s}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,i,s){return this.x=e,this.y=t,this.z=i,this.w=s,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw new Error("THREE.Vector4: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("THREE.Vector4: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w!==void 0?e.w:1,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){let t=this.x,i=this.y,s=this.z,a=this.w,n=e.elements;return this.x=n[0]*t+n[4]*i+n[8]*s+n[12]*a,this.y=n[1]*t+n[5]*i+n[9]*s+n[13]*a,this.z=n[2]*t+n[6]*i+n[10]*s+n[14]*a,this.w=n[3]*t+n[7]*i+n[11]*s+n[15]*a,this}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this.w/=e.w,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);let t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,i,s,a,n=e.elements,o=n[0],l=n[4],c=n[8],h=n[1],m=n[5],u=n[9],d=n[2],g=n[6],S=n[10];if(Math.abs(l-h)<.01&&Math.abs(c-d)<.01&&Math.abs(u-g)<.01){if(Math.abs(l+h)<.1&&Math.abs(c+d)<.1&&Math.abs(u+g)<.1&&Math.abs(o+m+S-3)<.1)return this.set(1,0,0,0),this;t=Math.PI;let p=(o+1)/2,y=(m+1)/2,E=(S+1)/2,x=(l+h)/4,T=(c+d)/4,b=(u+g)/4;return p>y&&p>E?p<.01?(i=0,s=.707106781,a=.707106781):(i=Math.sqrt(p),s=x/i,a=T/i):y>E?y<.01?(i=.707106781,s=0,a=.707106781):(s=Math.sqrt(y),i=x/s,a=b/s):E<.01?(i=.707106781,s=.707106781,a=0):(a=Math.sqrt(E),i=T/a,s=b/a),this.set(i,s,a,t),this}let f=Math.sqrt((g-u)*(g-u)+(c-d)*(c-d)+(h-l)*(h-l));return Math.abs(f)<.001&&(f=1),this.x=(g-u)/f,this.y=(c-d)/f,this.z=(h-l)/f,this.w=Math.acos((o+m+S-1)/2),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this.w=t[15],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=Ke(this.x,e.x,t.x),this.y=Ke(this.y,e.y,t.y),this.z=Ke(this.z,e.z,t.z),this.w=Ke(this.w,e.w,t.w),this}clampScalar(e,t){return this.x=Ke(this.x,e,t),this.y=Ke(this.y,e,t),this.z=Ke(this.z,e,t),this.w=Ke(this.w,e,t),this}clampLength(e,t){let i=this.length();return this.divideScalar(i||1).multiplyScalar(Ke(i,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this.z=e.z+(t.z-e.z)*i,this.w=e.w+(t.w-e.w)*i,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}};Fl.prototype.isVector4=!0;var lt=Fl,Pa=class extends di{constructor(e=1,t=1,i={}){super(),i=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:wt,depthBuffer:!0,stencilBuffer:!1,resolveColorBuffer:!0,resolveDepthBuffer:!0,resolveStencilBuffer:!0,storeMultisampledColorBuffer:!0,storeMultisampledDepthBuffer:!0,storeMultisampledStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1,useArrayDepthTexture:!1},i),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=i.depth,this.scissor=new lt(0,0,e,t),this.scissorTest=!1,this.viewport=new lt(0,0,e,t),this.textures=[];let s={width:e,height:t,depth:i.depth},a=new Ut(s),n=i.count;for(let o=0;o<n;o++)this.textures[o]=a.clone(),this.textures[o].isRenderTargetTexture=!0,this.textures[o].renderTarget=this;this._setTextureOptions(i),this.depthBuffer=i.depthBuffer,this.stencilBuffer=i.stencilBuffer,this.resolveColorBuffer=i.resolveColorBuffer,this.resolveDepthBuffer=i.resolveDepthBuffer,this.resolveStencilBuffer=i.resolveStencilBuffer,this.storeMultisampledColorBuffer=i.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=i.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=i.storeMultisampledStencilBuffer,this._depthTexture=null,this.depthTexture=i.depthTexture,this.samples=i.samples,this.multiview=i.multiview,this.useArrayDepthTexture=i.useArrayDepthTexture}_setTextureOptions(e={}){let t={minFilter:wt,generateMipmaps:!1,flipY:!1,internalFormat:null};e.mapping!==void 0&&(t.mapping=e.mapping),e.wrapS!==void 0&&(t.wrapS=e.wrapS),e.wrapT!==void 0&&(t.wrapT=e.wrapT),e.wrapR!==void 0&&(t.wrapR=e.wrapR),e.magFilter!==void 0&&(t.magFilter=e.magFilter),e.minFilter!==void 0&&(t.minFilter=e.minFilter),e.format!==void 0&&(t.format=e.format),e.type!==void 0&&(t.type=e.type),e.anisotropy!==void 0&&(t.anisotropy=e.anisotropy),e.colorSpace!==void 0&&(t.colorSpace=e.colorSpace),e.flipY!==void 0&&(t.flipY=e.flipY),e.generateMipmaps!==void 0&&(t.generateMipmaps=e.generateMipmaps),e.internalFormat!==void 0&&(t.internalFormat=e.internalFormat);for(let i=0;i<this.textures.length;i++)this.textures[i].setValues(t)}get texture(){return this.textures[0]}set texture(e){this.textures[0]=e}set depthTexture(e){this._depthTexture!==null&&this._depthTexture.renderTarget===this&&(this._depthTexture.renderTarget=null),e!==null&&e.renderTarget===null&&(e.renderTarget=this),this._depthTexture=e}get depthTexture(){return this._depthTexture}setSize(e,t,i=1){if(this.width!==e||this.height!==t||this.depth!==i){this.width=e,this.height=t,this.depth=i;for(let s=0,a=this.textures.length;s<a;s++)this.textures[s].image.width=e,this.textures[s].image.height=t,this.textures[s].image.depth=i,this.textures[s].isData3DTexture!==!0&&(this.textures[s].isArrayTexture=this.textures[s].image.depth>1);this.dispose()}this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.textures.length=0;for(let t=0,i=e.textures.length;t<i;t++){this.textures[t]=e.textures[t].clone(),this.textures[t].isRenderTargetTexture=!0,this.textures[t].renderTarget=this;let s=Object.assign({},e.textures[t].image);this.textures[t].source=new Cr(s)}if(this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,this.resolveColorBuffer=e.resolveColorBuffer,this.resolveDepthBuffer=e.resolveDepthBuffer,this.resolveStencilBuffer=e.resolveStencilBuffer,this.storeMultisampledColorBuffer=e.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=e.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=e.storeMultisampledStencilBuffer,e.depthTexture!==null)if(e.depthTexture.renderTarget===e){let t=e.depthTexture.clone();t.renderTarget=null,this.depthTexture=t}else this.depthTexture=e.depthTexture;return this.samples=e.samples,this.multiview=e.multiview,this.useArrayDepthTexture=e.useArrayDepthTexture,this}dispose(){this.dispatchEvent({type:"dispose"})}},Dt=class extends Pa{constructor(e=1,t=1,i={}){super(e,t,i),this.isWebGLRenderTarget=!0}},ns=class extends Ut{constructor(e=null,t=1,i=1,s=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:i,depth:s},this.magFilter=bt,this.minFilter=bt,this.wrapR=ci,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}copy(e){return super.copy(e),this.wrapR=e.wrapR,this}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}};var La=class extends Ut{constructor(e=null,t=1,i=1,s=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:i,depth:s},this.magFilter=bt,this.minFilter=bt,this.wrapR=ci,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}copy(e){return super.copy(e),this.wrapR=e.wrapR,this}};var Mn=class Mn{constructor(e,t,i,s,a,n,o,l,c,h,m,u,d,g,S,f){this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,i,s,a,n,o,l,c,h,m,u,d,g,S,f)}set(e,t,i,s,a,n,o,l,c,h,m,u,d,g,S,f){let p=this.elements;return p[0]=e,p[4]=t,p[8]=i,p[12]=s,p[1]=a,p[5]=n,p[9]=o,p[13]=l,p[2]=c,p[6]=h,p[10]=m,p[14]=u,p[3]=d,p[7]=g,p[11]=S,p[15]=f,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new Mn().fromArray(this.elements)}copy(e){let t=this.elements,i=e.elements;return t[0]=i[0],t[1]=i[1],t[2]=i[2],t[3]=i[3],t[4]=i[4],t[5]=i[5],t[6]=i[6],t[7]=i[7],t[8]=i[8],t[9]=i[9],t[10]=i[10],t[11]=i[11],t[12]=i[12],t[13]=i[13],t[14]=i[14],t[15]=i[15],this}copyPosition(e){let t=this.elements,i=e.elements;return t[12]=i[12],t[13]=i[13],t[14]=i[14],this}setFromMatrix3(e){let t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,i){return this.determinantAffine()===0?(e.set(1,0,0),t.set(0,1,0),i.set(0,0,1),this):(e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),i.setFromMatrixColumn(this,2),this)}makeBasis(e,t,i){return this.set(e.x,t.x,i.x,0,e.y,t.y,i.y,0,e.z,t.z,i.z,0,0,0,0,1),this}extractRotation(e){if(e.determinantAffine()===0)return this.identity();let t=this.elements,i=e.elements,s=1/dr.setFromMatrixColumn(e,0).length(),a=1/dr.setFromMatrixColumn(e,1).length(),n=1/dr.setFromMatrixColumn(e,2).length();return t[0]=i[0]*s,t[1]=i[1]*s,t[2]=i[2]*s,t[3]=0,t[4]=i[4]*a,t[5]=i[5]*a,t[6]=i[6]*a,t[7]=0,t[8]=i[8]*n,t[9]=i[9]*n,t[10]=i[10]*n,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){let t=this.elements,i=e.x,s=e.y,a=e.z,n=Math.cos(i),o=Math.sin(i),l=Math.cos(s),c=Math.sin(s),h=Math.cos(a),m=Math.sin(a);if(e.order==="XYZ"){let u=n*h,d=n*m,g=o*h,S=o*m;t[0]=l*h,t[4]=-l*m,t[8]=c,t[1]=d+g*c,t[5]=u-S*c,t[9]=-o*l,t[2]=S-u*c,t[6]=g+d*c,t[10]=n*l}else if(e.order==="YXZ"){let u=l*h,d=l*m,g=c*h,S=c*m;t[0]=u+S*o,t[4]=g*o-d,t[8]=n*c,t[1]=n*m,t[5]=n*h,t[9]=-o,t[2]=d*o-g,t[6]=S+u*o,t[10]=n*l}else if(e.order==="ZXY"){let u=l*h,d=l*m,g=c*h,S=c*m;t[0]=u-S*o,t[4]=-n*m,t[8]=g+d*o,t[1]=d+g*o,t[5]=n*h,t[9]=S-u*o,t[2]=-n*c,t[6]=o,t[10]=n*l}else if(e.order==="ZYX"){let u=n*h,d=n*m,g=o*h,S=o*m;t[0]=l*h,t[4]=g*c-d,t[8]=u*c+S,t[1]=l*m,t[5]=S*c+u,t[9]=d*c-g,t[2]=-c,t[6]=o*l,t[10]=n*l}else if(e.order==="YZX"){let u=n*l,d=n*c,g=o*l,S=o*c;t[0]=l*h,t[4]=S-u*m,t[8]=g*m+d,t[1]=m,t[5]=n*h,t[9]=-o*h,t[2]=-c*h,t[6]=d*m+g,t[10]=u-S*m}else if(e.order==="XZY"){let u=n*l,d=n*c,g=o*l,S=o*c;t[0]=l*h,t[4]=-m,t[8]=c*h,t[1]=u*m+S,t[5]=n*h,t[9]=d*m-g,t[2]=g*m-d,t[6]=o*h,t[10]=S*m+u}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(Mu,e,bu)}lookAt(e,t,i){let s=this.elements;return Ft.subVectors(e,t),Ft.lengthSq()===0&&(Ft.z=1),Ft.normalize(),Li.crossVectors(i,Ft),Li.lengthSq()===0&&(Math.abs(i.z)===1?Ft.x+=1e-4:Ft.z+=1e-4,Ft.normalize(),Li.crossVectors(i,Ft)),Li.normalize(),Ws.crossVectors(Ft,Li),s[0]=Li.x,s[4]=Ws.x,s[8]=Ft.x,s[1]=Li.y,s[5]=Ws.y,s[9]=Ft.y,s[2]=Li.z,s[6]=Ws.z,s[10]=Ft.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let i=e.elements,s=t.elements,a=this.elements,n=i[0],o=i[4],l=i[8],c=i[12],h=i[1],m=i[5],u=i[9],d=i[13],g=i[2],S=i[6],f=i[10],p=i[14],y=i[3],E=i[7],x=i[11],T=i[15],b=s[0],A=s[4],_=s[8],w=s[12],I=s[1],L=s[5],U=s[9],V=s[13],P=s[2],H=s[6],Y=s[10],z=s[14],J=s[3],X=s[7],Z=s[11],Q=s[15];return a[0]=n*b+o*I+l*P+c*J,a[4]=n*A+o*L+l*H+c*X,a[8]=n*_+o*U+l*Y+c*Z,a[12]=n*w+o*V+l*z+c*Q,a[1]=h*b+m*I+u*P+d*J,a[5]=h*A+m*L+u*H+d*X,a[9]=h*_+m*U+u*Y+d*Z,a[13]=h*w+m*V+u*z+d*Q,a[2]=g*b+S*I+f*P+p*J,a[6]=g*A+S*L+f*H+p*X,a[10]=g*_+S*U+f*Y+p*Z,a[14]=g*w+S*V+f*z+p*Q,a[3]=y*b+E*I+x*P+T*J,a[7]=y*A+E*L+x*H+T*X,a[11]=y*_+E*U+x*Y+T*Z,a[15]=y*w+E*V+x*z+T*Q,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){let e=this.elements,t=e[0],i=e[4],s=e[8],a=e[12],n=e[1],o=e[5],l=e[9],c=e[13],h=e[2],m=e[6],u=e[10],d=e[14],g=e[3],S=e[7],f=e[11],p=e[15],y=l*d-c*u,E=o*d-c*m,x=o*u-l*m,T=n*d-c*h,b=n*u-l*h,A=n*m-o*h;return t*(S*y-f*E+p*x)-i*(g*y-f*T+p*b)+s*(g*E-S*T+p*A)-a*(g*x-S*b+f*A)}determinantAffine(){let e=this.elements,t=e[0],i=e[4],s=e[8],a=e[1],n=e[5],o=e[9],l=e[2],c=e[6],h=e[10];return t*(n*h-o*c)-i*(a*h-o*l)+s*(a*c-n*l)}transpose(){let e=this.elements,t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,i){let s=this.elements;return e.isVector3?(s[12]=e.x,s[13]=e.y,s[14]=e.z):(s[12]=e,s[13]=t,s[14]=i),this}invert(){let e=this.elements,t=e[0],i=e[1],s=e[2],a=e[3],n=e[4],o=e[5],l=e[6],c=e[7],h=e[8],m=e[9],u=e[10],d=e[11],g=e[12],S=e[13],f=e[14],p=e[15],y=t*o-i*n,E=t*l-s*n,x=t*c-a*n,T=i*l-s*o,b=i*c-a*o,A=s*c-a*l,_=h*S-m*g,w=h*f-u*g,I=h*p-d*g,L=m*f-u*S,U=m*p-d*S,V=u*p-d*f,P=y*V-E*U+x*L+T*I-b*w+A*_;if(P===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let H=1/P;return e[0]=(o*V-l*U+c*L)*H,e[1]=(s*U-i*V-a*L)*H,e[2]=(S*A-f*b+p*T)*H,e[3]=(u*b-m*A-d*T)*H,e[4]=(l*I-n*V-c*w)*H,e[5]=(t*V-s*I+a*w)*H,e[6]=(f*x-g*A-p*E)*H,e[7]=(h*A-u*x+d*E)*H,e[8]=(n*U-o*I+c*_)*H,e[9]=(i*I-t*U-a*_)*H,e[10]=(g*b-S*x+p*y)*H,e[11]=(m*x-h*b-d*y)*H,e[12]=(o*w-n*L-l*_)*H,e[13]=(t*L-i*w+s*_)*H,e[14]=(S*E-g*T-f*y)*H,e[15]=(h*T-m*E+u*y)*H,this}scale(e){let t=this.elements,i=e.x,s=e.y,a=e.z;return t[0]*=i,t[4]*=s,t[8]*=a,t[1]*=i,t[5]*=s,t[9]*=a,t[2]*=i,t[6]*=s,t[10]*=a,t[3]*=i,t[7]*=s,t[11]*=a,this}getMaxScaleOnAxis(){let e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],i=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],s=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,i,s))}makeTranslation(e,t,i){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,i,0,0,0,1),this}makeRotationX(e){let t=Math.cos(e),i=Math.sin(e);return this.set(1,0,0,0,0,t,-i,0,0,i,t,0,0,0,0,1),this}makeRotationY(e){let t=Math.cos(e),i=Math.sin(e);return this.set(t,0,i,0,0,1,0,0,-i,0,t,0,0,0,0,1),this}makeRotationZ(e){let t=Math.cos(e),i=Math.sin(e);return this.set(t,-i,0,0,i,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){let i=Math.cos(t),s=Math.sin(t),a=1-i,n=e.x,o=e.y,l=e.z,c=a*n,h=a*o;return this.set(c*n+i,c*o-s*l,c*l+s*o,0,c*o+s*l,h*o+i,h*l-s*n,0,c*l-s*o,h*l+s*n,a*l*l+i,0,0,0,0,1),this}makeScale(e,t,i){return this.set(e,0,0,0,0,t,0,0,0,0,i,0,0,0,0,1),this}makeShear(e,t,i,s,a,n){return this.set(1,i,a,0,e,1,n,0,t,s,1,0,0,0,0,1),this}compose(e,t,i){let s=this.elements,a=t._x,n=t._y,o=t._z,l=t._w,c=a+a,h=n+n,m=o+o,u=a*c,d=a*h,g=a*m,S=n*h,f=n*m,p=o*m,y=l*c,E=l*h,x=l*m,T=i.x,b=i.y,A=i.z;return s[0]=(1-(S+p))*T,s[1]=(d+x)*T,s[2]=(g-E)*T,s[3]=0,s[4]=(d-x)*b,s[5]=(1-(u+p))*b,s[6]=(f+y)*b,s[7]=0,s[8]=(g+E)*A,s[9]=(f-y)*A,s[10]=(1-(u+S))*A,s[11]=0,s[12]=e.x,s[13]=e.y,s[14]=e.z,s[15]=1,this}decompose(e,t,i){let s=this.elements;e.x=s[12],e.y=s[13],e.z=s[14];let a=this.determinantAffine();if(a===0)return i.set(1,1,1),t.identity(),this;let n=dr.set(s[0],s[1],s[2]).length(),o=dr.set(s[4],s[5],s[6]).length(),l=dr.set(s[8],s[9],s[10]).length();a<0&&(n=-n),Jt.copy(this);let c=1/n,h=1/o,m=1/l;return Jt.elements[0]*=c,Jt.elements[1]*=c,Jt.elements[2]*=c,Jt.elements[4]*=h,Jt.elements[5]*=h,Jt.elements[6]*=h,Jt.elements[8]*=m,Jt.elements[9]*=m,Jt.elements[10]*=m,t.setFromRotationMatrix(Jt),i.x=n,i.y=o,i.z=l,this}makePerspective(e,t,i,s,a,n,o=Xt,l=!1){let c=this.elements,h=2*a/(t-e),m=2*a/(i-s),u=(t+e)/(t-e),d=(i+s)/(i-s),g,S;if(l)g=a/(n-a),S=n*a/(n-a);else if(o===Xt)g=-(n+a)/(n-a),S=-2*n*a/(n-a);else if(o===Er)g=-n/(n-a),S=-n*a/(n-a);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+o);return c[0]=h,c[4]=0,c[8]=u,c[12]=0,c[1]=0,c[5]=m,c[9]=d,c[13]=0,c[2]=0,c[6]=0,c[10]=g,c[14]=S,c[3]=0,c[7]=0,c[11]=-1,c[15]=0,this}makeOrthographic(e,t,i,s,a,n,o=Xt,l=!1){let c=this.elements,h=2/(t-e),m=2/(i-s),u=-(t+e)/(t-e),d=-(i+s)/(i-s),g,S;if(l)g=1/(n-a),S=n/(n-a);else if(o===Xt)g=-2/(n-a),S=-(n+a)/(n-a);else if(o===Er)g=-1/(n-a),S=-a/(n-a);else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+o);return c[0]=h,c[4]=0,c[8]=0,c[12]=u,c[1]=0,c[5]=m,c[9]=0,c[13]=d,c[2]=0,c[6]=0,c[10]=g,c[14]=S,c[3]=0,c[7]=0,c[11]=0,c[15]=1,this}equals(e){let t=this.elements,i=e.elements;for(let s=0;s<16;s++)if(t[s]!==i[s])return!1;return!0}fromArray(e,t=0){for(let i=0;i<16;i++)this.elements[i]=e[i+t];return this}toArray(e=[],t=0){let i=this.elements;return e[t]=i[0],e[t+1]=i[1],e[t+2]=i[2],e[t+3]=i[3],e[t+4]=i[4],e[t+5]=i[5],e[t+6]=i[6],e[t+7]=i[7],e[t+8]=i[8],e[t+9]=i[9],e[t+10]=i[10],e[t+11]=i[11],e[t+12]=i[12],e[t+13]=i[13],e[t+14]=i[14],e[t+15]=i[15],e}};Mn.prototype.isMatrix4=!0;var Xe=Mn,dr=new R,Jt=new Xe,Mu=new R(0,0,0),bu=new R(1,1,1),Li=new R,Ws=new R,Ft=new R,mc=new Xe,fc=new qt,wi=class r{constructor(e=0,t=0,i=0,s=r.DEFAULT_ORDER){this.isEuler=!0,this._x=e,this._y=t,this._z=i,this._order=s}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,i,s=this._order){return this._x=e,this._y=t,this._z=i,this._order=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,i=!0){let s=e.elements,a=s[0],n=s[4],o=s[8],l=s[1],c=s[5],h=s[9],m=s[2],u=s[6],d=s[10];switch(t){case"XYZ":this._y=Math.asin(Ke(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-h,d),this._z=Math.atan2(-n,a)):(this._x=Math.atan2(u,c),this._z=0);break;case"YXZ":this._x=Math.asin(-Ke(h,-1,1)),Math.abs(h)<.9999999?(this._y=Math.atan2(o,d),this._z=Math.atan2(l,c)):(this._y=Math.atan2(-m,a),this._z=0);break;case"ZXY":this._x=Math.asin(Ke(u,-1,1)),Math.abs(u)<.9999999?(this._y=Math.atan2(-m,d),this._z=Math.atan2(-n,c)):(this._y=0,this._z=Math.atan2(l,a));break;case"ZYX":this._y=Math.asin(-Ke(m,-1,1)),Math.abs(m)<.9999999?(this._x=Math.atan2(u,d),this._z=Math.atan2(l,a)):(this._x=0,this._z=Math.atan2(-n,c));break;case"YZX":this._z=Math.asin(Ke(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-h,c),this._y=Math.atan2(-m,a)):(this._x=0,this._y=Math.atan2(o,d));break;case"XZY":this._z=Math.asin(-Ke(n,-1,1)),Math.abs(n)<.9999999?(this._x=Math.atan2(u,c),this._y=Math.atan2(o,a)):(this._x=Math.atan2(-h,d),this._y=0);break;default:Ue("Euler: .setFromRotationMatrix() encountered an unknown order: "+t)}return this._order=t,i===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,i){return mc.makeRotationFromQuaternion(e),this.setFromRotationMatrix(mc,t,i)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return fc.setFromEuler(this),this.setFromQuaternion(fc,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}};wi.DEFAULT_ORDER="XYZ";var os=class{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return(this.mask&(1<<e|0))!==0}},Tu=0,gc=new R,pr=new qt,_i=new Xe,Xs=new R,Yr=new R,wu=new R,Eu=new qt,_c=new R(1,0,0),vc=new R(0,1,0),xc=new R(0,0,1),yc={type:"added"},Au={type:"removed"},mr={type:"childadded",child:null},Ao={type:"childremoved",child:null},Tt=class r extends di{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:Tu++}),this.uuid=Vr(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=r.DEFAULT_UP.clone();let e=new R,t=new wi,i=new qt,s=new R(1,1,1);function a(){i.setFromEuler(t,!1)}function n(){t.setFromQuaternion(i,void 0,!1)}t._onChange(a),i._onChange(n),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:e},rotation:{configurable:!0,enumerable:!0,value:t},quaternion:{configurable:!0,enumerable:!0,value:i},scale:{configurable:!0,enumerable:!0,value:s},modelViewMatrix:{value:new Xe},normalMatrix:{value:new ke}}),this.matrix=new Xe,this.matrixWorld=new Xe,this.matrixAutoUpdate=r.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=r.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new os,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.static=!1,this.userData={},this.pivot=null}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return pr.setFromAxisAngle(e,t),this.quaternion.multiply(pr),this}rotateOnWorldAxis(e,t){return pr.setFromAxisAngle(e,t),this.quaternion.premultiply(pr),this}rotateX(e){return this.rotateOnAxis(_c,e)}rotateY(e){return this.rotateOnAxis(vc,e)}rotateZ(e){return this.rotateOnAxis(xc,e)}translateOnAxis(e,t){return gc.copy(e).applyQuaternion(this.quaternion),this.position.add(gc.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(_c,e)}translateY(e){return this.translateOnAxis(vc,e)}translateZ(e){return this.translateOnAxis(xc,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(_i.copy(this.matrixWorld).invert())}lookAt(e,t,i){e.isVector3?Xs.copy(e):Xs.set(e,t,i);let s=this.parent;this.updateWorldMatrix(!0,!1),Yr.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?_i.lookAt(Yr,Xs,this.up):_i.lookAt(Xs,Yr,this.up),this.quaternion.setFromRotationMatrix(_i),s&&(_i.extractRotation(s.matrixWorld),pr.setFromRotationMatrix(_i),this.quaternion.premultiply(pr.invert()))}add(e){if(arguments.length>1){for(let t=0;t<arguments.length;t++)this.add(arguments[t]);return this}return e===this?(Fe("Object3D.add: object can't be added as a child of itself.",e),this):(e&&e.isObject3D?(e.removeFromParent(),e.parent=this,this.children.push(e),e.dispatchEvent(yc),mr.child=e,this.dispatchEvent(mr),mr.child=null):Fe("Object3D.add: object not an instance of THREE.Object3D.",e),this)}remove(e){if(arguments.length>1){for(let i=0;i<arguments.length;i++)this.remove(arguments[i]);return this}let t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(Au),Ao.child=e,this.dispatchEvent(Ao),Ao.child=null),this}removeFromParent(){let e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),_i.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),_i.multiply(e.parent.matrixWorld)),e.applyMatrix4(_i),e.removeFromParent(),e.parent=this,this.children.push(e),e.updateWorldMatrix(!1,!0),e.dispatchEvent(yc),mr.child=e,this.dispatchEvent(mr),mr.child=null,this}getObjectById(e){return this.getObjectByProperty("id",e)}getObjectByName(e){return this.getObjectByProperty("name",e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let i=0,s=this.children.length;i<s;i++){let a=this.children[i].getObjectByProperty(e,t);if(a!==void 0)return a}}getObjectsByProperty(e,t,i=[]){this[e]===t&&i.push(this);let s=this.children;for(let a=0,n=s.length;a<n;a++)s[a].getObjectsByProperty(e,t,i);return i}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Yr,e,wu),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Yr,Eu,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);let t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}intersectsFrustum(){}traverse(e){e(this);let t=this.children;for(let i=0,s=t.length;i<s;i++)t[i].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);let t=this.children;for(let i=0,s=t.length;i<s;i++)t[i].traverseVisible(e)}traverseAncestors(e){let t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale);let e=this.pivot;if(e!==null){let t=e.x,i=e.y,s=e.z,a=this.matrix.elements;a[12]+=t-a[0]*t-a[4]*i-a[8]*s,a[13]+=i-a[1]*t-a[5]*i-a[9]*s,a[14]+=s-a[2]*t-a[6]*i-a[10]*s}this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,e=!0);let t=this.children;for(let i=0,s=t.length;i<s;i++)t[i].updateMatrixWorld(e)}updateWorldMatrix(e,t,i=!1){let s=this.parent;if(e===!0&&s!==null&&s.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||i)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,i=!0),t===!0){let a=this.children;for(let n=0,o=a.length;n<o;n++)a[n].updateWorldMatrix(!1,!0,i)}}toJSON(e){let t=e===void 0||typeof e=="string",i={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},i.metadata={version:4.7,type:"Object",generator:"Object3D.toJSON"});let s={};s.uuid=this.uuid,s.type=this.type,s.name=this.name,s.castShadow=this.castShadow,s.receiveShadow=this.receiveShadow,s.visible=this.visible,s.frustumCulled=this.frustumCulled,s.renderOrder=this.renderOrder,s.static=this.static,s.matrixAutoUpdate=this.matrixAutoUpdate,Object.keys(this.userData).length>0&&(s.userData=this.userData),s.layers=this.layers.mask,s.matrix=this.matrix.toArray(),s.up=this.up.toArray(),this.pivot!==null&&(s.pivot=this.pivot.toArray()),this.morphTargetDictionary!==void 0&&(s.morphTargetDictionary=Object.assign({},this.morphTargetDictionary)),this.morphTargetInfluences!==void 0&&(s.morphTargetInfluences=this.morphTargetInfluences.slice()),this.isInstancedMesh&&(s.type="InstancedMesh",s.count=this.count,s.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(s.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(s.type="BatchedMesh",s.perObjectFrustumCulled=this.perObjectFrustumCulled,s.sortObjects=this.sortObjects,s.drawRanges=this._drawRanges,s.reservedRanges=this._reservedRanges,s.geometryInfo=this._geometryInfo.map(o=>({...o,boundingBox:o.boundingBox?o.boundingBox.toJSON():void 0,boundingSphere:o.boundingSphere?o.boundingSphere.toJSON():void 0})),s.instanceInfo=this._instanceInfo.map(o=>({...o})),s.availableInstanceIds=this._availableInstanceIds.slice(),s.availableGeometryIds=this._availableGeometryIds.slice(),s.nextIndexStart=this._nextIndexStart,s.nextVertexStart=this._nextVertexStart,s.geometryCount=this._geometryCount,s.maxInstanceCount=this._maxInstanceCount,s.maxVertexCount=this._maxVertexCount,s.maxIndexCount=this._maxIndexCount,s.geometryInitialized=this._geometryInitialized,s.matricesTexture=this._matricesTexture.toJSON(e),s.indirectTexture=this._indirectTexture.toJSON(e),this._colorsTexture!==null&&(s.colorsTexture=this._colorsTexture.toJSON(e)),this.boundingSphere!==null&&(s.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(s.boundingBox=this.boundingBox.toJSON()));function a(o,l){return o[l.uuid]===void 0&&(o[l.uuid]=l.toJSON(e)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?s.background=this.background.toJSON():this.background.isTexture&&(s.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(s.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){s.geometry=a(e.geometries,this.geometry);let o=this.geometry.parameters;if(o!==void 0&&o.shapes!==void 0){let l=o.shapes;if(Array.isArray(l))for(let c=0,h=l.length;c<h;c++){let m=l[c];a(e.shapes,m)}else a(e.shapes,l)}}if(this.isSkinnedMesh&&(s.bindMode=this.bindMode,s.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(a(e.skeletons,this.skeleton),s.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){let o=[];for(let l=0,c=this.material.length;l<c;l++)o.push(a(e.materials,this.material[l]));s.material=o}else s.material=a(e.materials,this.material);if(this.children.length>0){s.children=[];for(let o=0;o<this.children.length;o++)s.children.push(this.children[o].toJSON(e).object)}if(this.animations.length>0){s.animations=[];for(let o=0;o<this.animations.length;o++){let l=this.animations[o];s.animations.push(a(e.animations,l))}}if(t){let o=n(e.geometries),l=n(e.materials),c=n(e.textures),h=n(e.images),m=n(e.shapes),u=n(e.skeletons),d=n(e.animations),g=n(e.nodes);o.length>0&&(i.geometries=o),l.length>0&&(i.materials=l),c.length>0&&(i.textures=c),h.length>0&&(i.images=h),m.length>0&&(i.shapes=m),u.length>0&&(i.skeletons=u),d.length>0&&(i.animations=d),g.length>0&&(i.nodes=g)}return i.object=s,i;function n(o){let l=[];for(let c in o){let h=o[c];delete h.metadata,l.push(h)}return l}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.pivot=e.pivot!==null?e.pivot.clone():null,this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.static=e.static,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let i=0;i<e.children.length;i++){let s=e.children[i];this.add(s.clone())}return this}dispose(){this.dispatchEvent({type:"dispose"})}};Tt.DEFAULT_UP=new R(0,1,0),Tt.DEFAULT_MATRIX_AUTO_UPDATE=!0,Tt.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;var bi=class extends Tt{constructor(){super(),this.isGroup=!0,this.type="Group"}},Cu={type:"move"},Rr=class{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new bi,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new bi,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new R,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new R),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new bi,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new R,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new R,this._grip.eventsEnabled=!1),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){let t=this._hand;if(t)for(let i of e.hand.values())this._getHandJoint(t,i)}return this.dispatchEvent({type:"connected",data:e}),this}disconnect(e){return this.dispatchEvent({type:"disconnected",data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,i){let s=null,a=null,n=null,o=this._targetRay,l=this._grip,c=this._hand;if(e&&t.session.visibilityState!=="visible-blurred"){if(c&&e.hand){n=!0;for(let S of e.hand.values()){let f=t.getJointPose(S,i),p=this._getHandJoint(c,S);f!==null&&(p.matrix.fromArray(f.transform.matrix),p.matrix.decompose(p.position,p.rotation,p.scale),p.matrixWorldNeedsUpdate=!0,p.jointRadius=f.radius),p.visible=f!==null}let h=c.joints["index-finger-tip"],m=c.joints["thumb-tip"],u=h.position.distanceTo(m.position),d=.02,g=.005;c.inputState.pinching&&u>d+g?(c.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:e.handedness,target:this})):!c.inputState.pinching&&u<=d-g&&(c.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:e.handedness,target:this}))}else l!==null&&e.gripSpace&&(a=t.getPose(e.gripSpace,i),a!==null&&(l.matrix.fromArray(a.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,a.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(a.linearVelocity)):l.hasLinearVelocity=!1,a.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(a.angularVelocity)):l.hasAngularVelocity=!1,l.eventsEnabled&&l.dispatchEvent({type:"gripUpdated",data:e,target:this})));o!==null&&(s=t.getPose(e.targetRaySpace,i),s===null&&a!==null&&(s=a),s!==null&&(o.matrix.fromArray(s.transform.matrix),o.matrix.decompose(o.position,o.rotation,o.scale),o.matrixWorldNeedsUpdate=!0,s.linearVelocity?(o.hasLinearVelocity=!0,o.linearVelocity.copy(s.linearVelocity)):o.hasLinearVelocity=!1,s.angularVelocity?(o.hasAngularVelocity=!0,o.angularVelocity.copy(s.angularVelocity)):o.hasAngularVelocity=!1,this.dispatchEvent(Cu)))}return o!==null&&(o.visible=s!==null),l!==null&&(l.visible=a!==null),c!==null&&(c.visible=n!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){let i=new bi;i.matrixAutoUpdate=!1,i.visible=!1,e.joints[t.jointName]=i,e.add(i)}return e.joints[t.jointName]}},Ah={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},Ni={h:0,s:0,l:0},js={h:0,s:0,l:0};function Co(r,e,t){return t<0&&(t+=1),t>1&&(t-=1),t<1/6?r+(e-r)*6*t:t<1/2?e:t<2/3?r+(e-r)*6*(2/3-t):r}var He=class{constructor(e,t,i){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,i)}set(e,t,i){if(t===void 0&&i===void 0){let s=e;s&&s.isColor?this.copy(s):typeof s=="number"?this.setHex(s):typeof s=="string"&&this.setStyle(s)}else this.setRGB(e,t,i);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=zt){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,et.colorSpaceToWorking(this,t),this}setRGB(e,t,i,s=et.workingColorSpace){return this.r=e,this.g=t,this.b=i,et.colorSpaceToWorking(this,s),this}setHSL(e,t,i,s=et.workingColorSpace){if(e=vu(e,1),t=Ke(t,0,1),i=Ke(i,0,1),t===0)this.r=this.g=this.b=i;else{let a=i<=.5?i*(1+t):i+t-i*t,n=2*i-a;this.r=Co(n,a,e+1/3),this.g=Co(n,a,e),this.b=Co(n,a,e-1/3)}return et.colorSpaceToWorking(this,s),this}setStyle(e,t=zt){function i(a){a!==void 0&&parseFloat(a)<1&&Ue("Color: Alpha component of "+e+" will be ignored.")}let s;if(s=/^(\w+)\(([^\)]*)\)/.exec(e)){let a,n=s[1],o=s[2];switch(n){case"rgb":case"rgba":if(a=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return i(a[4]),this.setRGB(Math.min(255,parseInt(a[1],10))/255,Math.min(255,parseInt(a[2],10))/255,Math.min(255,parseInt(a[3],10))/255,t);if(a=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return i(a[4]),this.setRGB(Math.min(100,parseInt(a[1],10))/100,Math.min(100,parseInt(a[2],10))/100,Math.min(100,parseInt(a[3],10))/100,t);break;case"hsl":case"hsla":if(a=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return i(a[4]),this.setHSL(parseFloat(a[1])/360,parseFloat(a[2])/100,parseFloat(a[3])/100,t);break;default:Ue("Color: Unknown color model "+e)}}else if(s=/^\#([A-Fa-f\d]+)$/.exec(e)){let a=s[1],n=a.length;if(n===3)return this.setRGB(parseInt(a.charAt(0),16)/15,parseInt(a.charAt(1),16)/15,parseInt(a.charAt(2),16)/15,t);if(n===6)return this.setHex(parseInt(a,16),t);Ue("Color: Invalid hex color "+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=zt){let i=Ah[e.toLowerCase()];return i!==void 0?this.setHex(i,t):Ue("Color: Unknown color "+e),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=Ti(e.r),this.g=Ti(e.g),this.b=Ti(e.b),this}copyLinearToSRGB(e){return this.r=Tr(e.r),this.g=Tr(e.g),this.b=Tr(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=zt){return et.workingToColorSpace(Ct.copy(this),e),Math.round(Ke(Ct.r*255,0,255))*65536+Math.round(Ke(Ct.g*255,0,255))*256+Math.round(Ke(Ct.b*255,0,255))}getHexString(e=zt){return("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=et.workingColorSpace){et.workingToColorSpace(Ct.copy(this),t);let i=Ct.r,s=Ct.g,a=Ct.b,n=Math.max(i,s,a),o=Math.min(i,s,a),l,c,h=(o+n)/2;if(o===n)l=0,c=0;else{let m=n-o;switch(c=h<=.5?m/(n+o):m/(2-n-o),n){case i:l=(s-a)/m+(s<a?6:0);break;case s:l=(a-i)/m+2;break;case a:l=(i-s)/m+4;break}l/=6}return e.h=l,e.s=c,e.l=h,e}getRGB(e,t=et.workingColorSpace){return et.workingToColorSpace(Ct.copy(this),t),e.r=Ct.r,e.g=Ct.g,e.b=Ct.b,e}getStyle(e=zt){et.workingToColorSpace(Ct.copy(this),e);let t=Ct.r,i=Ct.g,s=Ct.b;return e!==zt?`color(${e} ${t.toFixed(3)} ${i.toFixed(3)} ${s.toFixed(3)})`:`rgb(${Math.round(t*255)},${Math.round(i*255)},${Math.round(s*255)})`}offsetHSL(e,t,i){return this.getHSL(Ni),this.setHSL(Ni.h+e,Ni.s+t,Ni.l+i)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,i){return this.r=e.r+(t.r-e.r)*i,this.g=e.g+(t.g-e.g)*i,this.b=e.b+(t.b-e.b)*i,this}lerpHSL(e,t){this.getHSL(Ni),e.getHSL(js);let i=Mo(Ni.h,js.h,t),s=Mo(Ni.s,js.s,t),a=Mo(Ni.l,js.l,t);return this.setHSL(i,s,a),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){let t=this.r,i=this.g,s=this.b,a=e.elements;return this.r=a[0]*t+a[3]*i+a[6]*s,this.g=a[1]*t+a[4]*i+a[7]*s,this.b=a[2]*t+a[5]*i+a[8]*s,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}},Ct=new He;He.NAMES=Ah;var ls=class extends Tt{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new wi,this.environmentIntensity=1,this.environmentRotation=new wi,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(e,t){return super.copy(e,t),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,this.backgroundRotation.copy(e.backgroundRotation),this.environmentIntensity=e.environmentIntensity,this.environmentRotation.copy(e.environmentRotation),e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){let t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),t.object.backgroundBlurriness=this.backgroundBlurriness,t.object.backgroundIntensity=this.backgroundIntensity,t.object.backgroundRotation=this.backgroundRotation.toArray(),t.object.environmentIntensity=this.environmentIntensity,t.object.environmentRotation=this.environmentRotation.toArray(),t}},Kt=new R,vi=new R,Ro=new R,xi=new R,fr=new R,gr=new R,Sc=new R,Io=new R,Po=new R,Lo=new R,No=new lt,Uo=new lt,Do=new lt,Mi=class r{constructor(e=new R,t=new R,i=new R){this.a=e,this.b=t,this.c=i}static getNormal(e,t,i,s){s.subVectors(i,t),Kt.subVectors(e,t),s.cross(Kt);let a=s.lengthSq();return a>0?s.multiplyScalar(1/Math.sqrt(a)):s.set(0,0,0)}static getBarycoord(e,t,i,s,a){Kt.subVectors(s,t),vi.subVectors(i,t),Ro.subVectors(e,t);let n=Kt.dot(Kt),o=Kt.dot(vi),l=Kt.dot(Ro),c=vi.dot(vi),h=vi.dot(Ro),m=n*c-o*o;if(m===0)return a.set(0,0,0),null;let u=1/m,d=(c*l-o*h)*u,g=(n*h-o*l)*u;return a.set(1-d-g,g,d)}static containsPoint(e,t,i,s){return this.getBarycoord(e,t,i,s,xi)===null?!1:xi.x>=0&&xi.y>=0&&xi.x+xi.y<=1}static getInterpolation(e,t,i,s,a,n,o,l){return this.getBarycoord(e,t,i,s,xi)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(a,xi.x),l.addScaledVector(n,xi.y),l.addScaledVector(o,xi.z),l)}static getInterpolatedAttribute(e,t,i,s,a,n){return No.setScalar(0),Uo.setScalar(0),Do.setScalar(0),No.fromBufferAttribute(e,t),Uo.fromBufferAttribute(e,i),Do.fromBufferAttribute(e,s),n.setScalar(0),n.addScaledVector(No,a.x),n.addScaledVector(Uo,a.y),n.addScaledVector(Do,a.z),n}static isFrontFacing(e,t,i,s){return Kt.subVectors(i,t),vi.subVectors(e,t),Kt.cross(vi).dot(s)<0}set(e,t,i){return this.a.copy(e),this.b.copy(t),this.c.copy(i),this}setFromPointsAndIndices(e,t,i,s){return this.a.copy(e[t]),this.b.copy(e[i]),this.c.copy(e[s]),this}setFromAttributeAndIndices(e,t,i,s){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,i),this.c.fromBufferAttribute(e,s),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return Kt.subVectors(this.c,this.b),vi.subVectors(this.a,this.b),Kt.cross(vi).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(e){return r.getNormal(this.a,this.b,this.c,e)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(e,t){return r.getBarycoord(e,this.a,this.b,this.c,t)}getInterpolation(e,t,i,s,a){return r.getInterpolation(e,this.a,this.b,this.c,t,i,s,a)}containsPoint(e){return r.containsPoint(e,this.a,this.b,this.c)}isFrontFacing(e){return r.isFrontFacing(this.a,this.b,this.c,e)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){let i=this.a,s=this.b,a=this.c,n,o;fr.subVectors(s,i),gr.subVectors(a,i),Io.subVectors(e,i);let l=fr.dot(Io),c=gr.dot(Io);if(l<=0&&c<=0)return t.copy(i);Po.subVectors(e,s);let h=fr.dot(Po),m=gr.dot(Po);if(h>=0&&m<=h)return t.copy(s);let u=l*m-h*c;if(u<=0&&l>=0&&h<=0)return n=l/(l-h),t.copy(i).addScaledVector(fr,n);Lo.subVectors(e,a);let d=fr.dot(Lo),g=gr.dot(Lo);if(g>=0&&d<=g)return t.copy(a);let S=d*c-l*g;if(S<=0&&c>=0&&g<=0)return o=c/(c-g),t.copy(i).addScaledVector(gr,o);let f=h*g-d*m;if(f<=0&&m-h>=0&&d-g>=0)return Sc.subVectors(a,s),o=(m-h)/(m-h+(d-g)),t.copy(s).addScaledVector(Sc,o);let p=1/(f+S+u);return n=S*p,o=u*p,t.copy(i).addScaledVector(fr,n).addScaledVector(gr,o)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}},ei=class{constructor(e=new R(1/0,1/0,1/0),t=new R(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,i=e.length;t<i;t+=3)this.expandByPoint($t.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,i=e.count;t<i;t++)this.expandByPoint($t.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,i=e.length;t<i;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){let i=$t.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(i),this.max.copy(e).add(i),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);let i=e.geometry;if(i!==void 0){let a=i.getAttribute("position");if(t===!0&&a!==void 0&&e.isInstancedMesh!==!0)for(let n=0,o=a.count;n<o;n++)e.isMesh===!0?e.getVertexPosition(n,$t):$t.fromBufferAttribute(a,n),$t.applyMatrix4(e.matrixWorld),this.expandByPoint($t);else e.boundingBox!==void 0?(e.boundingBox===null&&e.computeBoundingBox(),qs.copy(e.boundingBox)):(i.boundingBox===null&&i.computeBoundingBox(),qs.copy(i.boundingBox)),qs.applyMatrix4(e.matrixWorld),this.union(qs)}let s=e.children;for(let a=0,n=s.length;a<n;a++)this.expandByObject(s[a],t);return this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y&&e.z>=this.min.z&&e.z<=this.max.z}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y&&e.max.z>=this.min.z&&e.min.z<=this.max.z}intersectsSphere(e){return this.clampPoint(e.center,$t),$t.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,i;return e.normal.x>0?(t=e.normal.x*this.min.x,i=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,i=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,i+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,i+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,i+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,i+=e.normal.z*this.min.z),t<=-e.constant&&i>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(Zr),Ys.subVectors(this.max,Zr),_r.subVectors(e.a,Zr),vr.subVectors(e.b,Zr),xr.subVectors(e.c,Zr),Ui.subVectors(vr,_r),Di.subVectors(xr,vr),Ji.subVectors(_r,xr);let t=[0,-Ui.z,Ui.y,0,-Di.z,Di.y,0,-Ji.z,Ji.y,Ui.z,0,-Ui.x,Di.z,0,-Di.x,Ji.z,0,-Ji.x,-Ui.y,Ui.x,0,-Di.y,Di.x,0,-Ji.y,Ji.x,0];return!Oo(t,_r,vr,xr,Ys)||(t=[1,0,0,0,1,0,0,0,1],!Oo(t,_r,vr,xr,Ys))?!1:(Zs.crossVectors(Ui,Di),t=[Zs.x,Zs.y,Zs.z],Oo(t,_r,vr,xr,Ys))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,$t).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize($t).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()?this:(yi[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),yi[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),yi[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),yi[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),yi[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),yi[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),yi[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),yi[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(yi),this)}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(e){return this.min.fromArray(e.min),this.max.fromArray(e.max),this}},yi=[new R,new R,new R,new R,new R,new R,new R,new R],$t=new R,qs=new ei,_r=new R,vr=new R,xr=new R,Ui=new R,Di=new R,Ji=new R,Zr=new R,Ys=new R,Zs=new R,Ki=new R;function Oo(r,e,t,i,s){for(let a=0,n=r.length-3;a<=n;a+=3){Ki.fromArray(r,a);let o=s.x*Math.abs(Ki.x)+s.y*Math.abs(Ki.y)+s.z*Math.abs(Ki.z),l=e.dot(Ki),c=t.dot(Ki),h=i.dot(Ki);if(Math.max(-Math.max(l,c,h),Math.min(l,c,h))>o)return!1}return!0}var y_=Ru();function Ru(){let r=new ArrayBuffer(4),e=new Float32Array(r),t=new Uint32Array(r),i=new Uint32Array(512),s=new Uint32Array(512);for(let l=0;l<256;++l){let c=l-127;c<-27?(i[l]=0,i[l|256]=32768,s[l]=24,s[l|256]=24):c<-14?(i[l]=1024>>-c-14,i[l|256]=1024>>-c-14|32768,s[l]=-c-1,s[l|256]=-c-1):c<=15?(i[l]=c+15<<10,i[l|256]=c+15<<10|32768,s[l]=13,s[l|256]=13):c<128?(i[l]=31744,i[l|256]=64512,s[l]=24,s[l|256]=24):(i[l]=31744,i[l|256]=64512,s[l]=13,s[l|256]=13)}let a=new Uint32Array(2048),n=new Uint32Array(64),o=new Uint32Array(64);for(let l=1;l<1024;++l){let c=l<<13,h=0;for(;(c&8388608)===0;)c<<=1,h-=8388608;c&=-8388609,h+=947912704,a[l]=c|h}for(let l=1024;l<2048;++l)a[l]=939524096+(l-1024<<13);for(let l=1;l<31;++l)n[l]=l<<23;n[31]=1199570944,n[32]=2147483648;for(let l=33;l<63;++l)n[l]=2147483648+(l-32<<23);n[63]=3347054592;for(let l=1;l<64;++l)l!==32&&(o[l]=1024);return{floatView:e,uint32View:t,baseTable:i,shiftTable:s,mantissaTable:a,exponentTable:n,offsetTable:o}}var vt=new R,Js=new ae,Iu=0,jt=class extends di{constructor(e,t,i=!1){if(super(),Array.isArray(e))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:Iu++}),this.name="",this.array=e,this.itemSize=t,this.count=e!==void 0?e.length/t:0,this.normalized=i,this.usage=Mh,this.updateRanges=[],this.gpuType=si,this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,t,i){e*=this.itemSize,i*=t.itemSize;for(let s=0,a=this.itemSize;s<a;s++)this.array[e+s]=t.array[i+s];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,i=this.count;t<i;t++)Js.fromBufferAttribute(this,t),Js.applyMatrix3(e),this.setXY(t,Js.x,Js.y);else if(this.itemSize===3)for(let t=0,i=this.count;t<i;t++)vt.fromBufferAttribute(this,t),vt.applyMatrix3(e),this.setXYZ(t,vt.x,vt.y,vt.z);return this}applyMatrix4(e){for(let t=0,i=this.count;t<i;t++)vt.fromBufferAttribute(this,t),vt.applyMatrix4(e),this.setXYZ(t,vt.x,vt.y,vt.z);return this}applyNormalMatrix(e){for(let t=0,i=this.count;t<i;t++)vt.fromBufferAttribute(this,t),vt.applyNormalMatrix(e),this.setXYZ(t,vt.x,vt.y,vt.z);return this}transformDirection(e){for(let t=0,i=this.count;t<i;t++)vt.fromBufferAttribute(this,t),vt.transformDirection(e),this.setXYZ(t,vt.x,vt.y,vt.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let i=this.array[e*this.itemSize+t];return this.normalized&&(i=qr(i,this.array)),i}setComponent(e,t,i){return this.normalized&&(i=Lt(i,this.array)),this.array[e*this.itemSize+t]=i,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=qr(t,this.array)),t}setX(e,t){return this.normalized&&(t=Lt(t,this.array)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=qr(t,this.array)),t}setY(e,t){return this.normalized&&(t=Lt(t,this.array)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=qr(t,this.array)),t}setZ(e,t){return this.normalized&&(t=Lt(t,this.array)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=qr(t,this.array)),t}setW(e,t){return this.normalized&&(t=Lt(t,this.array)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,i){return e*=this.itemSize,this.normalized&&(t=Lt(t,this.array),i=Lt(i,this.array)),this.array[e+0]=t,this.array[e+1]=i,this}setXYZ(e,t,i,s){return e*=this.itemSize,this.normalized&&(t=Lt(t,this.array),i=Lt(i,this.array),s=Lt(s,this.array)),this.array[e+0]=t,this.array[e+1]=i,this.array[e+2]=s,this}setXYZW(e,t,i,s,a){return e*=this.itemSize,this.normalized&&(t=Lt(t,this.array),i=Lt(i,this.array),s=Lt(s,this.array),a=Lt(a,this.array)),this.array[e+0]=t,this.array[e+1]=i,this.array[e+2]=s,this.array[e+3]=a,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return e.name=this.name,e.usage=this.usage,e.gpuType=this.gpuType,e}dispose(){this.dispatchEvent({type:"dispose"})}};var cs=class extends jt{constructor(e,t,i){super(new Uint16Array(e),t,i)}};var hs=class extends jt{constructor(e,t,i){super(new Uint32Array(e),t,i)}};var De=class extends jt{constructor(e,t,i){super(new Float32Array(e),t,i)}},Pu=new ei,Jr=new R,Fo=new R,ti=class{constructor(e=new R,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){let i=this.center;t!==void 0?i.copy(t):Pu.setFromPoints(e).getCenter(i);let s=0;for(let a=0,n=e.length;a<n;a++)s=Math.max(s,i.distanceToSquared(e[a]));return this.radius=Math.sqrt(s),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){let t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){let i=this.center.distanceToSquared(e);return t.copy(e),i>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius=this.radius*e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;Jr.subVectors(e,this.center);let t=Jr.lengthSq();if(t>this.radius*this.radius){let i=Math.sqrt(t),s=(i-this.radius)*.5;this.center.addScaledVector(Jr,s/i),this.radius+=s}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(Fo.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(Jr.copy(e.center).add(Fo)),this.expandByPoint(Jr.copy(e.center).sub(Fo))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(e){return this.radius=e.radius,this.center.fromArray(e.center),this}},Lu=0,Wt=new Xe,Bo=new Tt,yr=new R,Bt=new ei,Kr=new ei,Mt=new R,ct=class r extends di{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:Lu++}),this.uuid=Vr(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.indirectOffset=0,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={},this._transformed=!1}getIndex(){return this.index}setIndex(e){return Array.isArray(e)?this.index=new(gu(e)?hs:cs)(e,1):this.index=e,this}setIndirect(e,t=0){return this.indirect=e,this.indirectOffset=t,this}getIndirect(){return this.indirect}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,i=0){this.groups.push({start:e,count:t,materialIndex:i})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){let t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);let i=this.attributes.normal;if(i!==void 0){let a=new ke().getNormalMatrix(e);i.applyNormalMatrix(a),i.needsUpdate=!0}let s=this.attributes.tangent;return s!==void 0&&(s.transformDirection(e),s.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this._transformed=!0,this}applyQuaternion(e){return Wt.makeRotationFromQuaternion(e),this.applyMatrix4(Wt),this}rotateX(e){return Wt.makeRotationX(e),this.applyMatrix4(Wt),this}rotateY(e){return Wt.makeRotationY(e),this.applyMatrix4(Wt),this}rotateZ(e){return Wt.makeRotationZ(e),this.applyMatrix4(Wt),this}translate(e,t,i){return Wt.makeTranslation(e,t,i),this.applyMatrix4(Wt),this}scale(e,t,i){return Wt.makeScale(e,t,i),this.applyMatrix4(Wt),this}lookAt(e){return Bo.lookAt(e),Bo.updateMatrix(),this.applyMatrix4(Bo.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(yr).negate(),this.translate(yr.x,yr.y,yr.z),this}setFromPoints(e){let t=this.getAttribute("position");if(t===void 0){let i=[];for(let s=0,a=e.length;s<a;s++){let n=e[s];i.push(n.x,n.y,n.z||0)}this.setAttribute("position",new De(i,3))}else{let i=Math.min(e.length,t.count);for(let s=0;s<i;s++){let a=e[s];t.setXYZ(s,a.x,a.y,a.z||0)}e.length>t.count&&Ue("BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),t.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new ei);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){Fe("BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new R(-1/0,-1/0,-1/0),new R(1/0,1/0,1/0));return}if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let i=0,s=t.length;i<s;i++){let a=t[i];Bt.setFromBufferAttribute(a),this.morphTargetsRelative?(Mt.addVectors(this.boundingBox.min,Bt.min),this.boundingBox.expandByPoint(Mt),Mt.addVectors(this.boundingBox.max,Bt.max),this.boundingBox.expandByPoint(Mt)):(this.boundingBox.expandByPoint(Bt.min),this.boundingBox.expandByPoint(Bt.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&Fe('BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new ti);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){Fe("BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new R,1/0);return}if(e){let i=this.boundingSphere.center;if(Bt.setFromBufferAttribute(e),t)for(let a=0,n=t.length;a<n;a++){let o=t[a];Kr.setFromBufferAttribute(o),this.morphTargetsRelative?(Mt.addVectors(Bt.min,Kr.min),Bt.expandByPoint(Mt),Mt.addVectors(Bt.max,Kr.max),Bt.expandByPoint(Mt)):(Bt.expandByPoint(Kr.min),Bt.expandByPoint(Kr.max))}Bt.getCenter(i);let s=0;for(let a=0,n=e.count;a<n;a++)Mt.fromBufferAttribute(e,a),s=Math.max(s,i.distanceToSquared(Mt));if(t)for(let a=0,n=t.length;a<n;a++){let o=t[a],l=this.morphTargetsRelative;for(let c=0,h=o.count;c<h;c++)Mt.fromBufferAttribute(o,c),l&&(yr.fromBufferAttribute(e,c),Mt.add(yr)),s=Math.max(s,i.distanceToSquared(Mt))}this.boundingSphere.radius=Math.sqrt(s),isNaN(this.boundingSphere.radius)&&Fe('BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){let e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){Fe("BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}let i=t.position,s=t.normal,a=t.uv,n=this.getAttribute("tangent");(n===void 0||n.count!==i.count)&&(n=new jt(new Float32Array(4*i.count),4),this.setAttribute("tangent",n));let o=[],l=[];for(let _=0;_<i.count;_++)o[_]=new R,l[_]=new R;let c=new R,h=new R,m=new R,u=new ae,d=new ae,g=new ae,S=new R,f=new R;function p(_,w,I){c.fromBufferAttribute(i,_),h.fromBufferAttribute(i,w),m.fromBufferAttribute(i,I),u.fromBufferAttribute(a,_),d.fromBufferAttribute(a,w),g.fromBufferAttribute(a,I),h.sub(c),m.sub(c),d.sub(u),g.sub(u);let L=1/(d.x*g.y-g.x*d.y);isFinite(L)&&(S.copy(h).multiplyScalar(g.y).addScaledVector(m,-d.y).multiplyScalar(L),f.copy(m).multiplyScalar(d.x).addScaledVector(h,-g.x).multiplyScalar(L),o[_].add(S),o[w].add(S),o[I].add(S),l[_].add(f),l[w].add(f),l[I].add(f))}let y=this.groups;y.length===0&&(y=[{start:0,count:e.count}]);for(let _=0,w=y.length;_<w;++_){let I=y[_],L=I.start,U=I.count;for(let V=L,P=L+U;V<P;V+=3)p(e.getX(V+0),e.getX(V+1),e.getX(V+2))}let E=new R,x=new R,T=new R,b=new R;function A(_){T.fromBufferAttribute(s,_),b.copy(T);let w=o[_];E.copy(w),E.sub(T.multiplyScalar(T.dot(w))).normalize(),x.crossVectors(b,w);let I=x.dot(l[_])<0?-1:1;n.setXYZW(_,E.x,E.y,E.z,I)}for(let _=0,w=y.length;_<w;++_){let I=y[_],L=I.start,U=I.count;for(let V=L,P=L+U;V<P;V+=3)A(e.getX(V+0)),A(e.getX(V+1)),A(e.getX(V+2))}this._transformed=!0}computeVertexNormals(){let e=this.index,t=this.getAttribute("position");if(t!==void 0){let i=this.getAttribute("normal");if(i===void 0||i.count!==t.count)i=new jt(new Float32Array(t.count*3),3),this.setAttribute("normal",i);else for(let u=0,d=i.count;u<d;u++)i.setXYZ(u,0,0,0);let s=new R,a=new R,n=new R,o=new R,l=new R,c=new R,h=new R,m=new R;if(e)for(let u=0,d=e.count;u<d;u+=3){let g=e.getX(u+0),S=e.getX(u+1),f=e.getX(u+2);s.fromBufferAttribute(t,g),a.fromBufferAttribute(t,S),n.fromBufferAttribute(t,f),h.subVectors(n,a),m.subVectors(s,a),h.cross(m),o.fromBufferAttribute(i,g),l.fromBufferAttribute(i,S),c.fromBufferAttribute(i,f),o.add(h),l.add(h),c.add(h),i.setXYZ(g,o.x,o.y,o.z),i.setXYZ(S,l.x,l.y,l.z),i.setXYZ(f,c.x,c.y,c.z)}else for(let u=0,d=t.count;u<d;u+=3)s.fromBufferAttribute(t,u+0),a.fromBufferAttribute(t,u+1),n.fromBufferAttribute(t,u+2),h.subVectors(n,a),m.subVectors(s,a),h.cross(m),i.setXYZ(u+0,h.x,h.y,h.z),i.setXYZ(u+1,h.x,h.y,h.z),i.setXYZ(u+2,h.x,h.y,h.z);this.normalizeNormals(),i.needsUpdate=!0}}normalizeNormals(){let e=this.attributes.normal;for(let t=0,i=e.count;t<i;t++)Mt.fromBufferAttribute(e,t),Mt.normalize(),e.setXYZ(t,Mt.x,Mt.y,Mt.z)}toNonIndexed(){function e(o,l){let c=o.array,h=o.itemSize,m=o.normalized,u=new c.constructor(l.length*h),d=0,g=0;for(let S=0,f=l.length;S<f;S++){o.isInterleavedBufferAttribute?d=l[S]*o.data.stride+o.offset:d=l[S]*h;for(let p=0;p<h;p++)u[g++]=c[d++]}return new jt(u,h,m)}if(this.index===null)return Ue("BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;let t=new r,i=this.index.array,s=this.attributes;for(let o in s){let l=s[o],c=e(l,i);t.setAttribute(o,c)}let a=this.morphAttributes;for(let o in a){let l=[],c=a[o];for(let h=0,m=c.length;h<m;h++){let u=c[h],d=e(u,i);l.push(d)}t.morphAttributes[o]=l}t.morphTargetsRelative=this.morphTargetsRelative;let n=this.groups;for(let o=0,l=n.length;o<l;o++){let c=n[o];t.addGroup(c.start,c.count,c.materialIndex)}return t}toJSON(){let e={metadata:{version:4.7,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(e.uuid=this.uuid,e.type=this.parameters!==void 0&&this._transformed===!0?"BufferGeometry":this.type,e.name=this.name,Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0&&this._transformed!==!0){let l=this.parameters;for(let c in l)l[c]!==void 0&&(e[c]=l[c]);return e}e.data={attributes:{}};let t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});let i=this.attributes;for(let l in i){let c=i[l];e.data.attributes[l]=c.toJSON(e.data)}let s={},a=!1;for(let l in this.morphAttributes){let c=this.morphAttributes[l],h=[];for(let m=0,u=c.length;m<u;m++){let d=c[m];h.push(d.toJSON(e.data))}h.length>0&&(s[l]=h,a=!0)}a&&(e.data.morphAttributes=s,e.data.morphTargetsRelative=this.morphTargetsRelative);let n=this.groups;n.length>0&&(e.data.groups=JSON.parse(JSON.stringify(n)));let o=this.boundingSphere;return o!==null&&(e.data.boundingSphere=o.toJSON()),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let t={};this.name=e.name;let i=e.index;i!==null&&this.setIndex(i.clone());let s=e.attributes;for(let c in s){let h=s[c];this.setAttribute(c,h.clone(t))}let a=e.morphAttributes;for(let c in a){let h=[],m=a[c];for(let u=0,d=m.length;u<d;u++)h.push(m[u].clone(t));this.morphAttributes[c]=h}this.morphTargetsRelative=e.morphTargetsRelative;let n=e.groups;for(let c=0,h=n.length;c<h;c++){let m=n[c];this.addGroup(m.start,m.count,m.materialIndex)}let o=e.boundingBox;o!==null&&(this.boundingBox=o.clone());let l=e.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this._transformed=e._transformed,this}dispose(){this.dispatchEvent({type:"dispose"})}};var S_=new R;var zo=new R,Nu=new R,Uu=new ke,Qt=class{constructor(e=new R(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,i,s){return this.normal.set(e,t,i),this.constant=s,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,i){let s=zo.subVectors(i,t).cross(Nu.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(s,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){let e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t,i=!0){let s=e.delta(zo),a=this.normal.dot(s);if(a===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;let n=-(e.start.dot(this.normal)+this.constant)/a;return i===!0&&(n<0||n>1)?null:t.copy(e.start).addScaledVector(s,n)}intersectsLine(e){let t=this.distanceToPoint(e.start),i=this.distanceToPoint(e.end);return t<0&&i>0||i<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){let i=t||Uu.getNormalMatrix(e),s=this.coplanarPoint(zo).applyMatrix4(e),a=this.normal.applyMatrix3(i).normalize();return this.constant=-s.dot(a),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}toJSON(){return{normal:this.normal.toArray(),constant:this.constant}}fromJSON(e){return this.normal.fromArray(e.normal),this.constant=e.constant,this}},Du=0,Ei=class extends di{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:Du++}),this.uuid=Vr(),this.name="",this.type="Material",this.blending=Br,this.side=Hi,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=hl,this.blendDst=ul,this.blendEquation=ar,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new He(0,0,0),this.blendAlpha=0,this.depthFunc=wr,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=fh,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=_a,this.stencilZFail=_a,this.stencilZPass=_a,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(let t in e){let i=e[t];if(i===void 0){Ue(`Material: parameter '${t}' has value of undefined.`);continue}let s=this[t];if(s===void 0){Ue(`Material: '${t}' is not a property of THREE.${this.type}.`);continue}s&&s.isColor?s.set(i):s&&s.isVector2&&i&&i.isVector2||s&&s.isEuler&&i&&i.isEuler||s&&s.isVector3&&i&&i.isVector3?s.copy(i):this[t]=i}}toJSON(e){let t=e===void 0||typeof e=="string";t&&(e={textures:{},images:{}});let i={metadata:{version:4.7,type:"Material",generator:"Material.toJSON"}};i.uuid=this.uuid,i.type=this.type,i.blending=this.blending,i.side=this.side,i.shadowSide=this.shadowSide,i.vertexColors=this.vertexColors,i.opacity=this.opacity,i.transparent=this.transparent,i.blendSrc=this.blendSrc,i.blendDst=this.blendDst,i.blendEquation=this.blendEquation,i.blendSrcAlpha=this.blendSrcAlpha,i.blendDstAlpha=this.blendDstAlpha,i.blendEquationAlpha=this.blendEquationAlpha,i.blendColor=this.blendColor.getHex(),i.blendAlpha=this.blendAlpha,i.depthFunc=this.depthFunc,i.depthTest=this.depthTest,i.depthWrite=this.depthWrite,i.colorWrite=this.colorWrite,i.clipIntersection=this.clipIntersection,i.clipShadows=this.clipShadows,i.stencilWriteMask=this.stencilWriteMask,i.stencilFunc=this.stencilFunc,i.stencilRef=this.stencilRef,i.stencilFuncMask=this.stencilFuncMask,i.stencilFail=this.stencilFail,i.stencilZFail=this.stencilZFail,i.stencilZPass=this.stencilZPass,i.stencilWrite=this.stencilWrite,i.polygonOffset=this.polygonOffset,i.polygonOffsetFactor=this.polygonOffsetFactor,i.polygonOffsetUnits=this.polygonOffsetUnits,i.dithering=this.dithering,i.alphaTest=this.alphaTest,i.alphaHash=this.alphaHash,i.alphaToCoverage=this.alphaToCoverage,i.premultipliedAlpha=this.premultipliedAlpha,i.forceSinglePass=this.forceSinglePass,i.allowOverride=this.allowOverride,i.visible=this.visible,i.toneMapped=this.toneMapped,i.name=this.name,this.color&&this.color.isColor&&(i.color=this.color.getHex()),this.roughness!==void 0&&(i.roughness=this.roughness),this.metalness!==void 0&&(i.metalness=this.metalness),this.sheen!==void 0&&(i.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(i.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(i.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(i.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&(i.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(i.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(i.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(i.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(i.shininess=this.shininess),this.clearcoat!==void 0&&(i.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(i.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(i.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(i.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(i.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,i.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(i.sheenColorMap=this.sheenColorMap.toJSON(e).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(i.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(e).uuid),this.dispersion!==void 0&&(i.dispersion=this.dispersion),this.retroreflectivity!==void 0&&(i.retroreflectivity=this.retroreflectivity),this.iridescence!==void 0&&(i.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(i.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(i.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(i.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(i.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(i.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(i.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(i.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(i.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(i.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(i.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(i.lightMap=this.lightMap.toJSON(e).uuid,i.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(i.aoMap=this.aoMap.toJSON(e).uuid,i.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(i.bumpMap=this.bumpMap.toJSON(e).uuid,i.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(i.normalMap=this.normalMap.toJSON(e).uuid,i.normalMapType=this.normalMapType,i.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(i.displacementMap=this.displacementMap.toJSON(e).uuid,i.displacementScale=this.displacementScale,i.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(i.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(i.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(i.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(i.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(i.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(i.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(i.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(i.combine=this.combine)),this.envMapRotation!==void 0&&(i.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(i.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(i.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(i.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(i.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(i.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(i.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(i.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(i.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&(i.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(i.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(i.size=this.size),this.sizeAttenuation!==void 0&&(i.sizeAttenuation=this.sizeAttenuation),Array.isArray(this.clippingPlanes)&&this.clippingPlanes.length>0&&(i.clippingPlanes=this.clippingPlanes.map(a=>a.toJSON())),this.rotation!==void 0&&(i.rotation=this.rotation),this.depthPacking!==void 0&&(i.depthPacking=this.depthPacking),this.linewidth!==void 0&&(i.linewidth=this.linewidth),this.linecap!==void 0&&(i.linecap=this.linecap),this.linejoin!==void 0&&(i.linejoin=this.linejoin),this.dashSize!==void 0&&(i.dashSize=this.dashSize),this.gapSize!==void 0&&(i.gapSize=this.gapSize),this.scale!==void 0&&(i.scale=this.scale),this.wireframe!==void 0&&(i.wireframe=this.wireframe),this.wireframeLinewidth!==void 0&&(i.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!==void 0&&(i.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!==void 0&&(i.wireframeLinejoin=this.wireframeLinejoin),this.flatShading!==void 0&&(i.flatShading=this.flatShading),this.fog!==void 0&&(i.fog=this.fog),Object.keys(this.userData).length>0&&(i.userData=this.userData);function s(a){let n=[];for(let o in a){let l=a[o];delete l.metadata,n.push(l)}return n}if(t){let a=s(e.textures),n=s(e.images);a.length>0&&(i.textures=a),n.length>0&&(i.images=n)}return i}fromJSON(e,t){if(e.uuid!==void 0&&(this.uuid=e.uuid),e.name!==void 0&&(this.name=e.name),e.color!==void 0&&this.color!==void 0&&this.color.setHex(e.color),e.roughness!==void 0&&(this.roughness=e.roughness),e.metalness!==void 0&&(this.metalness=e.metalness),e.sheen!==void 0&&(this.sheen=e.sheen),e.sheenColor!==void 0&&(this.sheenColor=new He().setHex(e.sheenColor)),e.sheenRoughness!==void 0&&(this.sheenRoughness=e.sheenRoughness),e.emissive!==void 0&&this.emissive!==void 0&&this.emissive.setHex(e.emissive),e.specular!==void 0&&this.specular!==void 0&&this.specular.setHex(e.specular),e.specularIntensity!==void 0&&(this.specularIntensity=e.specularIntensity),e.specularColor!==void 0&&this.specularColor!==void 0&&this.specularColor.setHex(e.specularColor),e.shininess!==void 0&&(this.shininess=e.shininess),e.clearcoat!==void 0&&(this.clearcoat=e.clearcoat),e.clearcoatRoughness!==void 0&&(this.clearcoatRoughness=e.clearcoatRoughness),e.dispersion!==void 0&&(this.dispersion=e.dispersion),e.retroreflectivity!==void 0&&(this.retroreflectivity=e.retroreflectivity),e.iridescence!==void 0&&(this.iridescence=e.iridescence),e.iridescenceIOR!==void 0&&(this.iridescenceIOR=e.iridescenceIOR),e.iridescenceThicknessRange!==void 0&&(this.iridescenceThicknessRange=e.iridescenceThicknessRange),e.transmission!==void 0&&(this.transmission=e.transmission),e.thickness!==void 0&&(this.thickness=e.thickness),e.attenuationDistance!==void 0&&(this.attenuationDistance=e.attenuationDistance),e.attenuationColor!==void 0&&this.attenuationColor!==void 0&&this.attenuationColor.setHex(e.attenuationColor),e.anisotropy!==void 0&&(this.anisotropy=e.anisotropy),e.anisotropyRotation!==void 0&&(this.anisotropyRotation=e.anisotropyRotation),e.fog!==void 0&&(this.fog=e.fog),e.flatShading!==void 0&&(this.flatShading=e.flatShading),e.blending!==void 0&&(this.blending=e.blending),e.combine!==void 0&&(this.combine=e.combine),e.side!==void 0&&(this.side=e.side),e.shadowSide!==void 0&&(this.shadowSide=e.shadowSide),e.opacity!==void 0&&(this.opacity=e.opacity),e.transparent!==void 0&&(this.transparent=e.transparent),e.alphaTest!==void 0&&(this.alphaTest=e.alphaTest),e.alphaHash!==void 0&&(this.alphaHash=e.alphaHash),e.depthFunc!==void 0&&(this.depthFunc=e.depthFunc),e.depthTest!==void 0&&(this.depthTest=e.depthTest),e.depthWrite!==void 0&&(this.depthWrite=e.depthWrite),e.colorWrite!==void 0&&(this.colorWrite=e.colorWrite),e.clippingPlanes!==void 0&&(this.clippingPlanes=e.clippingPlanes.map(i=>new Qt().fromJSON(i))),e.clipIntersection!==void 0&&(this.clipIntersection=e.clipIntersection),e.clipShadows!==void 0&&(this.clipShadows=e.clipShadows),e.depthPacking!==void 0&&(this.depthPacking=e.depthPacking),e.blendSrc!==void 0&&(this.blendSrc=e.blendSrc),e.blendDst!==void 0&&(this.blendDst=e.blendDst),e.blendEquation!==void 0&&(this.blendEquation=e.blendEquation),e.blendSrcAlpha!==void 0&&(this.blendSrcAlpha=e.blendSrcAlpha),e.blendDstAlpha!==void 0&&(this.blendDstAlpha=e.blendDstAlpha),e.blendEquationAlpha!==void 0&&(this.blendEquationAlpha=e.blendEquationAlpha),e.blendColor!==void 0&&this.blendColor!==void 0&&this.blendColor.setHex(e.blendColor),e.blendAlpha!==void 0&&(this.blendAlpha=e.blendAlpha),e.stencilWriteMask!==void 0&&(this.stencilWriteMask=e.stencilWriteMask),e.stencilFunc!==void 0&&(this.stencilFunc=e.stencilFunc),e.stencilRef!==void 0&&(this.stencilRef=e.stencilRef),e.stencilFuncMask!==void 0&&(this.stencilFuncMask=e.stencilFuncMask),e.stencilFail!==void 0&&(this.stencilFail=e.stencilFail),e.stencilZFail!==void 0&&(this.stencilZFail=e.stencilZFail),e.stencilZPass!==void 0&&(this.stencilZPass=e.stencilZPass),e.stencilWrite!==void 0&&(this.stencilWrite=e.stencilWrite),e.wireframe!==void 0&&(this.wireframe=e.wireframe),e.wireframeLinewidth!==void 0&&(this.wireframeLinewidth=e.wireframeLinewidth),e.wireframeLinecap!==void 0&&(this.wireframeLinecap=e.wireframeLinecap),e.wireframeLinejoin!==void 0&&(this.wireframeLinejoin=e.wireframeLinejoin),e.rotation!==void 0&&(this.rotation=e.rotation),e.linewidth!==void 0&&(this.linewidth=e.linewidth),e.linecap!==void 0&&(this.linecap=e.linecap),e.linejoin!==void 0&&(this.linejoin=e.linejoin),e.dashSize!==void 0&&(this.dashSize=e.dashSize),e.gapSize!==void 0&&(this.gapSize=e.gapSize),e.scale!==void 0&&(this.scale=e.scale),e.polygonOffset!==void 0&&(this.polygonOffset=e.polygonOffset),e.polygonOffsetFactor!==void 0&&(this.polygonOffsetFactor=e.polygonOffsetFactor),e.polygonOffsetUnits!==void 0&&(this.polygonOffsetUnits=e.polygonOffsetUnits),e.dithering!==void 0&&(this.dithering=e.dithering),e.alphaToCoverage!==void 0&&(this.alphaToCoverage=e.alphaToCoverage),e.premultipliedAlpha!==void 0&&(this.premultipliedAlpha=e.premultipliedAlpha),e.forceSinglePass!==void 0&&(this.forceSinglePass=e.forceSinglePass),e.allowOverride!==void 0&&(this.allowOverride=e.allowOverride),e.visible!==void 0&&(this.visible=e.visible),e.toneMapped!==void 0&&(this.toneMapped=e.toneMapped),e.userData!==void 0&&(this.userData=e.userData),e.vertexColors!==void 0&&(typeof e.vertexColors=="number"?this.vertexColors=e.vertexColors>0:this.vertexColors=e.vertexColors),e.size!==void 0&&(this.size=e.size),e.sizeAttenuation!==void 0&&(this.sizeAttenuation=e.sizeAttenuation),e.map!==void 0&&(this.map=t[e.map]||null),e.matcap!==void 0&&(this.matcap=t[e.matcap]||null),e.alphaMap!==void 0&&(this.alphaMap=t[e.alphaMap]||null),e.bumpMap!==void 0&&(this.bumpMap=t[e.bumpMap]||null),e.bumpScale!==void 0&&(this.bumpScale=e.bumpScale),e.normalMap!==void 0&&(this.normalMap=t[e.normalMap]||null),e.normalMapType!==void 0&&(this.normalMapType=e.normalMapType),e.normalScale!==void 0){let i=e.normalScale;Array.isArray(i)===!1&&(i=[i,i]),this.normalScale=new ae().fromArray(i)}return e.displacementMap!==void 0&&(this.displacementMap=t[e.displacementMap]||null),e.displacementScale!==void 0&&(this.displacementScale=e.displacementScale),e.displacementBias!==void 0&&(this.displacementBias=e.displacementBias),e.roughnessMap!==void 0&&(this.roughnessMap=t[e.roughnessMap]||null),e.metalnessMap!==void 0&&(this.metalnessMap=t[e.metalnessMap]||null),e.emissiveMap!==void 0&&(this.emissiveMap=t[e.emissiveMap]||null),e.emissiveIntensity!==void 0&&(this.emissiveIntensity=e.emissiveIntensity),e.specularMap!==void 0&&(this.specularMap=t[e.specularMap]||null),e.specularIntensityMap!==void 0&&(this.specularIntensityMap=t[e.specularIntensityMap]||null),e.specularColorMap!==void 0&&(this.specularColorMap=t[e.specularColorMap]||null),e.envMap!==void 0&&(this.envMap=t[e.envMap]||null),e.envMapRotation!==void 0&&this.envMapRotation.fromArray(e.envMapRotation),e.envMapIntensity!==void 0&&(this.envMapIntensity=e.envMapIntensity),e.reflectivity!==void 0&&(this.reflectivity=e.reflectivity),e.refractionRatio!==void 0&&(this.refractionRatio=e.refractionRatio),e.lightMap!==void 0&&(this.lightMap=t[e.lightMap]||null),e.lightMapIntensity!==void 0&&(this.lightMapIntensity=e.lightMapIntensity),e.aoMap!==void 0&&(this.aoMap=t[e.aoMap]||null),e.aoMapIntensity!==void 0&&(this.aoMapIntensity=e.aoMapIntensity),e.gradientMap!==void 0&&(this.gradientMap=t[e.gradientMap]||null),e.clearcoatMap!==void 0&&(this.clearcoatMap=t[e.clearcoatMap]||null),e.clearcoatRoughnessMap!==void 0&&(this.clearcoatRoughnessMap=t[e.clearcoatRoughnessMap]||null),e.clearcoatNormalMap!==void 0&&(this.clearcoatNormalMap=t[e.clearcoatNormalMap]||null),e.clearcoatNormalScale!==void 0&&(this.clearcoatNormalScale=new ae().fromArray(e.clearcoatNormalScale)),e.iridescenceMap!==void 0&&(this.iridescenceMap=t[e.iridescenceMap]||null),e.iridescenceThicknessMap!==void 0&&(this.iridescenceThicknessMap=t[e.iridescenceThicknessMap]||null),e.transmissionMap!==void 0&&(this.transmissionMap=t[e.transmissionMap]||null),e.thicknessMap!==void 0&&(this.thicknessMap=t[e.thicknessMap]||null),e.anisotropyMap!==void 0&&(this.anisotropyMap=t[e.anisotropyMap]||null),e.sheenColorMap!==void 0&&(this.sheenColorMap=t[e.sheenColorMap]||null),e.sheenRoughnessMap!==void 0&&(this.sheenRoughnessMap=t[e.sheenRoughnessMap]||null),this}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;let t=e.clippingPlanes,i=null;if(t!==null){let s=t.length;i=new Array(s);for(let a=0;a!==s;++a)i[a]=t[a].clone()}return this.clippingPlanes=i,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.allowOverride=e.allowOverride,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(e){e===!0&&this.version++}};var M_=new R,b_=new R,T_=new R,w_=new ae,E_=new ae,A_=new Xe,C_=new R,R_=new R,I_=new R,P_=new ae,L_=new ae,N_=new ae;var U_=new R,D_=new R;var Si=new R,Go=new R,Ks=new R,$s=new R,tr=class{constructor(e=new R,t=new R(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,Si)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);let i=t.dot(this.direction);return i<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,i)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){let t=Si.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(Si.copy(this.origin).addScaledVector(this.direction,t),Si.distanceToSquared(e))}distanceSqToSegment(e,t,i,s){Go.copy(e).add(t).multiplyScalar(.5),Ks.copy(t).sub(e).normalize(),$s.copy(this.origin).sub(Go);let a=e.distanceTo(t)*.5,n=-this.direction.dot(Ks),o=$s.dot(this.direction),l=-$s.dot(Ks),c=$s.lengthSq(),h=Math.abs(1-n*n),m,u,d,g;if(h>0)if(m=n*l-o,u=n*o-l,g=a*h,m>=0)if(u>=-g)if(u<=g){let S=1/h;m*=S,u*=S,d=m*(m+n*u+2*o)+u*(n*m+u+2*l)+c}else u=a,m=Math.max(0,-(n*u+o)),d=-m*m+u*(u+2*l)+c;else u=-a,m=Math.max(0,-(n*u+o)),d=-m*m+u*(u+2*l)+c;else u<=-g?(m=Math.max(0,-(-n*a+o)),u=m>0?-a:Math.min(Math.max(-a,-l),a),d=-m*m+u*(u+2*l)+c):u<=g?(m=0,u=Math.min(Math.max(-a,-l),a),d=u*(u+2*l)+c):(m=Math.max(0,-(n*a+o)),u=m>0?a:Math.min(Math.max(-a,-l),a),d=-m*m+u*(u+2*l)+c);else u=n>0?-a:a,m=Math.max(0,-(n*u+o)),d=-m*m+u*(u+2*l)+c;return i&&i.copy(this.origin).addScaledVector(this.direction,m),s&&s.copy(Go).addScaledVector(Ks,u),d}intersectSphere(e,t){if(e.radius<0)return null;Si.subVectors(e.center,this.origin);let i=Si.dot(this.direction),s=Si.dot(Si)-i*i,a=e.radius*e.radius;if(s>a)return null;let n=Math.sqrt(a-s),o=i-n,l=i+n;return l<0?null:o<0?this.at(l,t):this.at(o,t)}intersectsSphere(e){return e.radius<0?!1:this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){let t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;let i=-(this.origin.dot(e.normal)+e.constant)/t;return i>=0?i:null}intersectPlane(e,t){let i=this.distanceToPlane(e);return i===null?null:this.at(i,t)}intersectsPlane(e){let t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let i,s,a,n,o,l,c=1/this.direction.x,h=1/this.direction.y,m=1/this.direction.z,u=this.origin;return c>=0?(i=(e.min.x-u.x)*c,s=(e.max.x-u.x)*c):(i=(e.max.x-u.x)*c,s=(e.min.x-u.x)*c),h>=0?(a=(e.min.y-u.y)*h,n=(e.max.y-u.y)*h):(a=(e.max.y-u.y)*h,n=(e.min.y-u.y)*h),i>n||a>s||((a>i||isNaN(i))&&(i=a),(n<s||isNaN(s))&&(s=n),m>=0?(o=(e.min.z-u.z)*m,l=(e.max.z-u.z)*m):(o=(e.max.z-u.z)*m,l=(e.min.z-u.z)*m),i>l||o>s)||((o>i||i!==i)&&(i=o),(l<s||s!==s)&&(s=l),s<0)?null:this.at(i>=0?i:s,t)}intersectsBox(e){return this.intersectBox(e,Si)!==null}intersectTriangle(e,t,i,s,a){let n=this.origin,o=this.direction,l=o.x,c=o.y,h=o.z,m=e.x-n.x,u=e.y-n.y,d=e.z-n.z,g=t.x-n.x,S=t.y-n.y,f=t.z-n.z,p=i.x-n.x,y=i.y-n.y,E=i.z-n.z,x=Math.abs(l),T=Math.abs(c),b=Math.abs(h),A,_,w,I,L,U,V,P,H,Y,z,J;if(x>=T&&x>=b?(w=l,U=m,H=g,J=p,l>=0?(A=c,_=h,I=u,L=d,V=S,P=f,Y=y,z=E):(A=h,_=c,I=d,L=u,V=f,P=S,Y=E,z=y)):T>=b?(w=c,U=u,H=S,J=y,c>=0?(A=h,_=l,I=d,L=m,V=f,P=g,Y=E,z=p):(A=l,_=h,I=m,L=d,V=g,P=f,Y=p,z=E)):(w=h,U=d,H=f,J=E,h>=0?(A=l,_=c,I=m,L=u,V=g,P=S,Y=p,z=y):(A=c,_=l,I=u,L=m,V=S,P=g,Y=y,z=p)),w===0)return null;let X=A/w,Z=_/w,Q=1/w,Le=I-X*U,fe=L-Z*U,qe=V-X*H,Qe=P-Z*H,it=Y-X*J,K=z-Z*J,$=it*Qe-K*qe,ye=Le*K-fe*it,Be=qe*fe-Qe*Le;if(s){if($<0||ye<0||Be<0)return null}else if(($<0||ye<0||Be<0)&&($>0||ye>0||Be>0))return null;let pe=$+ye+Be;if(pe===0)return null;let Te=Q*($*U+ye*H+Be*J);return(pe>0?Te<0:Te>0)?null:this.at(Te/pe,a)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}},ir=class extends Ei{constructor(e){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new He(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new wi,this.combine=bn,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}},Mc=new Xe,$i=new tr,Qs=new ti,bc=new R,ea=new R,ta=new R,ia=new R,Vo=new R,ra=new R,Tc=new R,sa=new R,Et=class extends Tt{constructor(e=new ct,t=new ir){super(),this.isMesh=!0,this.type="Mesh",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){let e=this.geometry.morphAttributes,t=Object.keys(e);if(t.length>0){let i=e[t[0]];if(i!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let s=0,a=i.length;s<a;s++){let n=i[s].name||String(s);this.morphTargetInfluences.push(0),this.morphTargetDictionary[n]=s}}}}getVertexPosition(e,t){let i=this.geometry,s=i.attributes.position,a=i.morphAttributes.position,n=i.morphTargetsRelative;t.fromBufferAttribute(s,e);let o=this.morphTargetInfluences;if(a&&o){ra.set(0,0,0);for(let l=0,c=a.length;l<c;l++){let h=o[l],m=a[l];h!==0&&(Vo.fromBufferAttribute(m,e),n?ra.addScaledVector(Vo,h):ra.addScaledVector(Vo.sub(t),h))}t.add(ra)}return t}intersectsFrustum(e){return e.intersectsObject(this)}raycast(e,t){let i=this.geometry,s=this.material,a=this.matrixWorld;s!==void 0&&(i.boundingSphere===null&&i.computeBoundingSphere(),Qs.copy(i.boundingSphere),Qs.applyMatrix4(a),$i.copy(e.ray).recast(e.near),!(Qs.containsPoint($i.origin)===!1&&($i.intersectSphere(Qs,bc)===null||$i.origin.distanceToSquared(bc)>(e.far-e.near)**2))&&(Mc.copy(a).invert(),$i.copy(e.ray).applyMatrix4(Mc),!(i.boundingBox!==null&&$i.intersectsBox(i.boundingBox)===!1)&&this._computeIntersections(e,t,$i)))}_computeIntersections(e,t,i){let s,a=this.geometry,n=this.material,o=a.index,l=a.attributes.position,c=a.attributes.uv,h=a.attributes.uv1,m=a.attributes.normal,u=a.groups,d=a.drawRange;if(o!==null)if(Array.isArray(n))for(let g=0,S=u.length;g<S;g++){let f=u[g],p=n[f.materialIndex],y=Math.max(f.start,d.start),E=Math.min(o.count,Math.min(f.start+f.count,d.start+d.count));for(let x=y,T=E;x<T;x+=3){let b=o.getX(x),A=o.getX(x+1),_=o.getX(x+2);s=aa(this,p,e,i,c,h,m,b,A,_),s&&(s.faceIndex=Math.floor(x/3),s.face.materialIndex=f.materialIndex,t.push(s))}}else{let g=Math.max(0,d.start),S=Math.min(o.count,d.start+d.count);for(let f=g,p=S;f<p;f+=3){let y=o.getX(f),E=o.getX(f+1),x=o.getX(f+2);s=aa(this,n,e,i,c,h,m,y,E,x),s&&(s.faceIndex=Math.floor(f/3),t.push(s))}}else if(l!==void 0)if(Array.isArray(n))for(let g=0,S=u.length;g<S;g++){let f=u[g],p=n[f.materialIndex],y=Math.max(f.start,d.start),E=Math.min(l.count,Math.min(f.start+f.count,d.start+d.count));for(let x=y,T=E;x<T;x+=3){let b=x,A=x+1,_=x+2;s=aa(this,p,e,i,c,h,m,b,A,_),s&&(s.faceIndex=Math.floor(x/3),s.face.materialIndex=f.materialIndex,t.push(s))}}else{let g=Math.max(0,d.start),S=Math.min(l.count,d.start+d.count);for(let f=g,p=S;f<p;f+=3){let y=f,E=f+1,x=f+2;s=aa(this,n,e,i,c,h,m,y,E,x),s&&(s.faceIndex=Math.floor(f/3),t.push(s))}}}};function Ou(r,e,t,i,s,a,n,o){let l;if(e.side===Pt?l=i.intersectTriangle(n,a,s,!0,o):l=i.intersectTriangle(s,a,n,e.side===Hi,o),l===null)return null;sa.copy(o),sa.applyMatrix4(r.matrixWorld);let c=t.ray.origin.distanceTo(sa);return c<t.near||c>t.far?null:{distance:c,point:sa.clone(),object:r}}function aa(r,e,t,i,s,a,n,o,l,c){r.getVertexPosition(o,ea),r.getVertexPosition(l,ta),r.getVertexPosition(c,ia);let h=Ou(r,e,t,i,ea,ta,ia,Tc);if(h){let m=new R;Mi.getBarycoord(Tc,ea,ta,ia,m),s&&(h.uv=Mi.getInterpolatedAttribute(s,o,l,c,m,new ae)),a&&(h.uv1=Mi.getInterpolatedAttribute(a,o,l,c,m,new ae)),n&&(h.normal=Mi.getInterpolatedAttribute(n,o,l,c,m,new R),h.normal.dot(i.direction)>0&&h.normal.multiplyScalar(-1));let u={a:o,b:l,c,normal:new R,materialIndex:0};Mi.getNormal(ea,ta,ia,u.normal),h.face=u,h.barycoord=m}return h}var O_=new lt,F_=new lt,B_=new lt,z_=new lt,G_=new Xe,V_=new R,k_=new ti,H_=new Xe,W_=new tr;var Na=class extends Ut{constructor(e=null,t=1,i=1,s,a,n,o,l,c=bt,h=bt,m,u){super(null,n,o,l,c,h,s,a,m,u),this.isDataTexture=!0,this.image={data:e,width:t,height:i},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}},X_=new Xe,j_=new Xe;var q_=new Xe,Y_=new Xe;var Z_=new ei,J_=new Xe,K_=new Et,$_=new ti;var Qi=new ti,Fu=new ae(.5,.5),na=new R,Ai=class{constructor(e=new Qt,t=new Qt,i=new Qt,s=new Qt,a=new Qt,n=new Qt){this.planes=[e,t,i,s,a,n]}set(e,t,i,s,a,n){let o=this.planes;return o[0].copy(e),o[1].copy(t),o[2].copy(i),o[3].copy(s),o[4].copy(a),o[5].copy(n),this}copy(e){let t=this.planes;for(let i=0;i<6;i++)t[i].copy(e.planes[i]);return this}setFromProjectionMatrix(e,t=Xt,i=!1){let s=this.planes,a=e.elements,n=a[0],o=a[1],l=a[2],c=a[3],h=a[4],m=a[5],u=a[6],d=a[7],g=a[8],S=a[9],f=a[10],p=a[11],y=a[12],E=a[13],x=a[14],T=a[15];if(s[0].setComponents(c-n,d-h,p-g,T-y).normalize(),s[1].setComponents(c+n,d+h,p+g,T+y).normalize(),s[2].setComponents(c+o,d+m,p+S,T+E).normalize(),s[3].setComponents(c-o,d-m,p-S,T-E).normalize(),i)s[4].setComponents(l,u,f,x).normalize(),s[5].setComponents(c-l,d-u,p-f,T-x).normalize();else if(s[4].setComponents(c-l,d-u,p-f,T-x).normalize(),t===Xt)s[5].setComponents(c+l,d+u,p+f,T+x).normalize();else if(t===Er)s[5].setComponents(l,u,f,x).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),Qi.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{let t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),Qi.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(Qi)}intersectsSprite(e){Qi.center.set(0,0,0);let t=Fu.distanceTo(e.center);return Qi.radius=.7071067811865476+t,Qi.applyMatrix4(e.matrixWorld),this.intersectsSphere(Qi)}intersectsSphere(e){let t=this.planes,i=e.center,s=-e.radius;for(let a=0;a<6;a++)if(t[a].distanceToPoint(i)<s)return!1;return!0}intersectsBox(e){let t=this.planes;for(let i=0;i<6;i++){let s=t[i];if(na.x=s.normal.x>0?e.max.x:e.min.x,na.y=s.normal.y>0?e.max.y:e.min.y,na.z=s.normal.z>0?e.max.z:e.min.z,s.distanceToPoint(na)<0)return!1}return!0}containsPoint(e){let t=this.planes;for(let i=0;i<6;i++)if(t[i].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}},wc=new Xe,Ua=class r{constructor(){this.coordinateSystem=Xt,this._frustums=[],this._count=0}setFromArrayCamera(e){let t=e.cameras,i=this._frustums;for(let s=0;s<t.length;s++){let a=t[s];wc.multiplyMatrices(a.projectionMatrix,a.matrixWorldInverse),i[s]===void 0&&(i[s]=new Ai),i[s].setFromProjectionMatrix(wc,a.coordinateSystem,a.reversedDepth)}return this._count=t.length,this}intersectsObject(e){let t=this._frustums;for(let i=0;i<this._count;i++)if(t[i].intersectsObject(e))return!0;return!1}intersectsSprite(e){let t=this._frustums;for(let i=0;i<this._count;i++)if(t[i].intersectsSprite(e))return!0;return!1}intersectsSphere(e){let t=this._frustums;for(let i=0;i<this._count;i++)if(t[i].intersectsSphere(e))return!0;return!1}intersectsBox(e){let t=this._frustums;for(let i=0;i<this._count;i++)if(t[i].intersectsBox(e))return!0;return!1}containsPoint(e){let t=this._frustums;for(let i=0;i<this._count;i++)if(t[i].containsPoint(e))return!0;return!1}copy(e){this.coordinateSystem=e.coordinateSystem;let t=this._frustums,i=e._frustums;for(let s=0;s<e._count;s++)t[s]===void 0&&(t[s]=new Ai),t[s].copy(i[s]);return this._count=e._count,this}clone(){return new r().copy(this)}};var Qo=class{constructor(){this.index=0,this.pool=[],this.list=[]}push(e,t,i,s){let a=this.pool,n=this.list;this.index>=a.length&&a.push({start:-1,count:-1,z:-1,index:-1});let o=a[this.index];n.push(o),this.index++,o.start=e,o.count=t,o.z=i,o.index=s}reset(){this.list.length=0,this.index=0}},Q_=new Xe,e0=new He(1,1,1),t0=new Ai,i0=new Ua,r0=new ei,s0=new ti,a0=new R,n0=new R,o0=new R,l0=new Qo,c0=new Et;var rr=class extends Ei{constructor(e){super(),this.isLineBasicMaterial=!0,this.type="LineBasicMaterial",this.color=new He(16777215),this.map=null,this.linewidth=1,this.linecap="round",this.linejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.linewidth=e.linewidth,this.linecap=e.linecap,this.linejoin=e.linejoin,this.fog=e.fog,this}},Da=new R,Oa=new R,Ec=new Xe,$r=new tr,oa=new ti,ko=new R,Ac=new R,Ir=class extends Tt{constructor(e=new ct,t=new rr){super(),this.isLine=!0,this.type="Line",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}computeLineDistances(){let e=this.geometry;if(e.index===null){let t=e.attributes.position,i=[0];for(let s=1,a=t.count;s<a;s++)Da.fromBufferAttribute(t,s-1),Oa.fromBufferAttribute(t,s),i[s]=i[s-1],i[s]+=Da.distanceTo(Oa);e.setAttribute("lineDistance",new De(i,1))}else Ue("Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}intersectsFrustum(e){return e.intersectsObject(this)}raycast(e,t){let i=this.geometry,s=this.matrixWorld,a=e.params.Line.threshold,n=i.drawRange;if(i.boundingSphere===null&&i.computeBoundingSphere(),oa.copy(i.boundingSphere),oa.applyMatrix4(s),oa.radius+=a,e.ray.intersectsSphere(oa)===!1)return;Ec.copy(s).invert(),$r.copy(e.ray).applyMatrix4(Ec);let o=a/((this.scale.x+this.scale.y+this.scale.z)/3),l=o*o,c=this.isLineSegments?2:1,h=i.index,m=i.attributes.position;if(h!==null){let u=Math.max(0,n.start),d=Math.min(h.count,n.start+n.count);for(let g=u,S=d-1;g<S;g+=c){let f=h.getX(g),p=h.getX(g+1),y=la(this,e,$r,l,f,p,g);y&&t.push(y)}if(this.isLineLoop){let g=h.getX(d-1),S=h.getX(u),f=la(this,e,$r,l,g,S,d-1);f&&t.push(f)}}else{let u=Math.max(0,n.start),d=Math.min(m.count,n.start+n.count);for(let g=u,S=d-1;g<S;g+=c){let f=la(this,e,$r,l,g,g+1,g);f&&t.push(f)}if(this.isLineLoop){let g=la(this,e,$r,l,d-1,u,d-1);g&&t.push(g)}}}updateMorphTargets(){let e=this.geometry.morphAttributes,t=Object.keys(e);if(t.length>0){let i=e[t[0]];if(i!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let s=0,a=i.length;s<a;s++){let n=i[s].name||String(s);this.morphTargetInfluences.push(0),this.morphTargetDictionary[n]=s}}}}};function la(r,e,t,i,s,a,n){let o=r.geometry.attributes.position;if(Da.fromBufferAttribute(o,s),Oa.fromBufferAttribute(o,a),t.distanceSqToSegment(Da,Oa,ko,Ac)>i)return;ko.applyMatrix4(r.matrixWorld);let l=e.ray.origin.distanceTo(ko);if(!(l<e.near||l>e.far))return{distance:l,point:Ac.clone().applyMatrix4(r.matrixWorld),index:n,face:null,faceIndex:null,barycoord:null,object:r}}var Cc=new R,Rc=new R,us=class extends Ir{constructor(e,t){super(e,t),this.isLineSegments=!0,this.type="LineSegments"}computeLineDistances(){let e=this.geometry;if(e.index===null){let t=e.attributes.position,i=[];for(let s=0,a=t.count;s<a;s+=2)Cc.fromBufferAttribute(t,s),Rc.fromBufferAttribute(t,s+1),i[s]=s===0?0:i[s-1],i[s+1]=i[s]+Cc.distanceTo(Rc);e.setAttribute("lineDistance",new De(i,1))}else Ue("LineSegments.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}};var h0=new Xe,u0=new tr,d0=new ti,p0=new R;var ds=class extends Ut{constructor(e=[],t=Wi,i,s,a,n,o,l,c,h){super(e,t,i,s,a,n,o,l,c,h),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}};var zi=class extends Ut{constructor(e,t,i=ri,s,a,n,o=bt,l=bt,c,h=ui,m=1){if(h!==ui&&h!==ji)throw new Error("THREE.DepthTexture: format must be either THREE.DepthFormat or THREE.DepthStencilFormat");let u={width:e,height:t,depth:m};super(u,s,a,n,o,l,h,i,c),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.source=new Cr(Object.assign({},e.image)),this.compareFunction=e.compareFunction,this}toJSON(e){let t=super.toJSON(e);return t.compareFunction=this.compareFunction,t}},Fa=class extends zi{constructor(e,t=ri,i=Wi,s,a,n=bt,o=bt,l,c=ui){let h={width:e,height:e,depth:1},m=[h,h,h,h,h,h];super(e,e,t,i,s,a,n,o,l,c),this.image=m,this.isCubeDepthTexture=!0,this.isCubeTexture=!0}get images(){return this.image}set images(e){this.image=e}},ps=class extends Ut{constructor(e=null){super(),this.sourceTexture=e,this.isExternalTexture=!0}copy(e){return super.copy(e),this.sourceTexture=e.sourceTexture,this}},Ci=class r extends ct{constructor(e=1,t=1,i=1,s=1,a=1,n=1){super(),this.type="BoxGeometry",this.parameters={width:e,height:t,depth:i,widthSegments:s,heightSegments:a,depthSegments:n};let o=this;s=Math.floor(s),a=Math.floor(a),n=Math.floor(n);let l=[],c=[],h=[],m=[],u=0,d=0;g("z","y","x",-1,-1,i,t,e,n,a,0),g("z","y","x",1,-1,i,t,-e,n,a,1),g("x","z","y",1,1,e,i,t,s,n,2),g("x","z","y",1,-1,e,i,-t,s,n,3),g("x","y","z",1,-1,e,t,i,s,a,4),g("x","y","z",-1,-1,e,t,-i,s,a,5),this.setIndex(l),this.setAttribute("position",new De(c,3)),this.setAttribute("normal",new De(h,3)),this.setAttribute("uv",new De(m,2));function g(S,f,p,y,E,x,T,b,A,_,w){let I=x/A,L=T/_,U=x/2,V=T/2,P=b/2,H=A+1,Y=_+1,z=0,J=0,X=new R;for(let Z=0;Z<Y;Z++){let Q=Z*L-V;for(let Le=0;Le<H;Le++){let fe=Le*I-U;X[S]=fe*y,X[f]=Q*E,X[p]=P,c.push(X.x,X.y,X.z),X[S]=0,X[f]=0,X[p]=b>0?1:-1,h.push(X.x,X.y,X.z),m.push(Le/A),m.push(1-Z/_),z+=1}}for(let Z=0;Z<_;Z++)for(let Q=0;Q<A;Q++){let Le=u+Q+H*Z,fe=u+Q+H*(Z+1),qe=u+(Q+1)+H*(Z+1),Qe=u+(Q+1)+H*Z;l.push(Le,fe,Qe),l.push(fe,qe,Qe),J+=6}o.addGroup(d,J,w),d+=J,u+=z}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new r(e.width,e.height,e.depth,e.widthSegments,e.heightSegments,e.depthSegments)}},Ba=class r extends ct{constructor(e=1,t=1,i=4,s=8,a=1){super(),this.type="CapsuleGeometry",this.parameters={radius:e,height:t,capSegments:i,radialSegments:s,heightSegments:a},t=Math.max(0,t),i=Math.max(1,Math.floor(i)),s=Math.max(3,Math.floor(s)),a=Math.max(1,Math.floor(a));let n=[],o=[],l=[],c=[],h=t/2,m=Math.PI/2*e,u=t,d=2*m+u,g=i*2+a,S=s+1,f=new R,p=new R;for(let y=0;y<=g;y++){let E=0,x=0,T=0,b=0;if(y<=i){let w=y/i,I=w*Math.PI/2;x=-h-e*Math.cos(I),T=e*Math.sin(I),b=-e*Math.cos(I),E=w*m}else if(y<=i+a){let w=(y-i)/a;x=-h+w*t,T=e,b=0,E=m+w*u}else{let w=(y-i-a)/i,I=w*Math.PI/2;x=h+e*Math.sin(I),T=e*Math.cos(I),b=e*Math.sin(I),E=m+u+w*m}let A=Math.max(0,Math.min(1,E/d)),_=0;y===0?_=.5/s:y===g&&(_=-.5/s);for(let w=0;w<=s;w++){let I=w/s,L=I*Math.PI*2,U=Math.sin(L),V=Math.cos(L);p.x=-T*V,p.y=x,p.z=T*U,o.push(p.x,p.y,p.z),f.set(-T*V,b,T*U),f.normalize(),l.push(f.x,f.y,f.z),c.push(I+_,A)}if(y>0){let w=(y-1)*S;for(let I=0;I<s;I++){let L=w+I,U=w+I+1,V=y*S+I,P=y*S+I+1;n.push(L,U,V),n.push(U,P,V)}}}this.setIndex(n),this.setAttribute("position",new De(o,3)),this.setAttribute("normal",new De(l,3)),this.setAttribute("uv",new De(c,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new r(e.radius,e.height,e.capSegments,e.radialSegments,e.heightSegments)}},za=class r extends ct{constructor(e=1,t=32,i=0,s=Math.PI*2){super(),this.type="CircleGeometry",this.parameters={radius:e,segments:t,thetaStart:i,thetaLength:s},t=Math.max(3,t);let a=[],n=[],o=[],l=[],c=new R,h=new ae;n.push(0,0,0),o.push(0,0,1),l.push(.5,.5);for(let m=0,u=3;m<=t;m++,u+=3){let d=i+m/t*s;c.x=e*Math.cos(d),c.y=e*Math.sin(d),n.push(c.x,c.y,c.z),o.push(0,0,1),h.x=(n[u]/e+1)/2,h.y=(n[u+1]/e+1)/2,l.push(h.x,h.y)}for(let m=1;m<=t;m++)a.push(m,m+1,0);this.setIndex(a),this.setAttribute("position",new De(n,3)),this.setAttribute("normal",new De(o,3)),this.setAttribute("uv",new De(l,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new r(e.radius,e.segments,e.thetaStart,e.thetaLength)}},ms=class r extends ct{constructor(e=1,t=1,i=1,s=32,a=1,n=!1,o=0,l=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:e,radiusBottom:t,height:i,radialSegments:s,heightSegments:a,openEnded:n,thetaStart:o,thetaLength:l};let c=this;s=Math.floor(s),a=Math.floor(a);let h=[],m=[],u=[],d=[],g=0,S=[],f=i/2,p=0;y(),n===!1&&(e>0&&E(!0),t>0&&E(!1)),this.setIndex(h),this.setAttribute("position",new De(m,3)),this.setAttribute("normal",new De(u,3)),this.setAttribute("uv",new De(d,2));function y(){let x=new R,T=new R,b=0,A=(t-e)/i;for(let _=0;_<=a;_++){let w=[],I=_/a,L=I*(t-e)+e;for(let U=0;U<=s;U++){let V=U/s,P=V*l+o,H=Math.sin(P),Y=Math.cos(P);T.x=L*H,T.y=-I*i+f,T.z=L*Y,m.push(T.x,T.y,T.z),x.set(H,A,Y).normalize(),u.push(x.x,x.y,x.z),d.push(V,1-I),w.push(g++)}S.push(w)}for(let _=0;_<s;_++)for(let w=0;w<a;w++){let I=S[w][_],L=S[w+1][_],U=S[w+1][_+1],V=S[w][_+1];(e>0||w!==0)&&(h.push(I,L,V),b+=3),(t>0||w!==a-1)&&(h.push(L,U,V),b+=3)}c.addGroup(p,b,0),p+=b}function E(x){let T=g,b=new ae,A=new R,_=0,w=x===!0?e:t,I=x===!0?1:-1;for(let U=1;U<=s;U++)m.push(0,f*I,0),u.push(0,I,0),d.push(.5,.5),g++;let L=g;for(let U=0;U<=s;U++){let V=U/s*l+o,P=Math.cos(V),H=Math.sin(V);A.x=w*H,A.y=f*I,A.z=w*P,m.push(A.x,A.y,A.z),u.push(0,I,0),b.x=P*.5+.5,b.y=H*.5*I+.5,d.push(b.x,b.y),g++}for(let U=0;U<s;U++){let V=T+U,P=L+U;x===!0?h.push(P,P+1,V):h.push(P+1,P,V),_+=3}c.addGroup(p,_,x===!0?1:2),p+=_}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new r(e.radiusTop,e.radiusBottom,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}},Pr=class r extends ms{constructor(e=1,t=1,i=32,s=1,a=!1,n=0,o=Math.PI*2){super(0,e,t,i,s,a,n,o),this.type="ConeGeometry",this.parameters={radius:e,height:t,radialSegments:i,heightSegments:s,openEnded:a,thetaStart:n,thetaLength:o}}static fromJSON(e){return new r(e.radius,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}},Gi=class r extends ct{constructor(e=[],t=[],i=1,s=0){super(),this.type="PolyhedronGeometry",this.parameters={vertices:e,indices:t,radius:i,detail:s};let a=[],n=[];o(s),c(i),h(),this.setAttribute("position",new De(a,3)),this.setAttribute("normal",new De(a.slice(),3)),this.setAttribute("uv",new De(n,2)),s===0?this.computeVertexNormals():this.normalizeNormals();function o(y){let E=new R,x=new R,T=new R;for(let b=0;b<t.length;b+=3)d(t[b+0],E),d(t[b+1],x),d(t[b+2],T),l(E,x,T,y)}function l(y,E,x,T){let b=T+1,A=[];for(let _=0;_<=b;_++){A[_]=[];let w=y.clone().lerp(x,_/b),I=E.clone().lerp(x,_/b),L=b-_;for(let U=0;U<=L;U++)U===0&&_===b?A[_][U]=w:A[_][U]=w.clone().lerp(I,U/L)}for(let _=0;_<b;_++)for(let w=0;w<2*(b-_)-1;w++){let I=Math.floor(w/2);w%2===0?(u(A[_][I+1]),u(A[_+1][I]),u(A[_][I])):(u(A[_][I+1]),u(A[_+1][I+1]),u(A[_+1][I]))}}function c(y){let E=new R;for(let x=0;x<a.length;x+=3)E.x=a[x+0],E.y=a[x+1],E.z=a[x+2],E.normalize().multiplyScalar(y),a[x+0]=E.x,a[x+1]=E.y,a[x+2]=E.z}function h(){let y=new R;for(let E=0;E<a.length;E+=3){y.x=a[E+0],y.y=a[E+1],y.z=a[E+2];let x=f(y)/2/Math.PI+.5,T=p(y)/Math.PI+.5;n.push(x,1-T)}g(),m()}function m(){for(let y=0;y<n.length;y+=6){let E=n[y+0],x=n[y+2],T=n[y+4],b=Math.max(E,x,T),A=Math.min(E,x,T);b>.9&&A<.1&&(E<.2&&(n[y+0]+=1),x<.2&&(n[y+2]+=1),T<.2&&(n[y+4]+=1))}}function u(y){a.push(y.x,y.y,y.z)}function d(y,E){let x=y*3;E.x=e[x+0],E.y=e[x+1],E.z=e[x+2]}function g(){let y=new R,E=new R,x=new R,T=new R,b=new ae,A=new ae,_=new ae;for(let w=0,I=0;w<a.length;w+=9,I+=6){y.set(a[w+0],a[w+1],a[w+2]),E.set(a[w+3],a[w+4],a[w+5]),x.set(a[w+6],a[w+7],a[w+8]),b.set(n[I+0],n[I+1]),A.set(n[I+2],n[I+3]),_.set(n[I+4],n[I+5]),T.copy(y).add(E).add(x).divideScalar(3);let L=f(T);S(b,I+0,y,L),S(A,I+2,E,L),S(_,I+4,x,L)}}function S(y,E,x,T){T<0&&y.x===1&&(n[E]=y.x-1),x.x===0&&x.z===0&&(n[E]=T/2/Math.PI+.5)}function f(y){return Math.atan2(y.z,-y.x)}function p(y){return Math.atan2(-y.y,Math.sqrt(y.x*y.x+y.z*y.z))}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new r(e.vertices,e.indices,e.radius,e.detail)}},Ga=class r extends Gi{constructor(e=1,t=0){let i=(1+Math.sqrt(5))/2,s=1/i,a=[-1,-1,-1,-1,-1,1,-1,1,-1,-1,1,1,1,-1,-1,1,-1,1,1,1,-1,1,1,1,0,-s,-i,0,-s,i,0,s,-i,0,s,i,-s,-i,0,-s,i,0,s,-i,0,s,i,0,-i,0,-s,i,0,-s,-i,0,s,i,0,s],n=[3,11,7,3,7,15,3,15,13,7,19,17,7,17,6,7,6,15,17,4,8,17,8,10,17,10,6,8,0,16,8,16,2,8,2,10,0,12,1,0,1,18,0,18,16,6,10,2,6,2,13,6,13,15,2,16,18,2,18,3,2,3,13,18,1,9,18,9,11,18,11,3,4,14,12,4,12,0,4,0,8,11,9,5,11,5,19,11,19,7,19,5,14,19,14,4,19,4,17,1,12,14,1,14,5,1,5,9];super(a,n,e,t),this.type="DodecahedronGeometry",this.parameters={radius:e,detail:t}}static fromJSON(e){return new r(e.radius,e.detail)}},ca=new R,ha=new R,Ho=new R,ua=new Mi,Lr=class extends ct{constructor(e=null,t=1){if(super(),this.type="EdgesGeometry",this.parameters={geometry:e,thresholdAngle:t},e!==null){let i=Math.pow(10,4),s=Math.cos(va*t),a=e.getIndex(),n=e.getAttribute("position"),o=a?a.count:n.count,l=[0,0,0],c=["a","b","c"],h=new Array(3),m={},u=[];for(let d=0;d<o;d+=3){a?(l[0]=a.getX(d),l[1]=a.getX(d+1),l[2]=a.getX(d+2)):(l[0]=d,l[1]=d+1,l[2]=d+2);let{a:g,b:S,c:f}=ua;if(g.fromBufferAttribute(n,l[0]),S.fromBufferAttribute(n,l[1]),f.fromBufferAttribute(n,l[2]),ua.getNormal(Ho),h[0]=`${Math.round(g.x*i)},${Math.round(g.y*i)},${Math.round(g.z*i)}`,h[1]=`${Math.round(S.x*i)},${Math.round(S.y*i)},${Math.round(S.z*i)}`,h[2]=`${Math.round(f.x*i)},${Math.round(f.y*i)},${Math.round(f.z*i)}`,!(h[0]===h[1]||h[1]===h[2]||h[2]===h[0]))for(let p=0;p<3;p++){let y=(p+1)%3,E=h[p],x=h[y],T=ua[c[p]],b=ua[c[y]],A=`${E}_${x}`,_=`${x}_${E}`;_ in m&&m[_]?(Ho.dot(m[_].normal)<=s&&(u.push(T.x,T.y,T.z),u.push(b.x,b.y,b.z)),m[_]=null):A in m||(m[A]={index0:l[p],index1:l[y],normal:Ho.clone()})}}for(let d in m)if(m[d]){let{index0:g,index1:S}=m[d];ca.fromBufferAttribute(n,g),ha.fromBufferAttribute(n,S),u.push(ca.x,ca.y,ca.z),u.push(ha.x,ha.y,ha.z)}this.setAttribute("position",new De(u,3))}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}},Vt=class{constructor(){this.type="Curve",this.arcLengthDivisions=200,this.needsUpdate=!1,this.cacheArcLengths=null}getPoint(){Ue("Curve: .getPoint() not implemented.")}getPointAt(e,t){let i=this.getUtoTmapping(e);return this.getPoint(i,t)}getPoints(e=5){let t=[];for(let i=0;i<=e;i++)t.push(this.getPoint(i/e));return t}getSpacedPoints(e=5){let t=[];for(let i=0;i<=e;i++)t.push(this.getPointAt(i/e));return t}getLength(){let e=this.getLengths();return e[e.length-1]}getLengths(e=this.arcLengthDivisions){if(this.cacheArcLengths&&this.cacheArcLengths.length===e+1&&!this.needsUpdate)return this.cacheArcLengths;this.needsUpdate=!1;let t=[],i,s=this.getPoint(0),a=0;t.push(0);for(let n=1;n<=e;n++)i=this.getPoint(n/e),a+=i.distanceTo(s),t.push(a),s=i;return this.cacheArcLengths=t,t}updateArcLengths(){this.needsUpdate=!0,this.getLengths()}getUtoTmapping(e,t=null){let i=this.getLengths(),s=0,a=i.length,n;t?n=t:n=e*i[a-1];let o=0,l=a-1,c;for(;o<=l;)if(s=Math.floor(o+(l-o)/2),c=i[s]-n,c<0)o=s+1;else if(c>0)l=s-1;else{l=s;break}if(s=l,i[s]===n)return s/(a-1);let h=i[s],m=i[s+1]-h,u=(n-h)/m;return(s+u)/(a-1)}getTangent(e,t){let i=e-1e-4,s=e+1e-4;i<0&&(i=0),s>1&&(s=1);let a=this.getPoint(i),n=this.getPoint(s),o=t||(a.isVector2?new ae:new R);return o.copy(n).sub(a).normalize(),o}getTangentAt(e,t){let i=this.getUtoTmapping(e);return this.getTangent(i,t)}computeFrenetFrames(e,t=!1){let i=new R,s=[],a=[],n=[],o=new R,l=new Xe;for(let d=0;d<=e;d++){let g=d/e;s[d]=this.getTangentAt(g,new R)}a[0]=new R,n[0]=new R;let c=Number.MAX_VALUE,h=Math.abs(s[0].x),m=Math.abs(s[0].y),u=Math.abs(s[0].z);h<=c&&(c=h,i.set(1,0,0)),m<=c&&(c=m,i.set(0,1,0)),u<=c&&i.set(0,0,1),o.crossVectors(s[0],i).normalize(),a[0].crossVectors(s[0],o),n[0].crossVectors(s[0],a[0]);for(let d=1;d<=e;d++){if(a[d]=a[d-1].clone(),n[d]=n[d-1].clone(),o.crossVectors(s[d-1],s[d]),o.length()>Number.EPSILON){o.normalize();let g=Math.acos(Ke(s[d-1].dot(s[d]),-1,1));a[d].applyMatrix4(l.makeRotationAxis(o,g))}n[d].crossVectors(s[d],a[d])}if(t===!0){let d=Math.acos(Ke(a[0].dot(a[e]),-1,1));d/=e,s[0].dot(o.crossVectors(a[0],a[e]))>0&&(d=-d);for(let g=1;g<=e;g++)a[g].applyMatrix4(l.makeRotationAxis(s[g],d*g)),n[g].crossVectors(s[g],a[g])}return{tangents:s,normals:a,binormals:n}}clone(){return new this.constructor().copy(this)}copy(e){return this.arcLengthDivisions=e.arcLengthDivisions,this}toJSON(){let e={metadata:{version:4.7,type:"Curve",generator:"Curve.toJSON"}};return e.arcLengthDivisions=this.arcLengthDivisions,e.type=this.type,e}fromJSON(e){return this.arcLengthDivisions=e.arcLengthDivisions,this}},Nr=class extends Vt{constructor(e=0,t=0,i=1,s=1,a=0,n=Math.PI*2,o=!1,l=0){super(),this.isEllipseCurve=!0,this.type="EllipseCurve",this.aX=e,this.aY=t,this.xRadius=i,this.yRadius=s,this.aStartAngle=a,this.aEndAngle=n,this.aClockwise=o,this.aRotation=l}getPoint(e,t=new ae){let i=t,s=Math.PI*2,a=this.aEndAngle-this.aStartAngle,n=Math.abs(a)<Number.EPSILON;for(;a<0;)a+=s;for(;a>s;)a-=s;a<Number.EPSILON&&(n?a=0:a=s),this.aClockwise===!0&&!n&&(a===s?a=-s:a=a-s);let o=this.aStartAngle+e*a,l=this.aX+this.xRadius*Math.cos(o),c=this.aY+this.yRadius*Math.sin(o);if(this.aRotation!==0){let h=Math.cos(this.aRotation),m=Math.sin(this.aRotation),u=l-this.aX,d=c-this.aY;l=u*h-d*m+this.aX,c=u*m+d*h+this.aY}return i.set(l,c)}copy(e){return super.copy(e),this.aX=e.aX,this.aY=e.aY,this.xRadius=e.xRadius,this.yRadius=e.yRadius,this.aStartAngle=e.aStartAngle,this.aEndAngle=e.aEndAngle,this.aClockwise=e.aClockwise,this.aRotation=e.aRotation,this}toJSON(){let e=super.toJSON();return e.aX=this.aX,e.aY=this.aY,e.xRadius=this.xRadius,e.yRadius=this.yRadius,e.aStartAngle=this.aStartAngle,e.aEndAngle=this.aEndAngle,e.aClockwise=this.aClockwise,e.aRotation=this.aRotation,e}fromJSON(e){return super.fromJSON(e),this.aX=e.aX,this.aY=e.aY,this.xRadius=e.xRadius,this.yRadius=e.yRadius,this.aStartAngle=e.aStartAngle,this.aEndAngle=e.aEndAngle,this.aClockwise=e.aClockwise,this.aRotation=e.aRotation,this}},Va=class extends Nr{constructor(e,t,i,s,a,n){super(e,t,i,i,s,a,n),this.isArcCurve=!0,this.type="ArcCurve"}};function Rl(){let r=0,e=0,t=0,i=0;function s(a,n,o,l){r=a,e=o,t=-3*a+3*n-2*o-l,i=2*a-2*n+o+l}return{initCatmullRom:function(a,n,o,l,c){s(n,o,c*(o-a),c*(l-n))},initNonuniformCatmullRom:function(a,n,o,l,c,h,m){let u=(n-a)/c-(o-a)/(c+h)+(o-n)/h,d=(o-n)/h-(l-n)/(h+m)+(l-o)/m;u*=h,d*=h,s(n,o,u,d)},calc:function(a){let n=a*a,o=n*a;return r+e*a+t*n+i*o}}}var Ic=new R,Pc=new R,Wo=new Rl,Xo=new Rl,jo=new Rl,ka=class extends Vt{constructor(e=[],t=!1,i="centripetal",s=.5){super(),this.isCatmullRomCurve3=!0,this.type="CatmullRomCurve3",this.points=e,this.closed=t,this.curveType=i,this.tension=s}getPoint(e,t=new R){let i=t,s=this.points,a=s.length,n=(a-(this.closed?0:1))*e,o=Math.floor(n),l=n-o;this.closed?o+=o>0?0:(Math.floor(Math.abs(o)/a)+1)*a:l===0&&o===a-1&&(o=a-2,l=1);let c,h;this.closed||o>0?c=s[(o-1)%a]:(Pc.subVectors(s[0],s[1]).add(s[0]),c=Pc);let m=s[o%a],u=s[(o+1)%a];if(this.closed||o+2<a?h=s[(o+2)%a]:(Ic.subVectors(s[a-1],s[a-2]).add(s[a-1]),h=Ic),this.curveType==="centripetal"||this.curveType==="chordal"){let d=this.curveType==="chordal"?.5:.25,g=Math.pow(c.distanceToSquared(m),d),S=Math.pow(m.distanceToSquared(u),d),f=Math.pow(u.distanceToSquared(h),d);S<1e-4&&(S=1),g<1e-4&&(g=S),f<1e-4&&(f=S),Wo.initNonuniformCatmullRom(c.x,m.x,u.x,h.x,g,S,f),Xo.initNonuniformCatmullRom(c.y,m.y,u.y,h.y,g,S,f),jo.initNonuniformCatmullRom(c.z,m.z,u.z,h.z,g,S,f)}else this.curveType==="catmullrom"&&(Wo.initCatmullRom(c.x,m.x,u.x,h.x,this.tension),Xo.initCatmullRom(c.y,m.y,u.y,h.y,this.tension),jo.initCatmullRom(c.z,m.z,u.z,h.z,this.tension));return i.set(Wo.calc(l),Xo.calc(l),jo.calc(l)),i}copy(e){super.copy(e),this.points=[];for(let t=0,i=e.points.length;t<i;t++){let s=e.points[t];this.points.push(s.clone())}return this.closed=e.closed,this.curveType=e.curveType,this.tension=e.tension,this}toJSON(){let e=super.toJSON();e.points=[];for(let t=0,i=this.points.length;t<i;t++){let s=this.points[t];e.points.push(s.toArray())}return e.closed=this.closed,e.curveType=this.curveType,e.tension=this.tension,e}fromJSON(e){super.fromJSON(e),this.points=[];for(let t=0,i=e.points.length;t<i;t++){let s=e.points[t];this.points.push(new R().fromArray(s))}return this.closed=e.closed,this.curveType=e.curveType,this.tension=e.tension,this}};function Lc(r,e,t,i,s){let a=(i-e)*.5,n=(s-t)*.5,o=r*r,l=r*o;return(2*t-2*i+a+n)*l+(-3*t+3*i-2*a-n)*o+a*r+t}function Bu(r,e){let t=1-r;return t*t*e}function zu(r,e){return 2*(1-r)*r*e}function Gu(r,e){return r*r*e}function es(r,e,t,i){return Bu(r,e)+zu(r,t)+Gu(r,i)}function Vu(r,e){let t=1-r;return t*t*t*e}function ku(r,e){let t=1-r;return 3*t*t*r*e}function Hu(r,e){return 3*(1-r)*r*r*e}function Wu(r,e){return r*r*r*e}function ts(r,e,t,i,s){return Vu(r,e)+ku(r,t)+Hu(r,i)+Wu(r,s)}var fs=class extends Vt{constructor(e=new ae,t=new ae,i=new ae,s=new ae){super(),this.isCubicBezierCurve=!0,this.type="CubicBezierCurve",this.v0=e,this.v1=t,this.v2=i,this.v3=s}getPoint(e,t=new ae){let i=t,s=this.v0,a=this.v1,n=this.v2,o=this.v3;return i.set(ts(e,s.x,a.x,n.x,o.x),ts(e,s.y,a.y,n.y,o.y)),i}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this.v3.copy(e.v3),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e.v3=this.v3.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this.v3.fromArray(e.v3),this}},Ha=class extends Vt{constructor(e=new R,t=new R,i=new R,s=new R){super(),this.isCubicBezierCurve3=!0,this.type="CubicBezierCurve3",this.v0=e,this.v1=t,this.v2=i,this.v3=s}getPoint(e,t=new R){let i=t,s=this.v0,a=this.v1,n=this.v2,o=this.v3;return i.set(ts(e,s.x,a.x,n.x,o.x),ts(e,s.y,a.y,n.y,o.y),ts(e,s.z,a.z,n.z,o.z)),i}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this.v3.copy(e.v3),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e.v3=this.v3.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this.v3.fromArray(e.v3),this}},gs=class extends Vt{constructor(e=new ae,t=new ae){super(),this.isLineCurve=!0,this.type="LineCurve",this.v1=e,this.v2=t}getPoint(e,t=new ae){let i=t;return e===1?i.copy(this.v2):(i.copy(this.v2).sub(this.v1),i.multiplyScalar(e).add(this.v1)),i}getPointAt(e,t){return this.getPoint(e,t)}getTangent(e,t=new ae){return t.subVectors(this.v2,this.v1).normalize()}getTangentAt(e,t){return this.getTangent(e,t)}copy(e){return super.copy(e),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},Wa=class extends Vt{constructor(e=new R,t=new R){super(),this.isLineCurve3=!0,this.type="LineCurve3",this.v1=e,this.v2=t}getPoint(e,t=new R){let i=t;return e===1?i.copy(this.v2):(i.copy(this.v2).sub(this.v1),i.multiplyScalar(e).add(this.v1)),i}getPointAt(e,t){return this.getPoint(e,t)}getTangent(e,t=new R){return t.subVectors(this.v2,this.v1).normalize()}getTangentAt(e,t){return this.getTangent(e,t)}copy(e){return super.copy(e),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},_s=class extends Vt{constructor(e=new ae,t=new ae,i=new ae){super(),this.isQuadraticBezierCurve=!0,this.type="QuadraticBezierCurve",this.v0=e,this.v1=t,this.v2=i}getPoint(e,t=new ae){let i=t,s=this.v0,a=this.v1,n=this.v2;return i.set(es(e,s.x,a.x,n.x),es(e,s.y,a.y,n.y)),i}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},vs=class extends Vt{constructor(e=new R,t=new R,i=new R){super(),this.isQuadraticBezierCurve3=!0,this.type="QuadraticBezierCurve3",this.v0=e,this.v1=t,this.v2=i}getPoint(e,t=new R){let i=t,s=this.v0,a=this.v1,n=this.v2;return i.set(es(e,s.x,a.x,n.x),es(e,s.y,a.y,n.y),es(e,s.z,a.z,n.z)),i}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},xs=class extends Vt{constructor(e=[]){super(),this.isSplineCurve=!0,this.type="SplineCurve",this.points=e}getPoint(e,t=new ae){let i=t,s=this.points,a=(s.length-1)*e,n=Math.floor(a),o=a-n,l=s[n===0?n:n-1],c=s[n],h=s[n>s.length-2?s.length-1:n+1],m=s[n>s.length-3?s.length-1:n+2];return i.set(Lc(o,l.x,c.x,h.x,m.x),Lc(o,l.y,c.y,h.y,m.y)),i}copy(e){super.copy(e),this.points=[];for(let t=0,i=e.points.length;t<i;t++){let s=e.points[t];this.points.push(s.clone())}return this}toJSON(){let e=super.toJSON();e.points=[];for(let t=0,i=this.points.length;t<i;t++){let s=this.points[t];e.points.push(s.toArray())}return e}fromJSON(e){super.fromJSON(e),this.points=[];for(let t=0,i=e.points.length;t<i;t++){let s=e.points[t];this.points.push(new ae().fromArray(s))}return this}},Xa=Object.freeze({__proto__:null,ArcCurve:Va,CatmullRomCurve3:ka,CubicBezierCurve:fs,CubicBezierCurve3:Ha,EllipseCurve:Nr,LineCurve:gs,LineCurve3:Wa,QuadraticBezierCurve:_s,QuadraticBezierCurve3:vs,SplineCurve:xs}),ja=class extends Vt{constructor(){super(),this.type="CurvePath",this.curves=[],this.autoClose=!1}add(e){this.curves.push(e)}closePath(){let e=this.curves[0].getPoint(0),t=this.curves[this.curves.length-1].getPoint(1);if(!e.equals(t)){let i=e.isVector2===!0?"LineCurve":"LineCurve3";this.curves.push(new Xa[i](t,e))}return this}getPoint(e,t){let i=e*this.getLength(),s=this.getCurveLengths(),a=0;for(;a<s.length;){if(s[a]>=i){let n=s[a]-i,o=this.curves[a],l=o.getLength(),c=l===0?0:1-n/l;return o.getPointAt(c,t)}a++}return null}getLength(){let e=this.getCurveLengths();return e[e.length-1]}updateArcLengths(){this.needsUpdate=!0,this.cacheLengths=null,this.getCurveLengths()}getCurveLengths(){if(this.cacheLengths&&this.cacheLengths.length===this.curves.length)return this.cacheLengths;let e=[],t=0;for(let i=0,s=this.curves.length;i<s;i++)t+=this.curves[i].getLength(),e.push(t);return this.cacheLengths=e,e}getSpacedPoints(e=40){let t=[];for(let i=0;i<=e;i++)t.push(this.getPoint(i/e));return this.autoClose&&t.push(t[0]),t}getPoints(e=12){let t=[],i;for(let s=0,a=this.curves;s<a.length;s++){let n=a[s],o=n.isEllipseCurve?e*2:n.isLineCurve||n.isLineCurve3?1:n.isSplineCurve?e*n.points.length:e,l=n.getPoints(o);for(let c=0;c<l.length;c++){let h=l[c];i&&i.equals(h)||(t.push(h),i=h)}}return this.autoClose&&t.length>1&&!t[t.length-1].equals(t[0])&&t.push(t[0]),t}copy(e){super.copy(e),this.curves=[];for(let t=0,i=e.curves.length;t<i;t++){let s=e.curves[t];this.curves.push(s.clone())}return this.autoClose=e.autoClose,this}toJSON(){let e=super.toJSON();e.autoClose=this.autoClose,e.curves=[];for(let t=0,i=this.curves.length;t<i;t++){let s=this.curves[t];e.curves.push(s.toJSON())}return e}fromJSON(e){super.fromJSON(e),this.autoClose=e.autoClose,this.curves=[];for(let t=0,i=e.curves.length;t<i;t++){let s=e.curves[t];this.curves.push(new Xa[s.type]().fromJSON(s))}return this}},ys=class extends ja{constructor(e){super(),this.type="Path",this.currentPoint=new ae,e&&this.setFromPoints(e)}setFromPoints(e){this.moveTo(e[0].x,e[0].y);for(let t=1,i=e.length;t<i;t++)this.lineTo(e[t].x,e[t].y);return this}moveTo(e,t){return this.currentPoint.set(e,t),this}lineTo(e,t){let i=new gs(this.currentPoint.clone(),new ae(e,t));return this.curves.push(i),this.currentPoint.set(e,t),this}quadraticCurveTo(e,t,i,s){let a=new _s(this.currentPoint.clone(),new ae(e,t),new ae(i,s));return this.curves.push(a),this.currentPoint.set(i,s),this}bezierCurveTo(e,t,i,s,a,n){let o=new fs(this.currentPoint.clone(),new ae(e,t),new ae(i,s),new ae(a,n));return this.curves.push(o),this.currentPoint.set(a,n),this}splineThru(e){let t=[this.currentPoint.clone()].concat(e),i=new xs(t);return this.curves.push(i),this.currentPoint.copy(e[e.length-1]),this}arc(e,t,i,s,a,n){let o=this.currentPoint.x,l=this.currentPoint.y;return this.absarc(e+o,t+l,i,s,a,n),this}absarc(e,t,i,s,a,n){return this.absellipse(e,t,i,i,s,a,n),this}ellipse(e,t,i,s,a,n,o,l){let c=this.currentPoint.x,h=this.currentPoint.y;return this.absellipse(e+c,t+h,i,s,a,n,o,l),this}absellipse(e,t,i,s,a,n,o,l){let c=new Nr(e,t,i,s,a,n,o,l);if(this.curves.length>0){let m=c.getPoint(0);m.equals(this.currentPoint)||this.lineTo(m.x,m.y)}this.curves.push(c);let h=c.getPoint(1);return this.currentPoint.copy(h),this}copy(e){return super.copy(e),this.currentPoint.copy(e.currentPoint),this}toJSON(){let e=super.toJSON();return e.currentPoint=this.currentPoint.toArray(),e}fromJSON(e){return super.fromJSON(e),this.currentPoint.fromArray(e.currentPoint),this}},Ss=class extends ys{constructor(e){super(e),this.uuid=Vr(),this.type="Shape",this.holes=[]}getPointsHoles(e){let t=[];for(let i=0,s=this.holes.length;i<s;i++)t[i]=this.holes[i].getPoints(e);return t}extractPoints(e){return{shape:this.getPoints(e),holes:this.getPointsHoles(e)}}copy(e){super.copy(e),this.holes=[];for(let t=0,i=e.holes.length;t<i;t++){let s=e.holes[t];this.holes.push(s.clone())}return this}toJSON(){let e=super.toJSON();e.uuid=this.uuid,e.holes=[];for(let t=0,i=this.holes.length;t<i;t++){let s=this.holes[t];e.holes.push(s.toJSON())}return e}fromJSON(e){super.fromJSON(e),this.uuid=e.uuid,this.holes=[];for(let t=0,i=e.holes.length;t<i;t++){let s=e.holes[t];this.holes.push(new ys().fromJSON(s))}return this}};function Xu(r,e,t=2){let i=e&&e.length,s=i?e[0]*t:r.length,a=Ch(r,0,s,t,!0),n=[];if(!a||a.next===a.prev)return n;let o,l,c;if(i&&(a=Ju(r,e,a,t)),r.length>80*t){o=r[0],l=r[1];let h=o,m=l;for(let u=t;u<s;u+=t){let d=r[u],g=r[u+1];d<o&&(o=d),g<l&&(l=g),d>h&&(h=d),g>m&&(m=g)}c=Math.max(h-o,m-l),c=c!==0?32767/c:0}return Ms(a,n,t,o,l,c,0),n}function Ch(r,e,t,i,s){let a;if(s===od(r,e,t,i)>0)for(let n=e;n<t;n+=i)a=Nc(n/i|0,r[n],r[n+1],a);else for(let n=t-i;n>=e;n-=i)a=Nc(n/i|0,r[n],r[n+1],a);return a&&Ur(a,a.next)&&(Ts(a),a=a.next),a}function sr(r,e){if(!r)return r;e||(e=r);let t=r,i;do if(i=!1,!t.steiner&&(Ur(t,t.next)||pt(t.prev,t,t.next)===0)){if(Ts(t),t=e=t.prev,t===t.next)break;i=!0}else t=t.next;while(i||t!==e);return e}function Ms(r,e,t,i,s,a,n){if(!r)return;!n&&a&&td(r,i,s,a);let o=r;for(;r.prev!==r.next;){let l=r.prev,c=r.next;if(a?qu(r,i,s,a):ju(r)){e.push(l.i,r.i,c.i),Ts(r),r=c.next,o=c.next;continue}if(r=c,r===o){n?n===1?(r=Yu(sr(r),e),Ms(r,e,t,i,s,a,2)):n===2&&Zu(r,e,t,i,s,a):Ms(sr(r),e,t,i,s,a,1);break}}}function ju(r){let e=r.prev,t=r,i=r.next;if(pt(e,t,i)>=0)return!1;let s=e.x,a=t.x,n=i.x,o=e.y,l=t.y,c=i.y,h=Math.min(s,a,n),m=Math.min(o,l,c),u=Math.max(s,a,n),d=Math.max(o,l,c),g=i.next;for(;g!==e;){if(g.x>=h&&g.x<=u&&g.y>=m&&g.y<=d&&Qr(s,o,a,l,n,c,g.x,g.y)&&pt(g.prev,g,g.next)>=0)return!1;g=g.next}return!0}function qu(r,e,t,i){let s=r.prev,a=r,n=r.next;if(pt(s,a,n)>=0)return!1;let o=s.x,l=a.x,c=n.x,h=s.y,m=a.y,u=n.y,d=Math.min(o,l,c),g=Math.min(h,m,u),S=Math.max(o,l,c),f=Math.max(h,m,u),p=el(d,g,e,t,i),y=el(S,f,e,t,i),E=r.prevZ,x=r.nextZ;for(;E&&E.z>=p&&x&&x.z<=y;){if(E.x>=d&&E.x<=S&&E.y>=g&&E.y<=f&&E!==s&&E!==n&&Qr(o,h,l,m,c,u,E.x,E.y)&&pt(E.prev,E,E.next)>=0||(E=E.prevZ,x.x>=d&&x.x<=S&&x.y>=g&&x.y<=f&&x!==s&&x!==n&&Qr(o,h,l,m,c,u,x.x,x.y)&&pt(x.prev,x,x.next)>=0))return!1;x=x.nextZ}for(;E&&E.z>=p;){if(E.x>=d&&E.x<=S&&E.y>=g&&E.y<=f&&E!==s&&E!==n&&Qr(o,h,l,m,c,u,E.x,E.y)&&pt(E.prev,E,E.next)>=0)return!1;E=E.prevZ}for(;x&&x.z<=y;){if(x.x>=d&&x.x<=S&&x.y>=g&&x.y<=f&&x!==s&&x!==n&&Qr(o,h,l,m,c,u,x.x,x.y)&&pt(x.prev,x,x.next)>=0)return!1;x=x.nextZ}return!0}function Yu(r,e){let t=r;do{let i=t.prev,s=t.next.next;!Ur(i,s)&&Ih(i,t,t.next,s)&&bs(i,s)&&bs(s,i)&&(e.push(i.i,t.i,s.i),Ts(t),Ts(t.next),t=r=s),t=t.next}while(t!==r);return sr(t)}function Zu(r,e,t,i,s,a){let n=r;do{let o=n.next.next;for(;o!==n.prev;){if(n.i!==o.i&&sd(n,o)){let l=Ph(n,o);n=sr(n,n.next),l=sr(l,l.next),Ms(n,e,t,i,s,a,0),Ms(l,e,t,i,s,a,0);return}o=o.next}n=n.next}while(n!==r)}function Ju(r,e,t,i){let s=[];for(let a=0,n=e.length;a<n;a++){let o=e[a]*i,l=a<n-1?e[a+1]*i:r.length,c=Ch(r,o,l,i,!1);c===c.next&&(c.steiner=!0),s.push(rd(c))}s.sort(Ku);for(let a=0;a<s.length;a++)t=$u(s[a],t);return t}function Ku(r,e){let t=r.x-e.x;if(t===0&&(t=r.y-e.y,t===0)){let i=(r.next.y-r.y)/(r.next.x-r.x),s=(e.next.y-e.y)/(e.next.x-e.x);t=i-s}return t}function $u(r,e){let t=Qu(r,e);if(!t)return e;let i=Ph(t,r);return sr(i,i.next),sr(t,t.next)}function Qu(r,e){let t=e,i=r.x,s=r.y,a=-1/0,n;if(Ur(r,t))return t;do{if(Ur(r,t.next))return t.next;if(s<=t.y&&s>=t.next.y&&t.next.y!==t.y){let m=t.x+(s-t.y)*(t.next.x-t.x)/(t.next.y-t.y);if(m<=i&&m>a&&(a=m,n=t.x<t.next.x?t:t.next,m===i))return n}t=t.next}while(t!==e);if(!n)return null;let o=n,l=n.x,c=n.y,h=1/0;t=n;do{if(i>=t.x&&t.x>=l&&i!==t.x&&Rh(s<c?i:a,s,l,c,s<c?a:i,s,t.x,t.y)){let m=Math.abs(s-t.y)/(i-t.x);bs(t,r)&&(m<h||m===h&&(t.x>n.x||t.x===n.x&&ed(n,t)))&&(n=t,h=m)}t=t.next}while(t!==o);return n}function ed(r,e){return pt(r.prev,r,e.prev)<0&&pt(e.next,r,r.next)<0}function td(r,e,t,i){let s=r;do s.z===0&&(s.z=el(s.x,s.y,e,t,i)),s.prevZ=s.prev,s.nextZ=s.next,s=s.next;while(s!==r);s.prevZ.nextZ=null,s.prevZ=null,id(s)}function id(r){let e,t=1;do{let i=r,s;r=null;let a=null;for(e=0;i;){e++;let n=i,o=0;for(let c=0;c<t&&(o++,n=n.nextZ,!!n);c++);let l=t;for(;o>0||l>0&&n;)o!==0&&(l===0||!n||i.z<=n.z)?(s=i,i=i.nextZ,o--):(s=n,n=n.nextZ,l--),a?a.nextZ=s:r=s,s.prevZ=a,a=s;i=n}a.nextZ=null,t*=2}while(e>1);return r}function el(r,e,t,i,s){return r=(r-t)*s|0,e=(e-i)*s|0,r=(r|r<<8)&16711935,r=(r|r<<4)&252645135,r=(r|r<<2)&858993459,r=(r|r<<1)&1431655765,e=(e|e<<8)&16711935,e=(e|e<<4)&252645135,e=(e|e<<2)&858993459,e=(e|e<<1)&1431655765,r|e<<1}function rd(r){let e=r,t=r;do(e.x<t.x||e.x===t.x&&e.y<t.y)&&(t=e),e=e.next;while(e!==r);return t}function Rh(r,e,t,i,s,a,n,o){return(s-n)*(e-o)>=(r-n)*(a-o)&&(r-n)*(i-o)>=(t-n)*(e-o)&&(t-n)*(a-o)>=(s-n)*(i-o)}function Qr(r,e,t,i,s,a,n,o){return!(r===n&&e===o)&&Rh(r,e,t,i,s,a,n,o)}function sd(r,e){return r.next.i!==e.i&&r.prev.i!==e.i&&!ad(r,e)&&(bs(r,e)&&bs(e,r)&&nd(r,e)&&(pt(r.prev,r,e.prev)||pt(r,e.prev,e))||Ur(r,e)&&pt(r.prev,r,r.next)>0&&pt(e.prev,e,e.next)>0)}function pt(r,e,t){return(e.y-r.y)*(t.x-e.x)-(e.x-r.x)*(t.y-e.y)}function Ur(r,e){return r.x===e.x&&r.y===e.y}function Ih(r,e,t,i){let s=pa(pt(r,e,t)),a=pa(pt(r,e,i)),n=pa(pt(t,i,r)),o=pa(pt(t,i,e));return!!(s!==a&&n!==o||s===0&&da(r,t,e)||a===0&&da(r,i,e)||n===0&&da(t,r,i)||o===0&&da(t,e,i))}function da(r,e,t){return e.x<=Math.max(r.x,t.x)&&e.x>=Math.min(r.x,t.x)&&e.y<=Math.max(r.y,t.y)&&e.y>=Math.min(r.y,t.y)}function pa(r){return r>0?1:r<0?-1:0}function ad(r,e){let t=r;do{if(t.i!==r.i&&t.next.i!==r.i&&t.i!==e.i&&t.next.i!==e.i&&Ih(t,t.next,r,e))return!0;t=t.next}while(t!==r);return!1}function bs(r,e){return pt(r.prev,r,r.next)<0?pt(r,e,r.next)>=0&&pt(r,r.prev,e)>=0:pt(r,e,r.prev)<0||pt(r,r.next,e)<0}function nd(r,e){let t=r,i=!1,s=(r.x+e.x)/2,a=(r.y+e.y)/2;do t.y>a!=t.next.y>a&&t.next.y!==t.y&&s<(t.next.x-t.x)*(a-t.y)/(t.next.y-t.y)+t.x&&(i=!i),t=t.next;while(t!==r);return i}function Ph(r,e){let t=tl(r.i,r.x,r.y),i=tl(e.i,e.x,e.y),s=r.next,a=e.prev;return r.next=e,e.prev=r,t.next=s,s.prev=t,i.next=t,t.prev=i,a.next=i,i.prev=a,i}function Nc(r,e,t,i){let s=tl(r,e,t);return i?(s.next=i.next,s.prev=i,i.next.prev=s,i.next=s):(s.prev=s,s.next=s),s}function Ts(r){r.next.prev=r.prev,r.prev.next=r.next,r.prevZ&&(r.prevZ.nextZ=r.nextZ),r.nextZ&&(r.nextZ.prevZ=r.prevZ)}function tl(r,e,t){return{i:r,x:e,y:t,prev:null,next:null,z:0,prevZ:null,nextZ:null,steiner:!1}}function od(r,e,t,i){let s=0;for(let a=e,n=t-i;a<t;a+=i)s+=(r[n]-r[a])*(r[a+1]+r[n+1]),n=a;return s}var il=class{static triangulate(e,t,i=2){return Xu(e,t,i)}},hi=class r{static area(e){let t=e.length,i=0;for(let s=t-1,a=0;a<t;s=a++)i+=e[s].x*e[a].y-e[a].x*e[s].y;return i*.5}static isClockWise(e){return r.area(e)<0}static triangulateShape(e,t){let i=[],s=[],a=[];Uc(e),Dc(i,e);let n=e.length;t.forEach(Uc);for(let l=0;l<t.length;l++)s.push(n),n+=t[l].length,Dc(i,t[l]);let o=il.triangulate(i,s);for(let l=0;l<o.length;l+=3)a.push(o.slice(l,l+3));return a}};function Uc(r){let e=r.length;e>2&&r[e-1].equals(r[0])&&r.pop()}function Dc(r,e){for(let t=0;t<e.length;t++)r.push(e[t].x),r.push(e[t].y)}var qa=class r extends ct{constructor(e=new Ss([new ae(.5,.5),new ae(-.5,.5),new ae(-.5,-.5),new ae(.5,-.5)]),t={}){super(),this.type="ExtrudeGeometry",this.parameters={shapes:e,options:t},e=Array.isArray(e)?e:[e];let i=this,s=[],a=[];for(let o=0,l=e.length;o<l;o++){let c=e[o];n(c)}this.setAttribute("position",new De(s,3)),this.setAttribute("uv",new De(a,2)),this.computeVertexNormals();function n(o){let l=[],c=t.curveSegments!==void 0?t.curveSegments:12,h=t.steps!==void 0?t.steps:1,m=t.depth!==void 0?t.depth:1,u=t.bevelEnabled!==void 0?t.bevelEnabled:!0,d=t.bevelThickness!==void 0?t.bevelThickness:.2,g=t.bevelSize!==void 0?t.bevelSize:d-.1,S=t.bevelOffset!==void 0?t.bevelOffset:0,f=t.bevelSegments!==void 0?t.bevelSegments:3,p=t.extrudePath,y=t.UVGenerator!==void 0?t.UVGenerator:ld,E,x=!1,T,b,A,_;if(p){E=p.getSpacedPoints(h),x=!0,u=!1;let ie=p.isCatmullRomCurve3?p.closed:!1;T=p.computeFrenetFrames(h,ie),b=new R,A=new R,_=new R}u||(f=0,d=0,g=0,S=0);let w=o.extractPoints(c),I=w.shape,L=w.holes;if(!hi.isClockWise(I)){I=I.reverse();for(let ie=0,re=L.length;ie<re;ie++){let te=L[ie];hi.isClockWise(te)&&(L[ie]=te.reverse())}}function U(ie){let re=10000000000000001e-36,te=ie[0];for(let _e=1;_e<=ie.length;_e++){let ve=_e%ie.length,Re=ie[ve],Pe=Re.x-te.x,Je=Re.y-te.y,ze=Pe*Pe+Je*Je,je=Math.max(Math.abs(Re.x),Math.abs(Re.y),Math.abs(te.x),Math.abs(te.y)),N=re*je*je;if(ze<=N){ie.splice(ve,1),_e--;continue}te=Re}}U(I),L.forEach(U);let V=L.length,P=I;for(let ie=0;ie<V;ie++){let re=L[ie];I=I.concat(re)}function H(ie,re,te){return re||Fe("ExtrudeGeometry: vec does not exist"),ie.clone().addScaledVector(re,te)}let Y=I.length;function z(ie,re,te){let _e,ve,Re,Pe=ie.x-re.x,Je=ie.y-re.y,ze=te.x-ie.x,je=te.y-ie.y,N=Pe*Pe+Je*Je,mt=Pe*je-Je*ze;if(Math.abs(mt)>Number.EPSILON){let We=Math.sqrt(N),C=Math.sqrt(ze*ze+je*je),v=re.x-Je/We,B=re.y+Pe/We,W=te.x-je/C,q=te.y+ze/C,ce=((W-v)*je-(q-B)*ze)/(Pe*je-Je*ze);_e=v+Pe*ce-ie.x,ve=B+Je*ce-ie.y;let de=_e*_e+ve*ve;if(de<=2)return new ae(_e,ve);Re=Math.sqrt(de/2)}else{let We=!1;Pe>Number.EPSILON?ze>Number.EPSILON&&(We=!0):Pe<-Number.EPSILON?ze<-Number.EPSILON&&(We=!0):Math.sign(Je)===Math.sign(je)&&(We=!0),We?(_e=-Je,ve=Pe,Re=Math.sqrt(N)):(_e=Pe,ve=Je,Re=Math.sqrt(N/2))}return new ae(_e/Re,ve/Re)}let J=[];for(let ie=0,re=P.length,te=re-1,_e=ie+1;ie<re;ie++,te++,_e++)te===re&&(te=0),_e===re&&(_e=0),J[ie]=z(P[ie],P[te],P[_e]);let X=[],Z,Q=J.concat();for(let ie=0,re=V;ie<re;ie++){let te=L[ie];Z=[];for(let _e=0,ve=te.length,Re=ve-1,Pe=_e+1;_e<ve;_e++,Re++,Pe++)Re===ve&&(Re=0),Pe===ve&&(Pe=0),Z[_e]=z(te[_e],te[Re],te[Pe]);X.push(Z),Q=Q.concat(Z)}let Le;if(f===0)Le=hi.triangulateShape(P,L);else{let ie=[],re=[];for(let te=0;te<f;te++){let _e=te/f,ve=d*Math.cos(_e*Math.PI/2),Re=g*Math.sin(_e*Math.PI/2)+S;for(let Pe=0,Je=P.length;Pe<Je;Pe++){let ze=H(P[Pe],J[Pe],Re);$(ze.x,ze.y,-ve),_e===0&&ie.push(ze)}for(let Pe=0,Je=V;Pe<Je;Pe++){let ze=L[Pe];Z=X[Pe];let je=[];for(let N=0,mt=ze.length;N<mt;N++){let We=H(ze[N],Z[N],Re);$(We.x,We.y,-ve),_e===0&&je.push(We)}_e===0&&re.push(je)}}Le=hi.triangulateShape(ie,re)}let fe=Le.length,qe=g+S;for(let ie=0;ie<Y;ie++){let re=u?H(I[ie],Q[ie],qe):I[ie];x?(A.copy(T.normals[0]).multiplyScalar(re.x),b.copy(T.binormals[0]).multiplyScalar(re.y),_.copy(E[0]).add(A).add(b),$(_.x,_.y,_.z)):$(re.x,re.y,0)}for(let ie=1;ie<=h;ie++)for(let re=0;re<Y;re++){let te=u?H(I[re],Q[re],qe):I[re];x?(A.copy(T.normals[ie]).multiplyScalar(te.x),b.copy(T.binormals[ie]).multiplyScalar(te.y),_.copy(E[ie]).add(A).add(b),$(_.x,_.y,_.z)):$(te.x,te.y,m/h*ie)}for(let ie=f-1;ie>=0;ie--){let re=ie/f,te=d*Math.cos(re*Math.PI/2),_e=g*Math.sin(re*Math.PI/2)+S;for(let ve=0,Re=P.length;ve<Re;ve++){let Pe=H(P[ve],J[ve],_e);$(Pe.x,Pe.y,m+te)}for(let ve=0,Re=L.length;ve<Re;ve++){let Pe=L[ve];Z=X[ve];for(let Je=0,ze=Pe.length;Je<ze;Je++){let je=H(Pe[Je],Z[Je],_e);x?$(je.x,je.y+E[h-1].y,E[h-1].x+te):$(je.x,je.y,m+te)}}}Qe(),it();function Qe(){let ie=s.length/3;if(u){let re=0,te=Y*re;for(let _e=0;_e<fe;_e++){let ve=Le[_e];ye(ve[2]+te,ve[1]+te,ve[0]+te)}re=h+f*2,te=Y*re;for(let _e=0;_e<fe;_e++){let ve=Le[_e];ye(ve[0]+te,ve[1]+te,ve[2]+te)}}else{for(let re=0;re<fe;re++){let te=Le[re];ye(te[2],te[1],te[0])}for(let re=0;re<fe;re++){let te=Le[re];ye(te[0]+Y*h,te[1]+Y*h,te[2]+Y*h)}}i.addGroup(ie,s.length/3-ie,0)}function it(){let ie=s.length/3,re=0;K(P,re),re+=P.length;for(let te=0,_e=L.length;te<_e;te++){let ve=L[te];K(ve,re),re+=ve.length}i.addGroup(ie,s.length/3-ie,1)}function K(ie,re){let te=ie.length;for(;--te>=0;){let _e=te,ve=te-1;ve<0&&(ve=ie.length-1);for(let Re=0,Pe=h+f*2;Re<Pe;Re++){let Je=Y*Re,ze=Y*(Re+1),je=re+_e+Je,N=re+ve+Je,mt=re+ve+ze,We=re+_e+ze;Be(je,N,mt,We)}}}function $(ie,re,te){l.push(ie),l.push(re),l.push(te)}function ye(ie,re,te){pe(ie),pe(re),pe(te);let _e=s.length/3,ve=y.generateTopUV(i,s,_e-3,_e-2,_e-1);Te(ve[0]),Te(ve[1]),Te(ve[2])}function Be(ie,re,te,_e){pe(ie),pe(re),pe(_e),pe(re),pe(te),pe(_e);let ve=s.length/3,Re=y.generateSideWallUV(i,s,ve-6,ve-3,ve-2,ve-1);Te(Re[0]),Te(Re[1]),Te(Re[3]),Te(Re[1]),Te(Re[2]),Te(Re[3])}function pe(ie){s.push(l[ie*3+0]),s.push(l[ie*3+1]),s.push(l[ie*3+2])}function Te(ie){a.push(ie.x),a.push(ie.y)}}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}toJSON(){let e=super.toJSON(),t=this.parameters.shapes,i=this.parameters.options;return cd(t,i,e)}static fromJSON(e,t){let i=[];for(let a=0,n=e.shapes.length;a<n;a++){let o=t[e.shapes[a]];i.push(o)}let s=e.options.extrudePath;return s!==void 0&&(e.options.extrudePath=new Xa[s.type]().fromJSON(s)),new r(i,e.options)}},ld={generateTopUV:function(r,e,t,i,s){let a=e[t*3],n=e[t*3+1],o=e[i*3],l=e[i*3+1],c=e[s*3],h=e[s*3+1];return[new ae(a,n),new ae(o,l),new ae(c,h)]},generateSideWallUV:function(r,e,t,i,s,a){let n=e[t*3],o=e[t*3+1],l=e[t*3+2],c=e[i*3],h=e[i*3+1],m=e[i*3+2],u=e[s*3],d=e[s*3+1],g=e[s*3+2],S=e[a*3],f=e[a*3+1],p=e[a*3+2];return Math.abs(o-h)<Math.abs(n-c)?[new ae(n,1-l),new ae(c,1-m),new ae(u,1-g),new ae(S,1-p)]:[new ae(o,1-l),new ae(h,1-m),new ae(d,1-g),new ae(f,1-p)]}};function cd(r,e,t){if(t.shapes=[],Array.isArray(r))for(let i=0,s=r.length;i<s;i++){let a=r[i];t.shapes.push(a.uuid)}else t.shapes.push(r.uuid);return t.options=Object.assign({},e),e.extrudePath!==void 0&&(t.options.extrudePath=e.extrudePath.toJSON()),t}var Ya=class r extends Gi{constructor(e=1,t=0){let i=(1+Math.sqrt(5))/2,s=[-1,i,0,1,i,0,-1,-i,0,1,-i,0,0,-1,i,0,1,i,0,-1,-i,0,1,-i,i,0,-1,i,0,1,-i,0,-1,-i,0,1],a=[0,11,5,0,5,1,0,1,7,0,7,10,0,10,11,1,5,9,5,11,4,11,10,2,10,7,6,7,1,8,3,9,4,3,4,2,3,2,6,3,6,8,3,8,9,4,9,5,2,4,11,6,2,10,8,6,7,9,8,1];super(s,a,e,t),this.type="IcosahedronGeometry",this.parameters={radius:e,detail:t}}static fromJSON(e){return new r(e.radius,e.detail)}},Za=class r extends ct{constructor(e=[new ae(0,-.5),new ae(.5,0),new ae(0,.5)],t=12,i=0,s=Math.PI*2){super(),this.type="LatheGeometry",this.parameters={points:e,segments:t,phiStart:i,phiLength:s},t=Math.floor(t),s=Ke(s,0,Math.PI*2);let a=[],n=[],o=[],l=[],c=[],h=1/t,m=new R,u=new ae,d=new R,g=new R,S=new R,f=0,p=0;for(let y=0;y<=e.length-1;y++)switch(y){case 0:f=e[y+1].x-e[y].x,p=e[y+1].y-e[y].y,d.x=p*1,d.y=-f,d.z=p*0,S.copy(d),d.normalize(),l.push(d.x,d.y,d.z);break;case e.length-1:l.push(S.x,S.y,S.z);break;default:f=e[y+1].x-e[y].x,p=e[y+1].y-e[y].y,d.x=p*1,d.y=-f,d.z=p*0,g.copy(d),d.x+=S.x,d.y+=S.y,d.z+=S.z,d.normalize(),l.push(d.x,d.y,d.z),S.copy(g)}for(let y=0;y<=t;y++){let E=i+y*h*s,x=Math.sin(E),T=Math.cos(E);for(let b=0;b<=e.length-1;b++){m.x=e[b].x*x,m.y=e[b].y,m.z=e[b].x*T,n.push(m.x,m.y,m.z),u.x=y/t,u.y=b/(e.length-1),o.push(u.x,u.y);let A=l[3*b+0]*x,_=l[3*b+1],w=l[3*b+0]*T;c.push(A,_,w)}}for(let y=0;y<t;y++)for(let E=0;E<e.length-1;E++){let x=E+y*e.length,T=x,b=x+e.length,A=x+e.length+1,_=x+1;a.push(T,b,_),a.push(A,_,b)}this.setIndex(a),this.setAttribute("position",new De(n,3)),this.setAttribute("uv",new De(o,2)),this.setAttribute("normal",new De(c,3))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new r(e.points,e.segments,e.phiStart,e.phiLength)}},Ja=class r extends Gi{constructor(e=1,t=0){let i=[1,0,0,-1,0,0,0,1,0,0,-1,0,0,0,1,0,0,-1],s=[0,2,4,0,4,3,0,3,5,0,5,2,1,2,5,1,5,3,1,3,4,1,4,2];super(i,s,e,t),this.type="OctahedronGeometry",this.parameters={radius:e,detail:t}}static fromJSON(e){return new r(e.radius,e.detail)}},Dr=class r extends ct{constructor(e=1,t=1,i=1,s=1){super(),this.type="PlaneGeometry",this.parameters={width:e,height:t,widthSegments:i,heightSegments:s};let a=e/2,n=t/2,o=Math.floor(i),l=Math.floor(s),c=o+1,h=l+1,m=e/o,u=t/l,d=[],g=[],S=[],f=[];for(let p=0;p<h;p++){let y=p*u-n;for(let E=0;E<c;E++){let x=E*m-a;g.push(x,-y,0),S.push(0,0,1),f.push(E/o),f.push(1-p/l)}}for(let p=0;p<l;p++)for(let y=0;y<o;y++){let E=y+c*p,x=y+c*(p+1),T=y+1+c*(p+1),b=y+1+c*p;d.push(E,x,b),d.push(x,T,b)}this.setIndex(d),this.setAttribute("position",new De(g,3)),this.setAttribute("normal",new De(S,3)),this.setAttribute("uv",new De(f,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new r(e.width,e.height,e.widthSegments,e.heightSegments)}},Ka=class r extends ct{constructor(e=.5,t=1,i=32,s=1,a=0,n=Math.PI*2){super(),this.type="RingGeometry",this.parameters={innerRadius:e,outerRadius:t,thetaSegments:i,phiSegments:s,thetaStart:a,thetaLength:n},i=Math.max(3,i),s=Math.max(1,s);let o=[],l=[],c=[],h=[],m=e,u=(t-e)/s,d=new R,g=new ae;for(let S=0;S<=s;S++){for(let f=0;f<=i;f++){let p=a+f/i*n;d.x=m*Math.cos(p),d.y=m*Math.sin(p),l.push(d.x,d.y,d.z),c.push(0,0,1),g.x=(d.x/t+1)/2,g.y=(d.y/t+1)/2,h.push(g.x,g.y)}m+=u}for(let S=0;S<s;S++){let f=S*(i+1);for(let p=0;p<i;p++){let y=p+f,E=y,x=y+i+1,T=y+i+2,b=y+1;o.push(E,x,b),o.push(x,T,b)}}this.setIndex(o),this.setAttribute("position",new De(l,3)),this.setAttribute("normal",new De(c,3)),this.setAttribute("uv",new De(h,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new r(e.innerRadius,e.outerRadius,e.thetaSegments,e.phiSegments,e.thetaStart,e.thetaLength)}},$a=class r extends ct{constructor(e=new Ss([new ae(0,.5),new ae(-.5,-.5),new ae(.5,-.5)]),t=12){super(),this.type="ShapeGeometry",this.parameters={shapes:e,curveSegments:t};let i=[],s=[],a=[],n=[],o=0,l=0;if(Array.isArray(e)===!1)c(e);else for(let h=0;h<e.length;h++)c(e[h]),this.addGroup(o,l,h),o+=l,l=0;this.setIndex(i),this.setAttribute("position",new De(s,3)),this.setAttribute("normal",new De(a,3)),this.setAttribute("uv",new De(n,2));function c(h){let m=s.length/3,u=h.extractPoints(t),d=u.shape,g=u.holes;hi.isClockWise(d)===!1&&(d=d.reverse());for(let f=0,p=g.length;f<p;f++){let y=g[f];hi.isClockWise(y)===!0&&(g[f]=y.reverse())}let S=hi.triangulateShape(d,g);for(let f=0,p=g.length;f<p;f++){let y=g[f];d=d.concat(y)}for(let f=0,p=d.length;f<p;f++){let y=d[f];s.push(y.x,y.y,0),a.push(0,0,1),n.push(y.x,y.y)}for(let f=0,p=S.length;f<p;f++){let y=S[f],E=y[0]+m,x=y[1]+m,T=y[2]+m;i.push(E,x,T),l+=3}}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}toJSON(){let e=super.toJSON(),t=this.parameters.shapes;return hd(t,e)}static fromJSON(e,t){let i=[];for(let s=0,a=e.shapes.length;s<a;s++){let n=t[e.shapes[s]];i.push(n)}return new r(i,e.curveSegments)}};function hd(r,e){if(e.shapes=[],Array.isArray(r))for(let t=0,i=r.length;t<i;t++){let s=r[t];e.shapes.push(s.uuid)}else e.shapes.push(r.uuid);return e}var Qa=class r extends ct{constructor(e=1,t=32,i=16,s=0,a=Math.PI*2,n=0,o=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:e,widthSegments:t,heightSegments:i,phiStart:s,phiLength:a,thetaStart:n,thetaLength:o},t=Math.max(3,Math.floor(t)),i=Math.max(2,Math.floor(i));let l=Math.min(n+o,Math.PI),c=0,h=[],m=new R,u=new R,d=[],g=[],S=[],f=[];for(let p=0;p<=i;p++){let y=[],E=p/i,x=n+E*o,T=e*Math.cos(x),b=Math.sqrt(e*e-T*T),A=0;p===0&&n===0?A=.5/t:p===i&&l===Math.PI&&(A=-.5/t);for(let _=0;_<=t;_++){let w=_/t,I=s+w*a;m.x=-b*Math.cos(I),m.y=T,m.z=b*Math.sin(I),g.push(m.x,m.y,m.z),u.copy(m).normalize(),S.push(u.x,u.y,u.z),f.push(w+A,1-E),y.push(c++)}h.push(y)}for(let p=0;p<i;p++)for(let y=0;y<t;y++){let E=h[p][y+1],x=h[p][y],T=h[p+1][y],b=h[p+1][y+1];(p!==0||n>0)&&d.push(E,x,b),(p!==i-1||l<Math.PI)&&d.push(x,T,b)}this.setIndex(d),this.setAttribute("position",new De(g,3)),this.setAttribute("normal",new De(S,3)),this.setAttribute("uv",new De(f,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new r(e.radius,e.widthSegments,e.heightSegments,e.phiStart,e.phiLength,e.thetaStart,e.thetaLength)}},en=class r extends Gi{constructor(e=1,t=0){let i=[1,1,1,-1,-1,1,-1,1,-1,1,-1,-1],s=[2,1,0,0,3,2,1,3,0,2,3,1];super(i,s,e,t),this.type="TetrahedronGeometry",this.parameters={radius:e,detail:t}}static fromJSON(e){return new r(e.radius,e.detail)}},tn=class r extends ct{constructor(e=1,t=.4,i=12,s=48,a=Math.PI*2,n=0,o=Math.PI*2){super(),this.type="TorusGeometry",this.parameters={radius:e,tube:t,radialSegments:i,tubularSegments:s,arc:a,thetaStart:n,thetaLength:o},i=Math.floor(i),s=Math.floor(s);let l=[],c=[],h=[],m=[],u=new R,d=new R,g=new R;for(let S=0;S<=i;S++){let f=n+S/i*o;for(let p=0;p<=s;p++){let y=p/s*a;d.x=(e+t*Math.cos(f))*Math.cos(y),d.y=(e+t*Math.cos(f))*Math.sin(y),d.z=t*Math.sin(f),c.push(d.x,d.y,d.z),u.x=e*Math.cos(y),u.y=e*Math.sin(y),g.subVectors(d,u).normalize(),h.push(g.x,g.y,g.z),m.push(p/s),m.push(S/i)}}for(let S=1;S<=i;S++)for(let f=1;f<=s;f++){let p=(s+1)*S+f-1,y=(s+1)*(S-1)+f-1,E=(s+1)*(S-1)+f,x=(s+1)*S+f;l.push(p,y,x),l.push(y,E,x)}this.setIndex(l),this.setAttribute("position",new De(c,3)),this.setAttribute("normal",new De(h,3)),this.setAttribute("uv",new De(m,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new r(e.radius,e.tube,e.radialSegments,e.tubularSegments,e.arc,e.thetaStart,e.thetaLength)}},rn=class r extends ct{constructor(e=1,t=.4,i=64,s=8,a=2,n=3){super(),this.type="TorusKnotGeometry",this.parameters={radius:e,tube:t,tubularSegments:i,radialSegments:s,p:a,q:n},i=Math.floor(i),s=Math.floor(s);let o=[],l=[],c=[],h=[],m=new R,u=new R,d=new R,g=new R,S=new R,f=new R,p=new R;for(let E=0;E<=i;++E){let x=E/i*a*Math.PI*2;y(x,a,n,e,d),y(x+.01,a,n,e,g),f.subVectors(g,d),p.addVectors(g,d),S.crossVectors(f,p),p.crossVectors(S,f),S.normalize(),p.normalize();for(let T=0;T<=s;++T){let b=T/s*Math.PI*2,A=-t*Math.cos(b),_=t*Math.sin(b);m.x=d.x+(A*p.x+_*S.x),m.y=d.y+(A*p.y+_*S.y),m.z=d.z+(A*p.z+_*S.z),l.push(m.x,m.y,m.z),u.subVectors(m,d).normalize(),c.push(u.x,u.y,u.z),h.push(E/i),h.push(T/s)}}for(let E=1;E<=i;E++)for(let x=1;x<=s;x++){let T=(s+1)*(E-1)+(x-1),b=(s+1)*E+(x-1),A=(s+1)*E+x,_=(s+1)*(E-1)+x;o.push(T,b,_),o.push(b,A,_)}this.setIndex(o),this.setAttribute("position",new De(l,3)),this.setAttribute("normal",new De(c,3)),this.setAttribute("uv",new De(h,2));function y(E,x,T,b,A){let _=Math.cos(E),w=Math.sin(E),I=T/x*E,L=Math.cos(I);A.x=b*(2+L)*.5*_,A.y=b*(2+L)*w*.5,A.z=b*Math.sin(I)*.5}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new r(e.radius,e.tube,e.tubularSegments,e.radialSegments,e.p,e.q)}},sn=class r extends ct{constructor(e=new vs(new R(-1,-1,0),new R(-1,1,0),new R(1,1,0)),t=64,i=1,s=8,a=!1){super(),this.type="TubeGeometry",this.parameters={path:e,tubularSegments:t,radius:i,radialSegments:s,closed:a};let n=e.computeFrenetFrames(t,a);this.tangents=n.tangents,this.normals=n.normals,this.binormals=n.binormals;let o=new R,l=new R,c=new ae,h=new R,m=[],u=[],d=[],g=[];S(),this.setIndex(g),this.setAttribute("position",new De(m,3)),this.setAttribute("normal",new De(u,3)),this.setAttribute("uv",new De(d,2));function S(){for(let E=0;E<t;E++)f(E);f(a===!1?t:0),y(),p()}function f(E){h=e.getPointAt(E/t,h);let x=n.normals[E],T=n.binormals[E];for(let b=0;b<=s;b++){let A=b/s*Math.PI*2,_=Math.sin(A),w=-Math.cos(A);l.x=w*x.x+_*T.x,l.y=w*x.y+_*T.y,l.z=w*x.z+_*T.z,l.normalize(),u.push(l.x,l.y,l.z),o.x=h.x+i*l.x,o.y=h.y+i*l.y,o.z=h.z+i*l.z,m.push(o.x,o.y,o.z)}}function p(){for(let E=1;E<=t;E++)for(let x=1;x<=s;x++){let T=(s+1)*(E-1)+(x-1),b=(s+1)*E+(x-1),A=(s+1)*E+x,_=(s+1)*(E-1)+x;g.push(T,b,_),g.push(b,A,_)}}function y(){for(let E=0;E<=t;E++)for(let x=0;x<=s;x++)c.x=E/t,c.y=x/s,d.push(c.x,c.y)}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}toJSON(){let e=super.toJSON();return e.path=this.parameters.path.toJSON(),e}static fromJSON(e){return new r(new Xa[e.path.type]().fromJSON(e.path),e.tubularSegments,e.radius,e.radialSegments,e.closed)}},an=class extends ct{constructor(e=null){if(super(),this.type="WireframeGeometry",this.parameters={geometry:e},e!==null){let t=[],i=new Set,s=new R,a=new R;if(e.index!==null){let n=e.attributes.position,o=e.index,l=e.groups;l.length===0&&(l=[{start:0,count:o.count,materialIndex:0}]);for(let c=0,h=l.length;c<h;++c){let m=l[c],u=m.start,d=m.count;for(let g=u,S=u+d;g<S;g+=3)for(let f=0;f<3;f++){let p=o.getX(g+f),y=o.getX(g+(f+1)%3);s.fromBufferAttribute(n,p),a.fromBufferAttribute(n,y),Oc(s,a,i)===!0&&(t.push(s.x,s.y,s.z),t.push(a.x,a.y,a.z))}}}else{let n=e.attributes.position;for(let o=0,l=n.count/3;o<l;o++)for(let c=0;c<3;c++){let h=3*o+c,m=3*o+(c+1)%3;s.fromBufferAttribute(n,h),a.fromBufferAttribute(n,m),Oc(s,a,i)===!0&&(t.push(s.x,s.y,s.z),t.push(a.x,a.y,a.z))}}this.setAttribute("position",new De(t,3))}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}};function Oc(r,e,t){let i=`${r.x},${r.y},${r.z}-${e.x},${e.y},${e.z}`,s=`${e.x},${e.y},${e.z}-${r.x},${r.y},${r.z}`;return t.has(i)===!0||t.has(s)===!0?!1:(t.add(i),t.add(s),!0)}var m0=Object.freeze({__proto__:null,BoxGeometry:Ci,CapsuleGeometry:Ba,CircleGeometry:za,ConeGeometry:Pr,CylinderGeometry:ms,DodecahedronGeometry:Ga,EdgesGeometry:Lr,ExtrudeGeometry:qa,IcosahedronGeometry:Ya,LatheGeometry:Za,OctahedronGeometry:Ja,PlaneGeometry:Dr,PolyhedronGeometry:Gi,RingGeometry:Ka,ShapeGeometry:$a,SphereGeometry:Qa,TetrahedronGeometry:en,TorusGeometry:tn,TorusKnotGeometry:rn,TubeGeometry:sn,WireframeGeometry:an});function or(r){let e={};for(let t in r){e[t]={};for(let i in r[t]){let s=r[t][i];if(Fc(s))s.isRenderTargetTexture?(Ue("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),e[t][i]=null):e[t][i]=s.clone();else if(Array.isArray(s))if(Fc(s[0])){let a=[];for(let n=0,o=s.length;n<o;n++)a[n]=s[n].clone();e[t][i]=a}else e[t][i]=s.slice();else e[t][i]=s}}return e}function Rt(r){let e={};for(let t=0;t<r.length;t++){let i=or(r[t]);for(let s in i)e[s]=i[s]}return e}function Fc(r){return r&&(r.isColor||r.isMatrix3||r.isMatrix4||r.isVector2||r.isVector3||r.isVector4||r.isTexture||r.isQuaternion)}function ud(r){let e=[];for(let t=0;t<r.length;t++)e.push(r[t].clone());return e}function Il(r){let e=r.getRenderTarget();return e===null?r.outputColorSpace:e.isXRRenderTarget===!0?e.texture.colorSpace:et.workingColorSpace}var Lh={clone:or,merge:Rt},dd=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,pd=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`,kt=class extends Ei{constructor(e){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=dd,this.fragmentShader=pd,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=or(e.uniforms),this.uniformsGroups=ud(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this.defaultAttributeValues=Object.assign({},e.defaultAttributeValues),this.index0AttributeName=e.index0AttributeName,this.uniformsNeedUpdate=e.uniformsNeedUpdate,this}toJSON(e){let t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(let s in this.uniforms){let a=this.uniforms[s].value;a&&a.isTexture?t.uniforms[s]={type:"t",value:a.toJSON(e).uuid}:a&&a.isColor?t.uniforms[s]={type:"c",value:a.getHex()}:a&&a.isVector2?t.uniforms[s]={type:"v2",value:a.toArray()}:a&&a.isVector3?t.uniforms[s]={type:"v3",value:a.toArray()}:a&&a.isVector4?t.uniforms[s]={type:"v4",value:a.toArray()}:a&&a.isMatrix3?t.uniforms[s]={type:"m3",value:a.toArray()}:a&&a.isMatrix4?t.uniforms[s]={type:"m4",value:a.toArray()}:t.uniforms[s]={value:a}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;let i={};for(let s in this.extensions)this.extensions[s]===!0&&(i[s]=!0);return Object.keys(i).length>0&&(t.extensions=i),t}fromJSON(e,t){if(super.fromJSON(e,t),e.uniforms!==void 0)for(let i in e.uniforms){let s=e.uniforms[i];switch(this.uniforms[i]={},s.type){case"t":this.uniforms[i].value=t[s.value]||null;break;case"c":this.uniforms[i].value=new He().setHex(s.value);break;case"v2":this.uniforms[i].value=new ae().fromArray(s.value);break;case"v3":this.uniforms[i].value=new R().fromArray(s.value);break;case"v4":this.uniforms[i].value=new lt().fromArray(s.value);break;case"m3":this.uniforms[i].value=new ke().fromArray(s.value);break;case"m4":this.uniforms[i].value=new Xe().fromArray(s.value);break;default:this.uniforms[i].value=s.value}}if(e.defines!==void 0&&(this.defines=e.defines),e.vertexShader!==void 0&&(this.vertexShader=e.vertexShader),e.fragmentShader!==void 0&&(this.fragmentShader=e.fragmentShader),e.glslVersion!==void 0&&(this.glslVersion=e.glslVersion),e.extensions!==void 0)for(let i in e.extensions)this.extensions[i]=e.extensions[i];return e.lights!==void 0&&(this.lights=e.lights),e.clipping!==void 0&&(this.clipping=e.clipping),this}},nn=class extends kt{constructor(e){super(e),this.isRawShaderMaterial=!0,this.type="RawShaderMaterial"}};var ws=class extends Ei{constructor(e){super(),this.isMeshLambertMaterial=!0,this.type="MeshLambertMaterial",this.color=new He(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new He(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=co,this.normalScale=new ae(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new wi,this.combine=bn,this.reflectivity=1,this.envMapIntensity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.envMapIntensity=e.envMapIntensity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}},on=class extends Ei{constructor(e){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=ph,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}},ln=class extends Ei{constructor(e){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}};function Sr(r,e){return!r||r.constructor===e?r:typeof e.BYTES_PER_ELEMENT=="number"?new e(r):Array.prototype.slice.call(r)}function qo(r){return r!==void 0&&r.inTangents!==void 0&&r.outTangents!==void 0}var Vi=class{constructor(e,t,i,s){this.parameterPositions=e,this._cachedIndex=0,this.resultBuffer=s!==void 0?s:new t.constructor(i),this.sampleValues=t,this.valueSize=i,this.settings=null,this.DefaultSettings_={}}evaluate(e){let t=this.parameterPositions,i=this._cachedIndex,s=t[i],a=t[i-1];i:{e:{let n;t:{r:if(!(e<s)){for(let o=i+2;;){if(s===void 0){if(e<a)break r;return i=t.length,this._cachedIndex=i,this.copySampleValue_(i-1)}if(i===o)break;if(a=s,s=t[++i],e<s)break e}n=t.length;break t}if(!(e>=a)){let o=t[1];e<o&&(i=2,a=o);for(let l=i-2;;){if(a===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(i===l)break;if(s=a,a=t[--i-1],e>=a)break e}n=i,i=0;break t}break i}for(;i<n;){let o=i+n>>>1;e<t[o]?n=o:i=o+1}if(s=t[i],a=t[i-1],a===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(s===void 0)return i=t.length,this._cachedIndex=i,this.copySampleValue_(i-1)}this._cachedIndex=i,this.intervalChanged_(i,a,s)}return this.interpolate_(i,a,e,s)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(e){let t=this.resultBuffer,i=this.sampleValues,s=this.valueSize,a=e*s;for(let n=0;n!==s;++n)t[n]=i[a+n];return t}interpolate_(){throw new Error("THREE.Interpolant: Call to abstract method.")}intervalChanged_(){}},cn=class extends Vi{constructor(e,t,i,s){super(e,t,i,s),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:Jo,endingEnd:Jo}}intervalChanged_(e,t,i){let s=this.parameterPositions,a=e-2,n=e+1,o=s[a],l=s[n];if(o===void 0)switch(this.getSettings_().endingStart){case Ko:a=e,o=2*t-i;break;case $o:a=s.length-2,o=t+s[a]-s[a+1];break;default:a=e,o=i}if(l===void 0)switch(this.getSettings_().endingEnd){case Ko:n=e,l=2*i-t;break;case $o:n=1,l=i+s[1]-s[0];break;default:n=e-1,l=t}let c=(i-t)*.5,h=this.valueSize;this._weightPrev=c/(t-o),this._weightNext=c/(l-i),this._offsetPrev=a*h,this._offsetNext=n*h}interpolate_(e,t,i,s){let a=this.resultBuffer,n=this.sampleValues,o=this.valueSize,l=e*o,c=l-o,h=this._offsetPrev,m=this._offsetNext,u=this._weightPrev,d=this._weightNext,g=(i-t)/(s-t),S=g*g,f=S*g,p=-u*f+2*u*S-u*g,y=(1+u)*f+(-1.5-2*u)*S+(-.5+u)*g+1,E=(-1-d)*f+(1.5+d)*S+.5*g,x=d*f-d*S;for(let T=0;T!==o;++T)a[T]=p*n[h+T]+y*n[c+T]+E*n[l+T]+x*n[m+T];return a}},hn=class extends Vi{constructor(e,t,i,s){super(e,t,i,s)}interpolate_(e,t,i,s){let a=this.resultBuffer,n=this.sampleValues,o=this.valueSize,l=e*o,c=l-o,h=(i-t)/(s-t),m=1-h;for(let u=0;u!==o;++u)a[u]=n[c+u]*m+n[l+u]*h;return a}},un=class extends Vi{constructor(e,t,i,s){super(e,t,i,s)}interpolate_(e){return this.copySampleValue_(e-1)}},dn=class extends Vi{interpolate_(e,t,i,s){let a=this.resultBuffer,n=this.sampleValues,o=this.valueSize,l=e*o,c=l-o,h=this.inTangents,m=this.outTangents;if(!h||!m){let g=(i-t)/(s-t),S=1-g;for(let f=0;f!==o;++f)a[f]=n[c+f]*S+n[l+f]*g;return a}let u=o*2,d=e-1;for(let g=0;g!==o;++g){let S=n[c+g],f=n[l+g],p=d*u+g*2,y=m[p],E=m[p+1],x=e*u+g*2,T=h[x],b=h[x+1],A=fd(i,t,y,T,s);a[g]=Nh(A,S,E,b,f)}return a}};function Nh(r,e,t,i,s){let a=1-r;return a*a*a*e+3*a*a*r*t+3*a*r*r*i+r*r*r*s}function md(r,e,t,i,s){let a=1-r;return 3*a*a*(t-e)+6*a*r*(i-t)+3*r*r*(s-i)}function fd(r,e,t,i,s){let a=(r-e)/(s-e);for(let n=0;n<8;n++){let o=Nh(a,e,t,i,s)-r;if(Math.abs(o)<1e-10)break;let l=md(a,e,t,i,s);if(Math.abs(l)<1e-10)break;a=Math.max(0,Math.min(1,a-o/l))}return a}var Gt=class{constructor(e,t,i,s){if(e===void 0)throw new Error("THREE.KeyframeTrack: track name is undefined");if(t===void 0||t.length===0)throw new Error("THREE.KeyframeTrack: no keyframes in track named "+e);this.name=e,this.times=Sr(t,this.TimeBufferType),this.values=Sr(i,this.ValueBufferType),this.setInterpolation(s||this.DefaultInterpolation)}static toJSON(e){let t=e.constructor,i;if(t.toJSON!==this.toJSON)i=t.toJSON(e);else{i={name:e.name,times:Sr(e.times,Array),values:Sr(e.values,Array)};let s=e.getInterpolation();s!==e.DefaultInterpolation&&(i.interpolation=s),qo(e.settings)&&(i.settings={inTangents:Sr(e.settings.inTangents,Array),outTangents:Sr(e.settings.outTangents,Array)})}return i.type=e.ValueTypeName,i}InterpolantFactoryMethodDiscrete(e){return new un(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodLinear(e){return new hn(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodSmooth(e){return new cn(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodBezier(e){let t=new dn(this.times,this.values,this.getValueSize(),e);return this.settings&&(t.inTangents=this.settings.inTangents,t.outTangents=this.settings.outTangents),t}setInterpolation(e){let t;switch(e){case is:t=this.InterpolantFactoryMethodDiscrete;break;case Ca:t=this.InterpolantFactoryMethodLinear;break;case ga:t=this.InterpolantFactoryMethodSmooth;break;case Zo:t=this.InterpolantFactoryMethodBezier;break}if(t===void 0){let i="unsupported interpolation for "+this.ValueTypeName+" keyframe track named "+this.name;if(this.createInterpolant===void 0)if(e!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw new Error(i);return Ue("KeyframeTrack:",i),this}return this.createInterpolant=t,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return is;case this.InterpolantFactoryMethodLinear:return Ca;case this.InterpolantFactoryMethodSmooth:return ga;case this.InterpolantFactoryMethodBezier:return Zo}}getValueSize(){return this.values.length/this.times.length}shift(e){if(e!==0){let t=this.times;for(let i=0,s=t.length;i!==s;++i)t[i]+=e}return this}scale(e){if(e!==1){let t=this.times;for(let i=0,s=t.length;i!==s;++i)t[i]*=e;qo(this.settings)&&(Bc(this.settings.inTangents,e),Bc(this.settings.outTangents,e))}return this}trim(e,t){let i=this.times,s=i.length,a=0,n=s-1;for(;a!==s&&i[a]<e;)++a;for(;n!==-1&&i[n]>t;)--n;if(++n,a!==0||n!==s){a>=n&&(n=Math.max(n,1),a=n-1);let o=this.getValueSize();this.times=i.slice(a,n),this.values=this.values.slice(a*o,n*o)}return this}validate(){let e=!0,t=this.getValueSize();t-Math.floor(t)!==0&&(Fe("KeyframeTrack: Invalid value size in track.",this),e=!1);let i=this.times,s=this.values,a=i.length;a===0&&(Fe("KeyframeTrack: Track is empty.",this),e=!1);let n=null;for(let o=0;o!==a;o++){let l=i[o];if(typeof l=="number"&&isNaN(l)){Fe("KeyframeTrack: Time is not a valid number.",this,o,l),e=!1;break}if(n!==null&&n>l){Fe("KeyframeTrack: Out of order keys.",this,o,l,n),e=!1;break}n=l}if(s!==void 0&&_u(s))for(let o=0,l=s.length;o!==l;++o){let c=s[o];if(isNaN(c)){Fe("KeyframeTrack: Value is not a valid number.",this,o,c),e=!1;break}}return e}optimize(){let e=this.times.slice(),t=this.values.slice(),i=this.getValueSize(),s=this.getInterpolation()===ga,a=e.length-1,n=1;for(let o=1;o<a;++o){let l=!1,c=e[o],h=e[o+1];if(c!==h&&(o!==1||c!==e[0]))if(s)l=!0;else{let m=o*i,u=m-i,d=m+i;for(let g=0;g!==i;++g){let S=t[m+g];if(S!==t[u+g]||S!==t[d+g]){l=!0;break}}}if(l){if(o!==n){e[n]=e[o];let m=o*i,u=n*i;for(let d=0;d!==i;++d)t[u+d]=t[m+d]}++n}}if(a>0){e[n]=e[a];for(let o=a*i,l=n*i,c=0;c!==i;++c)t[l+c]=t[o+c];++n}return n!==e.length?(this.times=e.slice(0,n),this.values=t.slice(0,n*i)):(this.times=e,this.values=t),this}clone(){let e=this.times.slice(),t=this.values.slice(),i=this.constructor,s=new i(this.name,e,t);return s.createInterpolant=this.createInterpolant,qo(this.settings)&&(s.settings={inTangents:this.settings.inTangents.slice(),outTangents:this.settings.outTangents.slice()}),s}};function Bc(r,e){for(let t=0,i=r.length;t!==i;t+=2)r[t]*=e}Gt.prototype.ValueTypeName="",Gt.prototype.TimeBufferType=Float32Array,Gt.prototype.ValueBufferType=Float32Array,Gt.prototype.DefaultInterpolation=Ca;var Fi=class extends Gt{constructor(e,t,i){super(e,t,i)}};Fi.prototype.ValueTypeName="bool",Fi.prototype.ValueBufferType=Array,Fi.prototype.DefaultInterpolation=is,Fi.prototype.InterpolantFactoryMethodLinear=void 0,Fi.prototype.InterpolantFactoryMethodSmooth=void 0;var pn=class extends Gt{constructor(e,t,i,s){super(e,t,i,s)}};pn.prototype.ValueTypeName="color";var mn=class extends Gt{constructor(e,t,i,s){super(e,t,i,s)}};mn.prototype.ValueTypeName="number";var fn=class extends Vi{constructor(e,t,i,s){super(e,t,i,s)}interpolate_(e,t,i,s){let a=this.resultBuffer,n=this.sampleValues,o=this.valueSize,l=(i-t)/(s-t),c=e*o;for(let h=c+o;c!==h;c+=4)qt.slerpFlat(a,0,n,c-o,n,c,l);return a}},Es=class extends Gt{constructor(e,t,i,s){super(e,t,i,s)}InterpolantFactoryMethodLinear(e){return new fn(this.times,this.values,this.getValueSize(),e)}};Es.prototype.ValueTypeName="quaternion",Es.prototype.InterpolantFactoryMethodSmooth=void 0;var Bi=class extends Gt{constructor(e,t,i){super(e,t,i)}};Bi.prototype.ValueTypeName="string",Bi.prototype.ValueBufferType=Array,Bi.prototype.DefaultInterpolation=is,Bi.prototype.InterpolantFactoryMethodLinear=void 0,Bi.prototype.InterpolantFactoryMethodSmooth=void 0;var gn=class extends Gt{constructor(e,t,i,s){super(e,t,i,s)}};gn.prototype.ValueTypeName="vector";var _n=class{constructor(e,t,i){let s=this,a=!1,n=0,o=0,l,c=[];this.onStart=void 0,this.onLoad=e,this.onProgress=t,this.onError=i,this._abortController=null,this.itemStart=function(h){o++,a===!1&&s.onStart!==void 0&&s.onStart(h,n,o),a=!0},this.itemEnd=function(h){n++,s.onProgress!==void 0&&s.onProgress(h,n,o),n===o&&(a=!1,s.onLoad!==void 0&&s.onLoad())},this.itemError=function(h){s.onError!==void 0&&s.onError(h)},this.resolveURL=function(h){return h=h.normalize("NFC"),l?l(h):h},this.setURLModifier=function(h){return l=h,this},this.addHandler=function(h,m){return c.push(h,m),this},this.removeHandler=function(h){let m=c.indexOf(h);return m!==-1&&c.splice(m,2),this},this.getHandler=function(h){for(let m=0,u=c.length;m<u;m+=2){let d=c[m],g=c[m+1];if(d.global&&(d.lastIndex=0),d.test(h))return g}return null},this.abort=function(){return this.abortController.abort(),this._abortController=null,this}}get abortController(){return this._abortController||(this._abortController=new AbortController),this._abortController}},Uh=new _n,vn=class{constructor(e){this.manager=e!==void 0?e:Uh,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}load(){}loadAsync(e,t){let i=this;return new Promise(function(s,a){i.load(e,s,t,a)})}parse(){}setCrossOrigin(e){return this.crossOrigin=e,this}setWithCredentials(e){return this.withCredentials=e,this}setPath(e){return this.path=e,this}setResourcePath(e){return this.resourcePath=e,this}setRequestHeader(e){return this.requestHeader=e,this}abort(){return this}};vn.DEFAULT_MATERIAL_NAME="__DEFAULT";var As=class extends Tt{constructor(e,t=1){super(),this.isLight=!0,this.type="Light",this.color=new He(e),this.intensity=t}copy(e,t){return super.copy(e,t),this.color.copy(e.color),this.intensity=e.intensity,this}toJSON(e){let t=super.toJSON(e);return t.object.color=this.color.getHex(),t.object.intensity=this.intensity,t}},Cs=class extends As{constructor(e,t,i){super(e,i),this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(Tt.DEFAULT_UP),this.updateMatrix(),this.groundColor=new He(t)}copy(e,t){return super.copy(e,t),this.groundColor.copy(e.groundColor),this}toJSON(e){let t=super.toJSON(e);return t.object.groundColor=this.groundColor.getHex(),t}},Yo=new Xe,zc=new R,Gc=new R,xn=class{constructor(e){this.camera=e,this.intensity=1,this.bias=0,this.biasNode=null,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new ae(512,512),this.mapType=Ot,this.map=null,this.mapPass=null,this.matrix=new Xe,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new Ai,this._frameExtents=new ae(1,1),this._viewportCount=1,this._viewports=[new lt(0,0,1,1)]}getViewportCount(){return this._viewportCount}getCamera(){return this.camera}getFrustum(){return this._frustum}updateMatrices(e){let t=this.camera;zc.setFromMatrixPosition(e.matrixWorld),t.position.copy(zc),Gc.setFromMatrixPosition(e.target.matrixWorld),t.lookAt(Gc),t.updateMatrixWorld(),this._updateMatrix(t,this.matrix,this._frustum)}_updateMatrix(e,t,i,s){Yo.multiplyMatrices(e.projectionMatrix,e.matrixWorldInverse),i.setFromProjectionMatrix(Yo,e.coordinateSystem,e.reversedDepth);let a=this._frameExtents,n=s?s.z/a.x:1,o=s?s.w/a.y:1,l=s?s.x/a.x:0,c=s?s.y/a.y:0;e.coordinateSystem===Er||e.reversedDepth?t.set(.5*n,0,0,.5*n+l,0,.5*o,0,.5*o+c,0,0,1,0,0,0,0,1):t.set(.5*n,0,0,.5*n+l,0,.5*o,0,.5*o+c,0,0,.5,.5,0,0,0,1),t.multiply(Yo)}getViewport(e){return this._viewports[e]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(e){return this.camera=e.camera.clone(),this.intensity=e.intensity,this.bias=e.bias,this.radius=e.radius,this.autoUpdate=e.autoUpdate,this.needsUpdate=e.needsUpdate,this.normalBias=e.normalBias,this.blurSamples=e.blurSamples,this.mapSize.copy(e.mapSize),this.biasNode=e.biasNode,this}clone(){return new this.constructor().copy(this)}toJSON(){let e={};return e.intensity=this.intensity,e.bias=this.bias,e.normalBias=this.normalBias,e.radius=this.radius,e.blurSamples=this.blurSamples,e.mapSize=this.mapSize.toArray(),e.camera=this.camera.toJSON(!1).object,delete e.camera.matrix,e}},ma=new R,fa=new qt,li=new R,Or=class extends Tt{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new Xe,this.projectionMatrix=new Xe,this.projectionMatrixInverse=new Xe,this.coordinateSystem=Xt,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorld.decompose(ma,fa,li),li.x===1&&li.y===1&&li.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(ma,fa,li.set(1,1,1)).invert()}updateWorldMatrix(e,t,i=!1){super.updateWorldMatrix(e,t,i),this.matrixWorld.decompose(ma,fa,li),li.x===1&&li.y===1&&li.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(ma,fa,li.set(1,1,1)).invert()}clone(){return new this.constructor().copy(this)}},Oi=new R,Vc=new ae,kc=new ae,Nt=class extends Or{constructor(e=50,t=1,i=.1,s=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=e,this.zoom=1,this.near=i,this.far=s,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){let t=.5*this.getFilmHeight()/e;this.fov=Ra*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){let e=Math.tan(va*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return Ra*2*Math.atan(Math.tan(va*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,t,i){Oi.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),t.set(Oi.x,Oi.y).multiplyScalar(-e/Oi.z),Oi.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),i.set(Oi.x,Oi.y).multiplyScalar(-e/Oi.z)}getViewSize(e,t){return this.getViewBounds(e,Vc,kc),t.subVectors(kc,Vc)}setViewOffset(e,t,i,s,a,n){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=i,this.view.offsetY=s,this.view.width=a,this.view.height=n,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=this.near,t=e*Math.tan(va*.5*this.fov)/this.zoom,i=2*t,s=this.aspect*i,a=-.5*s,n=this.view;if(this.view!==null&&this.view.enabled){let l=n.fullWidth,c=n.fullHeight;a+=n.offsetX*s/l,t-=n.offsetY*i/c,s*=n.width/l,i*=n.height/c}let o=this.filmOffset;o!==0&&(a+=e*o/this.getFilmWidth()),this.projectionMatrix.makePerspective(a,a+s,t,t-i,e,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}};var ki=class extends Or{constructor(e=-1,t=1,i=1,s=-1,a=.1,n=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=i,this.bottom=s,this.near=a,this.far=n,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,i,s,a,n){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=i,this.view.offsetY=s,this.view.width=a,this.view.height=n,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),i=(this.right+this.left)/2,s=(this.top+this.bottom)/2,a=i-e,n=i+e,o=s+t,l=s-t;if(this.view!==null&&this.view.enabled){let c=(this.right-this.left)/this.view.fullWidth/this.zoom,h=(this.top-this.bottom)/this.view.fullHeight/this.zoom;a+=c*this.view.offsetX,n=a+c*this.view.width,o-=h*this.view.offsetY,l=o-h*this.view.height}this.projectionMatrix.makeOrthographic(a,n,o,l,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}},rl=class extends xn{constructor(){super(new ki(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}},Rs=class extends As{constructor(e,t){super(e,t),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(Tt.DEFAULT_UP),this.updateMatrix(),this.target=new Tt,this.shadow=new rl}dispose(){super.dispose(),this.shadow.dispose()}copy(e){return super.copy(e),this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}toJSON(e){let t=super.toJSON(e);return t.object.shadow=this.shadow.toJSON(),t.object.target=this.target.uuid,t}};var f0=new Xe,g0=new Xe,_0=new Xe;var Mr=-90,br=1,yn=class extends Tt{constructor(e,t,i){super(),this.type="CubeCamera",this.renderTarget=i,this.coordinateSystem=null,this.activeMipmapLevel=0;let s=new Nt(Mr,br,e,t);s.layers=this.layers,this.add(s);let a=new Nt(Mr,br,e,t);a.layers=this.layers,this.add(a);let n=new Nt(Mr,br,e,t);n.layers=this.layers,this.add(n);let o=new Nt(Mr,br,e,t);o.layers=this.layers,this.add(o);let l=new Nt(Mr,br,e,t);l.layers=this.layers,this.add(l);let c=new Nt(Mr,br,e,t);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){let e=this.coordinateSystem,t=this.children.concat(),[i,s,a,n,o,l]=t;for(let c of t)this.remove(c);if(e===Xt)i.up.set(0,1,0),i.lookAt(1,0,0),s.up.set(0,1,0),s.lookAt(-1,0,0),a.up.set(0,0,-1),a.lookAt(0,1,0),n.up.set(0,0,1),n.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else if(e===Er)i.up.set(0,-1,0),i.lookAt(-1,0,0),s.up.set(0,-1,0),s.lookAt(1,0,0),a.up.set(0,0,1),a.lookAt(0,1,0),n.up.set(0,0,-1),n.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+e);for(let c of t)this.add(c),c.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();let{renderTarget:i,activeMipmapLevel:s}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());let[a,n,o,l,c,h]=this.children,m=e.getRenderTarget(),u=e.getActiveCubeFace(),d=e.getActiveMipmapLevel(),g=e.xr.enabled;e.xr.enabled=!1;let S=i.texture.generateMipmaps;i.texture.generateMipmaps=!1;let f=!1;e.isWebGLRenderer===!0?f=e.state.buffers.depth.getReversed():f=e.reversedDepthBuffer,e.setRenderTarget(i,0,s),f&&e.autoClear===!1&&e.clearDepth(),e.render(t,a),e.setRenderTarget(i,1,s),f&&e.autoClear===!1&&e.clearDepth(),e.render(t,n),e.setRenderTarget(i,2,s),f&&e.autoClear===!1&&e.clearDepth(),e.render(t,o),e.setRenderTarget(i,3,s),f&&e.autoClear===!1&&e.clearDepth(),e.render(t,l),e.setRenderTarget(i,4,s),f&&e.autoClear===!1&&e.clearDepth(),e.render(t,c),i.texture.generateMipmaps=S,e.setRenderTarget(i,5,s),f&&e.autoClear===!1&&e.clearDepth(),e.render(t,h),e.setRenderTarget(m,u,d),e.xr.enabled=g,i.texture.needsPMREMUpdate=!0}},Sn=class extends Nt{constructor(e=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=e}};var v0=new R,x0=new qt,y0=new R,S0=new R,M0=new R;var b0=new R,T0=new qt,w0=new R,E0=new R;var Pl="\\[\\]\\.:\\/",gd=new RegExp("["+Pl+"]","g"),Ll="[^"+Pl+"]",_d="[^"+Pl.replace("\\.","")+"]",vd=/((?:WC+[\/:])*)/.source.replace("WC",Ll),xd=/(WCOD+)?/.source.replace("WCOD",_d),yd=/(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace("WC",Ll),Sd=/\.(WC+)(?:\[(.+)\])?/.source.replace("WC",Ll),Md=new RegExp("^"+vd+xd+yd+Sd+"$"),bd=["material","materials","bones","map"],sl=class{constructor(e,t,i){let s=i||dt.parseTrackName(t);this._targetGroup=e,this._bindings=e.subscribe_(t,s)}getValue(e,t){this.bind();let i=this._targetGroup.nCachedObjects_,s=this._bindings[i];s!==void 0&&s.getValue(e,t)}setValue(e,t){let i=this._bindings;for(let s=this._targetGroup.nCachedObjects_,a=i.length;s!==a;++s)i[s].setValue(e,t)}bind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,i=e.length;t!==i;++t)e[t].bind()}unbind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,i=e.length;t!==i;++t)e[t].unbind()}},dt=class r{constructor(e,t,i){this.path=t,this.parsedPath=i||r.parseTrackName(t),this.node=r.findNode(e,this.parsedPath.nodeName),this.rootNode=e,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(e,t,i){return e&&e.isAnimationObjectGroup?new r.Composite(e,t,i):new r(e,t,i)}static sanitizeNodeName(e){return e.replace(/\s/g,"_").replace(gd,"")}static parseTrackName(e){let t=Md.exec(e);if(t===null)throw new Error("THREE.PropertyBinding: Cannot parse trackName: "+e);let i={nodeName:t[2],objectName:t[3],objectIndex:t[4],propertyName:t[5],propertyIndex:t[6]},s=i.nodeName&&i.nodeName.lastIndexOf(".");if(s!==void 0&&s!==-1){let a=i.nodeName.substring(s+1);bd.indexOf(a)!==-1&&(i.nodeName=i.nodeName.substring(0,s),i.objectName=a)}if(i.propertyName===null||i.propertyName.length===0)throw new Error("THREE.PropertyBinding: can not parse propertyName from trackName: "+e);return i}static findNode(e,t){if(t===void 0||t===""||t==="."||t===-1||t===e.name||t===e.uuid)return e;if(e.skeleton){let i=e.skeleton.getBoneByName(t);if(i!==void 0)return i}if(e.children){let i=function(a){for(let n=0;n<a.length;n++){let o=a[n];if(o.name===t||o.uuid===t)return o;let l=i(o.children);if(l)return l}return null},s=i(e.children);if(s)return s}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(e,t){e[t]=this.targetObject[this.propertyName]}_getValue_array(e,t){let i=this.resolvedProperty;for(let s=0,a=i.length;s!==a;++s)e[t++]=i[s]}_getValue_arrayElement(e,t){e[t]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(e,t){this.resolvedProperty.toArray(e,t)}_setValue_direct(e,t){this.targetObject[this.propertyName]=e[t]}_setValue_direct_setNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(e,t){let i=this.resolvedProperty;for(let s=0,a=i.length;s!==a;++s)i[s]=e[t++]}_setValue_array_setNeedsUpdate(e,t){let i=this.resolvedProperty;for(let s=0,a=i.length;s!==a;++s)i[s]=e[t++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(e,t){let i=this.resolvedProperty;for(let s=0,a=i.length;s!==a;++s)i[s]=e[t++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(e,t){this.resolvedProperty[this.propertyIndex]=e[t]}_setValue_arrayElement_setNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(e,t){this.resolvedProperty.fromArray(e,t)}_setValue_fromArray_setNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(e,t){this.bind(),this.getValue(e,t)}_setValue_unbound(e,t){this.bind(),this.setValue(e,t)}bind(){let e=this.node,t=this.parsedPath,i=t.objectName,s=t.propertyName,a=t.propertyIndex;if(e||(e=r.findNode(this.rootNode,t.nodeName),this.node=e),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!e){Ue("PropertyBinding: No target node found for track: "+this.path+".");return}if(i){let c=t.objectIndex;switch(i){case"materials":if(!e.material){Fe("PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.materials){Fe("PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.",this);return}e=e.material.materials;break;case"bones":if(!e.skeleton){Fe("PropertyBinding: Can not bind to bones as node does not have a skeleton.",this);return}e=e.skeleton.bones;for(let h=0;h<e.length;h++)if(e[h].name===c){c=h;break}break;case"map":if("map"in e){e=e.map;break}if(!e.material){Fe("PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.map){Fe("PropertyBinding: Can not bind to material.map as node.material does not have a map.",this);return}e=e.material.map;break;default:if(e[i]===void 0){Fe("PropertyBinding: Can not bind to objectName of node undefined.",this);return}e=e[i]}if(c!==void 0){if(e[c]===void 0){Fe("PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.",this,e);return}e=e[c]}}let n=e[s];if(n===void 0){let c=t.nodeName;Fe("PropertyBinding: Trying to update property for track: "+c+"."+s+" but it wasn't found.",e);return}let o=this.Versioning.None;this.targetObject=e,e.isMaterial===!0?o=this.Versioning.NeedsUpdate:e.isObject3D===!0&&(o=this.Versioning.MatrixWorldNeedsUpdate);let l=this.BindingType.Direct;if(a!==void 0){if(s==="morphTargetInfluences"){if(!e.geometry){Fe("PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.",this);return}if(!e.geometry.morphAttributes){Fe("PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.",this);return}e.morphTargetDictionary[a]!==void 0&&(a=e.morphTargetDictionary[a])}l=this.BindingType.ArrayElement,this.resolvedProperty=n,this.propertyIndex=a}else n.fromArray!==void 0&&n.toArray!==void 0?(l=this.BindingType.HasFromToArray,this.resolvedProperty=n):Array.isArray(n)?(l=this.BindingType.EntireArray,this.resolvedProperty=n):this.propertyName=s;this.getValue=this.GetterByBindingType[l],this.setValue=this.SetterByBindingTypeAndVersioning[l][o]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}};dt.Composite=sl,dt.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3},dt.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2},dt.prototype.GetterByBindingType=[dt.prototype._getValue_direct,dt.prototype._getValue_array,dt.prototype._getValue_arrayElement,dt.prototype._getValue_toArray],dt.prototype.SetterByBindingTypeAndVersioning=[[dt.prototype._setValue_direct,dt.prototype._setValue_direct_setNeedsUpdate,dt.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[dt.prototype._setValue_array,dt.prototype._setValue_array_setNeedsUpdate,dt.prototype._setValue_array_setMatrixWorldNeedsUpdate],[dt.prototype._setValue_arrayElement,dt.prototype._setValue_arrayElement_setNeedsUpdate,dt.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[dt.prototype._setValue_fromArray,dt.prototype._setValue_fromArray_setNeedsUpdate,dt.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];var A0=new Float32Array(1);var C0=new Xe;var Bl=class Bl{constructor(e,t,i,s){this.elements=[1,0,0,1],e!==void 0&&this.set(e,t,i,s)}identity(){return this.set(1,0,0,1),this}fromArray(e,t=0){for(let i=0;i<4;i++)this.elements[i]=e[i+t];return this}set(e,t,i,s){let a=this.elements;return a[0]=e,a[2]=t,a[1]=i,a[3]=s,this}};Bl.prototype.isMatrix2=!0;var al=Bl,R0=new ae;var I0=new R,P0=new R,L0=new R,N0=new R,U0=new R,D0=new R,O0=new R;var F0=new R;var B0=new R,z0=new Xe,G0=new Xe;var V0=new R,k0=new He,H0=new He;var W0=new R,X0=new R,j0=new R;var q0=new R,Y0=new Or;var Z0=new ei;var J0=new R;function Nl(r,e,t,i){let s=Td(i);switch(t){case Tl:return r*e;case El:return r*e/s.components*s.byteLength;case In:return r*e/s.components*s.byteLength;case qi:return r*e*2/s.components*s.byteLength;case Pn:return r*e*2/s.components*s.byteLength;case wl:return r*e*3/s.components*s.byteLength;case Yt:return r*e*4/s.components*s.byteLength;case Ln:return r*e*4/s.components*s.byteLength;case Ns:case Us:return Math.floor((r+3)/4)*Math.floor((e+3)/4)*8;case Ds:case Os:return Math.floor((r+3)/4)*Math.floor((e+3)/4)*16;case Un:case On:return Math.max(r,16)*Math.max(e,8)/4;case Nn:case Dn:return Math.max(r,8)*Math.max(e,8)/2;case Fn:case Bn:case Gn:case Vn:return Math.floor((r+3)/4)*Math.floor((e+3)/4)*8;case zn:case Fs:case kn:return Math.floor((r+3)/4)*Math.floor((e+3)/4)*16;case Hn:return Math.floor((r+3)/4)*Math.floor((e+3)/4)*16;case Wn:return Math.floor((r+4)/5)*Math.floor((e+3)/4)*16;case Xn:return Math.floor((r+4)/5)*Math.floor((e+4)/5)*16;case jn:return Math.floor((r+5)/6)*Math.floor((e+4)/5)*16;case qn:return Math.floor((r+5)/6)*Math.floor((e+5)/6)*16;case Yn:return Math.floor((r+7)/8)*Math.floor((e+4)/5)*16;case Zn:return Math.floor((r+7)/8)*Math.floor((e+5)/6)*16;case Jn:return Math.floor((r+7)/8)*Math.floor((e+7)/8)*16;case Kn:return Math.floor((r+9)/10)*Math.floor((e+4)/5)*16;case $n:return Math.floor((r+9)/10)*Math.floor((e+5)/6)*16;case Qn:return Math.floor((r+9)/10)*Math.floor((e+7)/8)*16;case eo:return Math.floor((r+9)/10)*Math.floor((e+9)/10)*16;case to:return Math.floor((r+11)/12)*Math.floor((e+9)/10)*16;case io:return Math.floor((r+11)/12)*Math.floor((e+11)/12)*16;case ro:case so:case ao:return Math.ceil(r/4)*Math.ceil(e/4)*16;case no:case oo:return Math.ceil(r/4)*Math.ceil(e/4)*8;case Bs:case lo:return Math.ceil(r/4)*Math.ceil(e/4)*16}throw new Error(`Unable to determine texture byte length for ${t} format.`)}function Td(r){switch(r){case Ot:case yl:return{byteLength:1,components:1};case zr:case Sl:case ai:return{byteLength:2,components:1};case Cn:case Rn:return{byteLength:2,components:4};case ri:case An:case si:return{byteLength:4,components:1};case Ml:case bl:return{byteLength:4,components:3}}throw new Error(`THREE.TextureUtils: Unknown texture type ${r}.`)}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:"186"}})),typeof window<"u"&&(window.__THREE__?Ue("WARNING: Multiple instances of Three.js being imported."):window.__THREE__="186");/**
 * @license
 * Copyright 2010-2026 Three.js Authors
 * SPDX-License-Identifier: MIT
 */function iu(){let r=null,e=!1,t=null,i=null;function s(a,n){i=r.requestAnimationFrame(s),t(a,n)}return{start:function(){e!==!0&&t!==null&&r!==null&&(i=r.requestAnimationFrame(s),e=!0)},stop:function(){r!==null&&r.cancelAnimationFrame(i),e=!1},setAnimationLoop:function(a){t=a},setContext:function(a){r=a}}}function Ed(r){let e=new WeakMap;function t(o,l){let c=o.array,h=o.usage,m=c.byteLength,u=r.createBuffer();r.bindBuffer(l,u),r.bufferData(l,c,h),o.onUploadCallback();let d;if(c instanceof Float32Array)d=r.FLOAT;else if(typeof Float16Array<"u"&&c instanceof Float16Array)d=r.HALF_FLOAT;else if(c instanceof Uint16Array)o.isFloat16BufferAttribute?d=r.HALF_FLOAT:d=r.UNSIGNED_SHORT;else if(c instanceof Int16Array)d=r.SHORT;else if(c instanceof Uint32Array)d=r.UNSIGNED_INT;else if(c instanceof Int32Array)d=r.INT;else if(c instanceof Int8Array)d=r.BYTE;else if(c instanceof Uint8Array)d=r.UNSIGNED_BYTE;else if(c instanceof Uint8ClampedArray)d=r.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+c);return{buffer:u,type:d,bytesPerElement:c.BYTES_PER_ELEMENT,version:o.version,size:m}}function i(o,l,c){let h=l.array,m=l.updateRanges;if(r.bindBuffer(c,o),m.length===0)r.bufferSubData(c,0,h);else{m.sort((d,g)=>d.start-g.start);let u=0;for(let d=1;d<m.length;d++){let g=m[u],S=m[d];S.start<=g.start+g.count+1?g.count=Math.max(g.count,S.start+S.count-g.start):(++u,m[u]=S)}m.length=u+1;for(let d=0,g=m.length;d<g;d++){let S=m[d];r.bufferSubData(c,S.start*h.BYTES_PER_ELEMENT,h,S.start,S.count)}l.clearUpdateRanges()}l.onUploadCallback()}function s(o){return o.isInterleavedBufferAttribute&&(o=o.data),e.get(o)}function a(o){o.isInterleavedBufferAttribute&&(o=o.data);let l=e.get(o);l&&(r.deleteBuffer(l.buffer),e.delete(o))}function n(o,l){if(o.isInterleavedBufferAttribute&&(o=o.data),o.isGLBufferAttribute){let h=e.get(o);(!h||h.version<o.version)&&e.set(o,{buffer:o.buffer,type:o.type,bytesPerElement:o.elementSize,version:o.version});return}let c=e.get(o);if(c===void 0)e.set(o,t(o,l));else if(c.version<o.version){if(c.size!==o.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");i(c.buffer,o,l),c.version=o.version}}return{get:s,remove:a,update:n}}var Ad=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,Cd=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,Rd=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,Id=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,Pd=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,Ld=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,Nd=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,Ud=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,Dd=`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec4 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 );
	}
#endif`,Od=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,Fd=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,Bd=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,zd=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,Gd=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,Vd=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,kd=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,Hd=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,Wd=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,Xd=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,jd=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#endif`,qd=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#endif`,Yd=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec4 vColor;
#endif`,Zd=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec4( 1.0 );
#endif
#ifdef USE_COLOR_ALPHA
	vColor *= color;
#elif defined( USE_COLOR )
	vColor.rgb *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.rgb *= instanceColor.rgb;
#endif
#ifdef USE_BATCHING_COLOR
	vColor *= getBatchingColor( getIndirectIndex( gl_DrawID ) );
#endif`,Jd=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
#define inverseTransformDirection transformDirectionByInverseViewMatrix
vec3 transformNormalByInverseViewMatrix( in vec3 normal, in mat4 viewMatrix ) {
	return normalize( ( vec4( normal, 0.0 ) * viewMatrix ).xyz );
}
vec3 transformDirectionByInverseViewMatrix( in vec3 dir, in mat4 viewMatrix ) {
	return normalize( ( vec4( dir, 0.0 ) * viewMatrix ).xyz );
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,Kd=`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,$d=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
#endif`,Qd=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,ep=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,tp=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,ip=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,rp="gl_FragColor = linearToOutputTexel( gl_FragColor );",sp=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,ap=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * reflectVec );
		#ifdef ENVMAP_BLENDING_MULTIPLY
			outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_MIX )
			outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_ADD )
			outgoingLight += envColor.xyz * specularStrength * reflectivity;
		#endif
	#endif
#endif`,np=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
#endif`,op=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,lp=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,cp=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,hp=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,up=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,dp=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,pp=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,mp=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,fp=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,gp=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,_p=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,vp=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_SUN_LIGHTS > 0
	struct SunLight {
		vec3 direction;
		vec3 color;
	};
	uniform SunLight sunLights[ NUM_SUN_LIGHTS ];
	void getSunLightInfo( const in SunLight sunLight, out IncidentLight light ) {
		light.color = sunLight.color;
		light.direction = sunLight.direction;
		light.visible = true;
	}
#endif
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif
#include <lightprobes_pars_fragment>`,xp=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, pow4( roughness ) ) );
			reflectVec = transformDirectionByInverseViewMatrix( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_RETROREFLECTION
		vec3 getIBLRetroRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 retroVec = normalize( mix( viewDir, normal, pow4( roughness ) ) );
				retroVec = transformDirectionByInverseViewMatrix( retroVec, viewMatrix );
				vec4 envMapColor = textureCubeUV( envMap, envMapRotation * retroVec, roughness );
				return envMapColor.rgb * envMapIntensity;
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
		#ifdef USE_RETROREFLECTION
			vec3 getIBLAnisotropyRetroRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
				#ifdef ENVMAP_TYPE_CUBE_UV
					vec3 bentNormal = cross( bitangent, viewDir );
					bentNormal = normalize( cross( bentNormal, bitangent ) );
					bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
					return getIBLRetroRadiance( viewDir, bentNormal, roughness );
				#else
					return vec3( 0.0 );
				#endif
			}
		#endif
	#endif
#endif`,yp=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,Sp=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,Mp=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,bp=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,Tp=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.diffuseContribution = diffuseColor.rgb * ( 1.0 - metalnessFactor );
material.metalness = metalnessFactor;
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor;
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = vec3( 0.04 );
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_RETROREFLECTION
	material.retroreflectivity = retroreflectivity;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.0001, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,wp=`uniform sampler2D dfgLUT;
struct PhysicalMaterial {
	vec3 diffuseColor;
	vec3 diffuseContribution;
	vec3 specularColor;
	vec3 specularColorBlended;
	float roughness;
	float metalness;
	float specularF90;
	float dispersion;
	vec2 dfg;
	vec3 multiScatteringCompensation;
	#ifdef USE_RETROREFLECTION
		float retroreflectivity;
	#endif
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0Dielectric;
		vec3 iridescenceF0Metallic;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		return 0.5 / max( gv + gl, EPSILON );
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColorBlended;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transpose( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float rInv = 1.0 / ( roughness + 0.1 );
	float a = -1.9362 + 1.0678 * roughness + 0.4573 * r2 - 0.8469 * rInv;
	float b = -0.6014 + 0.5538 * roughness - 0.4670 * r2 - 0.1255 * rInv;
	float DG = exp( a * dotNV + b );
	return saturate( DG );
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 fab = texture2D( dfgLUT, vec2( roughness, dotNV ) ).rg;
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec2 fab, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec2 fab, const in vec3 specularColor, const in float specularF90, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColorBlended * t2.x + ( material.specularF90 - material.specularColorBlended ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseContribution * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
		#ifdef USE_CLEARCOAT
			vec3 Ncc = geometryClearcoatNormal;
			vec2 uvClearcoat = LTC_Uv( Ncc, viewDir, material.clearcoatRoughness );
			vec4 t1Clearcoat = texture2D( ltc_1, uvClearcoat );
			vec4 t2Clearcoat = texture2D( ltc_2, uvClearcoat );
			mat3 mInvClearcoat = mat3(
				vec3( t1Clearcoat.x, 0, t1Clearcoat.y ),
				vec3(             0, 1,             0 ),
				vec3( t1Clearcoat.z, 0, t1Clearcoat.w )
			);
			vec3 fresnelClearcoat = material.clearcoatF0 * t2Clearcoat.x + ( material.clearcoatF90 - material.clearcoatF0 ) * t2Clearcoat.y;
			clearcoatSpecularDirect += lightColor * fresnelClearcoat * LTC_Evaluate( Ncc, viewDir, position, mInvClearcoat, rectCoords );
		#endif
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
 
 		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
 
 		float sheenAlbedoV = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
 		float sheenAlbedoL = IBLSheenBRDF( geometryNormal, directLight.direction, material.sheenRoughness );
 
 		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * max( sheenAlbedoV, sheenAlbedoL );
 
 		irradiance *= sheenEnergyComp;
 
 	#endif
	vec3 specularBRDF = BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	#ifdef USE_RETROREFLECTION
		vec3 retroViewDir = reflect( - geometryViewDir, geometryNormal );
		vec3 retroSpecularBRDF = BRDF_GGX( directLight.direction, retroViewDir, geometryNormal, material );
		specularBRDF = mix( specularBRDF, retroSpecularBRDF, saturate( material.retroreflectivity ) );
	#endif
	reflectedLight.directSpecular += irradiance * specularBRDF * material.multiScatteringCompensation;
	vec3 halfDir = normalize( directLight.direction + geometryViewDir );
	float dotVH = saturate( dot( geometryViewDir, halfDir ) );
	vec3 F = F_Schlick( material.specularColor, material.specularF90, dotVH );
	#ifdef USE_RETROREFLECTION
		vec3 retroHalfDir = normalize( directLight.direction + retroViewDir );
		float dotRetroVH = saturate( dot( retroViewDir, retroHalfDir ) );
		vec3 retroF = F_Schlick( material.specularColor, material.specularF90, dotRetroVH );
		F = mix( F, retroF, saturate( material.retroreflectivity ) );
	#endif
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseContribution ) * ( 1.0 - F );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( material.dfg, material.specularColor, material.specularF90, material.iridescence, material.iridescenceF0Dielectric, singleScattering, multiScattering );
	#else
		computeMultiscattering( material.dfg, material.specularColor, material.specularF90, singleScattering, multiScattering );
	#endif
	vec3 diffuse = irradiance * BRDF_Lambert( material.diffuseContribution ) * ( 1.0 - singleScattering - multiScattering );
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		sheenSpecularIndirect += irradiance * material.sheenColor * sheenAlbedo * RECIPROCAL_PI;
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		diffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectDiffuse += diffuse;
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness ) * RECIPROCAL_PI;
 	#endif
	vec3 singleScatteringDielectric = vec3( 0.0 );
	vec3 multiScatteringDielectric = vec3( 0.0 );
	vec3 singleScatteringMetallic = vec3( 0.0 );
	vec3 multiScatteringMetallic = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( material.dfg, material.specularColor, material.specularF90, material.iridescence, material.iridescenceF0Dielectric, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscatteringIridescence( material.dfg, material.diffuseColor, material.specularF90, material.iridescence, material.iridescenceF0Metallic, singleScatteringMetallic, multiScatteringMetallic );
	#else
		computeMultiscattering( material.dfg, material.specularColor, material.specularF90, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscattering( material.dfg, material.diffuseColor, material.specularF90, singleScatteringMetallic, multiScatteringMetallic );
	#endif
	vec3 singleScattering = mix( singleScatteringDielectric, singleScatteringMetallic, material.metalness );
	vec3 multiScattering = mix( multiScatteringDielectric, multiScatteringMetallic, material.metalness );
	vec3 totalScatteringDielectric = singleScatteringDielectric + multiScatteringDielectric;
	vec3 diffuse = material.diffuseContribution * ( 1.0 - totalScatteringDielectric );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	vec3 indirectSpecular = radiance * singleScattering;
	indirectSpecular += multiScattering * cosineWeightedIrradiance;
	vec3 indirectDiffuse = diffuse * cosineWeightedIrradiance;
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		indirectSpecular *= sheenEnergyComp;
		indirectDiffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectSpecular += indirectSpecular;
	reflectedLight.indirectDiffuse += indirectDiffuse;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,Ep=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		vec3 iridescenceFresnelDielectric = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		vec3 iridescenceFresnelMetallic = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.diffuseColor );
		material.iridescenceFresnel = mix( iridescenceFresnelDielectric, iridescenceFresnelMetallic, material.metalness );
		material.iridescenceF0Dielectric = Schlick_to_F0( iridescenceFresnelDielectric, 1.0, dotNVi );
		material.iridescenceF0Metallic = Schlick_to_F0( iridescenceFresnelMetallic, 1.0, dotNVi );
	}
#endif
#ifdef STANDARD
	float dotNVms = saturate( dot( geometryNormal, geometryViewDir ) );
	material.dfg = texture2D( dfgLUT, vec2( material.roughness, dotNVms ) ).rg;
	#if ( NUM_SUN_LIGHTS > 0 || NUM_DIR_LIGHTS > 0 || NUM_POINT_LIGHTS > 0 || NUM_SPOT_LIGHTS > 0 )
		float EssMs = material.dfg.x + material.dfg.y;
		material.multiScatteringCompensation = 1.0 + material.specularColorBlended * ( 1.0 / EssMs - 1.0 );
	#endif
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS ) && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SUN_LIGHTS > 0 ) && defined( RE_Direct )
	SunLight sunLight;
	#if defined( USE_SHADOWMAP ) && NUM_SUN_LIGHT_SHADOWS > 0
	SunLightShadow sunLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SUN_LIGHTS; i ++ ) {
		sunLight = sunLights[ i ];
		getSunLightInfo( sunLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SUN_LIGHT_SHADOWS )
		sunLightShadow = sunLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getSunShadow( sunShadowMap[ i ], sunLightShadow, UNROLLED_LOOP_INDEX ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
	#ifdef USE_LIGHT_PROBES_GRID
		vec3 probeWorldPos = ( ( vec4( geometryPosition, 1.0 ) - viewMatrix[ 3 ] ) * viewMatrix ).xyz;
		vec3 probeWorldNormal = transformNormalByInverseViewMatrix( geometryNormal, viewMatrix );
		irradiance += getLightProbeGridIrradiance( probeWorldPos, probeWorldNormal );
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,Ap=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( ENVMAP_TYPE_CUBE_UV )
		#if defined( STANDARD ) || defined( LAMBERT ) || defined( PHONG )
			iblIrradiance += getIBLIrradiance( geometryNormal );
		#endif
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		vec3 iblRadiance = getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		vec3 iblRadiance = getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_RETROREFLECTION
		#ifdef USE_ANISOTROPY
			vec3 retroIBLRadiance = getIBLAnisotropyRetroRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
		#else
			vec3 retroIBLRadiance = getIBLRetroRadiance( geometryViewDir, geometryNormal, material.roughness );
		#endif
		iblRadiance = mix( iblRadiance, retroIBLRadiance, saturate( material.retroreflectivity ) );
	#endif
	radiance += iblRadiance;
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,Cp=`#if defined( RE_IndirectDiffuse )
	#if defined( LAMBERT ) || defined( PHONG )
		irradiance += iblIrradiance;
	#endif
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,Rp=`#ifdef USE_LIGHT_PROBES_GRID
uniform highp sampler3D probesSH;
uniform vec3 probesMin;
uniform vec3 probesMax;
uniform vec3 probesResolution;
vec3 getLightProbeGridIrradiance( vec3 worldPos, vec3 worldNormal ) {
	vec3 res = probesResolution;
	vec3 gridRange = probesMax - probesMin;
	vec3 resMinusOne = res - 1.0;
	vec3 probeSpacing = gridRange / resMinusOne;
	vec3 samplePos = worldPos + worldNormal * probeSpacing * 0.5;
	vec3 uvw = clamp( ( samplePos - probesMin ) / gridRange, 0.0, 1.0 );
	uvw = uvw * resMinusOne / res + 0.5 / res;
	float nz          = res.z;
	float paddedSlices = nz + 2.0;
	float atlasDepth  = 7.0 * paddedSlices;
	float uvZBase     = uvw.z * nz + 1.0;
	vec4 s0 = texture( probesSH, vec3( uvw.xy, ( uvZBase                       ) / atlasDepth ) );
	vec4 s1 = texture( probesSH, vec3( uvw.xy, ( uvZBase +       paddedSlices   ) / atlasDepth ) );
	vec4 s2 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 2.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s3 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 3.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s4 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 4.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s5 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 5.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s6 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 6.0 * paddedSlices   ) / atlasDepth ) );
	vec3 c0 = s0.xyz;
	vec3 c1 = vec3( s0.w, s1.xy );
	vec3 c2 = vec3( s1.zw, s2.x );
	vec3 c3 = s2.yzw;
	vec3 c4 = s3.xyz;
	vec3 c5 = vec3( s3.w, s4.xy );
	vec3 c6 = vec3( s4.zw, s5.x );
	vec3 c7 = s5.yzw;
	vec3 c8 = s6.xyz;
	float x = worldNormal.x, y = worldNormal.y, z = worldNormal.z;
	vec3 result = c0 * 0.886227;
	result += c1 * 2.0 * 0.511664 * y;
	result += c2 * 2.0 * 0.511664 * z;
	result += c3 * 2.0 * 0.511664 * x;
	result += c4 * 2.0 * 0.429043 * x * y;
	result += c5 * 2.0 * 0.429043 * y * z;
	result += c6 * ( 0.743125 * z * z - 0.247708 );
	result += c7 * 2.0 * 0.429043 * x * z;
	result += c8 * 0.429043 * ( x * x - y * y );
	return max( result, vec3( 0.0 ) );
}
#endif`,Ip=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,Pp=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Lp=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Np=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,Up=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,Dp=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,Op=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,Fp=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,Bp=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,zp=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,Gp=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,Vp=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,kp=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Hp=`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,Wp=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Xp=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#ifdef DOUBLE_SIDED
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#ifdef DOUBLE_SIDED
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,jp=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#if defined( USE_PACKED_NORMALMAP )
		mapN = vec3( mapN.xy, sqrt( saturate( 1.0 - dot( mapN.xy, mapN.xy ) ) ) );
	#endif
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,qp=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Yp=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Zp=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
		#ifdef FLIP_SIDED
			vBitangent = - vBitangent;
		#endif
	#endif
#endif`,Jp=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,Kp=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,$p=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,Qp=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,em=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,tm=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,im=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	#ifdef USE_REVERSED_DEPTH_BUFFER
	
		return depth * ( far - near ) - far;
	#else
		return depth * ( near - far ) - near;
	#endif
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	
	#ifdef USE_REVERSED_DEPTH_BUFFER
		return ( near * far ) / ( ( near - far ) * depth - near );
	#else
		return ( near * far ) / ( ( far - near ) * depth - far );
	#endif
}`,rm=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,sm=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,am=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,nm=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,om=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,lm=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,cm=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
		#define SUN_LIGHT_CASCADES 2
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow sunShadowMap[ NUM_SUN_LIGHT_SHADOWS ];
		#else
			uniform sampler2D sunShadowMap[ NUM_SUN_LIGHT_SHADOWS ];
		#endif
		uniform mat4 sunShadowMatrix[ NUM_SUN_LIGHT_SHADOWS * SUN_LIGHT_CASCADES ];
		uniform vec4 sunShadowCascade[ NUM_SUN_LIGHT_SHADOWS * SUN_LIGHT_CASCADES ];
		varying vec4 vSunShadowWorldPosition;
		varying vec3 vSunShadowWorldNormal;
		struct SunLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SunLightShadow sunLightShadows[ NUM_SUN_LIGHT_SHADOWS ];
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#else
			uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#endif
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#else
			uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#endif
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform samplerCubeShadow pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#elif defined( SHADOWMAP_TYPE_BASIC )
			uniform samplerCube pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#endif
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float interleavedGradientNoise( vec2 position ) {
			return fract( 52.9829189 * fract( dot( position, vec2( 0.06711056, 0.00583715 ) ) ) );
		}
		vec2 vogelDiskSample( int sampleIndex, int samplesCount, float phi ) {
			const float goldenAngle = 2.399963229728653;
			float r = sqrt( ( float( sampleIndex ) + 0.5 ) / float( samplesCount ) );
			float theta = float( sampleIndex ) * goldenAngle + phi;
			return vec2( cos( theta ), sin( theta ) ) * r;
		}
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float getShadow( sampler2DShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			shadowCoord.z += shadowBias;
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
				float radius = shadowRadius * texelSize.x;
				float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
				shadow = (
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 0, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 1, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 2, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 3, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 4, 5, phi ) * radius, shadowCoord.z ) )
				) * 0.2;
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#elif defined( SHADOWMAP_TYPE_VSM )
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 distribution = texture2D( shadowMap, shadowCoord.xy ).rg;
				float mean = distribution.x;
				float variance = distribution.y * distribution.y;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					float hard_shadow = step( mean, shadowCoord.z );
				#else
					float hard_shadow = step( shadowCoord.z, mean );
				#endif
				
				if ( hard_shadow == 1.0 ) {
					shadow = 1.0;
				} else {
					variance = max( variance, 0.0000001 );
					float d = shadowCoord.z - mean;
					float p_max = variance / ( variance + d * d );
					p_max = clamp( ( p_max - 0.3 ) / 0.65, 0.0, 1.0 );
					shadow = max( hard_shadow, p_max );
				}
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#else
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				float depth = texture2D( shadowMap, shadowCoord.xy ).r;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					shadow = step( depth, shadowCoord.z );
				#else
					shadow = step( shadowCoord.z, depth );
				#endif
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#endif
	#if NUM_SUN_LIGHT_SHADOWS > 0
		float getSunShadow(
			#if defined( SHADOWMAP_TYPE_PCF )
				sampler2DShadow shadowMap,
			#else
				sampler2D shadowMap,
			#endif
			SunLightShadow sunLightShadow,
			int shadowIndex
		) {
			vec4 shadowWorldPosition = vec4( vSunShadowWorldPosition.xyz + vSunShadowWorldNormal * sunLightShadow.shadowNormalBias, 1.0 );
			float viewDepth = vSunShadowWorldPosition.w;
			int cascadeOffset = shadowIndex * SUN_LIGHT_CASCADES;
			float shadow = 1.0;
			for ( int i = SUN_LIGHT_CASCADES - 1; i >= 0; i -- ) {
				vec4 cascade = sunShadowCascade[ cascadeOffset + i ];
				if ( viewDepth >= cascade.x && viewDepth < cascade.y ) {
					float cascadeShadow = getShadow(
						shadowMap,
						sunLightShadow.shadowMapSize,
						sunLightShadow.shadowIntensity,
						sunLightShadow.shadowBias,
						sunLightShadow.shadowRadius,
						sunShadowMatrix[ cascadeOffset + i ] * shadowWorldPosition
					);
					shadow = mix( cascadeShadow, shadow, smoothstep( cascade.z, cascade.y, viewDepth ) );
				}
			}
			return shadow;
		}
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	#if defined( SHADOWMAP_TYPE_PCF )
	float getPointShadow( samplerCubeShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 bd3D = normalize( lightToPosition );
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			#ifdef USE_REVERSED_DEPTH_BUFFER
				float dp = ( shadowCameraNear * ( shadowCameraFar - viewSpaceZ ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
				dp -= shadowBias;
			#else
				float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
				dp += shadowBias;
			#endif
			float texelSize = shadowRadius / shadowMapSize.x;
			vec3 absDir = abs( bd3D );
			vec3 tangent = absDir.x > absDir.z ? vec3( 0.0, 1.0, 0.0 ) : vec3( 1.0, 0.0, 0.0 );
			tangent = normalize( cross( bd3D, tangent ) );
			vec3 bitangent = cross( bd3D, tangent );
			float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
			vec2 sample0 = vogelDiskSample( 0, 5, phi );
			vec2 sample1 = vogelDiskSample( 1, 5, phi );
			vec2 sample2 = vogelDiskSample( 2, 5, phi );
			vec2 sample3 = vogelDiskSample( 3, 5, phi );
			vec2 sample4 = vogelDiskSample( 4, 5, phi );
			shadow = (
				texture( shadowMap, vec4( bd3D + ( tangent * sample0.x + bitangent * sample0.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample1.x + bitangent * sample1.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample2.x + bitangent * sample2.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample3.x + bitangent * sample3.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample4.x + bitangent * sample4.y ) * texelSize, dp ) )
			) * 0.2;
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#elif defined( SHADOWMAP_TYPE_BASIC )
	float getPointShadow( samplerCube shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			float depth = textureCube( shadowMap, bd3D ).r;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				depth = 1.0 - depth;
			#endif
			shadow = step( dp, depth );
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#endif
	#endif
#endif`,hm=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
		varying vec4 vSunShadowWorldPosition;
		varying vec3 vSunShadowWorldNormal;
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,um=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_SUN_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	#ifdef HAS_NORMAL
		vec3 shadowWorldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
	#else
		vec3 shadowWorldNormal = vec3( 0.0 );
	#endif
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_SUN_LIGHT_SHADOWS > 0
		vSunShadowWorldPosition = vec4( worldPosition.xyz, - mvPosition.z );
		vSunShadowWorldNormal = shadowWorldNormal;
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,dm=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
	SunLightShadow sunLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SUN_LIGHT_SHADOWS; i ++ ) {
		sunLight = sunLightShadows[ i ];
		shadow *= receiveShadow ? getSunShadow( sunShadowMap[ i ], sunLight, UNROLLED_LOOP_INDEX ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0 && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,pm=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,mm=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,fm=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,gm=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,_m=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,vm=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,xm=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,ym=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,Sm=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseContribution, material.specularColorBlended, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,Mm=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		#else
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,bm=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,Tm=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,wm=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,Em=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`,Am=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,Cm=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Rm=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Im=`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vWorldDirection );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Pm=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Lm=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Nm=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,Um=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	#ifdef USE_REVERSED_DEPTH_BUFFER
		float fragCoordZ = vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ];
	#else
		float fragCoordZ = 0.5 * vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ] + 0.5;
	#endif
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,Dm=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,Om=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = vec4( dist, 0.0, 0.0, 1.0 );
}`,Fm=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,Bm=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,zm=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,Gm=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,Vm=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,km=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Hm=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Wm=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Xm=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,jm=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,qm=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,Ym=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( normalize( normal ) * 0.5 + 0.5, diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,Zm=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Jm=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Km=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,$m=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_RETROREFLECTION
	uniform float retroreflectivity;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
 
		outgoingLight = outgoingLight + sheenSpecularDirect + sheenSpecularIndirect;
 
 	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Qm=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,ef=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,tf=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,rf=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,sf=`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,af=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,nf=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,of=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,Ze={alphahash_fragment:Ad,alphahash_pars_fragment:Cd,alphamap_fragment:Rd,alphamap_pars_fragment:Id,alphatest_fragment:Pd,alphatest_pars_fragment:Ld,aomap_fragment:Nd,aomap_pars_fragment:Ud,batching_pars_vertex:Dd,batching_vertex:Od,begin_vertex:Fd,beginnormal_vertex:Bd,bsdfs:zd,iridescence_fragment:Gd,bumpmap_pars_fragment:Vd,clipping_planes_fragment:kd,clipping_planes_pars_fragment:Hd,clipping_planes_pars_vertex:Wd,clipping_planes_vertex:Xd,color_fragment:jd,color_pars_fragment:qd,color_pars_vertex:Yd,color_vertex:Zd,common:Jd,cube_uv_reflection_fragment:Kd,defaultnormal_vertex:$d,displacementmap_pars_vertex:Qd,displacementmap_vertex:ep,emissivemap_fragment:tp,emissivemap_pars_fragment:ip,colorspace_fragment:rp,colorspace_pars_fragment:sp,envmap_fragment:ap,envmap_common_pars_fragment:np,envmap_pars_fragment:op,envmap_pars_vertex:lp,envmap_physical_pars_fragment:xp,envmap_vertex:cp,fog_vertex:hp,fog_pars_vertex:up,fog_fragment:dp,fog_pars_fragment:pp,gradientmap_pars_fragment:mp,lightmap_pars_fragment:fp,lights_lambert_fragment:gp,lights_lambert_pars_fragment:_p,lights_pars_begin:vp,lights_toon_fragment:yp,lights_toon_pars_fragment:Sp,lights_phong_fragment:Mp,lights_phong_pars_fragment:bp,lights_physical_fragment:Tp,lights_physical_pars_fragment:wp,lights_fragment_begin:Ep,lights_fragment_maps:Ap,lights_fragment_end:Cp,lightprobes_pars_fragment:Rp,logdepthbuf_fragment:Ip,logdepthbuf_pars_fragment:Pp,logdepthbuf_pars_vertex:Lp,logdepthbuf_vertex:Np,map_fragment:Up,map_pars_fragment:Dp,map_particle_fragment:Op,map_particle_pars_fragment:Fp,metalnessmap_fragment:Bp,metalnessmap_pars_fragment:zp,morphinstance_vertex:Gp,morphcolor_vertex:Vp,morphnormal_vertex:kp,morphtarget_pars_vertex:Hp,morphtarget_vertex:Wp,normal_fragment_begin:Xp,normal_fragment_maps:jp,normal_pars_fragment:qp,normal_pars_vertex:Yp,normal_vertex:Zp,normalmap_pars_fragment:Jp,clearcoat_normal_fragment_begin:Kp,clearcoat_normal_fragment_maps:$p,clearcoat_pars_fragment:Qp,iridescence_pars_fragment:em,opaque_fragment:tm,packing:im,premultiplied_alpha_fragment:rm,project_vertex:sm,dithering_fragment:am,dithering_pars_fragment:nm,roughnessmap_fragment:om,roughnessmap_pars_fragment:lm,shadowmap_pars_fragment:cm,shadowmap_pars_vertex:hm,shadowmap_vertex:um,shadowmask_pars_fragment:dm,skinbase_vertex:pm,skinning_pars_vertex:mm,skinning_vertex:fm,skinnormal_vertex:gm,specularmap_fragment:_m,specularmap_pars_fragment:vm,tonemapping_fragment:xm,tonemapping_pars_fragment:ym,transmission_fragment:Sm,transmission_pars_fragment:Mm,uv_pars_fragment:bm,uv_pars_vertex:Tm,uv_vertex:wm,worldpos_vertex:Em,background_vert:Am,background_frag:Cm,backgroundCube_vert:Rm,backgroundCube_frag:Im,cube_vert:Pm,cube_frag:Lm,depth_vert:Nm,depth_frag:Um,distance_vert:Dm,distance_frag:Om,equirect_vert:Fm,equirect_frag:Bm,linedashed_vert:zm,linedashed_frag:Gm,meshbasic_vert:Vm,meshbasic_frag:km,meshlambert_vert:Hm,meshlambert_frag:Wm,meshmatcap_vert:Xm,meshmatcap_frag:jm,meshnormal_vert:qm,meshnormal_frag:Ym,meshphong_vert:Zm,meshphong_frag:Jm,meshphysical_vert:Km,meshphysical_frag:$m,meshtoon_vert:Qm,meshtoon_frag:ef,points_vert:tf,points_frag:rf,shadow_vert:sf,shadow_frag:af,sprite_vert:nf,sprite_frag:of},me={common:{diffuse:{value:new He(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new ke},alphaMap:{value:null},alphaMapTransform:{value:new ke},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new ke}},envmap:{envMap:{value:null},envMapRotation:{value:new ke},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new ke}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new ke}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new ke},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new ke},normalScale:{value:new ae(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new ke},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new ke}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new ke}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new ke}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new He(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},sunLights:{value:[],properties:{direction:{},color:{}}},sunLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},sunShadowMatrix:{value:[]},sunShadowCascade:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null},probesSH:{value:null},probesMin:{value:new R},probesMax:{value:new R},probesResolution:{value:new R}},points:{diffuse:{value:new He(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new ke},alphaTest:{value:0},uvTransform:{value:new ke}},sprite:{diffuse:{value:new He(16777215)},opacity:{value:1},center:{value:new ae(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new ke},alphaMap:{value:null},alphaMapTransform:{value:new ke},alphaTest:{value:0}}},gi={basic:{uniforms:Rt([me.common,me.specularmap,me.envmap,me.aomap,me.lightmap,me.fog]),vertexShader:Ze.meshbasic_vert,fragmentShader:Ze.meshbasic_frag},lambert:{uniforms:Rt([me.common,me.specularmap,me.envmap,me.aomap,me.lightmap,me.emissivemap,me.bumpmap,me.normalmap,me.displacementmap,me.fog,me.lights,{emissive:{value:new He(0)},envMapIntensity:{value:1}}]),vertexShader:Ze.meshlambert_vert,fragmentShader:Ze.meshlambert_frag},phong:{uniforms:Rt([me.common,me.specularmap,me.envmap,me.aomap,me.lightmap,me.emissivemap,me.bumpmap,me.normalmap,me.displacementmap,me.fog,me.lights,{emissive:{value:new He(0)},specular:{value:new He(1118481)},shininess:{value:30},envMapIntensity:{value:1}}]),vertexShader:Ze.meshphong_vert,fragmentShader:Ze.meshphong_frag},standard:{uniforms:Rt([me.common,me.envmap,me.aomap,me.lightmap,me.emissivemap,me.bumpmap,me.normalmap,me.displacementmap,me.roughnessmap,me.metalnessmap,me.fog,me.lights,{emissive:{value:new He(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:Ze.meshphysical_vert,fragmentShader:Ze.meshphysical_frag},toon:{uniforms:Rt([me.common,me.aomap,me.lightmap,me.emissivemap,me.bumpmap,me.normalmap,me.displacementmap,me.gradientmap,me.fog,me.lights,{emissive:{value:new He(0)}}]),vertexShader:Ze.meshtoon_vert,fragmentShader:Ze.meshtoon_frag},matcap:{uniforms:Rt([me.common,me.bumpmap,me.normalmap,me.displacementmap,me.fog,{matcap:{value:null}}]),vertexShader:Ze.meshmatcap_vert,fragmentShader:Ze.meshmatcap_frag},points:{uniforms:Rt([me.points,me.fog]),vertexShader:Ze.points_vert,fragmentShader:Ze.points_frag},dashed:{uniforms:Rt([me.common,me.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:Ze.linedashed_vert,fragmentShader:Ze.linedashed_frag},depth:{uniforms:Rt([me.common,me.displacementmap]),vertexShader:Ze.depth_vert,fragmentShader:Ze.depth_frag},normal:{uniforms:Rt([me.common,me.bumpmap,me.normalmap,me.displacementmap,{opacity:{value:1}}]),vertexShader:Ze.meshnormal_vert,fragmentShader:Ze.meshnormal_frag},sprite:{uniforms:Rt([me.sprite,me.fog]),vertexShader:Ze.sprite_vert,fragmentShader:Ze.sprite_frag},background:{uniforms:{uvTransform:{value:new ke},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:Ze.background_vert,fragmentShader:Ze.background_frag},backgroundCube:{uniforms:{envMap:{value:null},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new ke}},vertexShader:Ze.backgroundCube_vert,fragmentShader:Ze.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:Ze.cube_vert,fragmentShader:Ze.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:Ze.equirect_vert,fragmentShader:Ze.equirect_frag},distance:{uniforms:Rt([me.common,me.displacementmap,{referencePosition:{value:new R},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:Ze.distance_vert,fragmentShader:Ze.distance_frag},shadow:{uniforms:Rt([me.lights,me.fog,{color:{value:new He(0)},opacity:{value:1}}]),vertexShader:Ze.shadow_vert,fragmentShader:Ze.shadow_frag}};gi.physical={uniforms:Rt([gi.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new ke},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new ke},clearcoatNormalScale:{value:new ae(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new ke},dispersion:{value:0},retroreflectivity:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new ke},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new ke},sheen:{value:0},sheenColor:{value:new He(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new ke},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new ke},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new ke},transmissionSamplerSize:{value:new ae},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new ke},attenuationDistance:{value:0},attenuationColor:{value:new He(0)},specularColor:{value:new He(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new ke},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new ke},anisotropyVector:{value:new ae},anisotropyMap:{value:null},anisotropyMapTransform:{value:new ke}}]),vertexShader:Ze.meshphysical_vert,fragmentShader:Ze.meshphysical_frag};var po={r:0,b:0,g:0},lf=new Xe,ru=new ke;ru.set(-1,0,0,0,1,0,0,0,1);function cf(r,e,t,i,s,a){let n=new He(0),o=s===!0?0:1,l,c,h=null,m=0,u=null;function d(y){let E=y.isScene===!0?y.background:null;if(E&&E.isTexture){let x=y.backgroundBlurriness>0;E=e.get(E,x)}return E}function g(y){let E=!1,x=d(y);x===null?f(n,o):x&&x.isColor&&(f(x,1),E=!0);let T=r.xr.getEnvironmentBlendMode();T==="additive"?t.buffers.color.setClear(0,0,0,1,a):T==="alpha-blend"&&t.buffers.color.setClear(0,0,0,0,a),(r.autoClear||E)&&(t.buffers.depth.setTest(!0),t.buffers.depth.setMask(!0),t.buffers.color.setMask(!0),r.clear(r.autoClearColor,r.autoClearDepth,r.autoClearStencil))}function S(y,E){let x=d(E);x&&(x.isCubeTexture||x.mapping===Ps)?(c===void 0&&(c=new Et(new Ci(1,1,1),new kt({name:"BackgroundCubeMaterial",uniforms:or(gi.backgroundCube.uniforms),vertexShader:gi.backgroundCube.vertexShader,fragmentShader:gi.backgroundCube.fragmentShader,side:Pt,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),c.geometry.deleteAttribute("normal"),c.geometry.deleteAttribute("uv"),c.onBeforeRender=function(T,b,A){this.matrixWorld.copyPosition(A.matrixWorld)},Object.defineProperty(c.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),i.update(c)),c.material.uniforms.envMap.value=x,c.material.uniforms.backgroundBlurriness.value=E.backgroundBlurriness,c.material.uniforms.backgroundIntensity.value=E.backgroundIntensity,c.material.uniforms.backgroundRotation.value.setFromMatrix4(lf.makeRotationFromEuler(E.backgroundRotation)).transpose(),x.isCubeTexture&&x.isRenderTargetTexture===!1&&c.material.uniforms.backgroundRotation.value.premultiply(ru),c.material.toneMapped=et.getTransfer(x.colorSpace)!==st,(h!==x||m!==x.version||u!==r.toneMapping)&&(c.material.needsUpdate=!0,h=x,m=x.version,u=r.toneMapping),c.layers.enableAll(),y.unshift(c,c.geometry,c.material,0,0,null)):x&&x.isTexture&&(l===void 0&&(l=new Et(new Dr(2,2),new kt({name:"BackgroundMaterial",uniforms:or(gi.background.uniforms),vertexShader:gi.background.vertexShader,fragmentShader:gi.background.fragmentShader,side:Hi,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),l.geometry.deleteAttribute("normal"),Object.defineProperty(l.material,"map",{get:function(){return this.uniforms.t2D.value}}),i.update(l)),l.material.uniforms.t2D.value=x,l.material.uniforms.backgroundIntensity.value=E.backgroundIntensity,l.material.toneMapped=et.getTransfer(x.colorSpace)!==st,x.matrixAutoUpdate===!0&&x.updateMatrix(),l.material.uniforms.uvTransform.value.copy(x.matrix),(h!==x||m!==x.version||u!==r.toneMapping)&&(l.material.needsUpdate=!0,h=x,m=x.version,u=r.toneMapping),l.layers.enableAll(),y.unshift(l,l.geometry,l.material,0,0,null))}function f(y,E){y.getRGB(po,Il(r)),t.buffers.color.setClear(po.r,po.g,po.b,E,a)}function p(){c!==void 0&&(c.geometry.dispose(),c.material.dispose(),c=void 0),l!==void 0&&(l.geometry.dispose(),l.material.dispose(),l=void 0)}return{getClearColor:function(){return n},setClearColor:function(y,E=1){n.set(y),o=E,f(n,o)},getClearAlpha:function(){return o},setClearAlpha:function(y){o=y,f(n,o)},render:g,addToRenderList:S,dispose:p}}function hf(r,e){let t=r.getParameter(r.MAX_VERTEX_ATTRIBS),i={},s=u(null),a=s,n=!1;function o(L,U,V,P,H){let Y=!1,z=m(L,P,V,U);a!==z&&(a=z,c(a.object)),Y=d(L,P,V,H),Y&&g(L,P,V,H),H!==null&&e.update(H,r.ELEMENT_ARRAY_BUFFER),(Y||n)&&(n=!1,x(L,U,V,P),H!==null&&r.bindBuffer(r.ELEMENT_ARRAY_BUFFER,e.get(H).buffer))}function l(){return r.createVertexArray()}function c(L){return r.bindVertexArray(L)}function h(L){return r.deleteVertexArray(L)}function m(L,U,V,P){let H=P.wireframe===!0,Y=i[U.id];Y===void 0&&(Y={},i[U.id]=Y);let z=L.isInstancedMesh===!0?L.id:0,J=Y[z];J===void 0&&(J={},Y[z]=J);let X=J[V.id];X===void 0&&(X={},J[V.id]=X);let Z=X[H];return Z===void 0&&(Z=u(l()),X[H]=Z),Z}function u(L){let U=[],V=[],P=[];for(let H=0;H<t;H++)U[H]=0,V[H]=0,P[H]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:U,enabledAttributes:V,attributeDivisors:P,object:L,attributes:{},index:null}}function d(L,U,V,P){let H=a.attributes,Y=U.attributes,z=0,J=V.getAttributes();for(let X in J)if(J[X].location>=0){let Z=H[X],Q=Y[X];if(Q===void 0&&(X==="instanceMatrix"&&L.instanceMatrix&&(Q=L.instanceMatrix),X==="instanceColor"&&L.instanceColor&&(Q=L.instanceColor)),Z===void 0||Z.attribute!==Q||Q&&Z.data!==Q.data)return!0;z++}return a.attributesNum!==z||a.index!==P}function g(L,U,V,P){let H={},Y=U.attributes,z=0,J=V.getAttributes();for(let X in J)if(J[X].location>=0){let Z=Y[X];Z===void 0&&(X==="instanceMatrix"&&L.instanceMatrix&&(Z=L.instanceMatrix),X==="instanceColor"&&L.instanceColor&&(Z=L.instanceColor));let Q={};Q.attribute=Z,Z&&Z.data&&(Q.data=Z.data),H[X]=Q,z++}a.attributes=H,a.attributesNum=z,a.index=P}function S(){let L=a.newAttributes;for(let U=0,V=L.length;U<V;U++)L[U]=0}function f(L){p(L,0)}function p(L,U){let V=a.newAttributes,P=a.enabledAttributes,H=a.attributeDivisors;V[L]=1,P[L]===0&&(r.enableVertexAttribArray(L),P[L]=1),H[L]!==U&&(r.vertexAttribDivisor(L,U),H[L]=U)}function y(){let L=a.newAttributes,U=a.enabledAttributes;for(let V=0,P=U.length;V<P;V++)U[V]!==L[V]&&(r.disableVertexAttribArray(V),U[V]=0)}function E(L,U,V,P,H,Y,z){z===!0?r.vertexAttribIPointer(L,U,V,H,Y):r.vertexAttribPointer(L,U,V,P,H,Y)}function x(L,U,V,P){S();let H=P.attributes,Y=V.getAttributes(),z=U.defaultAttributeValues;for(let J in Y){let X=Y[J];if(X.location>=0){let Z=H[J];if(Z===void 0&&(J==="instanceMatrix"&&L.instanceMatrix&&(Z=L.instanceMatrix),J==="instanceColor"&&L.instanceColor&&(Z=L.instanceColor)),Z!==void 0){let Q=Z.normalized,Le=Z.itemSize,fe=e.get(Z);if(fe===void 0)continue;let qe=fe.buffer,Qe=fe.type,it=fe.bytesPerElement,K=Qe===r.INT||Qe===r.UNSIGNED_INT||Z.gpuType===An;if(Z.isInterleavedBufferAttribute){let $=Z.data,ye=$.stride,Be=Z.offset;if($.isInstancedInterleavedBuffer){for(let pe=0;pe<X.locationSize;pe++)p(X.location+pe,$.meshPerAttribute);L.isInstancedMesh!==!0&&P._maxInstanceCount===void 0&&(P._maxInstanceCount=$.meshPerAttribute*$.count)}else for(let pe=0;pe<X.locationSize;pe++)f(X.location+pe);r.bindBuffer(r.ARRAY_BUFFER,qe);for(let pe=0;pe<X.locationSize;pe++)E(X.location+pe,Le/X.locationSize,Qe,Q,ye*it,(Be+Le/X.locationSize*pe)*it,K)}else{if(Z.isInstancedBufferAttribute){for(let $=0;$<X.locationSize;$++)p(X.location+$,Z.meshPerAttribute);L.isInstancedMesh!==!0&&P._maxInstanceCount===void 0&&(P._maxInstanceCount=Z.meshPerAttribute*Z.count)}else for(let $=0;$<X.locationSize;$++)f(X.location+$);r.bindBuffer(r.ARRAY_BUFFER,qe);for(let $=0;$<X.locationSize;$++)E(X.location+$,Le/X.locationSize,Qe,Q,Le*it,Le/X.locationSize*$*it,K)}}else if(z!==void 0){let Q=z[J];if(Q!==void 0)switch(Q.length){case 2:r.vertexAttrib2fv(X.location,Q);break;case 3:r.vertexAttrib3fv(X.location,Q);break;case 4:r.vertexAttrib4fv(X.location,Q);break;default:r.vertexAttrib1fv(X.location,Q)}}}}y()}function T(){w();for(let L in i){let U=i[L];for(let V in U){let P=U[V];for(let H in P){let Y=P[H];for(let z in Y)h(Y[z].object),delete Y[z];delete P[H]}}delete i[L]}}function b(L){if(i[L.id]===void 0)return;let U=i[L.id];for(let V in U){let P=U[V];for(let H in P){let Y=P[H];for(let z in Y)h(Y[z].object),delete Y[z];delete P[H]}}delete i[L.id]}function A(L){for(let U in i){let V=i[U];for(let P in V){let H=V[P];if(H[L.id]===void 0)continue;let Y=H[L.id];for(let z in Y)h(Y[z].object),delete Y[z];delete H[L.id]}}}function _(L){for(let U in i){let V=i[U],P=L.isInstancedMesh===!0?L.id:0,H=V[P];if(H!==void 0){for(let Y in H){let z=H[Y];for(let J in z)h(z[J].object),delete z[J];delete H[Y]}delete V[P],Object.keys(V).length===0&&delete i[U]}}}function w(){I(),n=!0,a!==s&&(a=s,c(a.object))}function I(){s.geometry=null,s.program=null,s.wireframe=!1}return{setup:o,reset:w,resetDefaultState:I,dispose:T,releaseStatesOfGeometry:b,releaseStatesOfObject:_,releaseStatesOfProgram:A,initAttributes:S,enableAttribute:f,disableUnusedAttributes:y}}function uf(r,e,t){let i;function s(l){i=l}function a(l,c){r.drawArrays(i,l,c),t.update(c,i,1)}function n(l,c,h){h!==0&&(r.drawArraysInstanced(i,l,c,h),t.update(c,i,h))}function o(l,c,h){if(h===0)return;e.get("WEBGL_multi_draw").multiDrawArraysWEBGL(i,l,0,c,0,h);let m=0;for(let u=0;u<h;u++)m+=c[u];t.update(m,i,1)}this.setMode=s,this.render=a,this.renderInstances=n,this.renderMultiDraw=o}function df(r,e,t,i){let s;function a(){if(s!==void 0)return s;if(e.has("EXT_texture_filter_anisotropic")===!0){let A=e.get("EXT_texture_filter_anisotropic");s=r.getParameter(A.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else s=0;return s}function n(A){return!(A!==Yt&&i.convert(A)!==r.getParameter(r.IMPLEMENTATION_COLOR_READ_FORMAT))}function o(A){let _=A===ai&&(e.has("EXT_color_buffer_half_float")||e.has("EXT_color_buffer_float"));return!(A!==Ot&&A!==si&&!_&&i.convert(A)!==r.getParameter(r.IMPLEMENTATION_COLOR_READ_TYPE))}function l(A){if(A==="highp"){if(r.getShaderPrecisionFormat(r.VERTEX_SHADER,r.HIGH_FLOAT).precision>0&&r.getShaderPrecisionFormat(r.FRAGMENT_SHADER,r.HIGH_FLOAT).precision>0)return"highp";A="mediump"}return A==="mediump"&&r.getShaderPrecisionFormat(r.VERTEX_SHADER,r.MEDIUM_FLOAT).precision>0&&r.getShaderPrecisionFormat(r.FRAGMENT_SHADER,r.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let c=t.precision!==void 0?t.precision:"highp",h=l(c);h!==c&&(Ue("WebGLRenderer:",c,"not supported, using",h,"instead."),c=h);let m=t.logarithmicDepthBuffer===!0,u=t.reversedDepthBuffer===!0&&e.has("EXT_clip_control");t.reversedDepthBuffer===!0&&u===!1&&Ue("WebGLRenderer: Unable to use reversed depth buffer due to missing EXT_clip_control extension. Fallback to default depth buffer.");let d=r.getParameter(r.MAX_TEXTURE_IMAGE_UNITS),g=r.getParameter(r.MAX_VERTEX_TEXTURE_IMAGE_UNITS),S=r.getParameter(r.MAX_TEXTURE_SIZE),f=r.getParameter(r.MAX_CUBE_MAP_TEXTURE_SIZE),p=r.getParameter(r.MAX_VERTEX_ATTRIBS),y=r.getParameter(r.MAX_VERTEX_UNIFORM_VECTORS),E=r.getParameter(r.MAX_VARYING_VECTORS),x=r.getParameter(r.MAX_FRAGMENT_UNIFORM_VECTORS),T=r.getParameter(r.MAX_SAMPLES),b=r.getParameter(r.SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:a,getMaxPrecision:l,textureFormatReadable:n,textureTypeReadable:o,precision:c,logarithmicDepthBuffer:m,reversedDepthBuffer:u,maxTextures:d,maxVertexTextures:g,maxTextureSize:S,maxCubemapSize:f,maxAttributes:p,maxVertexUniforms:y,maxVaryings:E,maxFragmentUniforms:x,maxSamples:T,samples:b}}function pf(r){let e=this,t=null,i=0,s=!1,a=!1,n=new Qt,o=new ke,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(m,u){let d=m.length!==0||u||i!==0||s;return s=u,i=m.length,d},this.beginShadows=function(){a=!0,h(null)},this.endShadows=function(){a=!1},this.setGlobalState=function(m,u){t=h(m,u,0)},this.setState=function(m,u,d){let g=m.clippingPlanes,S=m.clipIntersection,f=m.clipShadows,p=r.get(m);if(!s||g===null||g.length===0||a&&!f)a?h(null):c();else{let y=a?0:i,E=y*4,x=p.clippingState||null;l.value=x,x=h(g,u,E,d);for(let T=0;T!==E;++T)x[T]=t[T];p.clippingState=x,this.numIntersection=S?this.numPlanes:0,this.numPlanes+=y}};function c(){l.value!==t&&(l.value=t,l.needsUpdate=i>0),e.numPlanes=i,e.numIntersection=0}function h(m,u,d,g){let S=m!==null?m.length:0,f=null;if(S!==0){if(f=l.value,g!==!0||f===null){let p=d+S*4,y=u.matrixWorldInverse;o.getNormalMatrix(y),(f===null||f.length<p)&&(f=new Float32Array(p));for(let E=0,x=d;E!==S;++E,x+=4)n.copy(m[E]).applyMatrix4(y,o),n.normal.toArray(f,x),f[x+3]=n.constant}l.value=f,l.needsUpdate=!0}return e.numPlanes=S,e.numIntersection=0,f}}var Hr=4,mf=6,ff=20,gf=256,zs=new ki,Dh=new He,zl=null,Gl=0,Vl=0,kl=!1,_f=new R,lr=new R,fo=class{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._sizeLods=[],this._lodMeshes=[],this._backgroundBox=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._blurMaterial=null,this._ggxMaterial=null}fromScene(e,t=0,i=.1,s=100,a={}){let{size:n=256,position:o=_f}=a;zl=this._renderer.getRenderTarget(),Gl=this._renderer.getActiveCubeFace(),Vl=this._renderer.getActiveMipmapLevel(),kl=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(n);let l=this._allocateTargets();return l.depthBuffer=!0,this._sceneToCubeUV(e,i,s,l,o),t>0&&this._blur(l,0,0,t),this._applyPMREM(l),this._cleanup(l),l}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=Bh(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=Fh(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose(),this._backgroundBox!==null&&(this._backgroundBox.geometry.dispose(),this._backgroundBox.material.dispose())}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._ggxMaterial!==null&&this._ggxMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodMeshes.length;e++)this._lodMeshes[e].geometry.dispose()}_cleanup(e){this._renderer.setRenderTarget(zl,Gl,Vl),this._renderer.xr.enabled=kl,e.scissorTest=!1,kr(e,0,0,e.width,e.height)}_fromTexture(e,t){e.mapping===Wi||e.mapping===nr?this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4),zl=this._renderer.getRenderTarget(),Gl=this._renderer.getActiveCubeFace(),Vl=this._renderer.getActiveMipmapLevel(),kl=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;let i=t||this._allocateTargets();return this._textureToCubeUV(e,i),this._applyPMREM(i),this._cleanup(i),i}_allocateTargets(){let e=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,i={magFilter:wt,minFilter:wt,generateMipmaps:!1,type:ai,format:Yt,colorSpace:rs,depthBuffer:!1},s=Oh(e,t,i);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e||this._pingPongRenderTarget.height!==t){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=Oh(e,t,i);let{_lodMax:a}=this;({lodMeshes:this._lodMeshes,sizeLods:this._sizeLods}=vf(a)),this._blurMaterial=yf(a,e,t),this._ggxMaterial=xf(a,e,t)}return s}_compileMaterial(e){let t=new Et(new ct,e);this._renderer.compile(t,zs)}_sceneToCubeUV(e,t,i,s,a){let n=new Nt(90,1,t,i),o=[1,-1,1,1,1,1],l=[1,1,1,-1,-1,-1],c=this._renderer,h=c.autoClear,m=c.toneMapping;c.getClearColor(Dh),c.toneMapping=ii,c.autoClear=!1,c.state.buffers.depth.getReversed()&&(c.setRenderTarget(s),c.clearDepth(),c.setRenderTarget(null)),this._backgroundBox===null&&(this._backgroundBox=new Et(new Ci,new ir({name:"PMREM.Background",side:Pt,depthWrite:!1,depthTest:!1})));let u=this._backgroundBox,d=u.material,g=!1,S=e.background;S?S.isColor&&(d.color.copy(S),e.background=null,g=!0):(d.color.copy(Dh),g=!0);for(let f=0;f<6;f++){let p=f%3;p===0?(n.up.set(0,o[f],0),n.position.set(a.x,a.y,a.z),n.lookAt(a.x+l[f],a.y,a.z)):p===1?(n.up.set(0,0,o[f]),n.position.set(a.x,a.y,a.z),n.lookAt(a.x,a.y+l[f],a.z)):(n.up.set(0,o[f],0),n.position.set(a.x,a.y,a.z),n.lookAt(a.x,a.y,a.z+l[f]));let y=this._cubeSize;kr(s,p*y,f>2?y:0,y,y),c.setRenderTarget(s),g&&c.render(u,n),c.render(e,n)}c.toneMapping=m,c.autoClear=h,e.background=S}_textureToCubeUV(e,t){let i=this._renderer,s=e.mapping===Wi||e.mapping===nr;s?(this._cubemapMaterial===null&&(this._cubemapMaterial=Bh()),this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=Fh());let a=s?this._cubemapMaterial:this._equirectMaterial,n=this._lodMeshes[0];n.material=a;let o=a.uniforms;o.envMap.value=e;let l=this._cubeSize;kr(t,0,0,3*l,2*l),i.setRenderTarget(t),i.render(n,zs)}_applyPMREM(e){let t=this._renderer,i=t.autoClear;t.autoClear=!1;let s=this._lodMeshes.length;for(let a=1;a<s;a++)this._applyGGXFilter(e,a-1,a);t.autoClear=i}_applyGGXFilter(e,t,i){let s=this._renderer,a=this._pingPongRenderTarget,n=this._ggxMaterial,o=this._lodMeshes[i];o.material=n;let l=n.uniforms,c=i/(this._lodMeshes.length-1),h=t/(this._lodMeshes.length-1),m=Math.sqrt(c*c-h*h),u=c*1.25,d=m*u,{_lodMax:g}=this,S=this._sizeLods[i],f=3*S*(i>g-Hr?i-g+Hr:0),p=4*(this._cubeSize-S);l.envMap.value=e.texture,l.roughness.value=d,l.mipInt.value=g-t,kr(a,f,p,3*S,2*S),s.setRenderTarget(a),s.render(o,zs),l.envMap.value=a.texture,l.roughness.value=0,l.mipInt.value=g-i,kr(e,f,p,3*S,2*S),s.setRenderTarget(e),s.render(o,zs)}_blur(e,t,i,s){let a=this._pingPongRenderTarget,n=Math.min(s,Math.PI)/Math.SQRT2;this._blurPass(e,a,t,i,n),this._blurPass(a,e,i,i,n)}_blurPass(e,t,i,s,a){let n=this._renderer,o=this._blurMaterial,l=this._lodMeshes[s];l.material=o;let c=o.uniforms;c.envMap.value=e.texture,c.sigma.value=a,c.mipInt.value=this._lodMax-i;let h=this._sizeLods[s],m=3*h*(s>this._lodMax-Hr?s-this._lodMax+Hr:0),u=4*(this._cubeSize-h);kr(t,m,u,3*h,2*h),n.setRenderTarget(t),n.render(l,zs)}};function vf(r){let e=[],t=[],i=r,s=r-Hr+1+mf;for(let a=0;a<s;a++){let n=Math.pow(2,i);e.push(n);let o=1/(n-2),l=-o,c=1+o,h=[l,l,c,l,c,c,l,l,c,c,l,c],m=6,u=6,d=3,g=new Float32Array(d*u*m),S=new Float32Array(d*u*m);for(let p=0;p<m;p++){let y=p%3*2/3-1,E=p>2?0:-1,x=[y,E,0,y+2/3,E,0,y+2/3,E+1,0,y,E,0,y+2/3,E+1,0,y,E+1,0];g.set(x,d*u*p);for(let T=0;T<u;T++){let b=h[T*2]*2-1,A=h[T*2+1]*2-1;p===0?lr.set(1,A,b):p===1?lr.set(-b,1,-A):p===2?lr.set(-b,A,1):p===3?lr.set(-1,A,-b):p===4?lr.set(-b,-1,A):lr.set(b,A,-1),lr.toArray(S,(p*u+T)*d)}}let f=new ct;f.setAttribute("position",new jt(g,d)),f.setAttribute("outputDirection",new jt(S,d)),t.push(new Et(f,null)),i>Hr&&i--}return{lodMeshes:t,sizeLods:e}}function Oh(r,e,t){let i=new Dt(r,e,t);return i.texture.mapping=Ps,i.texture.name="PMREM.cubeUv",i.scissorTest=!0,i}function kr(r,e,t,i,s){r.viewport.set(e,t,i,s),r.scissor.set(e,t,i,s)}function xf(r,e,t){return new kt({name:"PMREMGGXConvolution",defines:{GGX_SAMPLES:gf,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${r}.0`},uniforms:{envMap:{value:null},roughness:{value:0},mipInt:{value:0}},vertexShader:vo(),fragmentShader:`

			precision highp float;
			precision highp int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform float roughness;
			uniform float mipInt;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			#define PI 3.14159265359

			// Van der Corput radical inverse
			float radicalInverse_VdC(uint bits) {
				bits = (bits << 16u) | (bits >> 16u);
				bits = ((bits & 0x55555555u) << 1u) | ((bits & 0xAAAAAAAAu) >> 1u);
				bits = ((bits & 0x33333333u) << 2u) | ((bits & 0xCCCCCCCCu) >> 2u);
				bits = ((bits & 0x0F0F0F0Fu) << 4u) | ((bits & 0xF0F0F0F0u) >> 4u);
				bits = ((bits & 0x00FF00FFu) << 8u) | ((bits & 0xFF00FF00u) >> 8u);
				return float(bits) * 2.3283064365386963e-10; // / 0x100000000
			}

			// Hammersley sequence
			vec2 hammersley(uint i, uint N) {
				return vec2(float(i) / float(N), radicalInverse_VdC(i));
			}

			// GGX VNDF importance sampling (Eric Heitz 2018)
			// "Sampling the GGX Distribution of Visible Normals"
			// https://jcgt.org/published/0007/04/01/
			vec3 importanceSampleGGX_VNDF(vec2 Xi, vec3 V, float roughness) {
				float alpha = roughness * roughness;

				// Section 4.1: Orthonormal basis
				vec3 T1 = vec3(1.0, 0.0, 0.0);
				vec3 T2 = cross(V, T1);

				// Section 4.2: Parameterization of projected area
				float r = sqrt(Xi.x);
				float phi = 2.0 * PI * Xi.y;
				float t1 = r * cos(phi);
				float t2 = r * sin(phi);
				float s = 0.5 * (1.0 + V.z);
				t2 = (1.0 - s) * sqrt(1.0 - t1 * t1) + s * t2;

				// Section 4.3: Reprojection onto hemisphere
				vec3 Nh = t1 * T1 + t2 * T2 + sqrt(max(0.0, 1.0 - t1 * t1 - t2 * t2)) * V;

				// Section 3.4: Transform back to ellipsoid configuration
				return normalize(vec3(alpha * Nh.x, alpha * Nh.y, max(0.0, Nh.z)));
			}

			void main() {
				vec3 N = normalize(vOutputDirection);
				vec3 V = N; // Assume view direction equals normal for pre-filtering

				vec3 prefilteredColor = vec3(0.0);
				float totalWeight = 0.0;

				// For very low roughness, just sample the environment directly
				if (roughness < 0.001) {
					gl_FragColor = vec4(bilinearCubeUV(envMap, N, mipInt), 1.0);
					return;
				}

				// Tangent space basis for VNDF sampling
				vec3 up = abs(N.z) < 0.999 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0);
				vec3 tangent = normalize(cross(up, N));
				vec3 bitangent = cross(N, tangent);

				for(uint i = 0u; i < uint(GGX_SAMPLES); i++) {
					vec2 Xi = hammersley(i, uint(GGX_SAMPLES));

					// For PMREM, V = N, so in tangent space V is always (0, 0, 1)
					vec3 H_tangent = importanceSampleGGX_VNDF(Xi, vec3(0.0, 0.0, 1.0), roughness);

					// Transform H back to world space
					vec3 H = normalize(tangent * H_tangent.x + bitangent * H_tangent.y + N * H_tangent.z);
					vec3 L = normalize(2.0 * dot(V, H) * H - V);

					float NdotL = max(dot(N, L), 0.0);

					if(NdotL > 0.0) {
						// Sample environment at fixed mip level
						// VNDF importance sampling handles the distribution filtering
						vec3 sampleColor = bilinearCubeUV(envMap, L, mipInt);

						// Weight by NdotL for the split-sum approximation
						// VNDF PDF naturally accounts for the visible microfacet distribution
						prefilteredColor += sampleColor * NdotL;
						totalWeight += NdotL;
					}
				}

				if (totalWeight > 0.0) {
					prefilteredColor = prefilteredColor / totalWeight;
				}

				gl_FragColor = vec4(prefilteredColor, 1.0);
			}
		`,blending:mi,depthTest:!1,depthWrite:!1})}function yf(r,e,t){return new kt({name:"SphericalGaussianBlur",defines:{SAMPLES:ff,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${r}.0`},uniforms:{envMap:{value:null},sigma:{value:0},mipInt:{value:0}},vertexShader:vo(),fragmentShader:`

			precision highp float;
			precision highp int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform float sigma;
			uniform float mipInt;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			#define PI 3.14159265359
			#define GOLDEN_ANGLE 2.39996322973

			void main() {

				if ( sigma == 0.0 ) {

					gl_FragColor = vec4( bilinearCubeUV( envMap, vOutputDirection, mipInt ), 1.0 );
					return;

				}

				vec3 outputDirection = normalize( vOutputDirection );

				vec3 up = abs( outputDirection.z ) < 0.999 ? vec3( 0.0, 0.0, 1.0 ) : vec3( 1.0, 0.0, 0.0 );
				vec3 tangent = normalize( cross( up, outputDirection ) );
				vec3 bitangent = cross( outputDirection, tangent );

				// Truncate the kernel at three standard deviations or at the antipode.
				float thetaMax = min( 3.0 * sigma, PI );
				float truncation = 1.0 - exp( - 0.5 * thetaMax * thetaMax / ( sigma * sigma ) );

				vec3 accumColor = vec3( 0.0 );
				float accumWeight = 0.0;

				for ( int i = 0; i < SAMPLES; i ++ ) {

					// Stratified inverse-CDF sampling of the Gaussian, placed on a golden-angle spiral.
					float stratum = ( float( i ) + 0.5 ) / float( SAMPLES );
					float theta = sigma * sqrt( - 2.0 * log( 1.0 - stratum * truncation ) );
					float phi = float( i ) * GOLDEN_ANGLE;

					vec3 offset = cos( phi ) * tangent + sin( phi ) * bitangent;
					vec3 sampleDirection = cos( theta ) * outputDirection + sin( theta ) * offset;

					// Correct the planar sample density to solid angle.
					float weight = sin( theta ) / theta;

					accumColor += weight * bilinearCubeUV( envMap, sampleDirection, mipInt );
					accumWeight += weight;

				}

				gl_FragColor = vec4( accumColor / accumWeight, 1.0 );

			}
		`,blending:mi,depthTest:!1,depthWrite:!1})}function Fh(){return new kt({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:vo(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:mi,depthTest:!1,depthWrite:!1})}function Bh(){return new kt({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:vo(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:mi,depthTest:!1,depthWrite:!1})}function vo(){return`

		precision mediump float;
		precision mediump int;

		attribute vec3 outputDirection;

		varying vec3 vOutputDirection;

		void main() {

			vOutputDirection = outputDirection;
			gl_Position = vec4( position, 1.0 );

		}
	`}var go=class extends Dt{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;let i={width:e,height:e,depth:1},s=[i,i,i,i,i,i];this.texture=new ds(s),this._setTextureOptions(t),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;let i={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},s=new Ci(5,5,5),a=new kt({name:"CubemapFromEquirect",uniforms:or(i.uniforms),vertexShader:i.vertexShader,fragmentShader:i.fragmentShader,side:Pt,blending:mi});a.uniforms.tEquirect.value=t;let n=new Et(s,a),o=t.minFilter;return t.minFilter===Xi&&(t.minFilter=wt),new yn(1,10,this).update(e,n),t.minFilter=o,n.geometry.dispose(),n.material.dispose(),this}clear(e,t=!0,i=!0,s=!0){let a=e.getRenderTarget();for(let n=0;n<6;n++)e.setRenderTarget(this,n),e.clear(t,i,s);e.setRenderTarget(a)}};function Sf(r){let e=new WeakMap,t=new WeakMap,i=null;function s(u,d=!1){return u==null?null:d?n(u):a(u)}function a(u){if(u&&u.isTexture){let d=u.mapping;if(d===Tn||d===wn)if(e.has(u)){let g=e.get(u).texture;return o(g,u.mapping)}else{let g=u.image;if(g&&g.height>0){let S=new go(g.height);return S.fromEquirectangularTexture(r,u),e.set(u,S),u.addEventListener("dispose",c),o(S.texture,u.mapping)}else return null}}return u}function n(u){if(u&&u.isTexture){let d=u.mapping,g=d===Tn||d===wn,S=d===Wi||d===nr;if(g||S){let f=t.get(u),p=f!==void 0?f.texture.pmremVersion:0;if(u.isRenderTargetTexture&&u.pmremVersion!==p)return i===null&&(i=new fo(r)),f=g?i.fromEquirectangular(u,f):i.fromCubemap(u,f),f.texture.pmremVersion=u.pmremVersion,t.set(u,f),f.texture;if(f!==void 0)return f.texture;{let y=u.image;return g&&y&&y.height>0||S&&y&&l(y)?(i===null&&(i=new fo(r)),f=g?i.fromEquirectangular(u):i.fromCubemap(u),f.texture.pmremVersion=u.pmremVersion,t.set(u,f),u.addEventListener("dispose",h),f.texture):null}}}return u}function o(u,d){return d===Tn?u.mapping=Wi:d===wn&&(u.mapping=nr),u}function l(u){let d=0,g=6;for(let S=0;S<g;S++)u[S]!==void 0&&d++;return d===g}function c(u){let d=u.target;d.removeEventListener("dispose",c);let g=e.get(d);g!==void 0&&(e.delete(d),g.dispose())}function h(u){let d=u.target;d.removeEventListener("dispose",h);let g=t.get(d);g!==void 0&&(t.delete(d),g.dispose())}function m(){e=new WeakMap,t=new WeakMap,i!==null&&(i.dispose(),i=null)}return{get:s,dispose:m}}function Mf(r){let e={};function t(i){if(e[i]!==void 0)return e[i];let s=r.getExtension(i);return e[i]=s,s}return{has:function(i){return t(i)!==null},init:function(){t("EXT_color_buffer_float"),t("WEBGL_clip_cull_distance"),t("OES_texture_float_linear"),t("EXT_color_buffer_half_float"),t("WEBGL_multisampled_render_to_texture"),t("WEBGL_render_shared_exponent")},get:function(i){let s=t(i);return s===null&&er("WebGLRenderer: "+i+" extension not supported."),s}}}function bf(r,e,t,i){let s={},a=new WeakMap;function n(m){let u=m.target;u.index!==null&&e.remove(u.index);for(let g in u.attributes)e.remove(u.attributes[g]);u.removeEventListener("dispose",n),delete s[u.id];let d=a.get(u);d&&(e.remove(d),a.delete(u)),i.releaseStatesOfGeometry(u),u.isInstancedBufferGeometry===!0&&delete u._maxInstanceCount,t.memory.geometries--}function o(m,u){return s[u.id]===!0||(u.addEventListener("dispose",n),s[u.id]=!0,t.memory.geometries++),u}function l(m){let u=m.attributes;for(let d in u)e.update(u[d],r.ARRAY_BUFFER)}function c(m){let u=[],d=m.index,g=m.attributes.position,S=0;if(g===void 0)return;if(d!==null){let y=d.array;S=d.version;for(let E=0,x=y.length;E<x;E+=3){let T=y[E+0],b=y[E+1],A=y[E+2];u.push(T,b,b,A,A,T)}}else{let y=g.array;S=g.version;for(let E=0,x=y.length/3-1;E<x;E+=3){let T=E+0,b=E+1,A=E+2;u.push(T,b,b,A,A,T)}}let f=new(g.count>=65535?hs:cs)(u,1);f.version=S;let p=a.get(m);p&&e.remove(p),a.set(m,f)}function h(m){let u=a.get(m);if(u){let d=m.index;d!==null&&u.version<d.version&&c(m)}else c(m);return a.get(m)}return{get:o,update:l,getWireframeAttribute:h}}function Tf(r,e,t){let i;function s(m){i=m}let a,n;function o(m){a=m.type,n=m.bytesPerElement}function l(m,u){r.drawElements(i,u,a,m*n),t.update(u,i,1)}function c(m,u,d){d!==0&&(r.drawElementsInstanced(i,u,a,m*n,d),t.update(u,i,d))}function h(m,u,d){if(d===0)return;e.get("WEBGL_multi_draw").multiDrawElementsWEBGL(i,u,0,a,m,0,d);let g=0;for(let S=0;S<d;S++)g+=u[S];t.update(g,i,1)}this.setMode=s,this.setIndex=o,this.render=l,this.renderInstances=c,this.renderMultiDraw=h}function wf(r){let e={geometries:0,textures:0},t={frame:0,calls:0,triangles:0,points:0,lines:0};function i(a,n,o){switch(t.calls++,n){case r.TRIANGLES:t.triangles+=o*(a/3);break;case r.LINES:t.lines+=o*(a/2);break;case r.LINE_STRIP:t.lines+=o*(a-1);break;case r.LINE_LOOP:t.lines+=o*a;break;case r.POINTS:t.points+=o*a;break;default:Fe("WebGLInfo: Unknown draw mode:",n);break}}function s(){t.calls=0,t.triangles=0,t.points=0,t.lines=0}return{memory:e,render:t,programs:null,autoReset:!0,reset:s,update:i}}function Ef(r,e,t){let i=new WeakMap,s=new lt;function a(n,o,l){let c=n.morphTargetInfluences,h=o.morphAttributes.position||o.morphAttributes.normal||o.morphAttributes.color,m=h!==void 0?h.length:0,u=i.get(o);if(u===void 0||u.count!==m){let d=function(){_.dispose(),i.delete(o),o.removeEventListener("dispose",d)};u!==void 0&&u.texture.dispose();let g=o.morphAttributes.position!==void 0,S=o.morphAttributes.normal!==void 0,f=o.morphAttributes.color!==void 0,p=o.morphAttributes.position||[],y=o.morphAttributes.normal||[],E=o.morphAttributes.color||[],x=0;g===!0&&(x=1),S===!0&&(x=2),f===!0&&(x=3);let T=o.attributes.position.count*x,b=1;T>e.maxTextureSize&&(b=Math.ceil(T/e.maxTextureSize),T=e.maxTextureSize);let A=new Float32Array(T*b*4*m),_=new ns(A,T,b,m);_.type=si,_.needsUpdate=!0;let w=x*4;for(let I=0;I<m;I++){let L=p[I],U=y[I],V=E[I],P=T*b*4*I;for(let H=0;H<L.count;H++){let Y=H*w;g===!0&&(s.fromBufferAttribute(L,H),A[P+Y+0]=s.x,A[P+Y+1]=s.y,A[P+Y+2]=s.z,A[P+Y+3]=0),S===!0&&(s.fromBufferAttribute(U,H),A[P+Y+4]=s.x,A[P+Y+5]=s.y,A[P+Y+6]=s.z,A[P+Y+7]=0),f===!0&&(s.fromBufferAttribute(V,H),A[P+Y+8]=s.x,A[P+Y+9]=s.y,A[P+Y+10]=s.z,A[P+Y+11]=V.itemSize===4?s.w:1)}}u={count:m,texture:_,size:new ae(T,b)},i.set(o,u),o.addEventListener("dispose",d)}if(n.isInstancedMesh===!0&&n.morphTexture!==null)l.getUniforms().setValue(r,"morphTexture",n.morphTexture,t);else{let d=0;for(let S=0;S<c.length;S++)d+=c[S];let g=o.morphTargetsRelative?1:1-d;l.getUniforms().setValue(r,"morphTargetBaseInfluence",g),l.getUniforms().setValue(r,"morphTargetInfluences",c)}l.getUniforms().setValue(r,"morphTargetsTexture",u.texture,t),l.getUniforms().setValue(r,"morphTargetsTextureSize",u.size)}return{update:a}}function Af(r,e,t,i,s){let a=new WeakMap;function n(c){let h=s.render.frame,m=c.geometry,u=e.get(c,m);if(a.get(u)!==h&&(e.update(u),a.set(u,h)),c.isInstancedMesh&&(c.hasEventListener("dispose",l)===!1&&c.addEventListener("dispose",l),a.get(c)!==h&&(t.update(c.instanceMatrix,r.ARRAY_BUFFER),c.instanceColor!==null&&t.update(c.instanceColor,r.ARRAY_BUFFER),a.set(c,h))),c.isSkinnedMesh){let d=c.skeleton;a.get(d)!==h&&(d.update(),a.set(d,h))}return u}function o(){a=new WeakMap}function l(c){let h=c.target;h.removeEventListener("dispose",l),i.releaseStatesOfObject(h),t.remove(h.instanceMatrix),h.instanceColor!==null&&t.remove(h.instanceColor)}return{update:n,dispose:o}}var Cf={[dl]:"LINEAR_TONE_MAPPING",[pl]:"REINHARD_TONE_MAPPING",[ml]:"CINEON_TONE_MAPPING",[fl]:"ACES_FILMIC_TONE_MAPPING",[_l]:"AGX_TONE_MAPPING",[vl]:"NEUTRAL_TONE_MAPPING",[gl]:"CUSTOM_TONE_MAPPING"};function Rf(r,e,t,i,s,a){let n=new Dt(e,t,{type:r,depthBuffer:s,stencilBuffer:a,samples:i?4:0,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,resolveDepthBuffer:!1,resolveStencilBuffer:!1}),o=null,l=null,c=new ct;c.setAttribute("position",new De([-1,3,0,-1,-1,0,3,-1,0],3)),c.setAttribute("uv",new De([0,2,0,0,2,0],2));let h=new nn({uniforms:{tDiffuse:{value:null}},vertexShader:`
			precision highp float;

			uniform mat4 modelViewMatrix;
			uniform mat4 projectionMatrix;

			attribute vec3 position;
			attribute vec2 uv;

			varying vec2 vUv;

			void main() {
				vUv = uv;
				gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
			}`,fragmentShader:`
			precision highp float;

			uniform sampler2D tDiffuse;

			varying vec2 vUv;

			#include <tonemapping_pars_fragment>
			#include <colorspace_pars_fragment>

			void main() {
				gl_FragColor = texture2D( tDiffuse, vUv );

				#ifdef LINEAR_TONE_MAPPING
					gl_FragColor.rgb = LinearToneMapping( gl_FragColor.rgb );
				#elif defined( REINHARD_TONE_MAPPING )
					gl_FragColor.rgb = ReinhardToneMapping( gl_FragColor.rgb );
				#elif defined( CINEON_TONE_MAPPING )
					gl_FragColor.rgb = CineonToneMapping( gl_FragColor.rgb );
				#elif defined( ACES_FILMIC_TONE_MAPPING )
					gl_FragColor.rgb = ACESFilmicToneMapping( gl_FragColor.rgb );
				#elif defined( AGX_TONE_MAPPING )
					gl_FragColor.rgb = AgXToneMapping( gl_FragColor.rgb );
				#elif defined( NEUTRAL_TONE_MAPPING )
					gl_FragColor.rgb = NeutralToneMapping( gl_FragColor.rgb );
				#elif defined( CUSTOM_TONE_MAPPING )
					gl_FragColor.rgb = CustomToneMapping( gl_FragColor.rgb );
				#endif

				#ifdef SRGB_TRANSFER
					gl_FragColor = sRGBTransferOETF( gl_FragColor );
				#endif
			}`,depthTest:!1,depthWrite:!1}),m=new Et(c,h),u=new ki(-1,1,1,-1,0,1),d=null,g=null,S=!1,f,p=null,y=[],E=!1;this.setSize=function(x,T){n.setSize(x,T),o!==null&&o.setSize(x,T),l!==null&&l.setSize(x,T);for(let b=0;b<y.length;b++){let A=y[b];A.setSize&&A.setSize(x,T)}},this.setEffects=function(x){y=x,E=y.length>0&&y[0].isRenderPass===!0;let T=n.width,b=n.height;y.length>0&&o===null&&(o=new Dt(T,b,{type:ai,depthBuffer:!1,stencilBuffer:!1}),l=new Dt(T,b,{type:ai,depthBuffer:!1,stencilBuffer:!1}));for(let A=0;A<y.length;A++){let _=y[A];_.setSize&&_.setSize(T,b)}},this.begin=function(x,T){if(S||x.toneMapping===ii&&y.length===0)return!1;if(p=T,T!==null){let b=T.width,A=T.height;(n.width!==b||n.height!==A)&&this.setSize(b,A)}return E===!1&&x.setRenderTarget(n),f=x.toneMapping,x.toneMapping=ii,!0},this.hasRenderPass=function(){return E},this.end=function(x,T){x.toneMapping=f,S=!0;let b=n,A=o;for(let _=0;_<y.length;_++){let w=y[_];w.enabled!==!1&&(w.render(x,A,b,T),w.needsSwap!==!1&&(b=A,A=A===o?l:o))}if(d!==x.outputColorSpace||g!==x.toneMapping){d=x.outputColorSpace,g=x.toneMapping,h.defines={},et.getTransfer(d)===st&&(h.defines.SRGB_TRANSFER="");let _=Cf[g];_&&(h.defines[_]=""),h.needsUpdate=!0}h.uniforms.tDiffuse.value=b.texture,x.setRenderTarget(p),x.render(m,u),p=null,S=!1},this.isCompositing=function(){return S},this.dispose=function(){n.dispose(),o!==null&&o.dispose(),l!==null&&l.dispose(),c.dispose(),h.dispose()}}var su=new Ut,Xl=new zi(1,1),au=new ns,nu=new La,ou=new ds,zh=[],Gh=[],Vh=new Float32Array(16),kh=new Float32Array(9),Hh=new Float32Array(4);function Xr(r,e,t){let i=r[0];if(i<=0||i>0)return r;let s=e*t,a=zh[s];if(a===void 0&&(a=new Float32Array(s),zh[s]=a),e!==0){i.toArray(a,0);for(let n=1,o=0;n!==e;++n)o+=t,r[n].toArray(a,o)}return a}function yt(r,e){if(r.length!==e.length)return!1;for(let t=0,i=r.length;t<i;t++)if(r[t]!==e[t])return!1;return!0}function St(r,e){for(let t=0,i=e.length;t<i;t++)r[t]=e[t]}function xo(r,e){let t=Gh[e];t===void 0&&(t=new Int32Array(e),Gh[e]=t);for(let i=0;i!==e;++i)t[i]=r.allocateTextureUnit();return t}function If(r,e){let t=this.cache;t[0]!==e&&(r.uniform1f(this.addr,e),t[0]=e)}function Pf(r,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(r.uniform2f(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(yt(t,e))return;r.uniform2fv(this.addr,e),St(t,e)}}function Lf(r,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(r.uniform3f(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else if(e.r!==void 0)(t[0]!==e.r||t[1]!==e.g||t[2]!==e.b)&&(r.uniform3f(this.addr,e.r,e.g,e.b),t[0]=e.r,t[1]=e.g,t[2]=e.b);else{if(yt(t,e))return;r.uniform3fv(this.addr,e),St(t,e)}}function Nf(r,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(r.uniform4f(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(yt(t,e))return;r.uniform4fv(this.addr,e),St(t,e)}}function Uf(r,e){let t=this.cache,i=e.elements;if(i===void 0){if(yt(t,e))return;r.uniformMatrix2fv(this.addr,!1,e),St(t,e)}else{if(yt(t,i))return;Hh.set(i),r.uniformMatrix2fv(this.addr,!1,Hh),St(t,i)}}function Df(r,e){let t=this.cache,i=e.elements;if(i===void 0){if(yt(t,e))return;r.uniformMatrix3fv(this.addr,!1,e),St(t,e)}else{if(yt(t,i))return;kh.set(i),r.uniformMatrix3fv(this.addr,!1,kh),St(t,i)}}function Of(r,e){let t=this.cache,i=e.elements;if(i===void 0){if(yt(t,e))return;r.uniformMatrix4fv(this.addr,!1,e),St(t,e)}else{if(yt(t,i))return;Vh.set(i),r.uniformMatrix4fv(this.addr,!1,Vh),St(t,i)}}function Ff(r,e){let t=this.cache;t[0]!==e&&(r.uniform1i(this.addr,e),t[0]=e)}function Bf(r,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(r.uniform2i(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(yt(t,e))return;r.uniform2iv(this.addr,e),St(t,e)}}function zf(r,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(r.uniform3i(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(yt(t,e))return;r.uniform3iv(this.addr,e),St(t,e)}}function Gf(r,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(r.uniform4i(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(yt(t,e))return;r.uniform4iv(this.addr,e),St(t,e)}}function Vf(r,e){let t=this.cache;t[0]!==e&&(r.uniform1ui(this.addr,e),t[0]=e)}function kf(r,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(r.uniform2ui(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(yt(t,e))return;r.uniform2uiv(this.addr,e),St(t,e)}}function Hf(r,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(r.uniform3ui(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(yt(t,e))return;r.uniform3uiv(this.addr,e),St(t,e)}}function Wf(r,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(r.uniform4ui(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(yt(t,e))return;r.uniform4uiv(this.addr,e),St(t,e)}}function Xf(r,e,t){let i=this.cache,s=t.allocateTextureUnit();i[0]!==s&&(r.uniform1i(this.addr,s),i[0]=s);let a;this.type===r.SAMPLER_2D_SHADOW?(Xl.compareFunction=t.isReversedDepthBuffer()?uo:ho,a=Xl):a=su,t.setTexture2D(e||a,s)}function jf(r,e,t){let i=this.cache,s=t.allocateTextureUnit();i[0]!==s&&(r.uniform1i(this.addr,s),i[0]=s),t.setTexture3D(e||nu,s)}function qf(r,e,t){let i=this.cache,s=t.allocateTextureUnit();i[0]!==s&&(r.uniform1i(this.addr,s),i[0]=s),t.setTextureCube(e||ou,s)}function Yf(r,e,t){let i=this.cache,s=t.allocateTextureUnit();i[0]!==s&&(r.uniform1i(this.addr,s),i[0]=s),t.setTexture2DArray(e||au,s)}function Zf(r){switch(r){case 5126:return If;case 35664:return Pf;case 35665:return Lf;case 35666:return Nf;case 35674:return Uf;case 35675:return Df;case 35676:return Of;case 5124:case 35670:return Ff;case 35667:case 35671:return Bf;case 35668:case 35672:return zf;case 35669:case 35673:return Gf;case 5125:return Vf;case 36294:return kf;case 36295:return Hf;case 36296:return Wf;case 35678:case 36198:case 36298:case 36306:case 35682:return Xf;case 35679:case 36299:case 36307:return jf;case 35680:case 36300:case 36308:case 36293:return qf;case 36289:case 36303:case 36311:case 36292:return Yf}}function Jf(r,e){r.uniform1fv(this.addr,e)}function Kf(r,e){let t=Xr(e,this.size,2);r.uniform2fv(this.addr,t)}function $f(r,e){let t=Xr(e,this.size,3);r.uniform3fv(this.addr,t)}function Qf(r,e){let t=Xr(e,this.size,4);r.uniform4fv(this.addr,t)}function eg(r,e){let t=Xr(e,this.size,4);r.uniformMatrix2fv(this.addr,!1,t)}function tg(r,e){let t=Xr(e,this.size,9);r.uniformMatrix3fv(this.addr,!1,t)}function ig(r,e){let t=Xr(e,this.size,16);r.uniformMatrix4fv(this.addr,!1,t)}function rg(r,e){r.uniform1iv(this.addr,e)}function sg(r,e){r.uniform2iv(this.addr,e)}function ag(r,e){r.uniform3iv(this.addr,e)}function ng(r,e){r.uniform4iv(this.addr,e)}function og(r,e){r.uniform1uiv(this.addr,e)}function lg(r,e){r.uniform2uiv(this.addr,e)}function cg(r,e){r.uniform3uiv(this.addr,e)}function hg(r,e){r.uniform4uiv(this.addr,e)}function ug(r,e,t){let i=this.cache,s=e.length,a=xo(t,s);yt(i,a)||(r.uniform1iv(this.addr,a),St(i,a));let n;this.type===r.SAMPLER_2D_SHADOW?n=Xl:n=su;for(let o=0;o!==s;++o)t.setTexture2D(e[o]||n,a[o])}function dg(r,e,t){let i=this.cache,s=e.length,a=xo(t,s);yt(i,a)||(r.uniform1iv(this.addr,a),St(i,a));for(let n=0;n!==s;++n)t.setTexture3D(e[n]||nu,a[n])}function pg(r,e,t){let i=this.cache,s=e.length,a=xo(t,s);yt(i,a)||(r.uniform1iv(this.addr,a),St(i,a));for(let n=0;n!==s;++n)t.setTextureCube(e[n]||ou,a[n])}function mg(r,e,t){let i=this.cache,s=e.length,a=xo(t,s);yt(i,a)||(r.uniform1iv(this.addr,a),St(i,a));for(let n=0;n!==s;++n)t.setTexture2DArray(e[n]||au,a[n])}function fg(r){switch(r){case 5126:return Jf;case 35664:return Kf;case 35665:return $f;case 35666:return Qf;case 35674:return eg;case 35675:return tg;case 35676:return ig;case 5124:case 35670:return rg;case 35667:case 35671:return sg;case 35668:case 35672:return ag;case 35669:case 35673:return ng;case 5125:return og;case 36294:return lg;case 36295:return cg;case 36296:return hg;case 35678:case 36198:case 36298:case 36306:case 35682:return ug;case 35679:case 36299:case 36307:return dg;case 35680:case 36300:case 36308:case 36293:return pg;case 36289:case 36303:case 36311:case 36292:return mg}}var jl=class{constructor(e,t,i){this.id=e,this.addr=i,this.cache=[],this.type=t.type,this.setValue=Zf(t.type)}},ql=class{constructor(e,t,i){this.id=e,this.addr=i,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=fg(t.type)}},Yl=class{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,i){let s=this.seq;for(let a=0,n=s.length;a!==n;++a){let o=s[a];o.setValue(e,t[o.id],i)}}},Hl=/(\w+)(\])?(\[|\.)?/g;function Wh(r,e){r.seq.push(e),r.map[e.id]=e}function gg(r,e,t){let i=r.name,s=i.length;for(Hl.lastIndex=0;;){let a=Hl.exec(i),n=Hl.lastIndex,o=a[1],l=a[2]==="]",c=a[3];if(l&&(o=o|0),c===void 0||c==="["&&n+2===s){Wh(t,c===void 0?new jl(o,r,e):new ql(o,r,e));break}else{let h=t.map[o];h===void 0&&(h=new Yl(o),Wh(t,h)),t=h}}}var Wr=class{constructor(e,t){this.seq=[],this.map={};let i=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let n=0;n<i;++n){let o=e.getActiveUniform(t,n),l=e.getUniformLocation(t,o.name);gg(o,l,this)}let s=[],a=[];for(let n of this.seq)n.type===e.SAMPLER_2D_SHADOW||n.type===e.SAMPLER_CUBE_SHADOW||n.type===e.SAMPLER_2D_ARRAY_SHADOW?s.push(n):a.push(n);s.length>0&&(this.seq=s.concat(a))}setValue(e,t,i,s){let a=this.map[t];a!==void 0&&a.setValue(e,i,s)}setOptional(e,t,i){let s=t[i];s!==void 0&&this.setValue(e,i,s)}static upload(e,t,i,s){for(let a=0,n=t.length;a!==n;++a){let o=t[a],l=i[o.id];l.needsUpdate!==!1&&o.setValue(e,l.value,s)}}static seqWithValue(e,t){let i=[];for(let s=0,a=e.length;s!==a;++s){let n=e[s];n.id in t&&i.push(n)}return i}};function Xh(r,e,t){let i=r.createShader(e);return r.shaderSource(i,t),r.compileShader(i),i}var _g=37297,vg=0;function xg(r,e){let t=r.split(`
`),i=[],s=Math.max(e-6,0),a=Math.min(e+6,t.length);for(let n=s;n<a;n++){let o=n+1;i.push(`${o===e?">":" "} ${o}: ${t[n]}`)}return i.join(`
`)}var jh=new ke;function yg(r){et._getMatrix(jh,et.workingColorSpace,r);let e=`mat3( ${jh.elements.map(t=>t.toFixed(4))} )`;switch(et.getTransfer(r)){case ss:return[e,"LinearTransferOETF"];case st:return[e,"sRGBTransferOETF"];default:return Ue("WebGLProgram: Unsupported color space: ",r),[e,"LinearTransferOETF"]}}function qh(r,e,t){let i=r.getShaderParameter(e,r.COMPILE_STATUS),s=(r.getShaderInfoLog(e)||"").trim();if(i&&s==="")return"";let a=/ERROR: 0:(\d+)/.exec(s);if(a){let n=parseInt(a[1]);return t.toUpperCase()+`

`+s+`

`+xg(r.getShaderSource(e),n)}else return s}function Sg(r,e){let t=yg(e);return[`vec4 ${r}( vec4 value ) {`,`	return ${t[1]}( vec4( value.rgb * ${t[0]}, value.a ) );`,"}"].join(`
`)}var Mg={[dl]:"Linear",[pl]:"Reinhard",[ml]:"Cineon",[fl]:"ACESFilmic",[_l]:"AgX",[vl]:"Neutral",[gl]:"Custom"};function bg(r,e){let t=Mg[e];return t===void 0?(Ue("WebGLProgram: Unsupported toneMapping:",e),"vec3 "+r+"( vec3 color ) { return LinearToneMapping( color ); }"):"vec3 "+r+"( vec3 color ) { return "+t+"ToneMapping( color ); }"}var mo=new R;function Tg(){et.getLuminanceCoefficients(mo);let r=mo.x.toFixed(4),e=mo.y.toFixed(4),t=mo.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${r}, ${e}, ${t} );`,"	return dot( weights, rgb );","}"].join(`
`)}function wg(r){return[r.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",r.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(Vs).join(`
`)}function Eg(r){let e=[];for(let t in r){let i=r[t];i!==!1&&e.push("#define "+t+" "+i)}return e.join(`
`)}function Ag(r,e){let t={},i=r.getProgramParameter(e,r.ACTIVE_ATTRIBUTES);for(let s=0;s<i;s++){let a=r.getActiveAttrib(e,s),n=a.name,o=1;a.type===r.FLOAT_MAT2&&(o=2),a.type===r.FLOAT_MAT3&&(o=3),a.type===r.FLOAT_MAT4&&(o=4),t[n]={type:a.type,location:r.getAttribLocation(e,n),locationSize:o}}return t}function Vs(r){return r!==""}function Yh(r,e){let t=e.numSpotLightShadows+e.numSpotLightMaps-e.numSpotLightShadowsWithMaps;return r.replace(/NUM_SUN_LIGHTS/g,e.numSunLights).replace(/NUM_DIR_LIGHTS/g,e.numDirLights).replace(/NUM_SPOT_LIGHTS/g,e.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,e.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,t).replace(/NUM_RECT_AREA_LIGHTS/g,e.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,e.numPointLights).replace(/NUM_HEMI_LIGHTS/g,e.numHemiLights).replace(/NUM_SUN_LIGHT_SHADOWS/g,e.numSunLightShadows).replace(/NUM_DIR_LIGHT_SHADOWS/g,e.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,e.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,e.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,e.numPointLightShadows)}function Zh(r,e){return r.replace(/NUM_CLIPPING_PLANES/g,e.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,e.numClippingPlanes-e.numClipIntersection)}var Cg=/^[ \t]*#include +<([\w\d./]+)>/gm;function Zl(r){return r.replace(Cg,Ig)}var Rg=new Map;function Ig(r,e){let t=Ze[e];if(t===void 0){let i=Rg.get(e);if(i!==void 0)t=Ze[i],Ue('WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',e,i);else throw new Error("THREE.WebGLProgram: Can not resolve #include <"+e+">")}return Zl(t)}var Pg=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function Jh(r){return r.replace(Pg,Lg)}function Lg(r,e,t,i){let s="";for(let a=parseInt(e);a<parseInt(t);a++)s+=i.replace(/\[\s*i\s*\]/g,"[ "+a+" ]").replace(/UNROLLED_LOOP_INDEX/g,a);return s}function Kh(r){let e=`precision ${r.precision} float;
	precision ${r.precision} int;
	precision ${r.precision} sampler2D;
	precision ${r.precision} samplerCube;
	precision ${r.precision} sampler3D;
	precision ${r.precision} sampler2DArray;
	precision ${r.precision} sampler2DShadow;
	precision ${r.precision} samplerCubeShadow;
	precision ${r.precision} sampler2DArrayShadow;
	precision ${r.precision} isampler2D;
	precision ${r.precision} isampler3D;
	precision ${r.precision} isamplerCube;
	precision ${r.precision} isampler2DArray;
	precision ${r.precision} usampler2D;
	precision ${r.precision} usampler3D;
	precision ${r.precision} usamplerCube;
	precision ${r.precision} usampler2DArray;
	`;return r.precision==="highp"?e+=`
#define HIGH_PRECISION`:r.precision==="mediump"?e+=`
#define MEDIUM_PRECISION`:r.precision==="lowp"&&(e+=`
#define LOW_PRECISION`),e}var Ng={[Is]:"SHADOWMAP_TYPE_PCF",[Fr]:"SHADOWMAP_TYPE_VSM"};function Ug(r){return Ng[r.shadowMapType]||"SHADOWMAP_TYPE_BASIC"}var Dg={[Wi]:"ENVMAP_TYPE_CUBE",[nr]:"ENVMAP_TYPE_CUBE",[Ps]:"ENVMAP_TYPE_CUBE_UV"};function Og(r){return r.envMap===!1?"ENVMAP_TYPE_CUBE":Dg[r.envMapMode]||"ENVMAP_TYPE_CUBE"}var Fg={[nr]:"ENVMAP_MODE_REFRACTION"};function Bg(r){return r.envMap===!1?"ENVMAP_MODE_REFLECTION":Fg[r.envMapMode]||"ENVMAP_MODE_REFLECTION"}var zg={[bn]:"ENVMAP_BLENDING_MULTIPLY",[hh]:"ENVMAP_BLENDING_MIX",[uh]:"ENVMAP_BLENDING_ADD"};function Gg(r){return r.envMap===!1?"ENVMAP_BLENDING_NONE":zg[r.combine]||"ENVMAP_BLENDING_NONE"}function Vg(r){let e=r.envMapCubeUVHeight;if(e===null)return null;let t=Math.log2(e)-2,i=1/e;return{texelWidth:1/(3*Math.max(Math.pow(2,t),112)),texelHeight:i,maxMip:t}}function kg(r,e,t,i){let s=r.getContext(),a=t.defines,n=t.vertexShader,o=t.fragmentShader,l=Ug(t),c=Og(t),h=Bg(t),m=Gg(t),u=Vg(t),d=wg(t),g=Eg(a),S=s.createProgram(),f,p,y=t.glslVersion?"#version "+t.glslVersion+`
`:"";t.isRawShaderMaterial?(f=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g].filter(Vs).join(`
`),f.length>0&&(f+=`
`),p=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g].filter(Vs).join(`
`),p.length>0&&(p+=`
`)):(f=[Kh(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g,t.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",t.batching?"#define USE_BATCHING":"",t.batchingColor?"#define USE_BATCHING_COLOR":"",t.instancing?"#define USE_INSTANCING":"",t.instancingColor?"#define USE_INSTANCING_COLOR":"",t.instancingMorph?"#define USE_INSTANCING_MORPH":"",t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+h:"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.displacementMap?"#define USE_DISPLACEMENTMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.mapUv?"#define MAP_UV "+t.mapUv:"",t.alphaMapUv?"#define ALPHAMAP_UV "+t.alphaMapUv:"",t.lightMapUv?"#define LIGHTMAP_UV "+t.lightMapUv:"",t.aoMapUv?"#define AOMAP_UV "+t.aoMapUv:"",t.emissiveMapUv?"#define EMISSIVEMAP_UV "+t.emissiveMapUv:"",t.bumpMapUv?"#define BUMPMAP_UV "+t.bumpMapUv:"",t.normalMapUv?"#define NORMALMAP_UV "+t.normalMapUv:"",t.displacementMapUv?"#define DISPLACEMENTMAP_UV "+t.displacementMapUv:"",t.metalnessMapUv?"#define METALNESSMAP_UV "+t.metalnessMapUv:"",t.roughnessMapUv?"#define ROUGHNESSMAP_UV "+t.roughnessMapUv:"",t.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+t.anisotropyMapUv:"",t.clearcoatMapUv?"#define CLEARCOATMAP_UV "+t.clearcoatMapUv:"",t.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+t.clearcoatNormalMapUv:"",t.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+t.clearcoatRoughnessMapUv:"",t.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+t.iridescenceMapUv:"",t.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+t.iridescenceThicknessMapUv:"",t.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+t.sheenColorMapUv:"",t.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+t.sheenRoughnessMapUv:"",t.specularMapUv?"#define SPECULARMAP_UV "+t.specularMapUv:"",t.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+t.specularColorMapUv:"",t.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+t.specularIntensityMapUv:"",t.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+t.transmissionMapUv:"",t.thicknessMapUv?"#define THICKNESSMAP_UV "+t.thicknessMapUv:"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexNormals?"#define HAS_NORMAL":"",t.vertexColors?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.flatShading?"#define FLAT_SHADED":"",t.skinning?"#define USE_SKINNING":"",t.morphTargets?"#define USE_MORPHTARGETS":"",t.morphNormals&&t.flatShading===!1?"#define USE_MORPHNORMALS":"",t.morphColors?"#define USE_MORPHCOLORS":"",t.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+t.morphTextureStride:"",t.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+t.morphTargetsCount:"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.sizeAttenuation?"#define USE_SIZEATTENUATION":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(Vs).join(`
`),p=[Kh(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g,t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",t.map?"#define USE_MAP":"",t.matcap?"#define USE_MATCAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+c:"",t.envMap?"#define "+h:"",t.envMap?"#define "+m:"",u?"#define CUBEUV_TEXEL_WIDTH "+u.texelWidth:"",u?"#define CUBEUV_TEXEL_HEIGHT "+u.texelHeight:"",u?"#define CUBEUV_MAX_MIP "+u.maxMip+".0":"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.packedNormalMap?"#define USE_PACKED_NORMALMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoat?"#define USE_CLEARCOAT":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.dispersion?"#define USE_DISPERSION":"",t.retroreflection?"#define USE_RETROREFLECTION":"",t.iridescence?"#define USE_IRIDESCENCE":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaTest?"#define USE_ALPHATEST":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.sheen?"#define USE_SHEEN":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors||t.instancingColor?"#define USE_COLOR":"",t.vertexAlphas||t.batchingColor?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.gradientMap?"#define USE_GRADIENTMAP":"",t.flatShading?"#define FLAT_SHADED":"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.numLightProbeGrids>0?"#define USE_LIGHT_PROBES_GRID":"",t.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",t.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",t.toneMapping!==ii?"#define TONE_MAPPING":"",t.toneMapping!==ii?Ze.tonemapping_pars_fragment:"",t.toneMapping!==ii?bg("toneMapping",t.toneMapping):"",t.dithering?"#define DITHERING":"",t.opaque?"#define OPAQUE":"",Ze.colorspace_pars_fragment,Sg("linearToOutputTexel",t.outputColorSpace),Tg(),t.useDepthPacking?"#define DEPTH_PACKING "+t.depthPacking:"",`
`].filter(Vs).join(`
`)),n=Zl(n),n=Yh(n,t),n=Zh(n,t),o=Zl(o),o=Yh(o,t),o=Zh(o,t),n=Jh(n),o=Jh(o),t.isRawShaderMaterial!==!0&&(y=`#version 300 es
`,f=[d,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+f,p=["#define varying in",t.glslVersion===Al?"":"layout(location = 0) out highp vec4 pc_fragColor;",t.glslVersion===Al?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+p);let E=y+f+n,x=y+p+o,T=Xh(s,s.VERTEX_SHADER,E),b=Xh(s,s.FRAGMENT_SHADER,x);s.attachShader(S,T),s.attachShader(S,b),t.index0AttributeName!==void 0?s.bindAttribLocation(S,0,t.index0AttributeName):t.hasPositionAttribute===!0&&s.bindAttribLocation(S,0,"position"),s.linkProgram(S);function A(L){if(r.debug.checkShaderErrors){let U=s.getProgramInfoLog(S)||"",V=s.getShaderInfoLog(T)||"",P=s.getShaderInfoLog(b)||"",H=U.trim(),Y=V.trim(),z=P.trim(),J=!0,X=!0;if(s.getProgramParameter(S,s.LINK_STATUS)===!1)if(J=!1,typeof r.debug.onShaderError=="function")r.debug.onShaderError(s,S,T,b);else{let Z=qh(s,T,"vertex"),Q=qh(s,b,"fragment");Fe("WebGLProgram: Shader Error "+s.getError()+" - VALIDATE_STATUS "+s.getProgramParameter(S,s.VALIDATE_STATUS)+`

Material Name: `+L.name+`
Material Type: `+L.type+`

Program Info Log: `+H+`
`+Z+`
`+Q)}else H!==""?Ue("WebGLProgram: Program Info Log:",H):(Y===""||z==="")&&(X=!1);X&&(L.diagnostics={runnable:J,programLog:H,vertexShader:{log:Y,prefix:f},fragmentShader:{log:z,prefix:p}})}s.deleteShader(T),s.deleteShader(b),_=new Wr(s,S),w=Ag(s,S)}let _;this.getUniforms=function(){return _===void 0&&A(this),_};let w;this.getAttributes=function(){return w===void 0&&A(this),w};let I=t.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return I===!1&&(I=s.getProgramParameter(S,_g)),I},this.destroy=function(){i.releaseStatesOfProgram(this),s.deleteProgram(S),this.program=void 0},this.type=t.shaderType,this.name=t.shaderName,this.id=vg++,this.cacheKey=e,this.usedTimes=1,this.program=S,this.vertexShader=T,this.fragmentShader=b,this}var Hg=0,Jl=class{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e,t,i){let s=this._getShaderCacheForMaterial(e);return s.has(t)===!1&&(s.add(t),t.usedTimes++),s.has(i)===!1&&(s.add(i),i.usedTimes++),this}remove(e){let t=this.materialCache.get(e);for(let i of t)i.usedTimes--,i.usedTimes===0&&this.shaderCache.delete(i.code);return this.materialCache.delete(e),this}getVertexShaderStage(e){return this._getShaderStage(e.vertexShader)}getFragmentShaderStage(e){return this._getShaderStage(e.fragmentShader)}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){let t=this.materialCache,i=t.get(e);return i===void 0&&(i=new Set,t.set(e,i)),i}_getShaderStage(e){let t=this.shaderCache,i=t.get(e);return i===void 0&&(i=new Kl(e),t.set(e,i)),i}},Kl=class{constructor(e){this.id=Hg++,this.code=e,this.usedTimes=0}};function Wg(r){return r===qi||r===Fs||r===Bs}function Xg(r,e,t,i,s,a){let n=new os,o=new Jl,l=new Set,c=[],h=new Map,m=i.logarithmicDepthBuffer,u=i.precision,d={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distance",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function g(_){return l.add(_),_===0?"uv":`uv${_}`}function S(_,w,I,L,U,V){let P=L.fog,H=U.geometry,Y=_.isMeshStandardMaterial||_.isMeshLambertMaterial||_.isMeshPhongMaterial?L.environment:null,z=_.isMeshStandardMaterial||_.isMeshLambertMaterial&&!_.envMap||_.isMeshPhongMaterial&&!_.envMap,J=e.get(_.envMap||Y,z),X=J&&J.mapping===Ps?J.image.height:null,Z=d[_.type];_.precision!==null&&(u=i.getMaxPrecision(_.precision),u!==_.precision&&Ue("WebGLProgram.getParameters:",_.precision,"not supported, using",u,"instead."));let Q=H.morphAttributes.position||H.morphAttributes.normal||H.morphAttributes.color,Le=Q!==void 0?Q.length:0,fe=0;H.morphAttributes.position!==void 0&&(fe=1),H.morphAttributes.normal!==void 0&&(fe=2),H.morphAttributes.color!==void 0&&(fe=3);let qe,Qe,it,K;if(Z){let xt=gi[Z];qe=xt.vertexShader,Qe=xt.fragmentShader}else{qe=_.vertexShader,Qe=_.fragmentShader;let xt=o.getVertexShaderStage(_),rt=o.getFragmentShaderStage(_);o.update(_,xt,rt),it=xt.id,K=rt.id}let $=r.getRenderTarget(),ye=r.state.buffers.depth.getReversed(),Be=U.isInstancedMesh===!0,pe=U.isBatchedMesh===!0,Te=!!_.map,ie=!!_.matcap,re=!!J,te=!!_.aoMap,_e=!!_.lightMap,ve=!!_.bumpMap&&_.wireframe===!1,Re=!!_.normalMap,Pe=!!_.displacementMap,Je=!!_.emissiveMap,ze=!!_.metalnessMap,je=!!_.roughnessMap,N=_.anisotropy>0,mt=_.clearcoat>0,We=_.dispersion>0,C=_.retroreflectivity>0,v=_.iridescence>0,B=_.sheen>0,W=_.transmission>0,q=N&&!!_.anisotropyMap,ce=mt&&!!_.clearcoatMap,de=mt&&!!_.clearcoatNormalMap,F=mt&&!!_.clearcoatRoughnessMap,he=v&&!!_.iridescenceMap,ue=v&&!!_.iridescenceThicknessMap,Ee=B&&!!_.sheenColorMap,ne=B&&!!_.sheenRoughnessMap,Ge=!!_.specularMap,Ie=!!_.specularColorMap,Ve=!!_.specularIntensityMap,Ye=W&&!!_.transmissionMap,O=W&&!!_.thicknessMap,ee=!!_.gradientMap,oe=!!_.alphaMap,xe=_.alphaTest>0,be=!!_.alphaHash,se=!!_.extensions,Ne=ii;_.toneMapped&&($===null||$.isXRRenderTarget===!0)&&(Ne=r.toneMapping);let Se={shaderID:Z,shaderType:_.type,shaderName:_.name,vertexShader:qe,fragmentShader:Qe,defines:_.defines,customVertexShaderID:it,customFragmentShaderID:K,isRawShaderMaterial:_.isRawShaderMaterial===!0,glslVersion:_.glslVersion,precision:u,batching:pe,batchingColor:pe&&U._colorsTexture!==null,instancing:Be,instancingColor:Be&&U.instanceColor!==null,instancingMorph:Be&&U.morphTexture!==null,outputColorSpace:$===null?r.outputColorSpace:$.isXRRenderTarget===!0?$.texture.colorSpace:et.workingColorSpace,alphaToCoverage:!!_.alphaToCoverage,map:Te,matcap:ie,envMap:re,envMapMode:re&&J.mapping,envMapCubeUVHeight:X,aoMap:te,lightMap:_e,bumpMap:ve,normalMap:Re,displacementMap:Pe,emissiveMap:Je,normalMapObjectSpace:Re&&_.normalMapType===mh,normalMapTangentSpace:Re&&_.normalMapType===co,packedNormalMap:Re&&_.normalMapType===co&&Wg(_.normalMap.format),metalnessMap:ze,roughnessMap:je,anisotropy:N,anisotropyMap:q,clearcoat:mt,clearcoatMap:ce,clearcoatNormalMap:de,clearcoatRoughnessMap:F,dispersion:We,retroreflection:C,iridescence:v,iridescenceMap:he,iridescenceThicknessMap:ue,sheen:B,sheenColorMap:Ee,sheenRoughnessMap:ne,specularMap:Ge,specularColorMap:Ie,specularIntensityMap:Ve,transmission:W,transmissionMap:Ye,thicknessMap:O,gradientMap:ee,opaque:_.transparent===!1&&_.blending===Br&&_.alphaToCoverage===!1,alphaMap:oe,alphaTest:xe,alphaHash:be,combine:_.combine,mapUv:Te&&g(_.map.channel),aoMapUv:te&&g(_.aoMap.channel),lightMapUv:_e&&g(_.lightMap.channel),bumpMapUv:ve&&g(_.bumpMap.channel),normalMapUv:Re&&g(_.normalMap.channel),displacementMapUv:Pe&&g(_.displacementMap.channel),emissiveMapUv:Je&&g(_.emissiveMap.channel),metalnessMapUv:ze&&g(_.metalnessMap.channel),roughnessMapUv:je&&g(_.roughnessMap.channel),anisotropyMapUv:q&&g(_.anisotropyMap.channel),clearcoatMapUv:ce&&g(_.clearcoatMap.channel),clearcoatNormalMapUv:de&&g(_.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:F&&g(_.clearcoatRoughnessMap.channel),iridescenceMapUv:he&&g(_.iridescenceMap.channel),iridescenceThicknessMapUv:ue&&g(_.iridescenceThicknessMap.channel),sheenColorMapUv:Ee&&g(_.sheenColorMap.channel),sheenRoughnessMapUv:ne&&g(_.sheenRoughnessMap.channel),specularMapUv:Ge&&g(_.specularMap.channel),specularColorMapUv:Ie&&g(_.specularColorMap.channel),specularIntensityMapUv:Ve&&g(_.specularIntensityMap.channel),transmissionMapUv:Ye&&g(_.transmissionMap.channel),thicknessMapUv:O&&g(_.thicknessMap.channel),alphaMapUv:oe&&g(_.alphaMap.channel),vertexTangents:!!H.attributes.tangent&&(Re||N),vertexNormals:!!H.attributes.normal,vertexColors:_.vertexColors,vertexAlphas:_.vertexColors===!0&&!!H.attributes.color&&H.attributes.color.itemSize===4,pointsUvs:U.isPoints===!0&&!!H.attributes.uv&&(Te||oe),fog:!!P,useFog:_.fog===!0,fogExp2:!!P&&P.isFogExp2,flatShading:_.wireframe===!1&&(_.flatShading===!0||H.attributes.normal===void 0&&Re===!1&&(_.isMeshLambertMaterial||_.isMeshPhongMaterial||_.isMeshStandardMaterial||_.isMeshPhysicalMaterial)),sizeAttenuation:_.sizeAttenuation===!0,logarithmicDepthBuffer:m,reversedDepthBuffer:ye,skinning:U.isSkinnedMesh===!0,hasPositionAttribute:H.attributes.position!==void 0,morphTargets:H.morphAttributes.position!==void 0,morphNormals:H.morphAttributes.normal!==void 0,morphColors:H.morphAttributes.color!==void 0,morphTargetsCount:Le,morphTextureStride:fe,numSunLights:w.sun.length,numDirLights:w.directional.length,numPointLights:w.point.length,numSpotLights:w.spot.length,numSpotLightMaps:w.spotLightMap.length,numRectAreaLights:w.rectArea.length,numHemiLights:w.hemi.length,numSunLightShadows:w.sunShadowMap.length,numDirLightShadows:w.directionalShadowMap.length,numPointLightShadows:w.pointShadowMap.length,numSpotLightShadows:w.spotShadowMap.length,numSpotLightShadowsWithMaps:w.numSpotLightShadowsWithMaps,numLightProbes:w.numLightProbes,numLightProbeGrids:V.length,numClippingPlanes:a.numPlanes,numClipIntersection:a.numIntersection,dithering:_.dithering,shadowMapEnabled:r.shadowMap.enabled&&I.length>0,shadowMapType:r.shadowMap.type,toneMapping:Ne,decodeVideoTexture:Te&&_.map.isVideoTexture===!0&&et.getTransfer(_.map.colorSpace)===st,decodeVideoTextureEmissive:Je&&_.emissiveMap.isVideoTexture===!0&&et.getTransfer(_.emissiveMap.colorSpace)===st,premultipliedAlpha:_.premultipliedAlpha,doubleSided:_.side===pi,flipSided:_.side===Pt,useDepthPacking:_.depthPacking>=0,depthPacking:_.depthPacking||0,index0AttributeName:_.index0AttributeName,extensionClipCullDistance:se&&_.extensions.clipCullDistance===!0&&t.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(se&&_.extensions.multiDraw===!0||pe)&&t.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:t.has("KHR_parallel_shader_compile"),customProgramCacheKey:_.customProgramCacheKey()};return Se.vertexUv1s=l.has(1),Se.vertexUv2s=l.has(2),Se.vertexUv3s=l.has(3),l.clear(),Se}function f(_){let w=[];if(_.shaderID?w.push(_.shaderID):(w.push(_.customVertexShaderID),w.push(_.customFragmentShaderID)),_.defines!==void 0)for(let I in _.defines)w.push(I),w.push(_.defines[I]);return _.isRawShaderMaterial===!1&&(p(w,_),y(w,_),w.push(r.outputColorSpace)),w.push(_.customProgramCacheKey),w.join()}function p(_,w){_.push(w.precision),_.push(w.outputColorSpace),_.push(w.envMapMode),_.push(w.envMapCubeUVHeight),_.push(w.mapUv),_.push(w.alphaMapUv),_.push(w.lightMapUv),_.push(w.aoMapUv),_.push(w.bumpMapUv),_.push(w.normalMapUv),_.push(w.displacementMapUv),_.push(w.emissiveMapUv),_.push(w.metalnessMapUv),_.push(w.roughnessMapUv),_.push(w.anisotropyMapUv),_.push(w.clearcoatMapUv),_.push(w.clearcoatNormalMapUv),_.push(w.clearcoatRoughnessMapUv),_.push(w.iridescenceMapUv),_.push(w.iridescenceThicknessMapUv),_.push(w.sheenColorMapUv),_.push(w.sheenRoughnessMapUv),_.push(w.specularMapUv),_.push(w.specularColorMapUv),_.push(w.specularIntensityMapUv),_.push(w.transmissionMapUv),_.push(w.thicknessMapUv),_.push(w.combine),_.push(w.fogExp2),_.push(w.sizeAttenuation),_.push(w.morphTargetsCount),_.push(w.morphAttributeCount),_.push(w.numSunLights),_.push(w.numDirLights),_.push(w.numPointLights),_.push(w.numSpotLights),_.push(w.numSpotLightMaps),_.push(w.numHemiLights),_.push(w.numRectAreaLights),_.push(w.numSunLightShadows),_.push(w.numDirLightShadows),_.push(w.numPointLightShadows),_.push(w.numSpotLightShadows),_.push(w.numSpotLightShadowsWithMaps),_.push(w.numLightProbes),_.push(w.shadowMapType),_.push(w.toneMapping),_.push(w.numClippingPlanes),_.push(w.numClipIntersection),_.push(w.depthPacking)}function y(_,w){n.disableAll(),w.instancing&&n.enable(0),w.instancingColor&&n.enable(1),w.instancingMorph&&n.enable(2),w.matcap&&n.enable(3),w.envMap&&n.enable(4),w.normalMapObjectSpace&&n.enable(5),w.normalMapTangentSpace&&n.enable(6),w.clearcoat&&n.enable(7),w.iridescence&&n.enable(8),w.alphaTest&&n.enable(9),w.vertexColors&&n.enable(10),w.vertexAlphas&&n.enable(11),w.vertexUv1s&&n.enable(12),w.vertexUv2s&&n.enable(13),w.vertexUv3s&&n.enable(14),w.vertexTangents&&n.enable(15),w.anisotropy&&n.enable(16),w.alphaHash&&n.enable(17),w.batching&&n.enable(18),w.dispersion&&n.enable(19),w.retroreflection&&n.enable(24),w.batchingColor&&n.enable(20),w.gradientMap&&n.enable(21),w.packedNormalMap&&n.enable(22),w.vertexNormals&&n.enable(23),_.push(n.mask),n.disableAll(),w.fog&&n.enable(0),w.useFog&&n.enable(1),w.flatShading&&n.enable(2),w.logarithmicDepthBuffer&&n.enable(3),w.reversedDepthBuffer&&n.enable(4),w.skinning&&n.enable(5),w.morphTargets&&n.enable(6),w.morphNormals&&n.enable(7),w.morphColors&&n.enable(8),w.premultipliedAlpha&&n.enable(9),w.shadowMapEnabled&&n.enable(10),w.doubleSided&&n.enable(11),w.flipSided&&n.enable(12),w.useDepthPacking&&n.enable(13),w.dithering&&n.enable(14),w.transmission&&n.enable(15),w.sheen&&n.enable(16),w.opaque&&n.enable(17),w.pointsUvs&&n.enable(18),w.decodeVideoTexture&&n.enable(19),w.decodeVideoTextureEmissive&&n.enable(20),w.alphaToCoverage&&n.enable(21),w.numLightProbeGrids>0&&n.enable(22),w.hasPositionAttribute&&n.enable(23),_.push(n.mask)}function E(_){let w=d[_.type],I;if(w){let L=gi[w];I=Lh.clone(L.uniforms)}else I=_.uniforms;return I}function x(_,w){let I=h.get(w);return I!==void 0?++I.usedTimes:(I=new kg(r,w,_,s),c.push(I),h.set(w,I)),I}function T(_){if(--_.usedTimes===0){let w=c.indexOf(_);c[w]=c[c.length-1],c.pop(),h.delete(_.cacheKey),_.destroy()}}function b(_){o.remove(_)}function A(){o.dispose()}return{getParameters:S,getProgramCacheKey:f,getUniforms:E,acquireProgram:x,releaseProgram:T,releaseShaderCache:b,programs:c,dispose:A}}function jg(){let r=new WeakMap;function e(n){return r.has(n)}function t(n){let o=r.get(n);return o===void 0&&(o={},r.set(n,o)),o}function i(n){r.delete(n)}function s(n,o,l){r.get(n)[o]=l}function a(){r=new WeakMap}return{has:e,get:t,remove:i,update:s,dispose:a}}function qg(r,e){return r.groupOrder!==e.groupOrder?r.groupOrder-e.groupOrder:r.renderOrder!==e.renderOrder?r.renderOrder-e.renderOrder:r.material.id!==e.material.id?r.material.id-e.material.id:r.materialVariant!==e.materialVariant?r.materialVariant-e.materialVariant:r.z!==e.z?r.z-e.z:r.id-e.id}function $h(r,e){return r.groupOrder!==e.groupOrder?r.groupOrder-e.groupOrder:r.renderOrder!==e.renderOrder?r.renderOrder-e.renderOrder:r.z!==e.z?e.z-r.z:r.id-e.id}function Qh(){let r=[],e=0,t=[],i=[],s=[];function a(){e=0,t.length=0,i.length=0,s.length=0}function n(u){let d=0;return u.isInstancedMesh&&(d+=2),u.isSkinnedMesh&&(d+=1),d}function o(u,d,g,S,f,p){let y=r[e];return y===void 0?(y={id:u.id,object:u,geometry:d,material:g,materialVariant:n(u),groupOrder:S,renderOrder:u.renderOrder,z:f,group:p},r[e]=y):(y.id=u.id,y.object=u,y.geometry=d,y.material=g,y.materialVariant=n(u),y.groupOrder=S,y.renderOrder=u.renderOrder,y.z=f,y.group=p),e++,y}function l(u,d,g,S,f,p,y){y.reversedDepth===!0&&(f=-f);let E=o(u,d,g,S,f,p);g.transmission>0?i.push(E):g.transparent===!0?s.push(E):t.push(E)}function c(u,d,g,S,f,p){let y=o(u,d,g,S,f,p);g.transmission>0?i.unshift(y):g.transparent===!0?s.unshift(y):t.unshift(y)}function h(u,d){t.length>1&&t.sort(u||qg),i.length>1&&i.sort(d||$h),s.length>1&&s.sort(d||$h)}function m(){for(let u=e,d=r.length;u<d;u++){let g=r[u];if(g.id===null)break;g.id=null,g.object=null,g.geometry=null,g.material=null,g.group=null}}return{opaque:t,transmissive:i,transparent:s,init:a,push:l,unshift:c,finish:m,sort:h}}function Yg(){let r=new WeakMap;function e(i,s){let a=r.get(i),n;return a===void 0?(n=new Qh,r.set(i,[n])):s>=a.length?(n=new Qh,a.push(n)):n=a[s],n}function t(){r=new WeakMap}return{get:e,dispose:t}}function Zg(){let r={};return{get:function(e){if(r[e.id]!==void 0)return r[e.id];let t;switch(e.type){case"SunLight":case"DirectionalLight":t={direction:new R,color:new He};break;case"SpotLight":t={position:new R,direction:new R,color:new He,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":t={position:new R,color:new He,distance:0,decay:0};break;case"HemisphereLight":t={direction:new R,skyColor:new He,groundColor:new He};break;case"RectAreaLight":t={color:new He,position:new R,halfWidth:new R,halfHeight:new R};break}return r[e.id]=t,t}}}function Jg(){let r={};return{get:function(e){if(r[e.id]!==void 0)return r[e.id];let t;switch(e.type){case"SunLight":case"DirectionalLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ae};break;case"SpotLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ae};break;case"PointLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ae,shadowCameraNear:1,shadowCameraFar:1e3};break}return r[e.id]=t,t}}}var Kg=0;function $g(r,e){return(e.castShadow?2:0)-(r.castShadow?2:0)+(e.map?1:0)-(r.map?1:0)}function Qg(r){let e=new Zg,t=Jg(),i={version:0,hash:{sunLength:-1,directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numSunShadows:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],sun:[],sunShadow:[],sunShadowMap:[],sunShadowMatrix:[],sunShadowCascade:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let c=0;c<9;c++)i.probe.push(new R);let s=new R,a=new Xe,n=new Xe;function o(c){let h=0,m=0,u=0;for(let U=0;U<9;U++)i.probe[U].set(0,0,0);let d=0,g=0,S=0,f=0,p=0,y=0,E=0,x=0,T=0,b=0,A=0,_=0,w=0,I=0;c.sort($g);for(let U=0,V=c.length;U<V;U++){let P=c[U],H=P.color,Y=P.intensity,z=P.distance,J=null;if(P.shadow&&P.shadow.map&&(P.shadow.map.texture.format===qi?J=P.shadow.map.texture:J=P.shadow.map.depthTexture||P.shadow.map.texture),P.isAmbientLight)h+=H.r*Y,m+=H.g*Y,u+=H.b*Y;else if(P.isLightProbe){for(let X=0;X<9;X++)i.probe[X].addScaledVector(P.sh.coefficients[X],Y);I++}else if(P.isSunLight){let X=e.get(P);if(X.color.copy(P.color).multiplyScalar(P.intensity),P.castShadow){let Z=P.shadow,Q=t.get(P);Q.shadowIntensity=Z.intensity,Q.shadowBias=Z.bias,Q.shadowNormalBias=Z.normalBias,Q.shadowRadius=Z.radius,Q.shadowMapSize.copy(Z.mapSize).multiply(Z.getFrameExtents()),i.sunShadow[g]=Q,i.sunShadowMap[g]=J;let Le=Z.getViewportCount();for(let fe=0;fe<Le;fe++)i.sunShadowMatrix[S+fe]=Z.getMatrix(fe),i.sunShadowCascade[S+fe]=Z._cascadeData[fe];S+=Le,g++}i.sun[d]=X,d++}else if(P.isDirectionalLight){let X=e.get(P);if(X.color.copy(P.color).multiplyScalar(P.intensity),P.castShadow){let Z=P.shadow,Q=t.get(P);Q.shadowIntensity=Z.intensity,Q.shadowBias=Z.bias,Q.shadowNormalBias=Z.normalBias,Q.shadowRadius=Z.radius,Q.shadowMapSize=Z.mapSize,i.directionalShadow[f]=Q,i.directionalShadowMap[f]=J,i.directionalShadowMatrix[f]=P.shadow.matrix,T++}i.directional[f]=X,f++}else if(P.isSpotLight){let X=e.get(P);X.position.setFromMatrixPosition(P.matrixWorld),X.color.copy(H).multiplyScalar(Y),X.distance=z,X.coneCos=Math.cos(P.angle),X.penumbraCos=Math.cos(P.angle*(1-P.penumbra)),X.decay=P.decay,i.spot[y]=X;let Z=P.shadow;if(P.map&&(i.spotLightMap[_]=P.map,_++,Z.updateMatrices(P),P.castShadow&&w++),i.spotLightMatrix[y]=Z.matrix,P.castShadow){let Q=t.get(P);Q.shadowIntensity=Z.intensity,Q.shadowBias=Z.bias,Q.shadowNormalBias=Z.normalBias,Q.shadowRadius=Z.radius,Q.shadowMapSize=Z.mapSize,i.spotShadow[y]=Q,i.spotShadowMap[y]=J,A++}y++}else if(P.isRectAreaLight){let X=e.get(P);X.color.copy(H).multiplyScalar(Y),X.halfWidth.set(P.width*.5,0,0),X.halfHeight.set(0,P.height*.5,0),i.rectArea[E]=X,E++}else if(P.isPointLight){let X=e.get(P);if(X.color.copy(P.color).multiplyScalar(P.intensity),X.distance=P.distance,X.decay=P.decay,P.castShadow){let Z=P.shadow,Q=t.get(P);Q.shadowIntensity=Z.intensity,Q.shadowBias=Z.bias,Q.shadowNormalBias=Z.normalBias,Q.shadowRadius=Z.radius,Q.shadowMapSize=Z.mapSize,Q.shadowCameraNear=Z.camera.near,Q.shadowCameraFar=Z.camera.far,i.pointShadow[p]=Q,i.pointShadowMap[p]=J,i.pointShadowMatrix[p]=P.shadow.matrix,b++}i.point[p]=X,p++}else if(P.isHemisphereLight){let X=e.get(P);X.skyColor.copy(P.color).multiplyScalar(Y),X.groundColor.copy(P.groundColor).multiplyScalar(Y),i.hemi[x]=X,x++}}E>0&&(r.has("OES_texture_float_linear")===!0?(i.rectAreaLTC1=me.LTC_FLOAT_1,i.rectAreaLTC2=me.LTC_FLOAT_2):(i.rectAreaLTC1=me.LTC_HALF_1,i.rectAreaLTC2=me.LTC_HALF_2)),i.ambient[0]=h,i.ambient[1]=m,i.ambient[2]=u;let L=i.hash;(L.sunLength!==d||L.directionalLength!==f||L.pointLength!==p||L.spotLength!==y||L.rectAreaLength!==E||L.hemiLength!==x||L.numSunShadows!==g||L.numDirectionalShadows!==T||L.numPointShadows!==b||L.numSpotShadows!==A||L.numSpotMaps!==_||L.numLightProbes!==I)&&(i.sun.length=d,i.directional.length=f,i.spot.length=y,i.rectArea.length=E,i.point.length=p,i.hemi.length=x,i.sunShadow.length=g,i.sunShadowMap.length=g,i.sunShadowMatrix.length=S,i.sunShadowCascade.length=S,i.directionalShadow.length=T,i.directionalShadowMap.length=T,i.directionalShadowMatrix.length=T,i.pointShadow.length=b,i.pointShadowMap.length=b,i.pointShadowMatrix.length=b,i.spotShadow.length=A,i.spotShadowMap.length=A,i.spotLightMatrix.length=A+_-w,i.spotLightMap.length=_,i.numSpotLightShadowsWithMaps=w,i.numLightProbes=I,L.sunLength=d,L.directionalLength=f,L.pointLength=p,L.spotLength=y,L.rectAreaLength=E,L.hemiLength=x,L.numSunShadows=g,L.numDirectionalShadows=T,L.numPointShadows=b,L.numSpotShadows=A,L.numSpotMaps=_,L.numLightProbes=I,i.version=Kg++)}function l(c,h){let m=0,u=0,d=0,g=0,S=0,f=0,p=h.matrixWorldInverse;for(let y=0,E=c.length;y<E;y++){let x=c[y];if(x.isSunLight){let T=i.sun[m];T.direction.setFromMatrixPosition(x.matrixWorld),T.direction.transformDirection(p),m++}else if(x.isDirectionalLight){let T=i.directional[u];T.direction.setFromMatrixPosition(x.matrixWorld),s.setFromMatrixPosition(x.target.matrixWorld),T.direction.sub(s),T.direction.transformDirection(p),u++}else if(x.isSpotLight){let T=i.spot[g];T.position.setFromMatrixPosition(x.matrixWorld),T.position.applyMatrix4(p),T.direction.setFromMatrixPosition(x.matrixWorld),s.setFromMatrixPosition(x.target.matrixWorld),T.direction.sub(s),T.direction.transformDirection(p),g++}else if(x.isRectAreaLight){let T=i.rectArea[S];T.position.setFromMatrixPosition(x.matrixWorld),T.position.applyMatrix4(p),n.identity(),a.copy(x.matrixWorld),a.premultiply(p),n.extractRotation(a),T.halfWidth.set(x.width*.5,0,0),T.halfHeight.set(0,x.height*.5,0),T.halfWidth.applyMatrix4(n),T.halfHeight.applyMatrix4(n),S++}else if(x.isPointLight){let T=i.point[d];T.position.setFromMatrixPosition(x.matrixWorld),T.position.applyMatrix4(p),d++}else if(x.isHemisphereLight){let T=i.hemi[f];T.direction.setFromMatrixPosition(x.matrixWorld),T.direction.transformDirection(p),f++}}}return{setup:o,setupView:l,state:i}}function eu(r){let e=new Qg(r),t=[],i=[],s=[];function a(u){m.camera=u,t.length=0,i.length=0,s.length=0}function n(u){t.push(u)}function o(u){i.push(u)}function l(u){s.push(u)}function c(){e.setup(t)}function h(u){e.setupView(t,u)}let m={lightsArray:t,shadowsArray:i,lightProbeGridArray:s,camera:null,lights:e,transmissionRenderTarget:{},textureUnits:0};return{init:a,state:m,setupLights:c,setupLightsView:h,pushLight:n,pushShadow:o,pushLightProbeGrid:l}}function e_(r){let e=new WeakMap;function t(s,a=0){let n=e.get(s),o;return n===void 0?(o=new eu(r),e.set(s,[o])):a>=n.length?(o=new eu(r),n.push(o)):o=n[a],o}function i(){e=new WeakMap}return{get:t,dispose:i}}var t_=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,i_=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ).rg;
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ).r;
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( max( 0.0, squared_mean - mean * mean ) );
	gl_FragColor = vec4( mean, std_dev, 0.0, 1.0 );
}`,r_=[new R(1,0,0),new R(-1,0,0),new R(0,1,0),new R(0,-1,0),new R(0,0,1),new R(0,0,-1)],s_=[new R(0,-1,0),new R(0,-1,0),new R(0,0,1),new R(0,0,-1),new R(0,-1,0),new R(0,-1,0)],tu=new Xe,Gs=new R,Wl=new R;function a_(r,e,t){let i=new Ai,s=new ae,a=new ae,n=new lt,o=new on,l=new ln,c={},h=t.maxTextureSize,m={[Hi]:Pt,[Pt]:Hi,[pi]:pi},u=new kt({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new ae},radius:{value:4}},vertexShader:t_,fragmentShader:i_}),d=u.clone();d.defines.HORIZONTAL_PASS=1;let g=new ct;g.setAttribute("position",new jt(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));let S=new Et(g,u),f=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=Is;let p=this.type;this.render=function(b,A,_){if(f.enabled===!1||f.autoUpdate===!1&&f.needsUpdate===!1||b.length===0)return;this.type===Xc&&(Ue("WebGLShadowMap: PCFSoftShadowMap has been removed. Using PCFShadowMap instead."),this.type=Is);let w=r.getRenderTarget(),I=r.getActiveCubeFace(),L=r.getActiveMipmapLevel(),U=r.state;U.setBlending(mi),U.buffers.depth.getReversed()===!0?U.buffers.color.setClear(0,0,0,0):U.buffers.color.setClear(1,1,1,1),U.buffers.depth.setTest(!0),U.setScissorTest(!1);let V=p!==this.type;V&&A.traverse(function(P){P.material&&(Array.isArray(P.material)?P.material.forEach(H=>H.needsUpdate=!0):P.material.needsUpdate=!0)});for(let P=0,H=b.length;P<H;P++){let Y=b[P],z=Y.shadow;if(z===void 0){Ue("WebGLShadowMap:",Y,"has no shadow.");continue}if(z.autoUpdate===!1&&z.needsUpdate===!1)continue;s.copy(z.mapSize);let J=z.getFrameExtents();s.multiply(J),a.copy(z.mapSize),(s.x>h||s.y>h)&&(s.x>h&&(a.x=Math.floor(h/J.x),s.x=a.x*J.x,z.mapSize.x=a.x),s.y>h&&(a.y=Math.floor(h/J.y),s.y=a.y*J.y,z.mapSize.y=a.y));let X=r.state.buffers.depth.getReversed();if(z.camera._reversedDepth=X,z.map===null||V===!0){if(z.map!==null&&(z.map.depthTexture!==null&&(z.map.depthTexture.dispose(),z.map.depthTexture=null),z.map.dispose()),this.type===Fr){if(Y.isPointLight){Ue("WebGLShadowMap: VSM shadow maps are not supported for PointLights. Use PCF or BasicShadowMap instead.");continue}z.map=new Dt(s.x,s.y,{format:qi,type:ai,minFilter:wt,magFilter:wt,generateMipmaps:!1}),z.map.texture.name=Y.name+".shadowMap",z.map.depthTexture=new zi(s.x,s.y,si),z.map.depthTexture.name=Y.name+".shadowMapDepth",z.map.depthTexture.format=ui,z.map.depthTexture.compareFunction=null,z.map.depthTexture.minFilter=bt,z.map.depthTexture.magFilter=bt}else Y.isPointLight?(z.map=new go(s.x),z.map.depthTexture=new Fa(s.x,ri)):(z.map=new Dt(s.x,s.y),z.map.depthTexture=new zi(s.x,s.y,ri)),z.map.depthTexture.name=Y.name+".shadowMap",z.map.depthTexture.format=ui,this.type===Is?(z.map.depthTexture.compareFunction=X?uo:ho,z.map.depthTexture.minFilter=wt,z.map.depthTexture.magFilter=wt):(z.map.depthTexture.compareFunction=null,z.map.depthTexture.minFilter=bt,z.map.depthTexture.magFilter=bt);z.camera.updateProjectionMatrix()}z.map.isWebGLCubeRenderTarget!==!0&&(z.map.width!==s.x||z.map.height!==s.y)&&z.map.setSize(s.x,s.y);let Z=z.map.isWebGLCubeRenderTarget?6:z.getViewportCount();Y.isPointLight!==!0&&z.updateMatrices(Y,_);for(let Q=0;Q<Z;Q++){let Le=z.getCamera(Q);if(Y.isPointLight){let fe=z.camera,qe=z.matrix,Qe=Y.distance||fe.far;Qe!==fe.far&&(fe.far=Qe,fe.updateProjectionMatrix()),Gs.setFromMatrixPosition(Y.matrixWorld),fe.position.copy(Gs),Wl.copy(fe.position),Wl.add(r_[Q]),fe.up.copy(s_[Q]),fe.lookAt(Wl),fe.updateMatrixWorld(),qe.makeTranslation(-Gs.x,-Gs.y,-Gs.z),tu.multiplyMatrices(fe.projectionMatrix,fe.matrixWorldInverse),z._frustum.setFromProjectionMatrix(tu,fe.coordinateSystem,fe.reversedDepth)}if(z.map.isWebGLCubeRenderTarget)r.setRenderTarget(z.map,Q),r.clear();else{Q===0&&(r.setRenderTarget(z.map),r.clear());let fe=z.getViewport(Q);n.set(a.x*fe.x,a.y*fe.y,a.x*fe.z,a.y*fe.w),U.viewport(n)}i=z.getFrustum(Q),x(A,_,Le,Y,this.type)}z.isPointLightShadow!==!0&&this.type===Fr&&y(z,_),z.needsUpdate=!1}p=this.type,f.needsUpdate=!1,r.setRenderTarget(w,I,L)};function y(b,A){let _=e.update(S);u.defines.VSM_SAMPLES!==b.blurSamples&&(u.defines.VSM_SAMPLES=b.blurSamples,d.defines.VSM_SAMPLES=b.blurSamples,u.needsUpdate=!0,d.needsUpdate=!0),b.mapPass===null?b.mapPass=new Dt(s.x,s.y,{format:qi,type:ai}):(b.mapPass.width!==b.map.width||b.mapPass.height!==b.map.height)&&b.mapPass.setSize(b.map.width,b.map.height),u.uniforms.shadow_pass.value=b.map.depthTexture,u.uniforms.resolution.value.set(b.map.width,b.map.height),u.uniforms.radius.value=b.radius,r.setRenderTarget(b.mapPass),r.clear(),r.renderBufferDirect(A,null,_,u,S,null),d.uniforms.shadow_pass.value=b.mapPass.texture,d.uniforms.resolution.value.set(b.map.width,b.map.height),d.uniforms.radius.value=b.radius,r.setRenderTarget(b.map),r.clear(),r.renderBufferDirect(A,null,_,d,S,null)}function E(b,A,_,w){let I=null,L=_.isPointLight===!0?b.customDistanceMaterial:b.customDepthMaterial;if(L!==void 0)I=L;else if(I=_.isPointLight===!0?l:o,r.localClippingEnabled&&A.clipShadows===!0&&Array.isArray(A.clippingPlanes)&&A.clippingPlanes.length!==0||A.displacementMap&&A.displacementScale!==0||A.alphaMap&&A.alphaTest>0||A.map&&A.alphaTest>0||A.alphaToCoverage===!0){let U=I.uuid,V=A.uuid,P=c[U];P===void 0&&(P={},c[U]=P);let H=P[V];H===void 0&&(H=I.clone(),P[V]=H,A.addEventListener("dispose",T)),I=H}if(I.visible=A.visible,I.wireframe=A.wireframe,w===Fr?I.side=A.shadowSide!==null?A.shadowSide:A.side:I.side=A.shadowSide!==null?A.shadowSide:m[A.side],I.alphaMap=A.alphaMap,I.alphaTest=A.alphaToCoverage===!0?.5:A.alphaTest,I.map=A.map,I.clipShadows=A.clipShadows,I.clippingPlanes=A.clippingPlanes,I.clipIntersection=A.clipIntersection,I.displacementMap=A.displacementMap,I.displacementScale=A.displacementScale,I.displacementBias=A.displacementBias,I.wireframeLinewidth=A.wireframeLinewidth,I.linewidth=A.linewidth,_.isPointLight===!0&&I.isMeshDistanceMaterial===!0){let U=r.properties.get(I);U.light=_}return I}function x(b,A,_,w,I){if(b.visible===!1)return;if(b.layers.test(A.layers)&&(b.isMesh||b.isLine||b.isPoints)&&(b.castShadow||b.receiveShadow&&I===Fr)&&(!b.frustumCulled||b.intersectsFrustum(i))){b.modelViewMatrix.multiplyMatrices(_.matrixWorldInverse,b.matrixWorld);let U=e.update(b),V=b.material;if(Array.isArray(V)){let P=U.groups;for(let H=0,Y=P.length;H<Y;H++){let z=P[H],J=V[z.materialIndex];if(J&&J.visible){let X=E(b,J,w,I);b.onBeforeShadow(r,b,A,_,U,X,z),r.renderBufferDirect(_,null,U,X,b,z),b.onAfterShadow(r,b,A,_,U,X,z)}}}else if(V.visible){let P=E(b,V,w,I);b.onBeforeShadow(r,b,A,_,U,P,null),r.renderBufferDirect(_,null,U,P,b,null),b.onAfterShadow(r,b,A,_,U,P,null)}}let L=b.children;for(let U=0,V=L.length;U<V;U++)x(L[U],A,_,w,I)}function T(b){b.target.removeEventListener("dispose",T);for(let A in c){let _=c[A],w=b.target.uuid;w in _&&(_[w].dispose(),delete _[w])}}}function n_(r,e){function t(){let O=!1,ee=new lt,oe=null,xe=new lt(0,0,0,0);return{setMask:function(be){oe!==be&&!O&&(r.colorMask(be,be,be,be),oe=be)},setLocked:function(be){O=be},setClear:function(be,se,Ne,Se,xt){xt===!0&&(be*=Se,se*=Se,Ne*=Se),ee.set(be,se,Ne,Se),xe.equals(ee)===!1&&(r.clearColor(be,se,Ne,Se),xe.copy(ee))},reset:function(){O=!1,oe=null,xe.set(-1,0,0,0)}}}function i(){let O=!1,ee=!1,oe=null,xe=null,be=null;return{setReversed:function(se){if(ee!==se){let Ne=e.get("EXT_clip_control");se?Ne.clipControlEXT(Ne.LOWER_LEFT_EXT,Ne.ZERO_TO_ONE_EXT):Ne.clipControlEXT(Ne.LOWER_LEFT_EXT,Ne.NEGATIVE_ONE_TO_ONE_EXT),ee=se;let Se=be;be=null,this.setClear(Se)}},getReversed:function(){return ee},setTest:function(se){se?$(r.DEPTH_TEST):ye(r.DEPTH_TEST)},setMask:function(se){oe!==se&&!O&&(r.depthMask(se),oe=se)},setFunc:function(se){if(ee&&(se=Eh[se]),xe!==se){switch(se){case xa:r.depthFunc(r.NEVER);break;case ya:r.depthFunc(r.ALWAYS);break;case Sa:r.depthFunc(r.LESS);break;case wr:r.depthFunc(r.LEQUAL);break;case Ma:r.depthFunc(r.EQUAL);break;case ba:r.depthFunc(r.GEQUAL);break;case Ta:r.depthFunc(r.GREATER);break;case wa:r.depthFunc(r.NOTEQUAL);break;default:r.depthFunc(r.LEQUAL)}xe=se}},setLocked:function(se){O=se},setClear:function(se){be!==se&&(be=se,ee&&(se=1-se),r.clearDepth(se))},reset:function(){O=!1,oe=null,xe=null,be=null,ee=!1}}}function s(){let O=!1,ee=null,oe=null,xe=null,be=null,se=null,Ne=null,Se=null,xt=null;return{setTest:function(rt){O||(rt?$(r.STENCIL_TEST):ye(r.STENCIL_TEST))},setMask:function(rt){ee!==rt&&!O&&(r.stencilMask(rt),ee=rt)},setFunc:function(rt,Zt,ni){(oe!==rt||xe!==Zt||be!==ni)&&(r.stencilFunc(rt,Zt,ni),oe=rt,xe=Zt,be=ni)},setOp:function(rt,Zt,ni){(se!==rt||Ne!==Zt||Se!==ni)&&(r.stencilOp(rt,Zt,ni),se=rt,Ne=Zt,Se=ni)},setLocked:function(rt){O=rt},setClear:function(rt){xt!==rt&&(r.clearStencil(rt),xt=rt)},reset:function(){O=!1,ee=null,oe=null,xe=null,be=null,se=null,Ne=null,Se=null,xt=null}}}let a=new t,n=new i,o=new s,l=new WeakMap,c=new WeakMap,h={},m={},u={},d=new WeakMap,g=[],S=null,f=!1,p=null,y=null,E=null,x=null,T=null,b=null,A=null,_=new He(0,0,0),w=0,I=!1,L=null,U=null,V=null,P=null,H=null,Y=r.getParameter(r.MAX_COMBINED_TEXTURE_IMAGE_UNITS),z=!1,J=0,X=r.getParameter(r.VERSION);X.indexOf("WebGL")!==-1?(J=parseFloat(/^WebGL (\d)/.exec(X)[1]),z=J>=1):X.indexOf("OpenGL ES")!==-1&&(J=parseFloat(/^OpenGL ES (\d)/.exec(X)[1]),z=J>=2);let Z=null,Q={},Le=r.getParameter(r.SCISSOR_BOX),fe=r.getParameter(r.VIEWPORT),qe=new lt().fromArray(Le),Qe=new lt().fromArray(fe);function it(O,ee,oe,xe){let be=new Uint8Array(4),se=r.createTexture();r.bindTexture(O,se),r.texParameteri(O,r.TEXTURE_MIN_FILTER,r.NEAREST),r.texParameteri(O,r.TEXTURE_MAG_FILTER,r.NEAREST);for(let Ne=0;Ne<oe;Ne++)O===r.TEXTURE_3D||O===r.TEXTURE_2D_ARRAY?r.texImage3D(ee,0,r.RGBA,1,1,xe,0,r.RGBA,r.UNSIGNED_BYTE,be):r.texImage2D(ee+Ne,0,r.RGBA,1,1,0,r.RGBA,r.UNSIGNED_BYTE,be);return se}let K={};K[r.TEXTURE_2D]=it(r.TEXTURE_2D,r.TEXTURE_2D,1),K[r.TEXTURE_CUBE_MAP]=it(r.TEXTURE_CUBE_MAP,r.TEXTURE_CUBE_MAP_POSITIVE_X,6),K[r.TEXTURE_2D_ARRAY]=it(r.TEXTURE_2D_ARRAY,r.TEXTURE_2D_ARRAY,1,1),K[r.TEXTURE_3D]=it(r.TEXTURE_3D,r.TEXTURE_3D,1,1),a.setClear(0,0,0,1),n.setClear(1),o.setClear(0),$(r.DEPTH_TEST),n.setFunc(wr),ve(!1),Re(nl),$(r.CULL_FACE),te(mi);function $(O){h[O]!==!0&&(r.enable(O),h[O]=!0)}function ye(O){h[O]!==!1&&(r.disable(O),h[O]=!1)}function Be(O,ee){return u[O]!==ee?(r.bindFramebuffer(O,ee),u[O]=ee,O===r.DRAW_FRAMEBUFFER&&(u[r.FRAMEBUFFER]=ee),O===r.FRAMEBUFFER&&(u[r.DRAW_FRAMEBUFFER]=ee),!0):!1}function pe(O,ee){let oe=g,xe=!1;if(O){oe=d.get(ee),oe===void 0&&(oe=[],d.set(ee,oe));let be=O.textures;if(oe.length!==be.length||oe[0]!==r.COLOR_ATTACHMENT0){for(let se=0,Ne=be.length;se<Ne;se++)oe[se]=r.COLOR_ATTACHMENT0+se;oe.length=be.length,xe=!0}}else oe[0]!==r.BACK&&(oe[0]=r.BACK,xe=!0);xe&&r.drawBuffers(oe)}function Te(O){return S!==O?(r.useProgram(O),S=O,!0):!1}let ie={[ar]:r.FUNC_ADD,[qc]:r.FUNC_SUBTRACT,[Yc]:r.FUNC_REVERSE_SUBTRACT};ie[Zc]=r.MIN,ie[Jc]=r.MAX;let re={[Kc]:r.ZERO,[$c]:r.ONE,[Qc]:r.SRC_COLOR,[hl]:r.SRC_ALPHA,[ah]:r.SRC_ALPHA_SATURATE,[rh]:r.DST_COLOR,[th]:r.DST_ALPHA,[eh]:r.ONE_MINUS_SRC_COLOR,[ul]:r.ONE_MINUS_SRC_ALPHA,[sh]:r.ONE_MINUS_DST_COLOR,[ih]:r.ONE_MINUS_DST_ALPHA,[nh]:r.CONSTANT_COLOR,[oh]:r.ONE_MINUS_CONSTANT_COLOR,[lh]:r.CONSTANT_ALPHA,[ch]:r.ONE_MINUS_CONSTANT_ALPHA};function te(O,ee,oe,xe,be,se,Ne,Se,xt,rt){if(O===mi){f===!0&&(ye(r.BLEND),f=!1);return}if(f===!1&&($(r.BLEND),f=!0),O!==jc){if(O!==p||rt!==I){if((y!==ar||T!==ar)&&(r.blendEquation(r.FUNC_ADD),y=ar,T=ar),rt)switch(O){case Br:r.blendFuncSeparate(r.ONE,r.ONE_MINUS_SRC_ALPHA,r.ONE,r.ONE_MINUS_SRC_ALPHA);break;case ol:r.blendFunc(r.ONE,r.ONE);break;case ll:r.blendFuncSeparate(r.ZERO,r.ONE_MINUS_SRC_COLOR,r.ZERO,r.ONE);break;case cl:r.blendFuncSeparate(r.DST_COLOR,r.ONE_MINUS_SRC_ALPHA,r.ZERO,r.ONE);break;default:Fe("WebGLState: Invalid blending: ",O);break}else switch(O){case Br:r.blendFuncSeparate(r.SRC_ALPHA,r.ONE_MINUS_SRC_ALPHA,r.ONE,r.ONE_MINUS_SRC_ALPHA);break;case ol:r.blendFuncSeparate(r.SRC_ALPHA,r.ONE,r.ONE,r.ONE);break;case ll:Fe("WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true");break;case cl:Fe("WebGLState: MultiplyBlending requires material.premultipliedAlpha = true");break;default:Fe("WebGLState: Invalid blending: ",O);break}E=null,x=null,b=null,A=null,_.set(0,0,0),w=0,p=O,I=rt}return}be=be||ee,se=se||oe,Ne=Ne||xe,(ee!==y||be!==T)&&(r.blendEquationSeparate(ie[ee],ie[be]),y=ee,T=be),(oe!==E||xe!==x||se!==b||Ne!==A)&&(r.blendFuncSeparate(re[oe],re[xe],re[se],re[Ne]),E=oe,x=xe,b=se,A=Ne),(Se.equals(_)===!1||xt!==w)&&(r.blendColor(Se.r,Se.g,Se.b,xt),_.copy(Se),w=xt),p=O,I=!1}function _e(O,ee){O.side===pi?ye(r.CULL_FACE):$(r.CULL_FACE);let oe=O.side===Pt;ee&&(oe=!oe),ve(oe),O.blending===Br&&O.transparent===!1?te(mi):te(O.blending,O.blendEquation,O.blendSrc,O.blendDst,O.blendEquationAlpha,O.blendSrcAlpha,O.blendDstAlpha,O.blendColor,O.blendAlpha,O.premultipliedAlpha),n.setFunc(O.depthFunc),n.setTest(O.depthTest),n.setMask(O.depthWrite),a.setMask(O.colorWrite);let xe=O.stencilWrite;o.setTest(xe),xe&&(o.setMask(O.stencilWriteMask),o.setFunc(O.stencilFunc,O.stencilRef,O.stencilFuncMask),o.setOp(O.stencilFail,O.stencilZFail,O.stencilZPass)),Je(O.polygonOffset,O.polygonOffsetFactor,O.polygonOffsetUnits),O.alphaToCoverage===!0?$(r.SAMPLE_ALPHA_TO_COVERAGE):ye(r.SAMPLE_ALPHA_TO_COVERAGE)}function ve(O){L!==O&&(O?r.frontFace(r.CW):r.frontFace(r.CCW),L=O)}function Re(O){O!==Hc?($(r.CULL_FACE),O!==U&&(O===nl?r.cullFace(r.BACK):O===Wc?r.cullFace(r.FRONT):r.cullFace(r.FRONT_AND_BACK))):ye(r.CULL_FACE),U=O}function Pe(O){O!==V&&(z&&r.lineWidth(O),V=O)}function Je(O,ee,oe){O?($(r.POLYGON_OFFSET_FILL),(P!==ee||H!==oe)&&(P=ee,H=oe,n.getReversed()&&(ee=-ee),r.polygonOffset(ee,oe))):ye(r.POLYGON_OFFSET_FILL)}function ze(O){O?$(r.SCISSOR_TEST):ye(r.SCISSOR_TEST)}function je(O){O===void 0&&(O=r.TEXTURE0+Y-1),Z!==O&&(r.activeTexture(O),Z=O)}function N(O,ee,oe){oe===void 0&&(Z===null?oe=r.TEXTURE0+Y-1:oe=Z);let xe=Q[oe];xe===void 0&&(xe={type:void 0,texture:void 0},Q[oe]=xe),(xe.type!==O||xe.texture!==ee)&&(Z!==oe&&(r.activeTexture(oe),Z=oe),r.bindTexture(O,ee||K[O]),xe.type=O,xe.texture=ee)}function mt(){let O=Q[Z];O!==void 0&&O.type!==void 0&&(r.bindTexture(O.type,null),O.type=void 0,O.texture=void 0)}function We(){try{r.compressedTexImage2D(...arguments)}catch(O){Fe("WebGLState:",O)}}function C(){try{r.compressedTexImage3D(...arguments)}catch(O){Fe("WebGLState:",O)}}function v(){try{r.texSubImage2D(...arguments)}catch(O){Fe("WebGLState:",O)}}function B(){try{r.texSubImage3D(...arguments)}catch(O){Fe("WebGLState:",O)}}function W(){try{r.compressedTexSubImage2D(...arguments)}catch(O){Fe("WebGLState:",O)}}function q(){try{r.compressedTexSubImage3D(...arguments)}catch(O){Fe("WebGLState:",O)}}function ce(){try{r.texStorage2D(...arguments)}catch(O){Fe("WebGLState:",O)}}function de(){try{r.texStorage3D(...arguments)}catch(O){Fe("WebGLState:",O)}}function F(){try{r.texImage2D(...arguments)}catch(O){Fe("WebGLState:",O)}}function he(){try{r.texImage3D(...arguments)}catch(O){Fe("WebGLState:",O)}}function ue(O){return m[O]!==void 0?m[O]:r.getParameter(O)}function Ee(O,ee){m[O]!==ee&&(r.pixelStorei(O,ee),m[O]=ee)}function ne(O){qe.equals(O)===!1&&(r.scissor(O.x,O.y,O.z,O.w),qe.copy(O))}function Ge(O){Qe.equals(O)===!1&&(r.viewport(O.x,O.y,O.z,O.w),Qe.copy(O))}function Ie(O,ee){let oe=c.get(ee);oe===void 0&&(oe=new WeakMap,c.set(ee,oe));let xe=oe.get(O);xe===void 0&&(xe=r.getUniformBlockIndex(ee,O.name),oe.set(O,xe))}function Ve(O,ee){let oe=c.get(ee).get(O);l.get(ee)!==oe&&(r.uniformBlockBinding(ee,oe,O.__bindingPointIndex),l.set(ee,oe))}function Ye(){r.disable(r.BLEND),r.disable(r.CULL_FACE),r.disable(r.DEPTH_TEST),r.disable(r.POLYGON_OFFSET_FILL),r.disable(r.SCISSOR_TEST),r.disable(r.STENCIL_TEST),r.disable(r.SAMPLE_ALPHA_TO_COVERAGE),r.blendEquation(r.FUNC_ADD),r.blendFunc(r.ONE,r.ZERO),r.blendFuncSeparate(r.ONE,r.ZERO,r.ONE,r.ZERO),r.blendColor(0,0,0,0),r.colorMask(!0,!0,!0,!0),r.clearColor(0,0,0,0),r.depthMask(!0),r.depthFunc(r.LESS),n.setReversed(!1),r.clearDepth(1),r.stencilMask(4294967295),r.stencilFunc(r.ALWAYS,0,4294967295),r.stencilOp(r.KEEP,r.KEEP,r.KEEP),r.clearStencil(0),r.cullFace(r.BACK),r.frontFace(r.CCW),r.polygonOffset(0,0),r.activeTexture(r.TEXTURE0),r.bindFramebuffer(r.FRAMEBUFFER,null),r.bindFramebuffer(r.DRAW_FRAMEBUFFER,null),r.bindFramebuffer(r.READ_FRAMEBUFFER,null),r.useProgram(null),r.lineWidth(1),r.scissor(0,0,r.canvas.width,r.canvas.height),r.viewport(0,0,r.canvas.width,r.canvas.height),r.pixelStorei(r.PACK_ALIGNMENT,4),r.pixelStorei(r.UNPACK_ALIGNMENT,4),r.pixelStorei(r.UNPACK_FLIP_Y_WEBGL,!1),r.pixelStorei(r.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),r.pixelStorei(r.UNPACK_COLORSPACE_CONVERSION_WEBGL,r.BROWSER_DEFAULT_WEBGL),r.pixelStorei(r.PACK_ROW_LENGTH,0),r.pixelStorei(r.PACK_SKIP_PIXELS,0),r.pixelStorei(r.PACK_SKIP_ROWS,0),r.pixelStorei(r.UNPACK_ROW_LENGTH,0),r.pixelStorei(r.UNPACK_IMAGE_HEIGHT,0),r.pixelStorei(r.UNPACK_SKIP_PIXELS,0),r.pixelStorei(r.UNPACK_SKIP_ROWS,0),r.pixelStorei(r.UNPACK_SKIP_IMAGES,0),h={},m={},Z=null,Q={},u={},d=new WeakMap,g=[],S=null,f=!1,p=null,y=null,E=null,x=null,T=null,b=null,A=null,_=new He(0,0,0),w=0,I=!1,L=null,U=null,V=null,P=null,H=null,qe.set(0,0,r.canvas.width,r.canvas.height),Qe.set(0,0,r.canvas.width,r.canvas.height),a.reset(),n.reset(),o.reset()}return{buffers:{color:a,depth:n,stencil:o},enable:$,disable:ye,bindFramebuffer:Be,drawBuffers:pe,useProgram:Te,setBlending:te,setMaterial:_e,setFlipSided:ve,setCullFace:Re,setLineWidth:Pe,setPolygonOffset:Je,setScissorTest:ze,activeTexture:je,bindTexture:N,unbindTexture:mt,compressedTexImage2D:We,compressedTexImage3D:C,texImage2D:F,texImage3D:he,pixelStorei:Ee,getParameter:ue,updateUBOMapping:Ie,uniformBlockBinding:Ve,texStorage2D:ce,texStorage3D:de,texSubImage2D:v,texSubImage3D:B,compressedTexSubImage2D:W,compressedTexSubImage3D:q,scissor:ne,viewport:Ge,reset:Ye}}function o_(r,e,t,i,s,a,n){let o=e.has("WEBGL_multisampled_render_to_texture")?e.get("WEBGL_multisampled_render_to_texture"):null,l=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),c=new ae,h=new WeakMap,m=new Set,u,d=new WeakMap,g=!1;try{g=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function S(C,v){return g?new OffscreenCanvas(C,v):as("canvas")}function f(C,v,B){let W=1,q=We(C);if((q.width>B||q.height>B)&&(W=B/Math.max(q.width,q.height)),W<1)if(typeof HTMLImageElement<"u"&&C instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&C instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&C instanceof ImageBitmap||typeof VideoFrame<"u"&&C instanceof VideoFrame){let ce=Math.floor(W*q.width),de=Math.floor(W*q.height);u===void 0&&(u=S(ce,de));let F=v?S(ce,de):u;return F.width=ce,F.height=de,F.getContext("2d").drawImage(C,0,0,ce,de),Ue("WebGLRenderer: Texture has been resized from ("+q.width+"x"+q.height+") to ("+ce+"x"+de+")."),F}else return"data"in C&&Ue("WebGLRenderer: Image in DataTexture is too big ("+q.width+"x"+q.height+")."),C;return C}function p(C){return C.generateMipmaps}function y(C){r.generateMipmap(C)}function E(C){return C.isWebGLCubeRenderTarget?r.TEXTURE_CUBE_MAP:C.isWebGL3DRenderTarget?r.TEXTURE_3D:C.isWebGLArrayRenderTarget||C.isCompressedArrayTexture?r.TEXTURE_2D_ARRAY:r.TEXTURE_2D}function x(C,v,B,W,q,ce=!1){if(C!==null){if(r[C]!==void 0)return r[C];Ue("WebGLRenderer: Attempt to use non-existing WebGL internal format '"+C+"'")}let de;W&&(de=e.get("EXT_texture_norm16"),de||Ue("WebGLRenderer: Unable to use normalized textures without EXT_texture_norm16 extension"));let F=v;if(v===r.RED&&(B===r.FLOAT&&(F=r.R32F),B===r.HALF_FLOAT&&(F=r.R16F),B===r.UNSIGNED_BYTE&&(F=r.R8),B===r.UNSIGNED_SHORT&&de&&(F=de.R16_EXT),B===r.SHORT&&de&&(F=de.R16_SNORM_EXT)),v===r.RED_INTEGER&&(B===r.UNSIGNED_BYTE&&(F=r.R8UI),B===r.UNSIGNED_SHORT&&(F=r.R16UI),B===r.UNSIGNED_INT&&(F=r.R32UI),B===r.BYTE&&(F=r.R8I),B===r.SHORT&&(F=r.R16I),B===r.INT&&(F=r.R32I)),v===r.RG&&(B===r.FLOAT&&(F=r.RG32F),B===r.HALF_FLOAT&&(F=r.RG16F),B===r.UNSIGNED_BYTE&&(F=r.RG8),B===r.UNSIGNED_SHORT&&de&&(F=de.RG16_EXT),B===r.SHORT&&de&&(F=de.RG16_SNORM_EXT)),v===r.RG_INTEGER&&(B===r.UNSIGNED_BYTE&&(F=r.RG8UI),B===r.UNSIGNED_SHORT&&(F=r.RG16UI),B===r.UNSIGNED_INT&&(F=r.RG32UI),B===r.BYTE&&(F=r.RG8I),B===r.SHORT&&(F=r.RG16I),B===r.INT&&(F=r.RG32I)),v===r.RGB_INTEGER&&(B===r.UNSIGNED_BYTE&&(F=r.RGB8UI),B===r.UNSIGNED_SHORT&&(F=r.RGB16UI),B===r.UNSIGNED_INT&&(F=r.RGB32UI),B===r.BYTE&&(F=r.RGB8I),B===r.SHORT&&(F=r.RGB16I),B===r.INT&&(F=r.RGB32I)),v===r.RGBA_INTEGER&&(B===r.UNSIGNED_BYTE&&(F=r.RGBA8UI),B===r.UNSIGNED_SHORT&&(F=r.RGBA16UI),B===r.UNSIGNED_INT&&(F=r.RGBA32UI),B===r.BYTE&&(F=r.RGBA8I),B===r.SHORT&&(F=r.RGBA16I),B===r.INT&&(F=r.RGBA32I)),v===r.RGB&&(B===r.UNSIGNED_SHORT&&de&&(F=de.RGB16_EXT),B===r.SHORT&&de&&(F=de.RGB16_SNORM_EXT),B===r.UNSIGNED_INT_5_9_9_9_REV&&(F=r.RGB9_E5),B===r.UNSIGNED_INT_10F_11F_11F_REV&&(F=r.R11F_G11F_B10F)),v===r.RGBA){let he=ce?ss:et.getTransfer(q);B===r.FLOAT&&(F=r.RGBA32F),B===r.HALF_FLOAT&&(F=r.RGBA16F),B===r.UNSIGNED_BYTE&&(F=he===st?r.SRGB8_ALPHA8:r.RGBA8),B===r.UNSIGNED_SHORT&&de&&(F=de.RGBA16_EXT),B===r.SHORT&&de&&(F=de.RGBA16_SNORM_EXT),B===r.UNSIGNED_SHORT_4_4_4_4&&(F=r.RGBA4),B===r.UNSIGNED_SHORT_5_5_5_1&&(F=r.RGB5_A1)}return(F===r.R16F||F===r.R32F||F===r.RG16F||F===r.RG32F||F===r.RGBA16F||F===r.RGBA32F)&&e.get("EXT_color_buffer_float"),F}function T(C,v){let B;return C?v===null||v===ri||v===Gr?B=r.DEPTH24_STENCIL8:v===si?B=r.DEPTH32F_STENCIL8:v===zr&&(B=r.DEPTH24_STENCIL8,Ue("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):v===null||v===ri||v===Gr?B=r.DEPTH_COMPONENT24:v===si?B=r.DEPTH_COMPONENT32F:v===zr&&(B=r.DEPTH_COMPONENT16),B}function b(C,v){return p(C)===!0||C.isFramebufferTexture&&C.minFilter!==bt&&C.minFilter!==wt?Math.log2(Math.max(v.width,v.height))+1:C.mipmaps!==void 0&&C.mipmaps.length>0?C.mipmaps.length:C.isCompressedTexture&&Array.isArray(C.image)?v.mipmaps.length:1}function A(C){let v=C.target;v.removeEventListener("dispose",A),w(v),v.isVideoTexture&&h.delete(v),v.isHTMLTexture&&m.delete(v)}function _(C){let v=C.target;v.removeEventListener("dispose",_),L(v)}function w(C){let v=i.get(C);if(v.__webglInit===void 0)return;let B=C.source,W=d.get(B);if(W){let q=W[v.__cacheKey];q.usedTimes--,q.usedTimes===0&&I(C),Object.keys(W).length===0&&d.delete(B)}i.remove(C)}function I(C){let v=i.get(C);r.deleteTexture(v.__webglTexture);let B=C.source,W=d.get(B);delete W[v.__cacheKey],n.memory.textures--}function L(C){let v=i.get(C);if(C.depthTexture&&(C.depthTexture.dispose(),i.remove(C.depthTexture)),C.isWebGLCubeRenderTarget)for(let W=0;W<6;W++){if(Array.isArray(v.__webglFramebuffer[W]))for(let q=0;q<v.__webglFramebuffer[W].length;q++)r.deleteFramebuffer(v.__webglFramebuffer[W][q]);else r.deleteFramebuffer(v.__webglFramebuffer[W]);v.__webglDepthbuffer&&r.deleteRenderbuffer(v.__webglDepthbuffer[W])}else{if(Array.isArray(v.__webglFramebuffer))for(let W=0;W<v.__webglFramebuffer.length;W++)r.deleteFramebuffer(v.__webglFramebuffer[W]);else r.deleteFramebuffer(v.__webglFramebuffer);if(v.__webglDepthbuffer&&r.deleteRenderbuffer(v.__webglDepthbuffer),v.__webglMultisampledFramebuffer&&r.deleteFramebuffer(v.__webglMultisampledFramebuffer),v.__webglColorRenderbuffer)for(let W=0;W<v.__webglColorRenderbuffer.length;W++)v.__webglColorRenderbuffer[W]&&r.deleteRenderbuffer(v.__webglColorRenderbuffer[W]);v.__webglDepthRenderbuffer&&r.deleteRenderbuffer(v.__webglDepthRenderbuffer)}let B=C.textures;for(let W=0,q=B.length;W<q;W++){let ce=i.get(B[W]);ce.__webglTexture&&(r.deleteTexture(ce.__webglTexture),n.memory.textures--),i.remove(B[W])}i.remove(C)}let U=0;function V(){U=0}function P(){return U}function H(C){U=C}function Y(){let C=U;return C>=s.maxTextures&&Ue("WebGLTextures: Trying to use "+(C+1)+" texture units while this GPU supports only "+s.maxTextures),U+=1,C}function z(C){let v=[];return v.push(C.wrapS),v.push(C.wrapT),v.push(C.wrapR||0),v.push(C.magFilter),v.push(C.minFilter),v.push(C.anisotropy),v.push(C.internalFormat),v.push(C.format),v.push(C.type),v.push(C.generateMipmaps),v.push(C.premultiplyAlpha),v.push(C.flipY),v.push(C.unpackAlignment),v.push(C.colorSpace),v.join()}function J(C,v){let B=i.get(C);if(C.isVideoTexture&&N(C),C.isRenderTargetTexture===!1&&C.isExternalTexture!==!0&&C.version>0&&B.__version!==C.version){let W=C.image;if(W===null)Ue("WebGLRenderer: Texture marked for update but no image data found.");else if(W.complete===!1)Ue("WebGLRenderer: Texture marked for update but image is incomplete");else{ye(B,C,v);return}}else C.isExternalTexture&&(B.__webglTexture=C.sourceTexture?C.sourceTexture:null);t.bindTexture(r.TEXTURE_2D,B.__webglTexture,r.TEXTURE0+v)}function X(C,v){let B=i.get(C);if(C.isRenderTargetTexture===!1&&C.version>0&&B.__version!==C.version){ye(B,C,v);return}else C.isExternalTexture&&(B.__webglTexture=C.sourceTexture?C.sourceTexture:null);t.bindTexture(r.TEXTURE_2D_ARRAY,B.__webglTexture,r.TEXTURE0+v)}function Z(C,v){let B=i.get(C);if(C.isRenderTargetTexture===!1&&C.version>0&&B.__version!==C.version){ye(B,C,v);return}t.bindTexture(r.TEXTURE_3D,B.__webglTexture,r.TEXTURE0+v)}function Q(C,v){let B=i.get(C);if(C.isCubeDepthTexture!==!0&&C.version>0&&B.__version!==C.version){Be(B,C,v);return}t.bindTexture(r.TEXTURE_CUBE_MAP,B.__webglTexture,r.TEXTURE0+v)}let Le={[Ea]:r.REPEAT,[ci]:r.CLAMP_TO_EDGE,[Aa]:r.MIRRORED_REPEAT},fe={[bt]:r.NEAREST,[dh]:r.NEAREST_MIPMAP_NEAREST,[Ls]:r.NEAREST_MIPMAP_LINEAR,[wt]:r.LINEAR,[En]:r.LINEAR_MIPMAP_NEAREST,[Xi]:r.LINEAR_MIPMAP_LINEAR},qe={[gh]:r.NEVER,[Sh]:r.ALWAYS,[_h]:r.LESS,[ho]:r.LEQUAL,[vh]:r.EQUAL,[uo]:r.GEQUAL,[xh]:r.GREATER,[yh]:r.NOTEQUAL};function Qe(C,v){if(v.type===si&&e.has("OES_texture_float_linear")===!1&&(v.magFilter===wt||v.magFilter===En||v.magFilter===Ls||v.magFilter===Xi||v.minFilter===wt||v.minFilter===En||v.minFilter===Ls||v.minFilter===Xi)&&Ue("WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),r.texParameteri(C,r.TEXTURE_WRAP_S,Le[v.wrapS]),r.texParameteri(C,r.TEXTURE_WRAP_T,Le[v.wrapT]),(C===r.TEXTURE_3D||C===r.TEXTURE_2D_ARRAY)&&r.texParameteri(C,r.TEXTURE_WRAP_R,Le[v.wrapR]),r.texParameteri(C,r.TEXTURE_MAG_FILTER,fe[v.magFilter]),r.texParameteri(C,r.TEXTURE_MIN_FILTER,fe[v.minFilter]),v.compareFunction&&(r.texParameteri(C,r.TEXTURE_COMPARE_MODE,r.COMPARE_REF_TO_TEXTURE),r.texParameteri(C,r.TEXTURE_COMPARE_FUNC,qe[v.compareFunction])),e.has("EXT_texture_filter_anisotropic")===!0){if(v.magFilter===bt||v.minFilter!==Ls&&v.minFilter!==Xi||v.type===si&&e.has("OES_texture_float_linear")===!1)return;if(v.anisotropy>1||i.get(v).__currentAnisotropy){let B=e.get("EXT_texture_filter_anisotropic");r.texParameterf(C,B.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(v.anisotropy,s.getMaxAnisotropy())),i.get(v).__currentAnisotropy=v.anisotropy}}}function it(C,v){let B=!1;C.__webglInit===void 0&&(C.__webglInit=!0,v.addEventListener("dispose",A));let W=v.source,q=d.get(W);q===void 0&&(q={},d.set(W,q));let ce=z(v);if(ce!==C.__cacheKey){q[ce]===void 0&&(q[ce]={texture:r.createTexture(),usedTimes:0},n.memory.textures++,B=!0),q[ce].usedTimes++;let de=q[C.__cacheKey];de!==void 0&&(q[C.__cacheKey].usedTimes--,de.usedTimes===0&&I(v)),C.__cacheKey=ce,C.__webglTexture=q[ce].texture}return B}function K(C,v,B){return Math.floor(Math.floor(C/B)/v)}function $(C,v,B,W){let q=C.updateRanges;if(q.length===0)t.texSubImage2D(r.TEXTURE_2D,0,0,0,v.width,v.height,B,W,v.data);else{q.sort((ue,Ee)=>ue.start-Ee.start);let ce=0;for(let ue=1;ue<q.length;ue++){let Ee=q[ce],ne=q[ue],Ge=Ee.start+Ee.count,Ie=K(ne.start,v.width,4),Ve=K(Ee.start,v.width,4);ne.start<=Ge+1&&Ie===Ve&&K(ne.start+ne.count-1,v.width,4)===Ie?Ee.count=Math.max(Ee.count,ne.start+ne.count-Ee.start):(++ce,q[ce]=ne)}q.length=ce+1;let de=t.getParameter(r.UNPACK_ROW_LENGTH),F=t.getParameter(r.UNPACK_SKIP_PIXELS),he=t.getParameter(r.UNPACK_SKIP_ROWS);t.pixelStorei(r.UNPACK_ROW_LENGTH,v.width);for(let ue=0,Ee=q.length;ue<Ee;ue++){let ne=q[ue],Ge=Math.floor(ne.start/4),Ie=Math.ceil(ne.count/4),Ve=Ge%v.width,Ye=Math.floor(Ge/v.width),O=Ie;t.pixelStorei(r.UNPACK_SKIP_PIXELS,Ve),t.pixelStorei(r.UNPACK_SKIP_ROWS,Ye),t.texSubImage2D(r.TEXTURE_2D,0,Ve,Ye,O,1,B,W,v.data)}C.clearUpdateRanges(),t.pixelStorei(r.UNPACK_ROW_LENGTH,de),t.pixelStorei(r.UNPACK_SKIP_PIXELS,F),t.pixelStorei(r.UNPACK_SKIP_ROWS,he)}}function ye(C,v,B){let W=r.TEXTURE_2D;(v.isDataArrayTexture||v.isCompressedArrayTexture)&&(W=r.TEXTURE_2D_ARRAY),v.isData3DTexture&&(W=r.TEXTURE_3D);let q=it(C,v),ce=v.source;t.bindTexture(W,C.__webglTexture,r.TEXTURE0+B);let de=i.get(ce);if(ce.version!==de.__version||q===!0){if(t.activeTexture(r.TEXTURE0+B),!(typeof ImageBitmap<"u"&&v.image instanceof ImageBitmap)){let ee=et.getPrimaries(et.workingColorSpace),oe=v.colorSpace===Ri?null:et.getPrimaries(v.colorSpace),xe=v.colorSpace===Ri||ee===oe?r.NONE:r.BROWSER_DEFAULT_WEBGL;t.pixelStorei(r.UNPACK_FLIP_Y_WEBGL,v.flipY),t.pixelStorei(r.UNPACK_PREMULTIPLY_ALPHA_WEBGL,v.premultiplyAlpha),t.pixelStorei(r.UNPACK_COLORSPACE_CONVERSION_WEBGL,xe)}t.pixelStorei(r.UNPACK_ALIGNMENT,v.unpackAlignment);let F=f(v.image,!1,s.maxTextureSize);F=mt(v,F);let he=a.convert(v.format,v.colorSpace),ue=a.convert(v.type),Ee=x(v.internalFormat,he,ue,v.normalized,v.colorSpace,v.isVideoTexture);Qe(W,v);let ne,Ge=v.mipmaps,Ie=v.isVideoTexture!==!0,Ve=de.__version===void 0||q===!0,Ye=ce.dataReady,O=b(v,F);if(v.isDepthTexture)Ee=T(v.format===ji,v.type),Ve&&(Ie?t.texStorage2D(r.TEXTURE_2D,1,Ee,F.width,F.height):t.texImage2D(r.TEXTURE_2D,0,Ee,F.width,F.height,0,he,ue,null));else if(v.isDataTexture)if(Ge.length>0){Ie&&Ve&&t.texStorage2D(r.TEXTURE_2D,O,Ee,Ge[0].width,Ge[0].height);for(let ee=0,oe=Ge.length;ee<oe;ee++)ne=Ge[ee],Ie?Ye&&t.texSubImage2D(r.TEXTURE_2D,ee,0,0,ne.width,ne.height,he,ue,ne.data):t.texImage2D(r.TEXTURE_2D,ee,Ee,ne.width,ne.height,0,he,ue,ne.data);v.generateMipmaps=!1}else Ie?(Ve&&t.texStorage2D(r.TEXTURE_2D,O,Ee,F.width,F.height),Ye&&$(v,F,he,ue)):t.texImage2D(r.TEXTURE_2D,0,Ee,F.width,F.height,0,he,ue,F.data);else if(v.isCompressedTexture)if(v.isCompressedArrayTexture){Ie&&Ve&&t.texStorage3D(r.TEXTURE_2D_ARRAY,O,Ee,Ge[0].width,Ge[0].height,F.depth);for(let ee=0,oe=Ge.length;ee<oe;ee++)if(ne=Ge[ee],v.format!==Yt)if(he!==null)if(Ie){if(Ye)if(v.layerUpdates.size>0){let xe=Nl(ne.width,ne.height,v.format,v.type);for(let be of v.layerUpdates){let se=ne.data.subarray(be*xe/ne.data.BYTES_PER_ELEMENT,(be+1)*xe/ne.data.BYTES_PER_ELEMENT);t.compressedTexSubImage3D(r.TEXTURE_2D_ARRAY,ee,0,0,be,ne.width,ne.height,1,he,se)}}else t.compressedTexSubImage3D(r.TEXTURE_2D_ARRAY,ee,0,0,0,ne.width,ne.height,F.depth,he,ne.data)}else t.compressedTexImage3D(r.TEXTURE_2D_ARRAY,ee,Ee,ne.width,ne.height,F.depth,0,ne.data,0,0);else Ue("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else Ie?Ye&&t.texSubImage3D(r.TEXTURE_2D_ARRAY,ee,0,0,0,ne.width,ne.height,F.depth,he,ue,ne.data):t.texImage3D(r.TEXTURE_2D_ARRAY,ee,Ee,ne.width,ne.height,F.depth,0,he,ue,ne.data);v.layerUpdates.size>0&&v.clearLayerUpdates()}else{Ie&&Ve&&t.texStorage2D(r.TEXTURE_2D,O,Ee,Ge[0].width,Ge[0].height);for(let ee=0,oe=Ge.length;ee<oe;ee++)ne=Ge[ee],v.format!==Yt?he!==null?Ie?Ye&&t.compressedTexSubImage2D(r.TEXTURE_2D,ee,0,0,ne.width,ne.height,he,ne.data):t.compressedTexImage2D(r.TEXTURE_2D,ee,Ee,ne.width,ne.height,0,ne.data):Ue("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):Ie?Ye&&t.texSubImage2D(r.TEXTURE_2D,ee,0,0,ne.width,ne.height,he,ue,ne.data):t.texImage2D(r.TEXTURE_2D,ee,Ee,ne.width,ne.height,0,he,ue,ne.data)}else if(v.isDataArrayTexture)if(Ie){if(Ve&&t.texStorage3D(r.TEXTURE_2D_ARRAY,O,Ee,F.width,F.height,F.depth),Ye)if(v.layerUpdates.size>0){let ee=Nl(F.width,F.height,v.format,v.type);for(let oe of v.layerUpdates){let xe=F.data.subarray(oe*ee/F.data.BYTES_PER_ELEMENT,(oe+1)*ee/F.data.BYTES_PER_ELEMENT);t.texSubImage3D(r.TEXTURE_2D_ARRAY,0,0,0,oe,F.width,F.height,1,he,ue,xe)}v.clearLayerUpdates()}else t.texSubImage3D(r.TEXTURE_2D_ARRAY,0,0,0,0,F.width,F.height,F.depth,he,ue,F.data)}else t.texImage3D(r.TEXTURE_2D_ARRAY,0,Ee,F.width,F.height,F.depth,0,he,ue,F.data);else if(v.isData3DTexture)Ie?(Ve&&t.texStorage3D(r.TEXTURE_3D,O,Ee,F.width,F.height,F.depth),Ye&&t.texSubImage3D(r.TEXTURE_3D,0,0,0,0,F.width,F.height,F.depth,he,ue,F.data)):t.texImage3D(r.TEXTURE_3D,0,Ee,F.width,F.height,F.depth,0,he,ue,F.data);else if(v.isFramebufferTexture){if(Ve)if(Ie)t.texStorage2D(r.TEXTURE_2D,O,Ee,F.width,F.height);else{let ee=F.width,oe=F.height;for(let xe=0;xe<O;xe++)t.texImage2D(r.TEXTURE_2D,xe,Ee,ee,oe,0,he,ue,null),ee>>=1,oe>>=1}}else if(v.isHTMLTexture){if("texElementImage2D"in r){let ee=r.canvas;if(ee.hasAttribute("layoutsubtree")||ee.setAttribute("layoutsubtree","true"),F.parentNode!==ee){ee.appendChild(F),m.add(v),ee.onpaint=oe=>{let xe=oe.changedElements;for(let be of m)xe.includes(be.image)&&(be.needsUpdate=!0)},ee.requestPaint();return}if(r.texElementImage2D.length===3)r.texElementImage2D(r.TEXTURE_2D,r.RGBA8,F);else{let oe=r.RGBA,xe=r.RGBA,be=r.UNSIGNED_BYTE;r.texElementImage2D(r.TEXTURE_2D,0,oe,xe,be,F)}r.texParameteri(r.TEXTURE_2D,r.TEXTURE_MIN_FILTER,r.LINEAR),r.texParameteri(r.TEXTURE_2D,r.TEXTURE_WRAP_S,r.CLAMP_TO_EDGE),r.texParameteri(r.TEXTURE_2D,r.TEXTURE_WRAP_T,r.CLAMP_TO_EDGE)}}else if(Ge.length>0){if(Ie&&Ve){let ee=We(Ge[0]);t.texStorage2D(r.TEXTURE_2D,O,Ee,ee.width,ee.height)}for(let ee=0,oe=Ge.length;ee<oe;ee++)ne=Ge[ee],Ie?Ye&&t.texSubImage2D(r.TEXTURE_2D,ee,0,0,he,ue,ne):t.texImage2D(r.TEXTURE_2D,ee,Ee,he,ue,ne);v.generateMipmaps=!1}else if(Ie){if(Ve){let ee=We(F);t.texStorage2D(r.TEXTURE_2D,O,Ee,ee.width,ee.height)}Ye&&t.texSubImage2D(r.TEXTURE_2D,0,0,0,he,ue,F)}else t.texImage2D(r.TEXTURE_2D,0,Ee,he,ue,F);p(v)&&y(W),de.__version=ce.version,v.onUpdate&&v.onUpdate(v)}C.__version=v.version}function Be(C,v,B){if(v.image.length!==6)return;let W=it(C,v),q=v.source;t.bindTexture(r.TEXTURE_CUBE_MAP,C.__webglTexture,r.TEXTURE0+B);let ce=i.get(q);if(q.version!==ce.__version||W===!0){t.activeTexture(r.TEXTURE0+B);let de=et.getPrimaries(et.workingColorSpace),F=v.colorSpace===Ri?null:et.getPrimaries(v.colorSpace),he=v.colorSpace===Ri||de===F?r.NONE:r.BROWSER_DEFAULT_WEBGL;t.pixelStorei(r.UNPACK_FLIP_Y_WEBGL,v.flipY),t.pixelStorei(r.UNPACK_PREMULTIPLY_ALPHA_WEBGL,v.premultiplyAlpha),t.pixelStorei(r.UNPACK_ALIGNMENT,v.unpackAlignment),t.pixelStorei(r.UNPACK_COLORSPACE_CONVERSION_WEBGL,he);let ue=v.isCompressedTexture||v.image[0].isCompressedTexture,Ee=v.image[0]&&v.image[0].isDataTexture,ne=[];for(let se=0;se<6;se++)!ue&&!Ee?ne[se]=f(v.image[se],!0,s.maxCubemapSize):ne[se]=Ee?v.image[se].image:v.image[se],ne[se]=mt(v,ne[se]);let Ge=ne[0],Ie=a.convert(v.format,v.colorSpace),Ve=a.convert(v.type),Ye=x(v.internalFormat,Ie,Ve,v.normalized,v.colorSpace),O=v.isVideoTexture!==!0,ee=ce.__version===void 0||W===!0,oe=q.dataReady,xe=b(v,Ge);Qe(r.TEXTURE_CUBE_MAP,v);let be;if(ue){O&&ee&&t.texStorage2D(r.TEXTURE_CUBE_MAP,xe,Ye,Ge.width,Ge.height);for(let se=0;se<6;se++){be=ne[se].mipmaps;for(let Ne=0;Ne<be.length;Ne++){let Se=be[Ne];v.format!==Yt?Ie!==null?O?oe&&t.compressedTexSubImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+se,Ne,0,0,Se.width,Se.height,Ie,Se.data):t.compressedTexImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+se,Ne,Ye,Se.width,Se.height,0,Se.data):Ue("WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):O?oe&&t.texSubImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+se,Ne,0,0,Se.width,Se.height,Ie,Ve,Se.data):t.texImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+se,Ne,Ye,Se.width,Se.height,0,Ie,Ve,Se.data)}}}else{if(be=v.mipmaps,O&&ee){be.length>0&&xe++;let se=We(ne[0]);t.texStorage2D(r.TEXTURE_CUBE_MAP,xe,Ye,se.width,se.height)}for(let se=0;se<6;se++)if(Ee){O?oe&&t.texSubImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+se,0,0,0,ne[se].width,ne[se].height,Ie,Ve,ne[se].data):t.texImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+se,0,Ye,ne[se].width,ne[se].height,0,Ie,Ve,ne[se].data);for(let Ne=0;Ne<be.length;Ne++){let Se=be[Ne].image[se].image;O?oe&&t.texSubImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+se,Ne+1,0,0,Se.width,Se.height,Ie,Ve,Se.data):t.texImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+se,Ne+1,Ye,Se.width,Se.height,0,Ie,Ve,Se.data)}}else{O?oe&&t.texSubImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+se,0,0,0,Ie,Ve,ne[se]):t.texImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+se,0,Ye,Ie,Ve,ne[se]);for(let Ne=0;Ne<be.length;Ne++){let Se=be[Ne];O?oe&&t.texSubImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+se,Ne+1,0,0,Ie,Ve,Se.image[se]):t.texImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+se,Ne+1,Ye,Ie,Ve,Se.image[se])}}}p(v)&&y(r.TEXTURE_CUBE_MAP),ce.__version=q.version,v.onUpdate&&v.onUpdate(v)}C.__version=v.version}function pe(C,v,B,W,q,ce){let de=a.convert(B.format,B.colorSpace),F=a.convert(B.type),he=x(B.internalFormat,de,F,B.normalized,B.colorSpace),ue=i.get(v),Ee=i.get(B);if(Ee.__renderTarget=v,!ue.__hasExternalTextures){let ne=Math.max(1,v.width>>ce),Ge=Math.max(1,v.height>>ce);q===r.TEXTURE_3D||q===r.TEXTURE_2D_ARRAY?t.texImage3D(q,ce,he,ne,Ge,v.depth,0,de,F,null):t.texImage2D(q,ce,he,ne,Ge,0,de,F,null)}t.bindFramebuffer(r.FRAMEBUFFER,C),je(v)?o.framebufferTexture2DMultisampleEXT(r.FRAMEBUFFER,W,q,Ee.__webglTexture,0,ze(v)):(q===r.TEXTURE_2D||q>=r.TEXTURE_CUBE_MAP_POSITIVE_X&&q<=r.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&r.framebufferTexture2D(r.FRAMEBUFFER,W,q,Ee.__webglTexture,ce),t.bindFramebuffer(r.FRAMEBUFFER,null)}function Te(C,v,B){if(r.bindRenderbuffer(r.RENDERBUFFER,C),v.depthBuffer){let W=v.depthTexture,q=W&&W.isDepthTexture?W.type:null,ce=T(v.stencilBuffer,q),de=v.stencilBuffer?r.DEPTH_STENCIL_ATTACHMENT:r.DEPTH_ATTACHMENT;je(v)?o.renderbufferStorageMultisampleEXT(r.RENDERBUFFER,ze(v),ce,v.width,v.height):B?r.renderbufferStorageMultisample(r.RENDERBUFFER,ze(v),ce,v.width,v.height):r.renderbufferStorage(r.RENDERBUFFER,ce,v.width,v.height),r.framebufferRenderbuffer(r.FRAMEBUFFER,de,r.RENDERBUFFER,C)}else{let W=v.textures;for(let q=0;q<W.length;q++){let ce=W[q],de=a.convert(ce.format,ce.colorSpace),F=a.convert(ce.type),he=x(ce.internalFormat,de,F,ce.normalized,ce.colorSpace);je(v)?o.renderbufferStorageMultisampleEXT(r.RENDERBUFFER,ze(v),he,v.width,v.height):B?r.renderbufferStorageMultisample(r.RENDERBUFFER,ze(v),he,v.width,v.height):r.renderbufferStorage(r.RENDERBUFFER,he,v.width,v.height)}}r.bindRenderbuffer(r.RENDERBUFFER,null)}function ie(C,v,B){let W=v.isWebGLCubeRenderTarget===!0;if(t.bindFramebuffer(r.FRAMEBUFFER,C),!(v.depthTexture&&v.depthTexture.isDepthTexture))throw new Error("THREE.WebGLTextures: renderTarget.depthTexture must be an instance of THREE.DepthTexture.");let q=i.get(v.depthTexture);if(q.__renderTarget=v,(!q.__webglTexture||v.depthTexture.image.width!==v.width||v.depthTexture.image.height!==v.height)&&(v.depthTexture.image.width=v.width,v.depthTexture.image.height=v.height,v.depthTexture.needsUpdate=!0),W){if(q.__webglInit===void 0&&(q.__webglInit=!0,v.depthTexture.addEventListener("dispose",A)),q.__webglTexture===void 0){q.__webglTexture=r.createTexture(),t.bindTexture(r.TEXTURE_CUBE_MAP,q.__webglTexture),Qe(r.TEXTURE_CUBE_MAP,v.depthTexture);let ue=a.convert(v.depthTexture.format),Ee=a.convert(v.depthTexture.type),ne;v.depthTexture.format===ui?ne=r.DEPTH_COMPONENT24:v.depthTexture.format===ji&&(ne=r.DEPTH24_STENCIL8);for(let Ge=0;Ge<6;Ge++)r.texImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+Ge,0,ne,v.width,v.height,0,ue,Ee,null)}}else J(v.depthTexture,0);let ce=q.__webglTexture,de=ze(v),F=W?r.TEXTURE_CUBE_MAP_POSITIVE_X+B:r.TEXTURE_2D,he=v.depthTexture.format===ji?r.DEPTH_STENCIL_ATTACHMENT:r.DEPTH_ATTACHMENT;if(v.depthTexture.format===ui)je(v)?o.framebufferTexture2DMultisampleEXT(r.FRAMEBUFFER,he,F,ce,0,de):r.framebufferTexture2D(r.FRAMEBUFFER,he,F,ce,0);else if(v.depthTexture.format===ji)je(v)?o.framebufferTexture2DMultisampleEXT(r.FRAMEBUFFER,he,F,ce,0,de):r.framebufferTexture2D(r.FRAMEBUFFER,he,F,ce,0);else throw new Error("THREE.WebGLTextures: Unknown depthTexture format.")}function re(C){let v=i.get(C),B=C.isWebGLCubeRenderTarget===!0;if(v.__boundDepthTexture!==C.depthTexture){let W=C.depthTexture;if(v.__depthDisposeCallback&&v.__depthDisposeCallback(),W){let q=()=>{delete v.__boundDepthTexture,delete v.__depthDisposeCallback,W.removeEventListener("dispose",q)};W.addEventListener("dispose",q),v.__depthDisposeCallback=q}v.__boundDepthTexture=W}if(C.depthTexture&&!v.__autoAllocateDepthBuffer)if(B)for(let W=0;W<6;W++)ie(v.__webglFramebuffer[W],C,W);else{let W=C.texture.mipmaps;W&&W.length>0?ie(v.__webglFramebuffer[0],C,0):ie(v.__webglFramebuffer,C,0)}else if(B){v.__webglDepthbuffer=[];for(let W=0;W<6;W++)if(t.bindFramebuffer(r.FRAMEBUFFER,v.__webglFramebuffer[W]),v.__webglDepthbuffer[W]===void 0)v.__webglDepthbuffer[W]=r.createRenderbuffer(),Te(v.__webglDepthbuffer[W],C,!1);else{let q=C.stencilBuffer?r.DEPTH_STENCIL_ATTACHMENT:r.DEPTH_ATTACHMENT,ce=v.__webglDepthbuffer[W];r.bindRenderbuffer(r.RENDERBUFFER,ce),r.framebufferRenderbuffer(r.FRAMEBUFFER,q,r.RENDERBUFFER,ce)}}else{let W=C.texture.mipmaps;if(W&&W.length>0?t.bindFramebuffer(r.FRAMEBUFFER,v.__webglFramebuffer[0]):t.bindFramebuffer(r.FRAMEBUFFER,v.__webglFramebuffer),v.__webglDepthbuffer===void 0)v.__webglDepthbuffer=r.createRenderbuffer(),Te(v.__webglDepthbuffer,C,!1);else{let q=C.stencilBuffer?r.DEPTH_STENCIL_ATTACHMENT:r.DEPTH_ATTACHMENT,ce=v.__webglDepthbuffer;r.bindRenderbuffer(r.RENDERBUFFER,ce),r.framebufferRenderbuffer(r.FRAMEBUFFER,q,r.RENDERBUFFER,ce)}}t.bindFramebuffer(r.FRAMEBUFFER,null)}function te(C,v,B){let W=i.get(C);v!==void 0&&pe(W.__webglFramebuffer,C,C.texture,r.COLOR_ATTACHMENT0,r.TEXTURE_2D,0),B!==void 0&&re(C)}function _e(C){let v=C.texture,B=i.get(C),W=i.get(v);C.addEventListener("dispose",_);let q=C.textures,ce=C.isWebGLCubeRenderTarget===!0,de=q.length>1;if(de||(W.__webglTexture===void 0&&(W.__webglTexture=r.createTexture()),W.__version=v.version,n.memory.textures++),ce){B.__webglFramebuffer=[];for(let F=0;F<6;F++)if(v.mipmaps&&v.mipmaps.length>0){B.__webglFramebuffer[F]=[];for(let he=0;he<v.mipmaps.length;he++)B.__webglFramebuffer[F][he]=r.createFramebuffer()}else B.__webglFramebuffer[F]=r.createFramebuffer()}else{if(v.mipmaps&&v.mipmaps.length>0){B.__webglFramebuffer=[];for(let F=0;F<v.mipmaps.length;F++)B.__webglFramebuffer[F]=r.createFramebuffer()}else B.__webglFramebuffer=r.createFramebuffer();if(de)for(let F=0,he=q.length;F<he;F++){let ue=i.get(q[F]);ue.__webglTexture===void 0&&(ue.__webglTexture=r.createTexture(),n.memory.textures++)}if(C.samples>0&&je(C)===!1){B.__webglMultisampledFramebuffer=r.createFramebuffer(),B.__webglColorRenderbuffer=[],t.bindFramebuffer(r.FRAMEBUFFER,B.__webglMultisampledFramebuffer);for(let F=0;F<q.length;F++){let he=q[F];B.__webglColorRenderbuffer[F]=r.createRenderbuffer(),r.bindRenderbuffer(r.RENDERBUFFER,B.__webglColorRenderbuffer[F]);let ue=a.convert(he.format,he.colorSpace),Ee=a.convert(he.type),ne=x(he.internalFormat,ue,Ee,he.normalized,he.colorSpace,C.isXRRenderTarget===!0),Ge=ze(C);r.renderbufferStorageMultisample(r.RENDERBUFFER,Ge,ne,C.width,C.height),r.framebufferRenderbuffer(r.FRAMEBUFFER,r.COLOR_ATTACHMENT0+F,r.RENDERBUFFER,B.__webglColorRenderbuffer[F])}r.bindRenderbuffer(r.RENDERBUFFER,null),C.depthBuffer&&(B.__webglDepthRenderbuffer=r.createRenderbuffer(),Te(B.__webglDepthRenderbuffer,C,!0)),t.bindFramebuffer(r.FRAMEBUFFER,null)}}if(ce){t.bindTexture(r.TEXTURE_CUBE_MAP,W.__webglTexture),Qe(r.TEXTURE_CUBE_MAP,v);for(let F=0;F<6;F++)if(v.mipmaps&&v.mipmaps.length>0)for(let he=0;he<v.mipmaps.length;he++)pe(B.__webglFramebuffer[F][he],C,v,r.COLOR_ATTACHMENT0,r.TEXTURE_CUBE_MAP_POSITIVE_X+F,he);else pe(B.__webglFramebuffer[F],C,v,r.COLOR_ATTACHMENT0,r.TEXTURE_CUBE_MAP_POSITIVE_X+F,0);p(v)&&y(r.TEXTURE_CUBE_MAP),t.unbindTexture()}else if(de){for(let F=0,he=q.length;F<he;F++){let ue=q[F],Ee=i.get(ue),ne=r.TEXTURE_2D;(C.isWebGL3DRenderTarget||C.isWebGLArrayRenderTarget)&&(ne=C.isWebGL3DRenderTarget?r.TEXTURE_3D:r.TEXTURE_2D_ARRAY),t.bindTexture(ne,Ee.__webglTexture),Qe(ne,ue),pe(B.__webglFramebuffer,C,ue,r.COLOR_ATTACHMENT0+F,ne,0),p(ue)&&y(ne)}t.unbindTexture()}else{let F=r.TEXTURE_2D;if((C.isWebGL3DRenderTarget||C.isWebGLArrayRenderTarget)&&(F=C.isWebGL3DRenderTarget?r.TEXTURE_3D:r.TEXTURE_2D_ARRAY),t.bindTexture(F,W.__webglTexture),Qe(F,v),v.mipmaps&&v.mipmaps.length>0)for(let he=0;he<v.mipmaps.length;he++)pe(B.__webglFramebuffer[he],C,v,r.COLOR_ATTACHMENT0,F,he);else pe(B.__webglFramebuffer,C,v,r.COLOR_ATTACHMENT0,F,0);p(v)&&y(F),t.unbindTexture()}C.depthBuffer&&re(C)}function ve(C){let v=C.textures;for(let B=0,W=v.length;B<W;B++){let q=v[B];if(p(q)){let ce=E(C),de=i.get(q).__webglTexture;t.bindTexture(ce,de),y(ce),t.unbindTexture()}}}let Re=[],Pe=[];function Je(C){if(C.samples>0){if(je(C)===!1){let v=C.textures,B=C.width,W=C.height,q=r.COLOR_BUFFER_BIT,ce=C.stencilBuffer?r.DEPTH_STENCIL_ATTACHMENT:r.DEPTH_ATTACHMENT,de=i.get(C),F=v.length>1;if(F)for(let ue=0;ue<v.length;ue++)t.bindFramebuffer(r.FRAMEBUFFER,de.__webglMultisampledFramebuffer),r.framebufferRenderbuffer(r.FRAMEBUFFER,r.COLOR_ATTACHMENT0+ue,r.RENDERBUFFER,null),t.bindFramebuffer(r.FRAMEBUFFER,de.__webglFramebuffer),r.framebufferTexture2D(r.DRAW_FRAMEBUFFER,r.COLOR_ATTACHMENT0+ue,r.TEXTURE_2D,null,0);t.bindFramebuffer(r.READ_FRAMEBUFFER,de.__webglMultisampledFramebuffer);let he=C.texture.mipmaps;he&&he.length>0?t.bindFramebuffer(r.DRAW_FRAMEBUFFER,de.__webglFramebuffer[0]):t.bindFramebuffer(r.DRAW_FRAMEBUFFER,de.__webglFramebuffer);for(let ue=0;ue<v.length;ue++){if(C.resolveDepthBuffer&&(C.depthBuffer&&(q|=r.DEPTH_BUFFER_BIT),C.stencilBuffer&&C.resolveStencilBuffer&&(q|=r.STENCIL_BUFFER_BIT)),F){r.framebufferRenderbuffer(r.READ_FRAMEBUFFER,r.COLOR_ATTACHMENT0,r.RENDERBUFFER,de.__webglColorRenderbuffer[ue]);let Ee=i.get(v[ue]).__webglTexture;r.framebufferTexture2D(r.DRAW_FRAMEBUFFER,r.COLOR_ATTACHMENT0,r.TEXTURE_2D,Ee,0)}r.blitFramebuffer(0,0,B,W,0,0,B,W,q,r.NEAREST),l===!0&&(Re.length=0,Pe.length=0,Re.push(r.COLOR_ATTACHMENT0+ue),C.depthBuffer&&C.storeMultisampledDepthBuffer===!1&&(Re.push(ce),Pe.push(ce),r.invalidateFramebuffer(r.DRAW_FRAMEBUFFER,Pe)),r.invalidateFramebuffer(r.READ_FRAMEBUFFER,Re))}if(t.bindFramebuffer(r.READ_FRAMEBUFFER,null),t.bindFramebuffer(r.DRAW_FRAMEBUFFER,null),F)for(let ue=0;ue<v.length;ue++){t.bindFramebuffer(r.FRAMEBUFFER,de.__webglMultisampledFramebuffer),r.framebufferRenderbuffer(r.FRAMEBUFFER,r.COLOR_ATTACHMENT0+ue,r.RENDERBUFFER,de.__webglColorRenderbuffer[ue]);let Ee=i.get(v[ue]).__webglTexture;t.bindFramebuffer(r.FRAMEBUFFER,de.__webglFramebuffer),r.framebufferTexture2D(r.DRAW_FRAMEBUFFER,r.COLOR_ATTACHMENT0+ue,r.TEXTURE_2D,Ee,0)}t.bindFramebuffer(r.DRAW_FRAMEBUFFER,de.__webglMultisampledFramebuffer)}else if(C.depthBuffer&&C.storeMultisampledDepthBuffer===!1&&l){let v=C.stencilBuffer?r.DEPTH_STENCIL_ATTACHMENT:r.DEPTH_ATTACHMENT;r.invalidateFramebuffer(r.DRAW_FRAMEBUFFER,[v])}}}function ze(C){return Math.min(s.maxSamples,C.samples)}function je(C){let v=i.get(C);return C.samples>0&&e.has("WEBGL_multisampled_render_to_texture")===!0&&v.__useRenderToTexture!==!1}function N(C){let v=n.render.frame;h.get(C)!==v&&(h.set(C,v),C.update())}function mt(C,v){let B=C.colorSpace,W=C.format,q=C.type;return C.isCompressedTexture===!0||C.isVideoTexture===!0||B!==rs&&B!==Ri&&(et.getTransfer(B)===st?(W!==Yt||q!==Ot)&&Ue("WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):Fe("WebGLTextures: Unsupported texture color space:",B)),v}function We(C){return typeof HTMLImageElement<"u"&&C instanceof HTMLImageElement?(c.width=C.naturalWidth||C.width,c.height=C.naturalHeight||C.height):typeof VideoFrame<"u"&&C instanceof VideoFrame?(c.width=C.displayWidth,c.height=C.displayHeight):(c.width=C.width,c.height=C.height),c}this.allocateTextureUnit=Y,this.resetTextureUnits=V,this.getTextureUnits=P,this.setTextureUnits=H,this.setTexture2D=J,this.setTexture2DArray=X,this.setTexture3D=Z,this.setTextureCube=Q,this.rebindTextures=te,this.setupRenderTarget=_e,this.updateRenderTargetMipmap=ve,this.updateMultisampleRenderTarget=Je,this.setupDepthRenderbuffer=re,this.setupFrameBufferTexture=pe,this.useMultisampledRTT=je,this.isReversedDepthBuffer=function(){return t.buffers.depth.getReversed()}}function l_(r,e){function t(i,s=Ri){let a,n=et.getTransfer(s);if(i===Ot)return r.UNSIGNED_BYTE;if(i===Cn)return r.UNSIGNED_SHORT_4_4_4_4;if(i===Rn)return r.UNSIGNED_SHORT_5_5_5_1;if(i===Ml)return r.UNSIGNED_INT_5_9_9_9_REV;if(i===bl)return r.UNSIGNED_INT_10F_11F_11F_REV;if(i===yl)return r.BYTE;if(i===Sl)return r.SHORT;if(i===zr)return r.UNSIGNED_SHORT;if(i===An)return r.INT;if(i===ri)return r.UNSIGNED_INT;if(i===si)return r.FLOAT;if(i===ai)return r.HALF_FLOAT;if(i===Tl)return r.ALPHA;if(i===wl)return r.RGB;if(i===Yt)return r.RGBA;if(i===ui)return r.DEPTH_COMPONENT;if(i===ji)return r.DEPTH_STENCIL;if(i===El)return r.RED;if(i===In)return r.RED_INTEGER;if(i===qi)return r.RG;if(i===Pn)return r.RG_INTEGER;if(i===Ln)return r.RGBA_INTEGER;if(i===Ns||i===Us||i===Ds||i===Os)if(n===st)if(a=e.get("WEBGL_compressed_texture_s3tc_srgb"),a!==null){if(i===Ns)return a.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(i===Us)return a.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(i===Ds)return a.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(i===Os)return a.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(a=e.get("WEBGL_compressed_texture_s3tc"),a!==null){if(i===Ns)return a.COMPRESSED_RGB_S3TC_DXT1_EXT;if(i===Us)return a.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(i===Ds)return a.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(i===Os)return a.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(i===Nn||i===Un||i===Dn||i===On)if(a=e.get("WEBGL_compressed_texture_pvrtc"),a!==null){if(i===Nn)return a.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(i===Un)return a.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(i===Dn)return a.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(i===On)return a.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(i===Fn||i===Bn||i===zn||i===Gn||i===Vn||i===Fs||i===kn)if(a=e.get("WEBGL_compressed_texture_etc"),a!==null){if(i===Fn||i===Bn)return n===st?a.COMPRESSED_SRGB8_ETC2:a.COMPRESSED_RGB8_ETC2;if(i===zn)return n===st?a.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:a.COMPRESSED_RGBA8_ETC2_EAC;if(i===Gn)return a.COMPRESSED_R11_EAC;if(i===Vn)return a.COMPRESSED_SIGNED_R11_EAC;if(i===Fs)return a.COMPRESSED_RG11_EAC;if(i===kn)return a.COMPRESSED_SIGNED_RG11_EAC}else return null;if(i===Hn||i===Wn||i===Xn||i===jn||i===qn||i===Yn||i===Zn||i===Jn||i===Kn||i===$n||i===Qn||i===eo||i===to||i===io)if(a=e.get("WEBGL_compressed_texture_astc"),a!==null){if(i===Hn)return n===st?a.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:a.COMPRESSED_RGBA_ASTC_4x4_KHR;if(i===Wn)return n===st?a.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:a.COMPRESSED_RGBA_ASTC_5x4_KHR;if(i===Xn)return n===st?a.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:a.COMPRESSED_RGBA_ASTC_5x5_KHR;if(i===jn)return n===st?a.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:a.COMPRESSED_RGBA_ASTC_6x5_KHR;if(i===qn)return n===st?a.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:a.COMPRESSED_RGBA_ASTC_6x6_KHR;if(i===Yn)return n===st?a.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:a.COMPRESSED_RGBA_ASTC_8x5_KHR;if(i===Zn)return n===st?a.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:a.COMPRESSED_RGBA_ASTC_8x6_KHR;if(i===Jn)return n===st?a.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:a.COMPRESSED_RGBA_ASTC_8x8_KHR;if(i===Kn)return n===st?a.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:a.COMPRESSED_RGBA_ASTC_10x5_KHR;if(i===$n)return n===st?a.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:a.COMPRESSED_RGBA_ASTC_10x6_KHR;if(i===Qn)return n===st?a.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:a.COMPRESSED_RGBA_ASTC_10x8_KHR;if(i===eo)return n===st?a.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:a.COMPRESSED_RGBA_ASTC_10x10_KHR;if(i===to)return n===st?a.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:a.COMPRESSED_RGBA_ASTC_12x10_KHR;if(i===io)return n===st?a.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:a.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(i===ro||i===so||i===ao)if(a=e.get("EXT_texture_compression_bptc"),a!==null){if(i===ro)return n===st?a.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:a.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(i===so)return a.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(i===ao)return a.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(i===no||i===oo||i===Bs||i===lo)if(a=e.get("EXT_texture_compression_rgtc"),a!==null){if(i===no)return a.COMPRESSED_RED_RGTC1_EXT;if(i===oo)return a.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(i===Bs)return a.COMPRESSED_RED_GREEN_RGTC2_EXT;if(i===lo)return a.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return i===Gr?r.UNSIGNED_INT_24_8:r[i]!==void 0?r[i]:null}return{convert:t}}var c_=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,h_=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`,$l=class{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(e,t){if(this.texture===null){let i=new ps(e.texture);(e.depthNear!==t.depthNear||e.depthFar!==t.depthFar)&&(this.depthNear=e.depthNear,this.depthFar=e.depthFar),this.texture=i}}getMesh(e){if(this.texture!==null&&this.mesh===null){let t=e.cameras[0].viewport,i=new kt({vertexShader:c_,fragmentShader:h_,uniforms:{depthColor:{value:this.texture},depthWidth:{value:t.z},depthHeight:{value:t.w}}});this.mesh=new Et(new Dr(20,20),i)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}},Ql=class extends di{constructor(e,t){super();let i=this,s=null,a=1,n=null,o="local-floor",l=1,c=null,h=null,m=null,u=null,d=null,g=null,S=typeof XRWebGLBinding<"u",f=new $l,p={},y=t.getContextAttributes(),E=null,x=null,T=[],b=[],A=new ae,_=null,w=null,I=new Nt;I.viewport=new lt;let L=new Nt;L.viewport=new lt;let U=[I,L],V=new Sn,P=null,H=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(K){let $=T[K];return $===void 0&&($=new Rr,T[K]=$),$.getTargetRaySpace()},this.getControllerGrip=function(K){let $=T[K];return $===void 0&&($=new Rr,T[K]=$),$.getGripSpace()},this.getHand=function(K){let $=T[K];return $===void 0&&($=new Rr,T[K]=$),$.getHandSpace()};function Y(K){let $=b.indexOf(K.inputSource);if($===-1)return;let ye=T[$];ye!==void 0&&(ye.update(K.inputSource,K.frame,c||n),ye.dispatchEvent({type:K.type,data:K.inputSource}))}function z(){s.removeEventListener("select",Y),s.removeEventListener("selectstart",Y),s.removeEventListener("selectend",Y),s.removeEventListener("squeeze",Y),s.removeEventListener("squeezestart",Y),s.removeEventListener("squeezeend",Y),s.removeEventListener("end",z),s.removeEventListener("inputsourceschange",J);for(let K=0;K<T.length;K++){let $=b[K];$!==null&&(b[K]=null,T[K].disconnect($))}P=null,H=null,f.reset();for(let K in p)delete p[K];if(e.setRenderTarget(E),d=null,u=null,m=null,s=null,x=null,it.stop(),i.isPresenting=!1,e.setPixelRatio(_),e.setSize(A.width,A.height,!1),w!==null){let K=w.camera;K.fov=w.fov,K.zoom=w.zoom,K.updateProjectionMatrix(),w=null}i.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(K){a=K,i.isPresenting===!0&&Ue("WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(K){o=K,i.isPresenting===!0&&Ue("WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return c||n},this.setReferenceSpace=function(K){c=K},this.getBaseLayer=function(){return u!==null?u:d},this.getBinding=function(){return m===null&&S&&(m=new XRWebGLBinding(s,t)),m},this.getFrame=function(){return g},this.getSession=function(){return s},this.setSession=async function(K){if(s=K,s!==null){if(E=e.getRenderTarget(),s.addEventListener("select",Y),s.addEventListener("selectstart",Y),s.addEventListener("selectend",Y),s.addEventListener("squeeze",Y),s.addEventListener("squeezestart",Y),s.addEventListener("squeezeend",Y),s.addEventListener("end",z),s.addEventListener("inputsourceschange",J),y.xrCompatible!==!0&&await t.makeXRCompatible(),_=e.getPixelRatio(),e.getSize(A),S&&"createProjectionLayer"in XRWebGLBinding.prototype){let $=null,ye=null,Be=null;y.depth&&(Be=y.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,$=y.stencil?ji:ui,ye=y.stencil?Gr:ri);let pe={colorFormat:t.RGBA8,depthFormat:Be,scaleFactor:a};m=this.getBinding(),u=m.createProjectionLayer(pe),s.updateRenderState({layers:[u]}),e.setPixelRatio(1),e.setSize(u.textureWidth,u.textureHeight,!1),x=new Dt(u.textureWidth,u.textureHeight,{format:Yt,type:Ot,depthTexture:new zi(u.textureWidth,u.textureHeight,ye,void 0,void 0,void 0,void 0,void 0,void 0,$),stencilBuffer:y.stencil,colorSpace:e.outputColorSpace,samples:y.antialias?4:0,resolveDepthBuffer:u.ignoreDepthValues===!1,resolveStencilBuffer:u.ignoreDepthValues===!1,storeMultisampledDepthBuffer:u.ignoreDepthValues===!1,storeMultisampledStencilBuffer:u.ignoreDepthValues===!1})}else{let $={antialias:y.antialias,alpha:!0,depth:y.depth,stencil:y.stencil,framebufferScaleFactor:a};d=new XRWebGLLayer(s,t,$),s.updateRenderState({baseLayer:d}),e.setPixelRatio(1),e.setSize(d.framebufferWidth,d.framebufferHeight,!1),x=new Dt(d.framebufferWidth,d.framebufferHeight,{format:Yt,type:Ot,colorSpace:e.outputColorSpace,stencilBuffer:y.stencil,resolveDepthBuffer:d.ignoreDepthValues===!1,resolveStencilBuffer:d.ignoreDepthValues===!1,storeMultisampledDepthBuffer:d.ignoreDepthValues===!1,storeMultisampledStencilBuffer:d.ignoreDepthValues===!1})}x.isXRRenderTarget=!0,this.setFoveation(l),c=null,n=await s.requestReferenceSpace(o),it.setContext(s),it.start(),i.isPresenting=!0,i.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(s!==null)return s.environmentBlendMode},this.getDepthTexture=function(){return f.getDepthTexture()};function J(K){for(let $=0;$<K.removed.length;$++){let ye=K.removed[$],Be=b.indexOf(ye);Be>=0&&(b[Be]=null,T[Be].disconnect(ye))}for(let $=0;$<K.added.length;$++){let ye=K.added[$],Be=b.indexOf(ye);if(Be===-1){for(let Te=0;Te<T.length;Te++)if(Te>=b.length){b.push(ye),Be=Te;break}else if(b[Te]===null){b[Te]=ye,Be=Te;break}if(Be===-1)break}let pe=T[Be];pe&&pe.connect(ye)}}let X=new R,Z=new R;function Q(K,$,ye){X.setFromMatrixPosition($.matrixWorld),Z.setFromMatrixPosition(ye.matrixWorld);let Be=X.distanceTo(Z),pe=$.projectionMatrix.elements,Te=ye.projectionMatrix.elements,ie=pe[14]/(pe[10]-1),re=pe[14]/(pe[10]+1),te=(pe[9]+1)/pe[5],_e=(pe[9]-1)/pe[5],ve=(pe[8]-1)/pe[0],Re=(Te[8]+1)/Te[0],Pe=ie*ve,Je=ie*Re,ze=Be/(-ve+Re),je=ze*-ve;if($.matrixWorld.decompose(K.position,K.quaternion,K.scale),K.translateX(je),K.translateZ(ze),K.matrixWorld.compose(K.position,K.quaternion,K.scale),K.matrixWorldInverse.copy(K.matrixWorld).invert(),pe[10]===-1)K.projectionMatrix.copy($.projectionMatrix),K.projectionMatrixInverse.copy($.projectionMatrixInverse);else{let N=ie+ze,mt=re+ze,We=Pe-je,C=Je+(Be-je),v=te*re/mt*N,B=_e*re/mt*N;K.projectionMatrix.makePerspective(We,C,v,B,N,mt),K.projectionMatrixInverse.copy(K.projectionMatrix).invert()}}function Le(K,$){$===null?K.matrixWorld.copy(K.matrix):K.matrixWorld.multiplyMatrices($.matrixWorld,K.matrix),K.matrixWorldInverse.copy(K.matrixWorld).invert()}this.updateCamera=function(K){if(s===null)return;let $=K.near,ye=K.far;f.texture!==null&&(f.depthNear>0&&($=f.depthNear),f.depthFar>0&&(ye=f.depthFar)),V.near=L.near=I.near=$,V.far=L.far=I.far=ye,(P!==V.near||H!==V.far)&&(s.updateRenderState({depthNear:V.near,depthFar:V.far}),P=V.near,H=V.far),V.layers.mask=K.layers.mask|6,I.layers.mask=V.layers.mask&-5,L.layers.mask=V.layers.mask&-3;let Be=K.parent,pe=V.cameras;Le(V,Be);for(let Te=0;Te<pe.length;Te++)Le(pe[Te],Be);pe.length===2?Q(V,I,L):V.projectionMatrix.copy(I.projectionMatrix),w===null&&K.isPerspectiveCamera&&(w={camera:K,fov:K.fov,zoom:K.zoom}),fe(K,V,Be)};function fe(K,$,ye){ye===null?K.matrix.copy($.matrixWorld):(K.matrix.copy(ye.matrixWorld),K.matrix.invert(),K.matrix.multiply($.matrixWorld)),K.matrix.decompose(K.position,K.quaternion,K.scale),K.updateMatrixWorld(!0),K.projectionMatrix.copy($.projectionMatrix),K.projectionMatrixInverse.copy($.projectionMatrixInverse),K.isPerspectiveCamera&&(K.fov=Ra*2*Math.atan(1/K.projectionMatrix.elements[5]),K.zoom=1)}this.getCamera=function(){return V},this.getFoveation=function(){if(!(u===null&&d===null))return l},this.setFoveation=function(K){l=K,u!==null&&(u.fixedFoveation=K),d!==null&&d.fixedFoveation!==void 0&&(d.fixedFoveation=K)},this.hasDepthSensing=function(){return f.texture!==null},this.getDepthSensingMesh=function(){return f.getMesh(V)},this.getCameraTexture=function(K){return p[K]};let qe=null;function Qe(K,$){if(h=$.getViewerPose(c||n),g=$,h!==null){let ye=h.views;d!==null&&(e.setRenderTargetFramebuffer(x,d.framebuffer),e.setRenderTarget(x));let Be=!1;ye.length!==V.cameras.length&&(V.cameras.length=0,Be=!0);for(let Te=0;Te<ye.length;Te++){let ie=ye[Te],re=null;if(d!==null)re=d.getViewport(ie);else{let _e=m.getViewSubImage(u,ie);re=_e.viewport,Te===0&&(e.setRenderTargetTextures(x,_e.colorTexture,_e.depthStencilTexture),e.setRenderTarget(x))}let te=U[Te];te===void 0&&(te=new Nt,te.layers.enable(Te),te.viewport=new lt,U[Te]=te),te.matrix.fromArray(ie.transform.matrix),te.matrix.decompose(te.position,te.quaternion,te.scale),te.projectionMatrix.fromArray(ie.projectionMatrix),te.projectionMatrixInverse.copy(te.projectionMatrix).invert(),te.viewport.set(re.x,re.y,re.width,re.height),Te===0&&(V.matrix.copy(te.matrix),V.matrix.decompose(V.position,V.quaternion,V.scale)),Be===!0&&V.cameras.push(te)}let pe=s.enabledFeatures;if(pe&&pe.includes("depth-sensing")&&s.depthUsage=="gpu-optimized"&&S){m=i.getBinding();let Te=m.getDepthInformation(ye[0]);Te&&Te.isValid&&Te.texture&&f.init(Te,s.renderState)}if(pe&&pe.includes("camera-access")&&S){e.state.unbindTexture(),m=i.getBinding();for(let Te=0;Te<ye.length;Te++){let ie=ye[Te].camera;if(ie){let re=p[ie];re||(re=new ps,p[ie]=re);let te=m.getCameraImage(ie);re.sourceTexture=te}}}}for(let ye=0;ye<T.length;ye++){let Be=b[ye],pe=T[ye];Be!==null&&pe!==void 0&&pe.update(Be,$,c||n)}qe&&qe(K,$),$.detectedPlanes&&i.dispatchEvent({type:"planesdetected",data:$}),g=null}let it=new iu;it.setAnimationLoop(Qe),this.setAnimationLoop=function(K){qe=K},this.dispose=function(){}}},u_=new Xe,lu=new ke;lu.set(-1,0,0,0,1,0,0,0,1);function d_(r,e){function t(f,p){f.matrixAutoUpdate===!0&&f.updateMatrix(),p.value.copy(f.matrix)}function i(f,p){p.color.getRGB(f.fogColor.value,Il(r)),p.isFog?(f.fogNear.value=p.near,f.fogFar.value=p.far):p.isFogExp2&&(f.fogDensity.value=p.density)}function s(f,p,y,E,x){p.isNodeMaterial?p.uniformsNeedUpdate=!1:p.isMeshBasicMaterial?a(f,p):p.isMeshLambertMaterial?(a(f,p),p.envMap&&(f.envMapIntensity.value=p.envMapIntensity)):p.isMeshToonMaterial?(a(f,p),m(f,p)):p.isMeshPhongMaterial?(a(f,p),h(f,p),p.envMap&&(f.envMapIntensity.value=p.envMapIntensity)):p.isMeshStandardMaterial?(a(f,p),u(f,p),p.isMeshPhysicalMaterial&&d(f,p,x)):p.isMeshMatcapMaterial?(a(f,p),g(f,p)):p.isMeshDepthMaterial?a(f,p):p.isMeshDistanceMaterial?(a(f,p),S(f,p)):p.isMeshNormalMaterial?a(f,p):p.isLineBasicMaterial?(n(f,p),p.isLineDashedMaterial&&o(f,p)):p.isPointsMaterial?l(f,p,y,E):p.isSpriteMaterial?c(f,p):p.isShadowMaterial?(f.color.value.copy(p.color),f.opacity.value=p.opacity):p.isShaderMaterial&&(p.uniformsNeedUpdate=!1)}function a(f,p){f.opacity.value=p.opacity,p.color&&f.diffuse.value.copy(p.color),p.emissive&&f.emissive.value.copy(p.emissive).multiplyScalar(p.emissiveIntensity),p.map&&(f.map.value=p.map,t(p.map,f.mapTransform)),p.alphaMap&&(f.alphaMap.value=p.alphaMap,t(p.alphaMap,f.alphaMapTransform)),p.bumpMap&&(f.bumpMap.value=p.bumpMap,t(p.bumpMap,f.bumpMapTransform),f.bumpScale.value=p.bumpScale,p.side===Pt&&(f.bumpScale.value*=-1)),p.normalMap&&(f.normalMap.value=p.normalMap,t(p.normalMap,f.normalMapTransform),f.normalScale.value.copy(p.normalScale),p.side===Pt&&f.normalScale.value.negate()),p.displacementMap&&(f.displacementMap.value=p.displacementMap,t(p.displacementMap,f.displacementMapTransform),f.displacementScale.value=p.displacementScale,f.displacementBias.value=p.displacementBias),p.emissiveMap&&(f.emissiveMap.value=p.emissiveMap,t(p.emissiveMap,f.emissiveMapTransform)),p.specularMap&&(f.specularMap.value=p.specularMap,t(p.specularMap,f.specularMapTransform)),p.alphaTest>0&&(f.alphaTest.value=p.alphaTest);let y=e.get(p),E=y.envMap,x=y.envMapRotation;E&&(f.envMap.value=E,f.envMapRotation.value.setFromMatrix4(u_.makeRotationFromEuler(x)).transpose(),E.isCubeTexture&&E.isRenderTargetTexture===!1&&f.envMapRotation.value.premultiply(lu),f.reflectivity.value=p.reflectivity,f.ior.value=p.ior,f.refractionRatio.value=p.refractionRatio),p.lightMap&&(f.lightMap.value=p.lightMap,f.lightMapIntensity.value=p.lightMapIntensity,t(p.lightMap,f.lightMapTransform)),p.aoMap&&(f.aoMap.value=p.aoMap,f.aoMapIntensity.value=p.aoMapIntensity,t(p.aoMap,f.aoMapTransform))}function n(f,p){f.diffuse.value.copy(p.color),f.opacity.value=p.opacity,p.map&&(f.map.value=p.map,t(p.map,f.mapTransform))}function o(f,p){f.dashSize.value=p.dashSize,f.totalSize.value=p.dashSize+p.gapSize,f.scale.value=p.scale}function l(f,p,y,E){f.diffuse.value.copy(p.color),f.opacity.value=p.opacity,f.size.value=p.size*y,f.scale.value=E*.5,p.map&&(f.map.value=p.map,t(p.map,f.uvTransform)),p.alphaMap&&(f.alphaMap.value=p.alphaMap,t(p.alphaMap,f.alphaMapTransform)),p.alphaTest>0&&(f.alphaTest.value=p.alphaTest)}function c(f,p){f.diffuse.value.copy(p.color),f.opacity.value=p.opacity,f.rotation.value=p.rotation,p.map&&(f.map.value=p.map,t(p.map,f.mapTransform)),p.alphaMap&&(f.alphaMap.value=p.alphaMap,t(p.alphaMap,f.alphaMapTransform)),p.alphaTest>0&&(f.alphaTest.value=p.alphaTest)}function h(f,p){f.specular.value.copy(p.specular),f.shininess.value=Math.max(p.shininess,1e-4)}function m(f,p){p.gradientMap&&(f.gradientMap.value=p.gradientMap)}function u(f,p){f.metalness.value=p.metalness,p.metalnessMap&&(f.metalnessMap.value=p.metalnessMap,t(p.metalnessMap,f.metalnessMapTransform)),f.roughness.value=p.roughness,p.roughnessMap&&(f.roughnessMap.value=p.roughnessMap,t(p.roughnessMap,f.roughnessMapTransform)),p.envMap&&(f.envMapIntensity.value=p.envMapIntensity)}function d(f,p,y){f.ior.value=p.ior,p.sheen>0&&(f.sheenColor.value.copy(p.sheenColor).multiplyScalar(p.sheen),f.sheenRoughness.value=p.sheenRoughness,p.sheenColorMap&&(f.sheenColorMap.value=p.sheenColorMap,t(p.sheenColorMap,f.sheenColorMapTransform)),p.sheenRoughnessMap&&(f.sheenRoughnessMap.value=p.sheenRoughnessMap,t(p.sheenRoughnessMap,f.sheenRoughnessMapTransform))),p.clearcoat>0&&(f.clearcoat.value=p.clearcoat,f.clearcoatRoughness.value=p.clearcoatRoughness,p.clearcoatMap&&(f.clearcoatMap.value=p.clearcoatMap,t(p.clearcoatMap,f.clearcoatMapTransform)),p.clearcoatRoughnessMap&&(f.clearcoatRoughnessMap.value=p.clearcoatRoughnessMap,t(p.clearcoatRoughnessMap,f.clearcoatRoughnessMapTransform)),p.clearcoatNormalMap&&(f.clearcoatNormalMap.value=p.clearcoatNormalMap,t(p.clearcoatNormalMap,f.clearcoatNormalMapTransform),f.clearcoatNormalScale.value.copy(p.clearcoatNormalScale),p.side===Pt&&f.clearcoatNormalScale.value.negate())),p.dispersion>0&&(f.dispersion.value=p.dispersion),p.retroreflectivity>0&&(f.retroreflectivity.value=p.retroreflectivity),p.iridescence>0&&(f.iridescence.value=p.iridescence,f.iridescenceIOR.value=p.iridescenceIOR,f.iridescenceThicknessMinimum.value=p.iridescenceThicknessRange[0],f.iridescenceThicknessMaximum.value=p.iridescenceThicknessRange[1],p.iridescenceMap&&(f.iridescenceMap.value=p.iridescenceMap,t(p.iridescenceMap,f.iridescenceMapTransform)),p.iridescenceThicknessMap&&(f.iridescenceThicknessMap.value=p.iridescenceThicknessMap,t(p.iridescenceThicknessMap,f.iridescenceThicknessMapTransform))),p.transmission>0&&(f.transmission.value=p.transmission,f.transmissionSamplerMap.value=y.texture,f.transmissionSamplerSize.value.set(y.width,y.height),p.transmissionMap&&(f.transmissionMap.value=p.transmissionMap,t(p.transmissionMap,f.transmissionMapTransform)),f.thickness.value=p.thickness,p.thicknessMap&&(f.thicknessMap.value=p.thicknessMap,t(p.thicknessMap,f.thicknessMapTransform)),f.attenuationDistance.value=p.attenuationDistance,f.attenuationColor.value.copy(p.attenuationColor)),p.anisotropy>0&&(f.anisotropyVector.value.set(p.anisotropy*Math.cos(p.anisotropyRotation),p.anisotropy*Math.sin(p.anisotropyRotation)),p.anisotropyMap&&(f.anisotropyMap.value=p.anisotropyMap,t(p.anisotropyMap,f.anisotropyMapTransform))),f.specularIntensity.value=p.specularIntensity,f.specularColor.value.copy(p.specularColor),p.specularColorMap&&(f.specularColorMap.value=p.specularColorMap,t(p.specularColorMap,f.specularColorMapTransform)),p.specularIntensityMap&&(f.specularIntensityMap.value=p.specularIntensityMap,t(p.specularIntensityMap,f.specularIntensityMapTransform))}function g(f,p){p.matcap&&(f.matcap.value=p.matcap)}function S(f,p){let y=e.get(p).light;f.referencePosition.value.setFromMatrixPosition(y.matrixWorld),f.nearDistance.value=y.shadow.camera.near,f.farDistance.value=y.shadow.camera.far}return{refreshFogUniforms:i,refreshMaterialUniforms:s}}function p_(r,e,t,i){let s={},a={},n=[],o=r.getParameter(r.MAX_UNIFORM_BUFFER_BINDINGS);function l(x,T){let b=T.program;i.uniformBlockBinding(x,b)}function c(x,T){let b=s[x.id];b===void 0&&(f(x),b=h(x),s[x.id]=b,x.addEventListener("dispose",y));let A=T.program;i.updateUBOMapping(x,A);let _=e.render.frame;a[x.id]!==_&&(u(x),a[x.id]=_)}function h(x){let T=m();x.__bindingPointIndex=T;let b=r.createBuffer(),A=x.__size,_=x.usage;return r.bindBuffer(r.UNIFORM_BUFFER,b),r.bufferData(r.UNIFORM_BUFFER,A,_),r.bindBuffer(r.UNIFORM_BUFFER,null),r.bindBufferBase(r.UNIFORM_BUFFER,T,b),b}function m(){for(let x=0;x<o;x++)if(n.indexOf(x)===-1)return n.push(x),x;return Fe("WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function u(x){let T=s[x.id],b=x.uniforms,A=x.__cache;r.bindBuffer(r.UNIFORM_BUFFER,T);for(let _=0,w=b.length;_<w;_++){let I=b[_];if(Array.isArray(I))for(let L=0,U=I.length;L<U;L++)d(I[L],_,L,A);else d(I,_,0,A)}r.bindBuffer(r.UNIFORM_BUFFER,null)}function d(x,T,b,A){if(S(x,T,b,A)===!0){let _=x.__offset,w=x.value;if(Array.isArray(w)){let I=0;for(let L=0;L<w.length;L++){let U=w[L],V=p(U);g(U,x.__data,I),typeof U!="number"&&typeof U!="boolean"&&!U.isMatrix3&&!ArrayBuffer.isView(U)&&(I+=V.storage/Float32Array.BYTES_PER_ELEMENT)}}else g(w,x.__data,0);r.bufferSubData(r.UNIFORM_BUFFER,_,x.__data)}}function g(x,T,b){typeof x=="number"||typeof x=="boolean"?T[0]=x:x.isMatrix3?(T[0]=x.elements[0],T[1]=x.elements[1],T[2]=x.elements[2],T[3]=0,T[4]=x.elements[3],T[5]=x.elements[4],T[6]=x.elements[5],T[7]=0,T[8]=x.elements[6],T[9]=x.elements[7],T[10]=x.elements[8],T[11]=0):ArrayBuffer.isView(x)?T.set(new x.constructor(x.buffer,x.byteOffset,T.length)):x.toArray(T,b)}function S(x,T,b,A){let _=x.value,w=T+"_"+b;if(A[w]===void 0)return typeof _=="number"||typeof _=="boolean"?A[w]=_:ArrayBuffer.isView(_)?A[w]=_.slice():A[w]=_.clone(),!0;{let I=A[w];if(typeof _=="number"||typeof _=="boolean"){if(I!==_)return A[w]=_,!0}else{if(ArrayBuffer.isView(_))return!0;if(I.equals(_)===!1)return I.copy(_),!0}}return!1}function f(x){let T=x.uniforms,b=0,A=16;for(let w=0,I=T.length;w<I;w++){let L=Array.isArray(T[w])?T[w]:[T[w]];for(let U=0,V=L.length;U<V;U++){let P=L[U],H=Array.isArray(P.value)?P.value:[P.value];for(let Y=0,z=H.length;Y<z;Y++){let J=H[Y],X=p(J),Z=b%A,Q=Z%X.boundary,Le=Z+Q;b+=Q,Le!==0&&A-Le<X.storage&&(b+=A-Le),P.__data=new Float32Array(X.storage/Float32Array.BYTES_PER_ELEMENT),P.__offset=b,b+=X.storage}}}let _=b%A;return _>0&&(b+=A-_),x.__size=b,x.__cache={},this}function p(x){let T={boundary:0,storage:0};return typeof x=="number"||typeof x=="boolean"?(T.boundary=4,T.storage=4):x.isVector2?(T.boundary=8,T.storage=8):x.isVector3||x.isColor?(T.boundary=16,T.storage=12):x.isVector4?(T.boundary=16,T.storage=16):x.isMatrix3?(T.boundary=48,T.storage=48):x.isMatrix4?(T.boundary=64,T.storage=64):x.isTexture?Ue("WebGLRenderer: Texture samplers can not be part of an uniforms group."):ArrayBuffer.isView(x)?(T.boundary=16,T.storage=x.byteLength):Ue("WebGLRenderer: Unsupported uniform value type.",x),T}function y(x){let T=x.target;T.removeEventListener("dispose",y);let b=n.indexOf(T.__bindingPointIndex);n.splice(b,1),r.deleteBuffer(s[T.id]),delete s[T.id],delete a[T.id]}function E(){for(let x in s)r.deleteBuffer(s[x]);n=[],s={},a={}}return{bind:l,update:c,dispose:E}}var m_=new Uint16Array([12469,15057,12620,14925,13266,14620,13807,14376,14323,13990,14545,13625,14713,13328,14840,12882,14931,12528,14996,12233,15039,11829,15066,11525,15080,11295,15085,10976,15082,10705,15073,10495,13880,14564,13898,14542,13977,14430,14158,14124,14393,13732,14556,13410,14702,12996,14814,12596,14891,12291,14937,11834,14957,11489,14958,11194,14943,10803,14921,10506,14893,10278,14858,9960,14484,14039,14487,14025,14499,13941,14524,13740,14574,13468,14654,13106,14743,12678,14818,12344,14867,11893,14889,11509,14893,11180,14881,10751,14852,10428,14812,10128,14765,9754,14712,9466,14764,13480,14764,13475,14766,13440,14766,13347,14769,13070,14786,12713,14816,12387,14844,11957,14860,11549,14868,11215,14855,10751,14825,10403,14782,10044,14729,9651,14666,9352,14599,9029,14967,12835,14966,12831,14963,12804,14954,12723,14936,12564,14917,12347,14900,11958,14886,11569,14878,11247,14859,10765,14828,10401,14784,10011,14727,9600,14660,9289,14586,8893,14508,8533,15111,12234,15110,12234,15104,12216,15092,12156,15067,12010,15028,11776,14981,11500,14942,11205,14902,10752,14861,10393,14812,9991,14752,9570,14682,9252,14603,8808,14519,8445,14431,8145,15209,11449,15208,11451,15202,11451,15190,11438,15163,11384,15117,11274,15055,10979,14994,10648,14932,10343,14871,9936,14803,9532,14729,9218,14645,8742,14556,8381,14461,8020,14365,7603,15273,10603,15272,10607,15267,10619,15256,10631,15231,10614,15182,10535,15118,10389,15042,10167,14963,9787,14883,9447,14800,9115,14710,8665,14615,8318,14514,7911,14411,7507,14279,7198,15314,9675,15313,9683,15309,9712,15298,9759,15277,9797,15229,9773,15166,9668,15084,9487,14995,9274,14898,8910,14800,8539,14697,8234,14590,7790,14479,7409,14367,7067,14178,6621,15337,8619,15337,8631,15333,8677,15325,8769,15305,8871,15264,8940,15202,8909,15119,8775,15022,8565,14916,8328,14804,8009,14688,7614,14569,7287,14448,6888,14321,6483,14088,6171,15350,7402,15350,7419,15347,7480,15340,7613,15322,7804,15287,7973,15229,8057,15148,8012,15046,7846,14933,7611,14810,7357,14682,7069,14552,6656,14421,6316,14251,5948,14007,5528,15356,5942,15356,5977,15353,6119,15348,6294,15332,6551,15302,6824,15249,7044,15171,7122,15070,7050,14949,6861,14818,6611,14679,6349,14538,6067,14398,5651,14189,5311,13935,4958,15359,4123,15359,4153,15356,4296,15353,4646,15338,5160,15311,5508,15263,5829,15188,6042,15088,6094,14966,6001,14826,5796,14678,5543,14527,5287,14377,4985,14133,4586,13869,4257,15360,1563,15360,1642,15358,2076,15354,2636,15341,3350,15317,4019,15273,4429,15203,4732,15105,4911,14981,4932,14836,4818,14679,4621,14517,4386,14359,4156,14083,3795,13808,3437,15360,122,15360,137,15358,285,15355,636,15344,1274,15322,2177,15281,2765,15215,3223,15120,3451,14995,3569,14846,3567,14681,3466,14511,3305,14344,3121,14037,2800,13753,2467,15360,0,15360,1,15359,21,15355,89,15346,253,15325,479,15287,796,15225,1148,15133,1492,15008,1749,14856,1882,14685,1886,14506,1783,14324,1608,13996,1398,13702,1183]),fi=null;function f_(){return fi===null&&(fi=new Na(m_,16,16,qi,ai),fi.name="DFG_LUT",fi.minFilter=wt,fi.magFilter=wt,fi.wrapS=ci,fi.wrapT=ci,fi.generateMipmaps=!1,fi.needsUpdate=!0),fi}var _o=class{constructor(e={}){let{canvas:t=bh(),context:i=null,depth:s=!0,stencil:a=!1,alpha:n=!1,antialias:o=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:c=!1,powerPreference:h="default",failIfMajorPerformanceCaveat:m=!1,reversedDepthBuffer:u=!1,outputBufferType:d=Ot}=e;this.isWebGLRenderer=!0;let g;if(i!==null){if(typeof WebGLRenderingContext<"u"&&i instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");g=i.getContextAttributes().alpha}else g=n;let S=d,f=new Set([Ln,Pn,In]),p=new Set([Ot,ri,zr,Gr,Cn,Rn]),y=new Uint32Array(4),E=new Int32Array(4),x=new R,T=null,b=null,A=[],_=[],w=null;this.domElement=t,this.debug={checkShaderErrors:!0,diagnostics:{keywords:!1},onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=ii,this.toneMappingExposure=1,this.transmissionResolutionScale=1;let I=this,L=!1,U=null,V=null,P=null,H=null;this._outputColorSpace=zt;let Y=0,z=0,J=null,X=-1,Z=null,Q=new lt,Le=new lt,fe=null,qe=new He(0),Qe=0,it=t.width,K=t.height,$=1,ye=null,Be=null,pe=new lt(0,0,it,K),Te=new lt(0,0,it,K),ie=!1,re=new Ai,te=!1,_e=!1,ve=new Xe,Re=new R,Pe=new lt,Je={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0},ze=!1;function je(){return J===null?$:1}let N=i;function mt(M,D){return t.getContext(M,D)}let We,C,v,B,W,q,ce,de,F,he,ue,Ee,ne,Ge,Ie,Ve,Ye,O,ee,oe,xe,be,se;try{let M={alpha:!0,depth:s,stencil:a,antialias:o,premultipliedAlpha:l,preserveDrawingBuffer:c,powerPreference:h,failIfMajorPerformanceCaveat:m};if("setAttribute"in t&&t.setAttribute("data-engine",`three.js r${"186"}`),t.addEventListener("webglcontextlost",xt,!1),t.addEventListener("webglcontextrestored",rt,!1),t.addEventListener("webglcontextcreationerror",Zt,!1),N===null){let D="webgl2";if(N=mt(D,M),N===null)throw mt(D)?new Error("THREE.WebGLRenderer: Error creating WebGL context with your selected attributes."):new Error("THREE.WebGLRenderer: Error creating WebGL context.")}Ne()}catch(M){throw t.removeEventListener("webglcontextlost",xt,!1),t.removeEventListener("webglcontextrestored",rt,!1),t.removeEventListener("webglcontextcreationerror",Zt,!1),Fe("WebGLRenderer: "+M.message),M}function Ne(){We=new Mf(N),We.init(),xe=new l_(N,We),C=new df(N,We,e,xe),v=new n_(N,We),C.reversedDepthBuffer&&u&&v.buffers.depth.setReversed(!0),V=N.createFramebuffer(),P=N.createFramebuffer(),H=N.createFramebuffer(),B=new wf(N),W=new jg,q=new o_(N,We,v,W,C,xe,B),ce=new Sf(I),de=new Ed(N),be=new hf(N,de),F=new bf(N,de,B,be),he=new Af(N,F,de,be,B),O=new Ef(N,C,q),Ie=new pf(W),ue=new Xg(I,ce,We,C,be,Ie),Ee=new d_(I,W),ne=new Yg,Ge=new e_(We),Ye=new cf(I,ce,v,he,g,l),Ve=new a_(I,he,C),se=new p_(N,B,C,v),ee=new uf(N,We,B),oe=new Tf(N,We,B),B.programs=ue.programs,I.capabilities=C,I.extensions=We,I.properties=W,I.renderLists=ne,I.shadowMap=Ve,I.state=v,I.info=B}S!==Ot&&(w=new Rf(S,t.width,t.height,o,s,a));let Se=new Ql(I,N);this.xr=Se,this.getContext=function(){return N},this.getContextAttributes=function(){return N.getContextAttributes()},this.forceContextLoss=function(){let M=We.get("WEBGL_lose_context");M&&M.loseContext()},this.forceContextRestore=function(){let M=We.get("WEBGL_lose_context");M&&M.restoreContext()},this.getPixelRatio=function(){return $},this.setPixelRatio=function(M){M!==void 0&&($=M,this.setSize(it,K,!1))},this.getSize=function(M){return M.set(it,K)},this.setSize=function(M,D,j=!0){if(Se.isPresenting){Ue("WebGLRenderer: Can't change size while VR device is presenting.");return}it=M,K=D,t.width=Math.floor(M*$),t.height=Math.floor(D*$),j===!0&&(t.style.width=M+"px",t.style.height=D+"px"),w!==null&&w.setSize(t.width,t.height),this.setViewport(0,0,M,D)},this.getDrawingBufferSize=function(M){return M.set(it*$,K*$).floor()},this.setDrawingBufferSize=function(M,D,j){it=M,K=D,$=j,t.width=Math.floor(M*j),t.height=Math.floor(D*j),this.setViewport(0,0,M,D)},this.setEffects=function(M){if(S===Ot){Fe("WebGLRenderer: setEffects() requires outputBufferType set to HalfFloatType or FloatType.");return}if(M){for(let D=0;D<M.length;D++)if(M[D].isOutputPass===!0){Ue("WebGLRenderer: OutputPass is not needed in setEffects(). Tone mapping and color space conversion are applied automatically.");break}}w.setEffects(M||[])},this.getCurrentViewport=function(M){return M.copy(Q)},this.getViewport=function(M){return M.copy(pe)},this.setViewport=function(M,D,j,k){M.isVector4?pe.set(M.x,M.y,M.z,M.w):pe.set(M,D,j,k),v.viewport(Q.copy(pe).multiplyScalar($).round())},this.getScissor=function(M){return M.copy(Te)},this.setScissor=function(M,D,j,k){M.isVector4?Te.set(M.x,M.y,M.z,M.w):Te.set(M,D,j,k),v.scissor(Le.copy(Te).multiplyScalar($).round())},this.getScissorTest=function(){return ie},this.setScissorTest=function(M){v.setScissorTest(ie=M)},this.setOpaqueSort=function(M){ye=M},this.setTransparentSort=function(M){Be=M},this.getClearColor=function(M){return M.copy(Ye.getClearColor())},this.setClearColor=function(){Ye.setClearColor(...arguments)},this.getClearAlpha=function(){return Ye.getClearAlpha()},this.setClearAlpha=function(){Ye.setClearAlpha(...arguments)},this.clear=function(M=!0,D=!0,j=!0){let k=0;if(M){let G=!1;if(J!==null){let le=J.texture.format;G=f.has(le)}if(G){let le=J.texture.type,ge=p.has(le),Me=Ye.getClearColor(),we=Ye.getClearAlpha(),Oe=Me.r,$e=Me.g,tt=Me.b;ge?(y[0]=Oe,y[1]=$e,y[2]=tt,y[3]=we,N.clearBufferuiv(N.COLOR,0,y)):(E[0]=Oe,E[1]=$e,E[2]=tt,E[3]=we,N.clearBufferiv(N.COLOR,0,E))}else k|=N.COLOR_BUFFER_BIT}D&&(k|=N.DEPTH_BUFFER_BIT,this.state.buffers.depth.setMask(!0)),j&&(k|=N.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),k!==0&&N.clear(k)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.setNodesHandler=function(M){M.setRenderer(this),U=M},this.dispose=function(){t.removeEventListener("webglcontextlost",xt,!1),t.removeEventListener("webglcontextrestored",rt,!1),t.removeEventListener("webglcontextcreationerror",Zt,!1),Ye.dispose(),ne.dispose(),Ge.dispose(),W.dispose(),ce.dispose(),he.dispose(),be.dispose(),se.dispose(),ue.dispose(),Se.dispose(),Se.removeEventListener("sessionstart",tc),Se.removeEventListener("sessionend",ic),Yi.stop()};function xt(M){M.preventDefault(),Cl("WebGLRenderer: Context Lost."),L=!0}function rt(){Cl("WebGLRenderer: Context Restored."),L=!1;let M=B.autoReset,D=Ve.enabled,j=Ve.autoUpdate,k=Ve.needsUpdate,G=Ve.type;Ne(),B.autoReset=M,Ve.enabled=D,Ve.autoUpdate=j,Ve.needsUpdate=k,Ve.type=G}function Zt(M){Fe("WebGLRenderer: A WebGL context could not be created. Reason: ",M.statusMessage)}function ni(M){let D=M.target;D.removeEventListener("dispose",ni),cu(D)}function cu(M){hu(M),W.remove(M)}function hu(M){let D=W.get(M).programs;D!==void 0&&(D.forEach(function(j){ue.releaseProgram(j)}),M.isShaderMaterial&&ue.releaseShaderCache(M))}this.renderBufferDirect=function(M,D,j,k,G,le){D===null&&(D=Je);let ge=G.isMesh&&G.matrixWorld.determinantAffine()<0,Me=pu(M,D,j,k,G);v.setMaterial(k,ge);let we=j.index,Oe=1;if(k.wireframe===!0){if(we=F.getWireframeAttribute(j),we===void 0)return;Oe=2}let $e=j.drawRange,tt=j.attributes.position,Ce=$e.start*Oe,at=($e.start+$e.count)*Oe;le!==null&&(Ce=Math.max(Ce,le.start*Oe),at=Math.min(at,(le.start+le.count)*Oe)),we!==null?(Ce=Math.max(Ce,0),at=Math.min(at,we.count)):tt!=null&&(Ce=Math.max(Ce,0),at=Math.min(at,tt.count));let _t=at-Ce;if(_t<0||_t===1/0)return;be.setup(G,k,Me,j,we);let ht,ut=ee;if(we!==null&&(ht=de.get(we),ut=oe,ut.setIndex(ht)),G.isMesh)k.wireframe===!0?(v.setLineWidth(k.wireframeLinewidth*je()),ut.setMode(N.LINES)):ut.setMode(N.TRIANGLES);else if(G.isLine){let ft=k.linewidth;ft===void 0&&(ft=1),v.setLineWidth(ft*je()),G.isLineSegments?ut.setMode(N.LINES):G.isLineLoop?ut.setMode(N.LINE_LOOP):ut.setMode(N.LINE_STRIP)}else G.isPoints?ut.setMode(N.POINTS):G.isSprite&&ut.setMode(N.TRIANGLES);if(G.isBatchedMesh)if(We.get("WEBGL_multi_draw"))ut.renderMultiDraw(G._multiDrawStarts,G._multiDrawCounts,G._multiDrawCount);else{let ft=G._multiDrawStarts,Ae=G._multiDrawCounts,It=G._multiDrawCount,Zi=we?de.get(we).bytesPerElement:1,Ht=W.get(k).currentProgram.getUniforms();for(let oi=0;oi<It;oi++)Ht.setValue(N,"_gl_DrawID",oi),ut.render(ft[oi]/Zi,Ae[oi])}else if(G.isInstancedMesh)ut.renderInstances(Ce,_t,G.count);else if(j.isInstancedBufferGeometry){let ft=j._maxInstanceCount!==void 0?j._maxInstanceCount:1/0,Ae=Math.min(j.instanceCount,ft);ut.renderInstances(Ce,_t,Ae)}else ut.render(Ce,_t)};function ec(M,D,j,k){U!==null&&M.isNodeMaterial&&U.setObject(k,M),te===!0&&Ie.setState(M,j,!1),M.transparent===!0&&M.side===pi&&M.forceSinglePass===!1?(M.side=Pt,M.needsUpdate=!0,Hs(M,D,k),M.side=Hi,M.needsUpdate=!0,Hs(M,D,k),M.side=pi):Hs(M,D,k)}this.compile=function(M,D,j=null){j===null&&(j=M),U!==null&&U.renderStart(M,D,j),b=Ge.get(j),b.init(D),_.push(b),j.traverseVisible(function(G){G.isLight&&G.layers.test(D.layers)&&(b.pushLight(G),G.castShadow&&b.pushShadow(G))}),M!==j&&M.traverseVisible(function(G){G.isLight&&G.layers.test(D.layers)&&(b.pushLight(G),G.castShadow&&b.pushShadow(G))}),b.setupLights(),U!==null&&U.updateLights(b.state.lightsArray),_e=this.localClippingEnabled,te=Ie.init(this.clippingPlanes,_e),te===!0&&Ie.setGlobalState(this.clippingPlanes,D),U!==null&&Ve.render(b.state.shadowsArray,j,D);let k=new Set;return M.traverse(function(G){if(!(G.isMesh||G.isPoints||G.isLine||G.isSprite))return;let le=G.material;if(le)if(Array.isArray(le))for(let ge=0;ge<le.length;ge++){let Me=le[ge];ec(Me,j,D,G),k.add(Me)}else ec(le,j,D,G),k.add(le)}),b=_.pop(),U!==null&&U.renderEnd(),k},this.compileAsync=function(M,D,j=null){let k=this.compile(M,D,j);return new Promise(G=>{function le(){if(k.forEach(function(ge){let Me=W.get(ge).currentProgram;(Me===void 0||Me.isReady())&&k.delete(ge)}),k.size===0){G(M);return}setTimeout(le,10)}We.get("KHR_parallel_shader_compile")!==null?le():setTimeout(le,10)})};let yo=null;function uu(M){yo&&yo(M)}function tc(){Yi.stop()}function ic(){Yi.start()}let Yi=new iu;Yi.setAnimationLoop(uu),typeof self<"u"&&Yi.setContext(self),this.setAnimationLoop=function(M){yo=M,Se.setAnimationLoop(M),M===null?Yi.stop():Yi.start()},Se.addEventListener("sessionstart",tc),Se.addEventListener("sessionend",ic),this.render=function(M,D){if(D!==void 0&&D.isCamera!==!0){Fe("WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(L===!0)return;U!==null&&U.renderStart(M,D);let j=Se.enabled===!0&&Se.isPresenting===!0,k=w!==null&&(J===null||j)&&w.begin(I,J);if(M.matrixWorldAutoUpdate===!0&&M.updateMatrixWorld(),D.parent===null&&D.matrixWorldAutoUpdate===!0&&D.updateMatrixWorld(),Se.enabled===!0&&Se.isPresenting===!0&&(w===null||w.isCompositing()===!1)&&(Se.cameraAutoUpdate===!0&&Se.updateCamera(D),D=Se.getCamera()),M.isScene===!0&&M.onBeforeRender(I,M,D,J),b=Ge.get(M,_.length),b.init(D),b.state.textureUnits=q.getTextureUnits(),_.push(b),ve.multiplyMatrices(D.projectionMatrix,D.matrixWorldInverse),re.setFromProjectionMatrix(ve,Xt,D.reversedDepth),_e=this.localClippingEnabled,te=Ie.init(this.clippingPlanes,_e),T=ne.get(M,A.length),T.init(),A.push(T),Se.enabled===!0&&Se.isPresenting===!0){let le=I.xr.getDepthSensingMesh();le!==null&&So(le,D,-1/0,I.sortObjects)}So(M,D,0,I.sortObjects),T.finish(),U!==null&&U.updateLights(b.state.lightsArray),I.sortObjects===!0&&T.sort(ye,Be),ze=Se.enabled===!1||Se.isPresenting===!1||Se.hasDepthSensing()===!1,ze&&Ye.addToRenderList(T,M),this.info.render.frame++,this.info.autoReset===!0&&this.info.reset(),te===!0&&Ie.beginShadows();let G=b.state.shadowsArray;if(Ve.render(G,M,D),te===!0&&Ie.endShadows(),(k&&w.hasRenderPass())===!1){let le=T.opaque,ge=T.transmissive;if(b.setupLights(),D.isArrayCamera){let Me=D.cameras;if(ge.length>0)for(let we=0,Oe=Me.length;we<Oe;we++){let $e=Me[we];sc(le,ge,M,$e)}ze&&Ye.render(M);for(let we=0,Oe=Me.length;we<Oe;we++){let $e=Me[we];rc(T,M,$e,$e.viewport)}}else ge.length>0&&sc(le,ge,M,D),ze&&Ye.render(M),rc(T,M,D)}J!==null&&z===0&&(q.updateMultisampleRenderTarget(J),q.updateRenderTargetMipmap(J)),k&&w.end(I),M.isScene===!0&&M.onAfterRender(I,M,D),be.resetDefaultState(),X=-1,Z=null,_.pop(),_.length>0?(b=_[_.length-1],q.setTextureUnits(b.state.textureUnits),te===!0&&Ie.setGlobalState(I.clippingPlanes,b.state.camera)):b=null,A.pop(),A.length>0?T=A[A.length-1]:T=null,U!==null&&U.renderEnd()};function So(M,D,j,k){if(M.visible===!1)return;if(M.layers.test(D.layers)){if(M.isGroup)j=M.renderOrder;else if(M.isLOD)M.autoUpdate===!0&&M.update(D);else if(M.isLightProbeGrid)b.pushLightProbeGrid(M);else if(M.isLight)b.pushLight(M),M.castShadow&&b.pushShadow(M);else if(M.isSprite){if(!M.frustumCulled||M.intersectsFrustum(re)){k&&Pe.setFromMatrixPosition(M.matrixWorld).applyMatrix4(ve);let le=he.update(M),ge=M.material;ge.visible&&T.push(M,le,ge,j,Pe.z,null,D)}}else if((M.isMesh||M.isLine||M.isPoints)&&(!M.frustumCulled||M.intersectsFrustum(re))){let le=he.update(M),ge=M.material;if(k&&(M.boundingSphere!==void 0?(M.boundingSphere===null&&M.computeBoundingSphere(),Pe.copy(M.boundingSphere.center)):(le.boundingSphere===null&&le.computeBoundingSphere(),Pe.copy(le.boundingSphere.center)),Pe.applyMatrix4(M.matrixWorld).applyMatrix4(ve)),Array.isArray(ge)){let Me=le.groups;for(let we=0,Oe=Me.length;we<Oe;we++){let $e=Me[we],tt=ge[$e.materialIndex];tt&&tt.visible&&T.push(M,le,tt,j,Pe.z,$e,D)}}else ge.visible&&T.push(M,le,ge,j,Pe.z,null,D)}}let G=M.children;for(let le=0,ge=G.length;le<ge;le++)So(G[le],D,j,k)}function rc(M,D,j,k){let{opaque:G,transmissive:le,transparent:ge}=M;b.setupLightsView(j),te===!0&&Ie.setGlobalState(I.clippingPlanes,j),k&&v.viewport(Q.copy(k)),G.length>0&&ks(G,D,j),le.length>0&&ks(le,D,j),ge.length>0&&ks(ge,D,j),v.buffers.depth.setTest(!0),v.buffers.depth.setMask(!0),v.buffers.color.setMask(!0),v.setPolygonOffset(!1)}function sc(M,D,j,k){if((j.isScene===!0?j.overrideMaterial:null)!==null)return;if(b.state.transmissionRenderTarget[k.id]===void 0){let tt=We.has("EXT_color_buffer_half_float")||We.has("EXT_color_buffer_float");b.state.transmissionRenderTarget[k.id]=new Dt(1,1,{generateMipmaps:!0,type:tt?ai:Ot,minFilter:Xi,samples:Math.max(4,C.samples),stencilBuffer:a,resolveDepthBuffer:!1,resolveStencilBuffer:!1,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,colorSpace:et.workingColorSpace})}let G=b.state.transmissionRenderTarget[k.id],le=k.viewport||Q;G.setSize(le.z*I.transmissionResolutionScale,le.w*I.transmissionResolutionScale);let ge=I.getRenderTarget(),Me=I.getActiveCubeFace(),we=I.getActiveMipmapLevel();I.setRenderTarget(G),I.getClearColor(qe),Qe=I.getClearAlpha(),Qe<1&&I.setClearColor(16777215,.5),I.clear(),ze&&Ye.render(j);let Oe=I.toneMapping;I.toneMapping=ii;let $e=k.viewport;if(k.viewport!==void 0&&(k.viewport=void 0),b.setupLightsView(k),te===!0&&Ie.setGlobalState(I.clippingPlanes,k),ks(M,j,k),q.updateMultisampleRenderTarget(G),q.updateRenderTargetMipmap(G),We.has("WEBGL_multisampled_render_to_texture")===!1){let tt=!1;for(let Ce=0,at=D.length;Ce<at;Ce++){let _t=D[Ce],{object:ht,geometry:ut,material:ft,group:Ae}=_t;if(ft.side===pi&&ht.layers.test(k.layers)){let It=ft.side;ft.side=Pt,ft.needsUpdate=!0,ac(ht,j,k,ut,ft,Ae),ft.side=It,ft.needsUpdate=!0,tt=!0}}tt===!0&&(q.updateMultisampleRenderTarget(G),q.updateRenderTargetMipmap(G))}I.setRenderTarget(ge,Me,we),I.setClearColor(qe,Qe),$e!==void 0&&(k.viewport=$e),I.toneMapping=Oe}function ks(M,D,j){let k=D.isScene===!0?D.overrideMaterial:null;for(let G=0,le=M.length;G<le;G++){let ge=M[G],{object:Me,geometry:we,group:Oe}=ge,$e=ge.material;$e.allowOverride===!0&&k!==null&&($e=k),Me.layers.test(j.layers)&&ac(Me,D,j,we,$e,Oe)}}function ac(M,D,j,k,G,le){U!==null&&G.isNodeMaterial&&U.setObject(M,G),M.onBeforeRender(I,D,j,k,G,le),M.modelViewMatrix.multiplyMatrices(j.matrixWorldInverse,M.matrixWorld),M.normalMatrix.getNormalMatrix(M.modelViewMatrix),G.onBeforeRender(I,D,j,k,M,le),G.transparent===!0&&G.side===pi&&G.forceSinglePass===!1?(G.side=Pt,G.needsUpdate=!0,I.renderBufferDirect(j,D,k,G,M,le),G.side=Hi,G.needsUpdate=!0,I.renderBufferDirect(j,D,k,G,M,le),G.side=pi):I.renderBufferDirect(j,D,k,G,M,le),M.onAfterRender(I,D,j,k,G,le)}function Hs(M,D,j){D.isScene!==!0&&(D=Je);let k=W.get(M),G=b.state.lights,le=b.state.shadowsArray,ge=G.state.version,Me=ue.getParameters(M,G.state,le,D,j,b.state.lightProbeGridArray),we=ue.getProgramCacheKey(Me),Oe=k.programs;k.environment=M.isMeshStandardMaterial||M.isMeshLambertMaterial||M.isMeshPhongMaterial?D.environment:null,k.fog=D.fog;let $e=M.isMeshStandardMaterial||M.isMeshLambertMaterial&&!M.envMap||M.isMeshPhongMaterial&&!M.envMap;k.envMap=ce.get(M.envMap||k.environment,$e),k.envMapRotation=k.environment!==null&&M.envMap===null?D.environmentRotation:M.envMapRotation,Oe===void 0&&(M.addEventListener("dispose",ni),Oe=new Map,k.programs=Oe);let tt=Oe.get(we);if(tt!==void 0){if(k.currentProgram===tt&&k.lightsStateVersion===ge)return oc(M,Me),tt}else Me.uniforms=ue.getUniforms(M),U!==null&&M.isNodeMaterial&&U.build(M,j,Me),M.onBeforeCompile(Me,I),tt=ue.acquireProgram(Me,we),Oe.set(we,tt),k.uniforms=Me.uniforms;let Ce=k.uniforms;return(!M.isShaderMaterial&&!M.isRawShaderMaterial||M.clipping===!0)&&(Ce.clippingPlanes=Ie.uniform),oc(M,Me),k.needsLights=fu(M),k.lightsStateVersion=ge,k.needsLights&&(Ce.ambientLightColor.value=G.state.ambient,Ce.lightProbe.value=G.state.probe,Ce.sunLights.value=G.state.sun,Ce.sunLightShadows.value=G.state.sunShadow,Ce.directionalLights.value=G.state.directional,Ce.directionalLightShadows.value=G.state.directionalShadow,Ce.spotLights.value=G.state.spot,Ce.spotLightShadows.value=G.state.spotShadow,Ce.rectAreaLights.value=G.state.rectArea,Ce.ltc_1.value=G.state.rectAreaLTC1,Ce.ltc_2.value=G.state.rectAreaLTC2,Ce.pointLights.value=G.state.point,Ce.pointLightShadows.value=G.state.pointShadow,Ce.hemisphereLights.value=G.state.hemi,Ce.sunShadowMatrix.value=G.state.sunShadowMatrix,Ce.sunShadowCascade.value=G.state.sunShadowCascade,Ce.directionalShadowMatrix.value=G.state.directionalShadowMatrix,Ce.spotLightMatrix.value=G.state.spotLightMatrix,Ce.spotLightMap.value=G.state.spotLightMap,Ce.pointShadowMatrix.value=G.state.pointShadowMatrix),k.lightProbeGrid=b.state.lightProbeGridArray.length>0,k.currentProgram=tt,k.uniformsList=null,tt}function nc(M){if(M.uniformsList===null){let D=M.currentProgram.getUniforms();M.uniformsList=Wr.seqWithValue(D.seq,M.uniforms)}return M.uniformsList}function oc(M,D){let j=W.get(M);j.outputColorSpace=D.outputColorSpace,j.batching=D.batching,j.batchingColor=D.batchingColor,j.instancing=D.instancing,j.instancingColor=D.instancingColor,j.instancingMorph=D.instancingMorph,j.skinning=D.skinning,j.morphTargets=D.morphTargets,j.morphNormals=D.morphNormals,j.morphColors=D.morphColors,j.morphTargetsCount=D.morphTargetsCount,j.numClippingPlanes=D.numClippingPlanes,j.numIntersection=D.numClipIntersection,j.vertexAlphas=D.vertexAlphas,j.vertexTangents=D.vertexTangents,j.toneMapping=D.toneMapping}function du(M,D){if(M.length===0)return null;if(M.length===1)return M[0].texture!==null?M[0]:null;x.setFromMatrixPosition(D.matrixWorld);for(let j=0,k=M.length;j<k;j++){let G=M[j];if(G.texture!==null&&G.boundingBox.containsPoint(x))return G}return null}function pu(M,D,j,k,G){D.isScene!==!0&&(D=Je),q.resetTextureUnits();let le=D.fog,ge=k.isMeshStandardMaterial||k.isMeshLambertMaterial||k.isMeshPhongMaterial?D.environment:null,Me=J===null?I.outputColorSpace:J.isXRRenderTarget===!0?J.texture.colorSpace:et.workingColorSpace,we=k.isMeshStandardMaterial||k.isMeshLambertMaterial&&!k.envMap||k.isMeshPhongMaterial&&!k.envMap,Oe=ce.get(k.envMap||ge,we),$e=k.vertexColors===!0&&!!j.attributes.color&&j.attributes.color.itemSize===4,tt=!!j.attributes.tangent&&(!!k.normalMap||k.anisotropy>0),Ce=!!j.morphAttributes.position,at=!!j.morphAttributes.normal,_t=!!j.morphAttributes.color,ht=ii;k.toneMapped&&(J===null||J.isXRRenderTarget===!0)&&(ht=I.toneMapping);let ut=j.morphAttributes.position||j.morphAttributes.normal||j.morphAttributes.color,ft=ut!==void 0?ut.length:0,Ae=W.get(k),It=b.state.lights;if(te===!0&&(_e===!0||M!==Z)){let ot=M===Z&&k.id===X;Ie.setState(k,M,ot)}let Zi=!1;k.version===Ae.__version?(Ae.needsLights&&Ae.lightsStateVersion!==It.state.version||Ae.outputColorSpace!==Me||G.isBatchedMesh&&Ae.batching===!1||!G.isBatchedMesh&&Ae.batching===!0||G.isBatchedMesh&&Ae.batchingColor===!0&&G._colorsTexture===null||G.isBatchedMesh&&Ae.batchingColor===!1&&G._colorsTexture!==null||G.isInstancedMesh&&Ae.instancing===!1||!G.isInstancedMesh&&Ae.instancing===!0||G.isSkinnedMesh&&Ae.skinning===!1||!G.isSkinnedMesh&&Ae.skinning===!0||G.isInstancedMesh&&Ae.instancingColor===!0&&G.instanceColor===null||G.isInstancedMesh&&Ae.instancingColor===!1&&G.instanceColor!==null||G.isInstancedMesh&&Ae.instancingMorph===!0&&G.morphTexture===null||G.isInstancedMesh&&Ae.instancingMorph===!1&&G.morphTexture!==null||Ae.envMap!==Oe||k.fog===!0&&Ae.fog!==le||Ae.numClippingPlanes!==void 0&&(Ae.numClippingPlanes!==Ie.numPlanes||Ae.numIntersection!==Ie.numIntersection)||Ae.vertexAlphas!==$e||Ae.vertexTangents!==tt||Ae.morphTargets!==Ce||Ae.morphNormals!==at||Ae.morphColors!==_t||Ae.toneMapping!==ht||Ae.morphTargetsCount!==ft||!!Ae.lightProbeGrid!=b.state.lightProbeGridArray.length>0)&&(Zi=!0):(Zi=!0,Ae.__version=k.version);let Ht=Ae.currentProgram;Zi===!0&&(Ht=Hs(k,D,G),U&&k.isNodeMaterial&&U.onUpdateProgram(k,Ht,Ae));let oi=!1,Ii=!1,cr=!1,nt=Ht.getUniforms(),gt=Ae.uniforms;if(v.useProgram(Ht.program)&&(oi=!0,Ii=!0,cr=!0),k.id!==X&&(X=k.id,Ii=!0),Ae.needsLights){let ot=du(b.state.lightProbeGridArray,G);Ae.lightProbeGrid!==ot&&(Ae.lightProbeGrid=ot,Ii=!0)}if(oi||Z!==M){v.buffers.depth.getReversed()&&M.reversedDepth!==!0&&(M._reversedDepth=!0,M.updateProjectionMatrix()),nt.setValue(N,"projectionMatrix",M.projectionMatrix),nt.setValue(N,"viewMatrix",M.matrixWorldInverse);let ot=nt.map.cameraPosition;ot!==void 0&&ot.setValue(N,Re.setFromMatrixPosition(M.matrixWorld)),C.logarithmicDepthBuffer&&nt.setValue(N,"logDepthBufFC",2/(Math.log(M.far+1)/Math.LN2)),(k.isMeshPhongMaterial||k.isMeshToonMaterial||k.isMeshLambertMaterial||k.isMeshBasicMaterial||k.isMeshStandardMaterial||k.isShaderMaterial)&&nt.setValue(N,"isOrthographic",M.isOrthographicCamera===!0),Z!==M&&(Z=M,Ii=!0,cr=!0)}if(Ae.needsLights&&(It.state.sunShadowMap.length>0&&nt.setValue(N,"sunShadowMap",It.state.sunShadowMap,q),It.state.directionalShadowMap.length>0&&nt.setValue(N,"directionalShadowMap",It.state.directionalShadowMap,q),It.state.spotShadowMap.length>0&&nt.setValue(N,"spotShadowMap",It.state.spotShadowMap,q),It.state.pointShadowMap.length>0&&nt.setValue(N,"pointShadowMap",It.state.pointShadowMap,q)),G.isSkinnedMesh){nt.setOptional(N,G,"bindMatrix"),nt.setOptional(N,G,"bindMatrixInverse");let ot=G.skeleton;ot&&(ot.boneTexture===null&&ot.computeBoneTexture(),nt.setValue(N,"boneTexture",ot.boneTexture,q))}G.isBatchedMesh&&(nt.setOptional(N,G,"batchingTexture"),nt.setValue(N,"batchingTexture",G._matricesTexture,q),nt.setOptional(N,G,"batchingIdTexture"),nt.setValue(N,"batchingIdTexture",G._indirectTexture,q),nt.setOptional(N,G,"batchingColorTexture"),G._colorsTexture!==null&&nt.setValue(N,"batchingColorTexture",G._colorsTexture,q));let Pi=j.morphAttributes;if((Pi.position!==void 0||Pi.normal!==void 0||Pi.color!==void 0)&&O.update(G,j,Ht),(Ii||Ae.receiveShadow!==G.receiveShadow)&&(Ae.receiveShadow=G.receiveShadow,nt.setValue(N,"receiveShadow",G.receiveShadow)),(k.isMeshStandardMaterial||k.isMeshLambertMaterial||k.isMeshPhongMaterial)&&k.envMap===null&&D.environment!==null&&(gt.envMapIntensity.value=D.environmentIntensity),gt.dfgLUT!==void 0&&(gt.dfgLUT.value=f_()),Ii){if(nt.setValue(N,"toneMappingExposure",I.toneMappingExposure),Ae.needsLights&&mu(gt,cr),le&&k.fog===!0&&Ee.refreshFogUniforms(gt,le),Ee.refreshMaterialUniforms(gt,k,$,K,b.state.transmissionRenderTarget[M.id]),Ae.needsLights&&Ae.lightProbeGrid){let ot=Ae.lightProbeGrid;gt.probesSH.value=ot.texture,gt.probesMin.value.copy(ot.boundingBox.min),gt.probesMax.value.copy(ot.boundingBox.max),gt.probesResolution.value.copy(ot.resolution)}Wr.upload(N,nc(Ae),gt,q)}if(k.isShaderMaterial&&k.uniformsNeedUpdate===!0&&(Wr.upload(N,nc(Ae),gt,q),k.uniformsNeedUpdate=!1),k.isSpriteMaterial&&nt.setValue(N,"center",G.center),nt.setValue(N,"modelViewMatrix",G.modelViewMatrix),nt.setValue(N,"normalMatrix",G.normalMatrix),nt.setValue(N,"modelMatrix",G.matrixWorld),k.uniformsGroups!==void 0){let ot=k.uniformsGroups;for(let jr=0,hr=ot.length;jr<hr;jr++){let cc=ot[jr];se.update(cc,Ht),se.bind(cc,Ht)}}return Ht}function mu(M,D){M.ambientLightColor.needsUpdate=D,M.lightProbe.needsUpdate=D,M.sunLights.needsUpdate=D,M.sunLightShadows.needsUpdate=D,M.directionalLights.needsUpdate=D,M.directionalLightShadows.needsUpdate=D,M.pointLights.needsUpdate=D,M.pointLightShadows.needsUpdate=D,M.spotLights.needsUpdate=D,M.spotLightShadows.needsUpdate=D,M.rectAreaLights.needsUpdate=D,M.hemisphereLights.needsUpdate=D}function fu(M){return M.isMeshLambertMaterial||M.isMeshToonMaterial||M.isMeshPhongMaterial||M.isMeshStandardMaterial||M.isShadowMaterial||M.isShaderMaterial&&M.lights===!0}this.getActiveCubeFace=function(){return Y},this.getActiveMipmapLevel=function(){return z},this.getRenderTarget=function(){return J},this.setRenderTargetTextures=function(M,D,j){let k=W.get(M);k.__autoAllocateDepthBuffer=M.resolveDepthBuffer===!1,k.__autoAllocateDepthBuffer===!1&&(k.__useRenderToTexture=!1),W.get(M.texture).__webglTexture=D,W.get(M.depthTexture).__webglTexture=k.__autoAllocateDepthBuffer?void 0:j,k.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(M,D){let j=W.get(M);j.__webglFramebuffer=D,j.__useDefaultFramebuffer=D===void 0},this.setRenderTarget=function(M,D=0,j=0){J=M,Y=D,z=j;let k=null,G=!1,le=!1;if(M){let ge=W.get(M);if(ge.__useDefaultFramebuffer!==void 0){v.bindFramebuffer(N.FRAMEBUFFER,ge.__webglFramebuffer),Q.copy(M.viewport),Le.copy(M.scissor),fe=M.scissorTest,v.viewport(Q),v.scissor(Le),v.setScissorTest(fe),X=-1;return}else if(ge.__webglFramebuffer===void 0)q.setupRenderTarget(M);else if(ge.__hasExternalTextures)q.rebindTextures(M,W.get(M.texture).__webglTexture,W.get(M.depthTexture).__webglTexture);else if(M.depthBuffer){let Oe=M.depthTexture;if(ge.__boundDepthTexture!==Oe){if(Oe!==null&&W.has(Oe)&&(M.width!==Oe.image.width||M.height!==Oe.image.height))throw new Error("THREE.WebGLRenderer: Attached DepthTexture is initialized to the incorrect size.");q.setupDepthRenderbuffer(M)}}let Me=M.texture;(Me.isData3DTexture||Me.isDataArrayTexture||Me.isCompressedArrayTexture)&&(le=!0);let we=W.get(M).__webglFramebuffer;M.isWebGLCubeRenderTarget?(Array.isArray(we[D])?k=we[D][j]:k=we[D],G=!0):M.samples>0&&q.useMultisampledRTT(M)===!1?k=W.get(M).__webglMultisampledFramebuffer:Array.isArray(we)?k=we[j]:k=we,Q.copy(M.viewport),Le.copy(M.scissor),fe=M.scissorTest}else Q.copy(pe).multiplyScalar($).floor(),Le.copy(Te).multiplyScalar($).floor(),fe=ie;if(j!==0&&(k=V),v.bindFramebuffer(N.FRAMEBUFFER,k)&&v.drawBuffers(M,k),v.viewport(Q),v.scissor(Le),v.setScissorTest(fe),G){let ge=W.get(M.texture);N.framebufferTexture2D(N.FRAMEBUFFER,N.COLOR_ATTACHMENT0,N.TEXTURE_CUBE_MAP_POSITIVE_X+D,ge.__webglTexture,j)}else if(le){let ge=D;for(let Me=0;Me<M.textures.length;Me++){let we=W.get(M.textures[Me]);N.framebufferTextureLayer(N.FRAMEBUFFER,N.COLOR_ATTACHMENT0+Me,we.__webglTexture,j,ge)}}else if(M!==null&&j!==0){let ge=W.get(M.texture);N.framebufferTexture2D(N.FRAMEBUFFER,N.COLOR_ATTACHMENT0,N.TEXTURE_2D,ge.__webglTexture,j)}X=-1};function lc(M){let D=W.get(M);return(D.__readFormat!==M.format||D.__readType!==M.type)&&(D.__readFormat=M.format,D.__readType=M.type,D.__formatReadable=C.textureFormatReadable(M.format),D.__typeReadable=C.textureTypeReadable(M.type)),D}this.readRenderTargetPixels=function(M,D,j,k,G,le,ge,Me=0){if(!(M&&M.isWebGLRenderTarget)){Fe("WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let we=W.get(M).__webglFramebuffer;if(M.isWebGLCubeRenderTarget&&ge!==void 0&&(we=we[ge]),we){v.bindFramebuffer(N.FRAMEBUFFER,we);try{let Oe=M.textures[Me],$e=Oe.format,tt=Oe.type;M.textures.length>1&&N.readBuffer(N.COLOR_ATTACHMENT0+Me);let Ce=lc(Oe);if(Ce.__formatReadable===!1){Fe("WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(Ce.__typeReadable===!1){Fe("WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}D>=0&&D<=M.width-k&&j>=0&&j<=M.height-G&&N.readPixels(D,j,k,G,xe.convert($e),xe.convert(tt),le)}finally{let Oe=J!==null?W.get(J).__webglFramebuffer:null;v.bindFramebuffer(N.FRAMEBUFFER,Oe)}}},this.readRenderTargetPixelsAsync=async function(M,D,j,k,G,le,ge,Me=0){if(!(M&&M.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let we=W.get(M).__webglFramebuffer;if(M.isWebGLCubeRenderTarget&&ge!==void 0&&(we=we[ge]),we)if(D>=0&&D<=M.width-k&&j>=0&&j<=M.height-G){v.bindFramebuffer(N.FRAMEBUFFER,we);let Oe=M.textures[Me],$e=Oe.format,tt=Oe.type;M.textures.length>1&&N.readBuffer(N.COLOR_ATTACHMENT0+Me);let Ce=lc(Oe);if(Ce.__formatReadable===!1)throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(Ce.__typeReadable===!1)throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");let at=N.createBuffer();N.bindBuffer(N.PIXEL_PACK_BUFFER,at),N.bufferData(N.PIXEL_PACK_BUFFER,le.byteLength,N.STREAM_READ),N.readPixels(D,j,k,G,xe.convert($e),xe.convert(tt),0),N.bindBuffer(N.PIXEL_PACK_BUFFER,null);let _t=J!==null?W.get(J).__webglFramebuffer:null;v.bindFramebuffer(N.FRAMEBUFFER,_t);let ht=N.fenceSync(N.SYNC_GPU_COMMANDS_COMPLETE,0);return N.flush(),await wh(N,ht,4),N.bindBuffer(N.PIXEL_PACK_BUFFER,at),N.getBufferSubData(N.PIXEL_PACK_BUFFER,0,le),N.bindBuffer(N.PIXEL_PACK_BUFFER,null),N.deleteBuffer(at),N.deleteSync(ht),le}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")},this.copyFramebufferToTexture=function(M,D=null,j=0){let k=Math.pow(2,-j),G=Math.floor(M.image.width*k),le=Math.floor(M.image.height*k),ge=D!==null?D.x:0,Me=D!==null?D.y:0;q.setTexture2D(M,0),N.copyTexSubImage2D(N.TEXTURE_2D,j,0,0,ge,Me,G,le),v.unbindTexture()},this.copyTextureToTexture=function(M,D,j=null,k=null,G=0,le=0){let ge,Me,we,Oe,$e,tt,Ce,at,_t,ht=M.isCompressedTexture?M.mipmaps[le]:M.image;if(j!==null)ge=j.max.x-j.min.x,Me=j.max.y-j.min.y,we=j.isBox3?j.max.z-j.min.z:1,Oe=j.min.x,$e=j.min.y,tt=j.isBox3?j.min.z:0;else{let gt=Math.pow(2,-G);ge=Math.floor(ht.width*gt),Me=Math.floor(ht.height*gt),M.isDataArrayTexture?we=ht.depth:M.isData3DTexture?we=Math.floor(ht.depth*gt):we=1,Oe=0,$e=0,tt=0}k!==null?(Ce=k.x,at=k.y,_t=k.z):(Ce=0,at=0,_t=0);let ut=xe.convert(D.format),ft=xe.convert(D.type),Ae;D.isData3DTexture?(q.setTexture3D(D,0),Ae=N.TEXTURE_3D):D.isDataArrayTexture||D.isCompressedArrayTexture?(q.setTexture2DArray(D,0),Ae=N.TEXTURE_2D_ARRAY):(q.setTexture2D(D,0),Ae=N.TEXTURE_2D),v.activeTexture(N.TEXTURE0),v.pixelStorei(N.UNPACK_FLIP_Y_WEBGL,D.flipY),v.pixelStorei(N.UNPACK_PREMULTIPLY_ALPHA_WEBGL,D.premultiplyAlpha),v.pixelStorei(N.UNPACK_ALIGNMENT,D.unpackAlignment);let It=v.getParameter(N.UNPACK_ROW_LENGTH),Zi=v.getParameter(N.UNPACK_IMAGE_HEIGHT),Ht=v.getParameter(N.UNPACK_SKIP_PIXELS),oi=v.getParameter(N.UNPACK_SKIP_ROWS),Ii=v.getParameter(N.UNPACK_SKIP_IMAGES);v.pixelStorei(N.UNPACK_ROW_LENGTH,ht.width),v.pixelStorei(N.UNPACK_IMAGE_HEIGHT,ht.height),v.pixelStorei(N.UNPACK_SKIP_PIXELS,Oe),v.pixelStorei(N.UNPACK_SKIP_ROWS,$e),v.pixelStorei(N.UNPACK_SKIP_IMAGES,tt);let cr=M.isDataArrayTexture||M.isData3DTexture,nt=D.isDataArrayTexture||D.isData3DTexture;if(M.isDepthTexture){let gt=W.get(M),Pi=W.get(D),ot=W.get(gt.__renderTarget),jr=W.get(Pi.__renderTarget);v.bindFramebuffer(N.READ_FRAMEBUFFER,ot.__webglFramebuffer),v.bindFramebuffer(N.DRAW_FRAMEBUFFER,jr.__webglFramebuffer);for(let hr=0;hr<we;hr++)cr&&(N.framebufferTextureLayer(N.READ_FRAMEBUFFER,N.COLOR_ATTACHMENT0,W.get(M).__webglTexture,G,tt+hr),N.framebufferTextureLayer(N.DRAW_FRAMEBUFFER,N.COLOR_ATTACHMENT0,W.get(D).__webglTexture,le,_t+hr)),N.blitFramebuffer(Oe,$e,ge,Me,Ce,at,ge,Me,N.DEPTH_BUFFER_BIT,N.NEAREST);v.bindFramebuffer(N.READ_FRAMEBUFFER,null),v.bindFramebuffer(N.DRAW_FRAMEBUFFER,null)}else if(G!==0||M.isRenderTargetTexture||W.has(M)){let gt=W.get(M),Pi=W.get(D);v.bindFramebuffer(N.READ_FRAMEBUFFER,P),v.bindFramebuffer(N.DRAW_FRAMEBUFFER,H);for(let ot=0;ot<we;ot++)cr?N.framebufferTextureLayer(N.READ_FRAMEBUFFER,N.COLOR_ATTACHMENT0,gt.__webglTexture,G,tt+ot):N.framebufferTexture2D(N.READ_FRAMEBUFFER,N.COLOR_ATTACHMENT0,N.TEXTURE_2D,gt.__webglTexture,G),nt?N.framebufferTextureLayer(N.DRAW_FRAMEBUFFER,N.COLOR_ATTACHMENT0,Pi.__webglTexture,le,_t+ot):N.framebufferTexture2D(N.DRAW_FRAMEBUFFER,N.COLOR_ATTACHMENT0,N.TEXTURE_2D,Pi.__webglTexture,le),G!==0?N.blitFramebuffer(Oe,$e,ge,Me,Ce,at,ge,Me,N.COLOR_BUFFER_BIT,N.NEAREST):nt?N.copyTexSubImage3D(Ae,le,Ce,at,_t+ot,Oe,$e,ge,Me):N.copyTexSubImage2D(Ae,le,Ce,at,Oe,$e,ge,Me);v.bindFramebuffer(N.READ_FRAMEBUFFER,null),v.bindFramebuffer(N.DRAW_FRAMEBUFFER,null)}else nt?M.isDataTexture||M.isData3DTexture?N.texSubImage3D(Ae,le,Ce,at,_t,ge,Me,we,ut,ft,ht.data):D.isCompressedArrayTexture?N.compressedTexSubImage3D(Ae,le,Ce,at,_t,ge,Me,we,ut,ht.data):N.texSubImage3D(Ae,le,Ce,at,_t,ge,Me,we,ut,ft,ht):M.isDataTexture?N.texSubImage2D(N.TEXTURE_2D,le,Ce,at,ge,Me,ut,ft,ht.data):M.isCompressedTexture?N.compressedTexSubImage2D(N.TEXTURE_2D,le,Ce,at,ht.width,ht.height,ut,ht.data):N.texSubImage2D(N.TEXTURE_2D,le,Ce,at,ge,Me,ut,ft,ht);v.pixelStorei(N.UNPACK_ROW_LENGTH,It),v.pixelStorei(N.UNPACK_IMAGE_HEIGHT,Zi),v.pixelStorei(N.UNPACK_SKIP_PIXELS,Ht),v.pixelStorei(N.UNPACK_SKIP_ROWS,oi),v.pixelStorei(N.UNPACK_SKIP_IMAGES,Ii),le===0&&D.generateMipmaps&&N.generateMipmap(Ae),v.unbindTexture()},this.initRenderTarget=function(M){W.get(M).__webglFramebuffer===void 0&&q.setupRenderTarget(M)},this.initTexture=function(M){M.isCubeTexture?q.setTextureCube(M,0):M.isData3DTexture?q.setTexture3D(M,0):M.isDataArrayTexture||M.isCompressedArrayTexture?q.setTexture2DArray(M,0):q.setTexture2D(M,0),v.unbindTexture()},this.resetState=function(){Y=0,z=0,J=null,v.reset(),be.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return Xt}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;let t=this.getContext();t.drawingBufferColorSpace=et._getDrawingBufferColorSpace(e),t.unpackColorSpace=et._getUnpackColorSpace()}};function __(r){if(r.querySelector("[transform]"))return null;let e=[...r.querySelectorAll(".am-node")];if(e.some(n=>n.getAttribute("transform")))return null;let t=e.map(n=>{let o=n.getBBox();return{label:n.getAttribute("data-key")||n.textContent.trim(),x:o.x+o.width/2,y:o.y+o.height/2,width:o.width,height:o.height}});if(!t.length||t.length>12||t.some(n=>!n.label||!Number.isFinite(n.x+n.y)||n.width<=0))return null;let i=[...r.querySelectorAll(".am-edge")];if(i.some(n=>typeof n.getTotalLength!="function"))return null;let s=i.map(n=>{let o=n.getTotalLength(),l=Array.from({length:25},(h,m)=>{let u=n.getPointAtLength(o*m/24);return{x:u.x,y:u.y}}),c=h=>{let m=n.getAttribute(h);return!!m&&m!=="none"};return{points:l,arrowStart:c("marker-start"),arrowEnd:c("marker-end")}}),a=r.viewBox.baseVal;return!(a.width>0&&a.height>0)||!Number.isFinite(a.width+a.height+a.x+a.y)?null:{nodes:t,edges:s,width:a.width,height:a.height,x:a.x,y:a.y}}function v_(){for(let r of document.querySelectorAll("figure.am-flow svg")){let e=r.closest(".nl-flow-wrap");e||(e=document.createElement("div"),e.className="nl-flow-wrap",r.replaceWith(e),e.append(r));let t=e.querySelector(".nl-path-open");t||(t=document.createElement("button"),e.append(t)),t.type="button",t.className="nl-path-open",t.textContent="\u7ACB\u4F53\u67E5\u770B \u2197",t.disabled=!1,t.setAttribute("aria-label","\u4EE5\u4E09\u7EF4\u65B9\u5F0F\u67E5\u770B\u8FD9\u6761\u63A8\u8FDB\u8DEF\u5F84"),t.onclick=()=>{try{let i=__(r);if(!i)throw Error("unsupported");x_(i,t)}catch{t.textContent="\u5F53\u524D\u8BBE\u5907\u4F7F\u7528\u4E8C\u7EF4\u8DEF\u5F84",t.disabled=!0}}}}function x_(r,e){let t=document.createElement("dialog");t.className="nl-path-dialog";let i=document.createElement("header"),s=document.createElement("h2");s.textContent="\u63A8\u8FDB\u8DEF\u5F84";let a=document.createElement("button");a.type="button",a.textContent="\xD7",a.setAttribute("aria-label","\u5173\u95ED\u7ACB\u4F53\u8DEF\u5F84"),i.append(s,a);let n=document.createElement("p");n.className="nl-path-hint",n.textContent="\u62D6\u52A8\u8C03\u6574\u89C6\u89D2 \xB7 \u70B9\u9009\u8282\u70B9\u805A\u7126 \xB7 \u5173\u7CFB\u4E0E\u539F\u56FE\u4E00\u81F4";let o=document.createElement("div");o.className="nl-path-stage";let l=document.createElement("div");l.className="nl-path-nodes",l.setAttribute("aria-label","\u8DEF\u5F84\u8282\u70B9");let c=document.createElement("button");c.type="button",c.textContent="\u590D\u4F4D\u89C6\u89D2",c.className="nl-path-reset",t.append(i,n,o,l,c),document.body.append(t);let h;try{h=new _o({alpha:!0,antialias:!0,powerPreference:"low-power"})}catch(z){throw t.remove(),z}let m=[],u=z=>(m.push(z),z),d=new ls,g=new bi;d.add(g);let S=new ki(-1,1,1,-1,1,5e3);S.position.set(0,0,1e3),h.setPixelRatio(Math.min(devicePixelRatio||1,1.5)),h.domElement.setAttribute("aria-hidden","true"),o.append(h.domElement);let f=[],p=[],y=[],E={x:r.x+r.width/2,y:r.y+r.height/2},x=z=>new R(z.x-E.x,E.y-z.y,0),T=new He("#e3ede1"),b=new He("#92b39c");for(let[z,J]of r.nodes.entries()){let X=u(new Ci(J.width,J.height,10)),Z=u(new ws({color:T})),Q=new Et(X,Z);Q.position.copy(x(J)),g.add(Q),p.push(Q);let Le=new us(u(new Lr(X)),u(new rr({color:"#477660"})));Q.add(Le);let fe=document.createElement("button");fe.type="button",fe.className="nl-path-label",fe.textContent=J.label,fe.onclick=()=>L(z),o.append(fe),f.push(fe);let qe=document.createElement("button");qe.type="button",qe.textContent=J.label,qe.setAttribute("aria-pressed","false"),qe.onclick=()=>L(z),l.append(qe),y.push(qe)}for(let z of r.edges){let Z=function(Q,Le){let fe=Q.clone().sub(Le).normalize();if(!fe.lengthSq())return;let qe=new Et(u(new Pr(3,8,12)),u(new ir({color:"#58846b"})));qe.position.copy(Q).addScaledVector(fe,-4),qe.quaternion.setFromUnitVectors(new R(0,1,0),fe),g.add(qe)},J=z.points.map(x),X=u(new ct().setFromPoints(J));g.add(new Ir(X,u(new rr({color:"#58846b"})))),J.length>1&&z.arrowEnd&&Z(J.at(-1),J.at(-2)),J.length>1&&z.arrowStart&&Z(J[0],J[1])}d.add(new Cs("#ffffff","#91a78e",2));let A=new Rs("#ffffff",2);A.position.set(-150,250,500),d.add(A),g.rotation.set(-.15,.12,0);let _=!1,w=0,I=null;function L(z){p.forEach((J,X)=>J.material.color.copy(X===z?b:T)),y.forEach((J,X)=>J.setAttribute("aria-pressed",String(X===z))),f.forEach((J,X)=>J.classList.toggle("selected",X===z)),U()}function U(){_||w||document.hidden||(w=requestAnimationFrame(()=>{if(w=0,_)return;h.render(d,S);let z=o.getBoundingClientRect();for(let[J,X]of p.entries()){let Z=X.localToWorld(new R(0,0,8)).project(S);f[J].style.left=(Z.x+1)*z.width/2+"px",f[J].style.top=(1-Z.y)*z.height/2+"px"}}))}function V(){let{width:z,height:J}=o.getBoundingClientRect();if(!z||!J)return;let X=Math.max(r.width*1.22,r.height*z/J*1.4);S.left=-X/2,S.right=X/2,S.top=X*J/z/2,S.bottom=-S.top,S.updateProjectionMatrix(),h.setSize(z,J,!1),U()}let P=new ResizeObserver(V);P.observe(o),o.addEventListener("pointerdown",z=>{z.target===h.domElement&&(I={x:z.clientX,y:z.clientY,rx:g.rotation.x,ry:g.rotation.y},o.setPointerCapture(z.pointerId))}),o.addEventListener("pointermove",z=>{I&&(g.rotation.x=Math.max(-.55,Math.min(.55,I.rx+(z.clientY-I.y)*.004)),g.rotation.y=Math.max(-.65,Math.min(.65,I.ry+(z.clientX-I.x)*.004)),U())});let H=()=>{I=null};o.addEventListener("pointerup",H),o.addEventListener("pointercancel",H),o.addEventListener("lostpointercapture",H),o.addEventListener("webglcontextlost",z=>{z.preventDefault(),t.close()},{capture:!0}),c.onclick=()=>{g.rotation.set(-.15,.12,0),U()},a.onclick=()=>t.close();let Y=()=>{document.hidden||U()};document.addEventListener("visibilitychange",Y),t.addEventListener("dblclick",z=>z.stopPropagation()),t.addEventListener("close",()=>{_=!0,cancelAnimationFrame(w),P.disconnect(),document.removeEventListener("visibilitychange",Y),m.forEach(z=>z.dispose()),h.dispose(),h.forceContextLoss(),t.remove(),e.focus()},{once:!0}),t.showModal(),V()}typeof document<"u"&&v_();})();
