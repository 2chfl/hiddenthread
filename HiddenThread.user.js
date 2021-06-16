// ==UserScript==
// @name         HiddenThread
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  steganography for 2ch.hk
// @author       anon25519
// @include      *://2ch.hk/*/*
// @include      *://2ch.re/*/*
// @include      *://2ch.pm/*/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

const BLOCK_SIZE = 16;
const IV_SIZE = 16;
const PUBLIC_KEY_SIZE = 65;
const SIGNATURE_SIZE = 64;

const NORMAL_POST_TYPE = 0;
const SIGNED_POST_TYPE = 1;

const MESSAGE_MAX_LENGTH = 30000
const MAX_FILES_COUNT = 100;

/*
https://github.com/indutny/elliptic/blob/43ac7f230069bd1575e1e4a58394a512303ba803/dist/elliptic.min.js
*/
!function(e){"object"==typeof exports&&"undefined"!=typeof module?module.exports=e():"function"==typeof define&&define.amd?define([],e):("undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof self?self:this).elliptic=e()}(function(){return function r(f,d,n){function a(t,e){if(!d[t]){if(!f[t]){var i="function"==typeof require&&require;if(!e&&i)return i(t,!0);if(s)return s(t,!0);throw(i=new Error("Cannot find module '"+t+"'")).code="MODULE_NOT_FOUND",i}i=d[t]={exports:{}},f[t][0].call(i.exports,function(e){return a(f[t][1][e]||e)},i,i.exports,r,f,d,n)}return d[t].exports}for(var s="function"==typeof require&&require,e=0;e<n.length;e++)a(n[e]);return a}({1:[function(e,t,i){"use strict";i.version=e("../package.json").version,i.utils=e("./elliptic/utils"),i.rand=e("brorand"),i.curve=e("./elliptic/curve"),i.curves=e("./elliptic/curves"),i.ec=e("./elliptic/ec"),i.eddsa=e("./elliptic/eddsa")},{"../package.json":35,"./elliptic/curve":4,"./elliptic/curves":7,"./elliptic/ec":8,"./elliptic/eddsa":11,"./elliptic/utils":15,brorand:17}],2:[function(e,t,i){"use strict";var r=e("bn.js"),f=e("../utils"),x=f.getNAF,I=f.getJSF,o=f.assert;function d(e,t){this.type=e,this.p=new r(t.p,16),this.red=t.prime?r.red(t.prime):r.mont(this.p),this.zero=new r(0).toRed(this.red),this.one=new r(1).toRed(this.red),this.two=new r(2).toRed(this.red),this.n=t.n&&new r(t.n,16),this.g=t.g&&this.pointFromJSON(t.g,t.gRed),this._wnafT1=new Array(4),this._wnafT2=new Array(4),this._wnafT3=new Array(4),this._wnafT4=new Array(4),this._bitLength=this.n?this.n.bitLength():0;t=this.n&&this.p.div(this.n);!t||0<t.cmpn(100)?this.redN=null:(this._maxwellTrick=!0,this.redN=this.n.toRed(this.red))}function n(e,t){this.curve=e,this.type=t,this.precomputed=null}(t.exports=d).prototype.point=function(){throw new Error("Not implemented")},d.prototype.validate=function(){throw new Error("Not implemented")},d.prototype._fixedNafMul=function(e,t){o(e.precomputed);var i=e._getDoubles(),r=x(t,1,this._bitLength),t=(1<<i.step+1)-(i.step%2==0?2:1);t/=3;for(var f,d=[],n=0;n<r.length;n+=i.step){f=0;for(var a=n+i.step-1;n<=a;a--)f=(f<<1)+r[a];d.push(f)}for(var s=this.jpoint(null,null,null),c=this.jpoint(null,null,null),h=t;0<h;h--){for(n=0;n<d.length;n++)(f=d[n])===h?c=c.mixedAdd(i.points[n]):f===-h&&(c=c.mixedAdd(i.points[n].neg()));s=s.add(c)}return s.toP()},d.prototype._wnafMul=function(e,t){for(var i=e._getNAFPoints(4),r=i.wnd,f=i.points,d=x(t,r,this._bitLength),n=this.jpoint(null,null,null),a=d.length-1;0<=a;a--){for(var s=0;0<=a&&0===d[a];a--)s++;if(0<=a&&s++,n=n.dblp(s),a<0)break;var c=d[a];o(0!==c),n="affine"===e.type?0<c?n.mixedAdd(f[c-1>>1]):n.mixedAdd(f[-c-1>>1].neg()):0<c?n.add(f[c-1>>1]):n.add(f[-c-1>>1].neg())}return"affine"===e.type?n.toP():n},d.prototype._wnafMulAdd=function(e,t,i,r,f){for(var d,n=this._wnafT1,a=this._wnafT2,s=this._wnafT3,c=0,h=0;h<r;h++){var o=(d=t[h])._getNAFPoints(e);n[h]=o.wnd,a[h]=o.points}for(h=r-1;1<=h;h-=2){var u=h-1,b=h;if(1===n[u]&&1===n[b]){var l=[t[u],null,null,t[b]];0===t[u].y.cmp(t[b].y)?(l[1]=t[u].add(t[b]),l[2]=t[u].toJ().mixedAdd(t[b].neg())):0===t[u].y.cmp(t[b].y.redNeg())?(l[1]=t[u].toJ().mixedAdd(t[b]),l[2]=t[u].add(t[b].neg())):(l[1]=t[u].toJ().mixedAdd(t[b]),l[2]=t[u].toJ().mixedAdd(t[b].neg()));var p=[-3,-1,-5,-7,0,7,5,1,3],m=I(i[u],i[b]),c=Math.max(m[0].length,c);for(s[u]=new Array(c),s[b]=new Array(c),_=0;_<c;_++){var v=0|m[0][_],g=0|m[1][_];s[u][_]=p[3*(1+v)+(1+g)],s[b][_]=0,a[u]=l}}else s[u]=x(i[u],n[u],this._bitLength),s[b]=x(i[b],n[b],this._bitLength),c=Math.max(s[u].length,c),c=Math.max(s[b].length,c)}var y=this.jpoint(null,null,null),M=this._wnafT4;for(h=c;0<=h;h--){for(var w=0;0<=h;){for(var S=!0,_=0;_<r;_++)M[_]=0|s[_][h],0!==M[_]&&(S=!1);if(!S)break;w++,h--}if(0<=h&&w++,y=y.dblp(w),h<0)break;for(_=0;_<r;_++){var A=M[_];0!==A&&(0<A?d=a[_][A-1>>1]:A<0&&(d=a[_][-A-1>>1].neg()),y="affine"===d.type?y.mixedAdd(d):y.add(d))}}for(h=0;h<r;h++)a[h]=null;return f?y:y.toP()},(d.BasePoint=n).prototype.eq=function(){throw new Error("Not implemented")},n.prototype.validate=function(){return this.curve.validate(this)},d.prototype.decodePoint=function(e,t){e=f.toArray(e,t);t=this.p.byteLength();if((4===e[0]||6===e[0]||7===e[0])&&e.length-1==2*t)return 6===e[0]?o(e[e.length-1]%2==0):7===e[0]&&o(e[e.length-1]%2==1),this.point(e.slice(1,1+t),e.slice(1+t,1+2*t));if((2===e[0]||3===e[0])&&e.length-1===t)return this.pointFromX(e.slice(1,1+t),3===e[0]);throw new Error("Unknown point format")},n.prototype.encodeCompressed=function(e){return this.encode(e,!0)},n.prototype._encode=function(e){var t=this.curve.p.byteLength(),i=this.getX().toArray("be",t);return e?[this.getY().isEven()?2:3].concat(i):[4].concat(i,this.getY().toArray("be",t))},n.prototype.encode=function(e,t){return f.encode(this._encode(t),e)},n.prototype.precompute=function(e){if(this.precomputed)return this;var t={doubles:null,naf:null,beta:null};return t.naf=this._getNAFPoints(8),t.doubles=this._getDoubles(4,e),t.beta=this._getBeta(),this.precomputed=t,this},n.prototype._hasDoubles=function(e){if(!this.precomputed)return!1;var t=this.precomputed.doubles;return!!t&&t.points.length>=Math.ceil((e.bitLength()+1)/t.step)},n.prototype._getDoubles=function(e,t){if(this.precomputed&&this.precomputed.doubles)return this.precomputed.doubles;for(var i=[this],r=this,f=0;f<t;f+=e){for(var d=0;d<e;d++)r=r.dbl();i.push(r)}return{step:e,points:i}},n.prototype._getNAFPoints=function(e){if(this.precomputed&&this.precomputed.naf)return this.precomputed.naf;for(var t=[this],i=(1<<e)-1,r=1==i?null:this.dbl(),f=1;f<i;f++)t[f]=t[f-1].add(r);return{wnd:e,points:t}},n.prototype._getBeta=function(){return null},n.prototype.dblp=function(e){for(var t=this,i=0;i<e;i++)t=t.dbl();return t}},{"../utils":15,"bn.js":16}],3:[function(e,t,i){"use strict";var r=e("../utils"),d=e("bn.js"),f=e("inherits"),n=e("./base"),a=r.assert;function s(e){this.twisted=1!=(0|e.a),this.mOneA=this.twisted&&-1==(0|e.a),this.extended=this.mOneA,n.call(this,"edwards",e),this.a=new d(e.a,16).umod(this.red.m),this.a=this.a.toRed(this.red),this.c=new d(e.c,16).toRed(this.red),this.c2=this.c.redSqr(),this.d=new d(e.d,16).toRed(this.red),this.dd=this.d.redAdd(this.d),a(!this.twisted||0===this.c.fromRed().cmpn(1)),this.oneC=1==(0|e.c)}function c(e,t,i,r,f){n.BasePoint.call(this,e,"projective"),null===t&&null===i&&null===r?(this.x=this.curve.zero,this.y=this.curve.one,this.z=this.curve.one,this.t=this.curve.zero,this.zOne=!0):(this.x=new d(t,16),this.y=new d(i,16),this.z=r?new d(r,16):this.curve.one,this.t=f&&new d(f,16),this.x.red||(this.x=this.x.toRed(this.curve.red)),this.y.red||(this.y=this.y.toRed(this.curve.red)),this.z.red||(this.z=this.z.toRed(this.curve.red)),this.t&&!this.t.red&&(this.t=this.t.toRed(this.curve.red)),this.zOne=this.z===this.curve.one,this.curve.extended&&!this.t&&(this.t=this.x.redMul(this.y),this.zOne||(this.t=this.t.redMul(this.z.redInvm()))))}f(s,n),(t.exports=s).prototype._mulA=function(e){return this.mOneA?e.redNeg():this.a.redMul(e)},s.prototype._mulC=function(e){return this.oneC?e:this.c.redMul(e)},s.prototype.jpoint=function(e,t,i,r){return this.point(e,t,i,r)},s.prototype.pointFromX=function(e,t){var i=(e=!(e=new d(e,16)).red?e.toRed(this.red):e).redSqr(),r=this.c2.redSub(this.a.redMul(i)),i=this.one.redSub(this.c2.redMul(this.d).redMul(i)),r=r.redMul(i.redInvm()),i=r.redSqrt();if(0!==i.redSqr().redSub(r).cmp(this.zero))throw new Error("invalid point");r=i.fromRed().isOdd();return(t&&!r||!t&&r)&&(i=i.redNeg()),this.point(e,i)},s.prototype.pointFromY=function(e,t){var i=(e=!(e=new d(e,16)).red?e.toRed(this.red):e).redSqr(),r=i.redSub(this.c2),i=i.redMul(this.d).redMul(this.c2).redSub(this.a),r=r.redMul(i.redInvm());if(0===r.cmp(this.zero)){if(t)throw new Error("invalid point");return this.point(this.zero,e)}i=r.redSqrt();if(0!==i.redSqr().redSub(r).cmp(this.zero))throw new Error("invalid point");return i.fromRed().isOdd()!==t&&(i=i.redNeg()),this.point(i,e)},s.prototype.validate=function(e){if(e.isInfinity())return!0;e.normalize();var t=e.x.redSqr(),i=e.y.redSqr(),e=t.redMul(this.a).redAdd(i),i=this.c2.redMul(this.one.redAdd(this.d.redMul(t).redMul(i)));return 0===e.cmp(i)},f(c,n.BasePoint),s.prototype.pointFromJSON=function(e){return c.fromJSON(this,e)},s.prototype.point=function(e,t,i,r){return new c(this,e,t,i,r)},c.fromJSON=function(e,t){return new c(e,t[0],t[1],t[2])},c.prototype.inspect=function(){return this.isInfinity()?"<EC Point Infinity>":"<EC Point x: "+this.x.fromRed().toString(16,2)+" y: "+this.y.fromRed().toString(16,2)+" z: "+this.z.fromRed().toString(16,2)+">"},c.prototype.isInfinity=function(){return 0===this.x.cmpn(0)&&(0===this.y.cmp(this.z)||this.zOne&&0===this.y.cmp(this.curve.c))},c.prototype._extDbl=function(){var e=this.x.redSqr(),t=this.y.redSqr(),i=(i=this.z.redSqr()).redIAdd(i),r=this.curve._mulA(e),f=this.x.redAdd(this.y).redSqr().redISub(e).redISub(t),d=r.redAdd(t),e=d.redSub(i),i=r.redSub(t),r=f.redMul(e),t=d.redMul(i),i=f.redMul(i),d=e.redMul(d);return this.curve.point(r,t,d,i)},c.prototype._projDbl=function(){var e,t,i,r,f,d,n=this.x.redAdd(this.y).redSqr(),a=this.x.redSqr(),s=this.y.redSqr();return d=this.curve.twisted?(f=(i=this.curve._mulA(a)).redAdd(s),this.zOne?(e=n.redSub(a).redSub(s).redMul(f.redSub(this.curve.two)),t=f.redMul(i.redSub(s)),f.redSqr().redSub(f).redSub(f)):(r=this.z.redSqr(),d=f.redSub(r).redISub(r),e=n.redSub(a).redISub(s).redMul(d),t=f.redMul(i.redSub(s)),f.redMul(d))):(i=a.redAdd(s),r=this.curve._mulC(this.z).redSqr(),d=i.redSub(r).redSub(r),e=this.curve._mulC(n.redISub(i)).redMul(d),t=this.curve._mulC(i).redMul(a.redISub(s)),i.redMul(d)),this.curve.point(e,t,d)},c.prototype.dbl=function(){return this.isInfinity()?this:this.curve.extended?this._extDbl():this._projDbl()},c.prototype._extAdd=function(e){var t=this.y.redSub(this.x).redMul(e.y.redSub(e.x)),i=this.y.redAdd(this.x).redMul(e.y.redAdd(e.x)),r=this.t.redMul(this.curve.dd).redMul(e.t),f=this.z.redMul(e.z.redAdd(e.z)),d=i.redSub(t),e=f.redSub(r),f=f.redAdd(r),r=i.redAdd(t),i=d.redMul(e),t=f.redMul(r),r=d.redMul(r),f=e.redMul(f);return this.curve.point(i,t,f,r)},c.prototype._projAdd=function(e){var t,i=this.z.redMul(e.z),r=i.redSqr(),f=this.x.redMul(e.x),d=this.y.redMul(e.y),n=this.curve.d.redMul(f).redMul(d),a=r.redSub(n),n=r.redAdd(n),e=this.x.redAdd(this.y).redMul(e.x.redAdd(e.y)).redISub(f).redISub(d),e=i.redMul(a).redMul(e),n=this.curve.twisted?(t=i.redMul(n).redMul(d.redSub(this.curve._mulA(f))),a.redMul(n)):(t=i.redMul(n).redMul(d.redSub(f)),this.curve._mulC(a).redMul(n));return this.curve.point(e,t,n)},c.prototype.add=function(e){return this.isInfinity()?e:e.isInfinity()?this:this.curve.extended?this._extAdd(e):this._projAdd(e)},c.prototype.mul=function(e){return this._hasDoubles(e)?this.curve._fixedNafMul(this,e):this.curve._wnafMul(this,e)},c.prototype.mulAdd=function(e,t,i){return this.curve._wnafMulAdd(1,[this,t],[e,i],2,!1)},c.prototype.jmulAdd=function(e,t,i){return this.curve._wnafMulAdd(1,[this,t],[e,i],2,!0)},c.prototype.normalize=function(){if(this.zOne)return this;var e=this.z.redInvm();return this.x=this.x.redMul(e),this.y=this.y.redMul(e),this.t&&(this.t=this.t.redMul(e)),this.z=this.curve.one,this.zOne=!0,this},c.prototype.neg=function(){return this.curve.point(this.x.redNeg(),this.y,this.z,this.t&&this.t.redNeg())},c.prototype.getX=function(){return this.normalize(),this.x.fromRed()},c.prototype.getY=function(){return this.normalize(),this.y.fromRed()},c.prototype.eq=function(e){return this===e||0===this.getX().cmp(e.getX())&&0===this.getY().cmp(e.getY())},c.prototype.eqXToP=function(e){var t=e.toRed(this.curve.red).redMul(this.z);if(0===this.x.cmp(t))return!0;for(var i=e.clone(),r=this.curve.redN.redMul(this.z);;){if(i.iadd(this.curve.n),0<=i.cmp(this.curve.p))return!1;if(t.redIAdd(r),0===this.x.cmp(t))return!0}},c.prototype.toP=c.prototype.normalize,c.prototype.mixedAdd=c.prototype.add},{"../utils":15,"./base":2,"bn.js":16,inherits:32}],4:[function(e,t,i){"use strict";i.base=e("./base"),i.short=e("./short"),i.mont=e("./mont"),i.edwards=e("./edwards")},{"./base":2,"./edwards":3,"./mont":5,"./short":6}],5:[function(e,t,i){"use strict";var r=e("bn.js"),f=e("inherits"),d=e("./base"),n=e("../utils");function a(e){d.call(this,"mont",e),this.a=new r(e.a,16).toRed(this.red),this.b=new r(e.b,16).toRed(this.red),this.i4=new r(4).toRed(this.red).redInvm(),this.two=new r(2).toRed(this.red),this.a24=this.i4.redMul(this.a.redAdd(this.two))}function s(e,t,i){d.BasePoint.call(this,e,"projective"),null===t&&null===i?(this.x=this.curve.one,this.z=this.curve.zero):(this.x=new r(t,16),this.z=new r(i,16),this.x.red||(this.x=this.x.toRed(this.curve.red)),this.z.red||(this.z=this.z.toRed(this.curve.red)))}f(a,d),(t.exports=a).prototype.validate=function(e){var t=e.normalize().x,e=t.redSqr(),t=e.redMul(t).redAdd(e.redMul(this.a)).redAdd(t);return 0===t.redSqrt().redSqr().cmp(t)},f(s,d.BasePoint),a.prototype.decodePoint=function(e,t){return this.point(n.toArray(e,t),1)},a.prototype.point=function(e,t){return new s(this,e,t)},a.prototype.pointFromJSON=function(e){return s.fromJSON(this,e)},s.prototype.precompute=function(){},s.prototype._encode=function(){return this.getX().toArray("be",this.curve.p.byteLength())},s.fromJSON=function(e,t){return new s(e,t[0],t[1]||e.one)},s.prototype.inspect=function(){return this.isInfinity()?"<EC Point Infinity>":"<EC Point x: "+this.x.fromRed().toString(16,2)+" z: "+this.z.fromRed().toString(16,2)+">"},s.prototype.isInfinity=function(){return 0===this.z.cmpn(0)},s.prototype.dbl=function(){var e=this.x.redAdd(this.z).redSqr(),t=this.x.redSub(this.z).redSqr(),i=e.redSub(t),e=e.redMul(t),i=i.redMul(t.redAdd(this.curve.a24.redMul(i)));return this.curve.point(e,i)},s.prototype.add=function(){throw new Error("Not supported on Montgomery curve")},s.prototype.diffAdd=function(e,t){var i=this.x.redAdd(this.z),r=this.x.redSub(this.z),f=e.x.redAdd(e.z),i=e.x.redSub(e.z).redMul(i),f=f.redMul(r),r=t.z.redMul(i.redAdd(f).redSqr()),f=t.x.redMul(i.redISub(f).redSqr());return this.curve.point(r,f)},s.prototype.mul=function(e){for(var t=e.clone(),i=this,r=this.curve.point(null,null),f=[];0!==t.cmpn(0);t.iushrn(1))f.push(t.andln(1));for(var d=f.length-1;0<=d;d--)0===f[d]?(i=i.diffAdd(r,this),r=r.dbl()):(r=i.diffAdd(r,this),i=i.dbl());return r},s.prototype.mulAdd=function(){throw new Error("Not supported on Montgomery curve")},s.prototype.jumlAdd=function(){throw new Error("Not supported on Montgomery curve")},s.prototype.eq=function(e){return 0===this.getX().cmp(e.getX())},s.prototype.normalize=function(){return this.x=this.x.redMul(this.z.redInvm()),this.z=this.curve.one,this},s.prototype.getX=function(){return this.normalize(),this.x.fromRed()}},{"../utils":15,"./base":2,"bn.js":16,inherits:32}],6:[function(e,t,i){"use strict";var r=e("../utils"),y=e("bn.js"),f=e("inherits"),d=e("./base"),n=r.assert;function a(e){d.call(this,"short",e),this.a=new y(e.a,16).toRed(this.red),this.b=new y(e.b,16).toRed(this.red),this.tinv=this.two.redInvm(),this.zeroA=0===this.a.fromRed().cmpn(0),this.threeA=0===this.a.fromRed().sub(this.p).cmpn(-3),this.endo=this._getEndomorphism(e),this._endoWnafT1=new Array(4),this._endoWnafT2=new Array(4)}function s(e,t,i,r){d.BasePoint.call(this,e,"affine"),null===t&&null===i?(this.x=null,this.y=null,this.inf=!0):(this.x=new y(t,16),this.y=new y(i,16),r&&(this.x.forceRed(this.curve.red),this.y.forceRed(this.curve.red)),this.x.red||(this.x=this.x.toRed(this.curve.red)),this.y.red||(this.y=this.y.toRed(this.curve.red)),this.inf=!1)}function c(e,t,i,r){d.BasePoint.call(this,e,"jacobian"),null===t&&null===i&&null===r?(this.x=this.curve.one,this.y=this.curve.one,this.z=new y(0)):(this.x=new y(t,16),this.y=new y(i,16),this.z=new y(r,16)),this.x.red||(this.x=this.x.toRed(this.curve.red)),this.y.red||(this.y=this.y.toRed(this.curve.red)),this.z.red||(this.z=this.z.toRed(this.curve.red)),this.zOne=this.z===this.curve.one}f(a,d),(t.exports=a).prototype._getEndomorphism=function(e){var t,i,r;if(this.zeroA&&this.g&&this.n&&1===this.p.modn(3))return i=(e.beta?new y(e.beta,16):i=(r=this._getEndoRoots(this.p))[0].cmp(r[1])<0?r[0]:r[1]).toRed(this.red),e.lambda?t=new y(e.lambda,16):(r=this._getEndoRoots(this.n),0===this.g.mul(r[0]).x.cmp(this.g.x.redMul(i))?t=r[0]:(t=r[1],n(0===this.g.mul(t).x.cmp(this.g.x.redMul(i))))),{beta:i,lambda:t,basis:e.basis?e.basis.map(function(e){return{a:new y(e.a,16),b:new y(e.b,16)}}):this._getEndoBasis(t)}},a.prototype._getEndoRoots=function(e){var t=e===this.p?this.red:y.mont(e),i=new y(2).toRed(t).redInvm(),e=i.redNeg(),i=new y(3).toRed(t).redNeg().redSqrt().redMul(i);return[e.redAdd(i).fromRed(),e.redSub(i).fromRed()]},a.prototype._getEndoBasis=function(e){for(var t,i,r,f,d,n,a,s=this.n.ushrn(Math.floor(this.n.bitLength()/2)),c=e,h=this.n.clone(),o=new y(1),u=new y(0),b=new y(0),l=new y(1),p=0;0!==c.cmpn(0);){var m=h.div(c),v=h.sub(m.mul(c)),g=b.sub(m.mul(o)),m=l.sub(m.mul(u));if(!r&&v.cmp(s)<0)t=a.neg(),i=o,r=v.neg(),f=g;else if(r&&2==++p)break;h=c,c=a=v,b=o,o=g,l=u,u=m}d=v.neg(),n=g;e=r.sqr().add(f.sqr());return 0<=d.sqr().add(n.sqr()).cmp(e)&&(d=t,n=i),r.negative&&(r=r.neg(),f=f.neg()),d.negative&&(d=d.neg(),n=n.neg()),[{a:r,b:f},{a:d,b:n}]},a.prototype._endoSplit=function(e){var t=this.endo.basis,i=t[0],r=t[1],f=r.b.mul(e).divRound(this.n),d=i.b.neg().mul(e).divRound(this.n),n=f.mul(i.a),t=d.mul(r.a),i=f.mul(i.b),r=d.mul(r.b);return{k1:e.sub(n).sub(t),k2:i.add(r).neg()}},a.prototype.pointFromX=function(e,t){var i=(e=!(e=new y(e,16)).red?e.toRed(this.red):e).redSqr().redMul(e).redIAdd(e.redMul(this.a)).redIAdd(this.b),r=i.redSqrt();if(0!==r.redSqr().redSub(i).cmp(this.zero))throw new Error("invalid point");i=r.fromRed().isOdd();return(t&&!i||!t&&i)&&(r=r.redNeg()),this.point(e,r)},a.prototype.validate=function(e){if(e.inf)return!0;var t=e.x,i=e.y,e=this.a.redMul(t),e=t.redSqr().redMul(t).redIAdd(e).redIAdd(this.b);return 0===i.redSqr().redISub(e).cmpn(0)},a.prototype._endoWnafMulAdd=function(e,t,i){for(var r=this._endoWnafT1,f=this._endoWnafT2,d=0;d<e.length;d++){var n=this._endoSplit(t[d]),a=e[d],s=a._getBeta();n.k1.negative&&(n.k1.ineg(),a=a.neg(!0)),n.k2.negative&&(n.k2.ineg(),s=s.neg(!0)),r[2*d]=a,r[2*d+1]=s,f[2*d]=n.k1,f[2*d+1]=n.k2}for(var i=this._wnafMulAdd(1,r,f,2*d,i),c=0;c<2*d;c++)r[c]=null,f[c]=null;return i},f(s,d.BasePoint),a.prototype.point=function(e,t,i){return new s(this,e,t,i)},a.prototype.pointFromJSON=function(e,t){return s.fromJSON(this,e,t)},s.prototype._getBeta=function(){if(this.curve.endo){var e=this.precomputed;if(e&&e.beta)return e.beta;var t,i,r=this.curve.point(this.x.redMul(this.curve.endo.beta),this.y);return e&&(t=this.curve,i=function(e){return t.point(e.x.redMul(t.endo.beta),e.y)},(e.beta=r).precomputed={beta:null,naf:e.naf&&{wnd:e.naf.wnd,points:e.naf.points.map(i)},doubles:e.doubles&&{step:e.doubles.step,points:e.doubles.points.map(i)}}),r}},s.prototype.toJSON=function(){return this.precomputed?[this.x,this.y,this.precomputed&&{doubles:this.precomputed.doubles&&{step:this.precomputed.doubles.step,points:this.precomputed.doubles.points.slice(1)},naf:this.precomputed.naf&&{wnd:this.precomputed.naf.wnd,points:this.precomputed.naf.points.slice(1)}}]:[this.x,this.y]},s.fromJSON=function(t,e,i){"string"==typeof e&&(e=JSON.parse(e));var r=t.point(e[0],e[1],i);if(!e[2])return r;function f(e){return t.point(e[0],e[1],i)}e=e[2];return r.precomputed={beta:null,doubles:e.doubles&&{step:e.doubles.step,points:[r].concat(e.doubles.points.map(f))},naf:e.naf&&{wnd:e.naf.wnd,points:[r].concat(e.naf.points.map(f))}},r},s.prototype.inspect=function(){return this.isInfinity()?"<EC Point Infinity>":"<EC Point x: "+this.x.fromRed().toString(16,2)+" y: "+this.y.fromRed().toString(16,2)+">"},s.prototype.isInfinity=function(){return this.inf},s.prototype.add=function(e){if(this.inf)return e;if(e.inf)return this;if(this.eq(e))return this.dbl();if(this.neg().eq(e))return this.curve.point(null,null);if(0===this.x.cmp(e.x))return this.curve.point(null,null);var t=this.y.redSub(e.y),e=(t=0!==t.cmpn(0)?t.redMul(this.x.redSub(e.x).redInvm()):t).redSqr().redISub(this.x).redISub(e.x),t=t.redMul(this.x.redSub(e)).redISub(this.y);return this.curve.point(e,t)},s.prototype.dbl=function(){if(this.inf)return this;var e=this.y.redAdd(this.y);if(0===e.cmpn(0))return this.curve.point(null,null);var t=this.curve.a,i=this.x.redSqr(),e=e.redInvm(),t=i.redAdd(i).redIAdd(i).redIAdd(t).redMul(e),e=t.redSqr().redISub(this.x.redAdd(this.x)),t=t.redMul(this.x.redSub(e)).redISub(this.y);return this.curve.point(e,t)},s.prototype.getX=function(){return this.x.fromRed()},s.prototype.getY=function(){return this.y.fromRed()},s.prototype.mul=function(e){return e=new y(e,16),this.isInfinity()?this:this._hasDoubles(e)?this.curve._fixedNafMul(this,e):this.curve.endo?this.curve._endoWnafMulAdd([this],[e]):this.curve._wnafMul(this,e)},s.prototype.mulAdd=function(e,t,i){t=[this,t],i=[e,i];return this.curve.endo?this.curve._endoWnafMulAdd(t,i):this.curve._wnafMulAdd(1,t,i,2)},s.prototype.jmulAdd=function(e,t,i){t=[this,t],i=[e,i];return this.curve.endo?this.curve._endoWnafMulAdd(t,i,!0):this.curve._wnafMulAdd(1,t,i,2,!0)},s.prototype.eq=function(e){return this===e||this.inf===e.inf&&(this.inf||0===this.x.cmp(e.x)&&0===this.y.cmp(e.y))},s.prototype.neg=function(e){if(this.inf)return this;var t,i=this.curve.point(this.x,this.y.redNeg());return e&&this.precomputed&&(t=this.precomputed,e=function(e){return e.neg()},i.precomputed={naf:t.naf&&{wnd:t.naf.wnd,points:t.naf.points.map(e)},doubles:t.doubles&&{step:t.doubles.step,points:t.doubles.points.map(e)}}),i},s.prototype.toJ=function(){return this.inf?this.curve.jpoint(null,null,null):this.curve.jpoint(this.x,this.y,this.curve.one)},f(c,d.BasePoint),a.prototype.jpoint=function(e,t,i){return new c(this,e,t,i)},c.prototype.toP=function(){if(this.isInfinity())return this.curve.point(null,null);var e=this.z.redInvm(),t=e.redSqr(),i=this.x.redMul(t),e=this.y.redMul(t).redMul(e);return this.curve.point(i,e)},c.prototype.neg=function(){return this.curve.jpoint(this.x,this.y.redNeg(),this.z)},c.prototype.add=function(e){if(this.isInfinity())return e;if(e.isInfinity())return this;var t=e.z.redSqr(),i=this.z.redSqr(),r=this.x.redMul(t),f=e.x.redMul(i),d=this.y.redMul(t.redMul(e.z)),n=e.y.redMul(i.redMul(this.z)),t=r.redSub(f),i=d.redSub(n);if(0===t.cmpn(0))return 0!==i.cmpn(0)?this.curve.jpoint(null,null,null):this.dbl();f=t.redSqr(),n=f.redMul(t),r=r.redMul(f),f=i.redSqr().redIAdd(n).redISub(r).redISub(r),n=i.redMul(r.redISub(f)).redISub(d.redMul(n)),t=this.z.redMul(e.z).redMul(t);return this.curve.jpoint(f,n,t)},c.prototype.mixedAdd=function(e){if(this.isInfinity())return e.toJ();if(e.isInfinity())return this;var t=this.z.redSqr(),i=this.x,r=e.x.redMul(t),f=this.y,d=e.y.redMul(t).redMul(this.z),e=i.redSub(r),t=f.redSub(d);if(0===e.cmpn(0))return 0!==t.cmpn(0)?this.curve.jpoint(null,null,null):this.dbl();r=e.redSqr(),d=r.redMul(e),i=i.redMul(r),r=t.redSqr().redIAdd(d).redISub(i).redISub(i),d=t.redMul(i.redISub(r)).redISub(f.redMul(d)),e=this.z.redMul(e);return this.curve.jpoint(r,d,e)},c.prototype.dblp=function(e){if(0===e)return this;if(this.isInfinity())return this;if(!e)return this.dbl();if(this.curve.zeroA||this.curve.threeA){for(var t=this,i=0;i<e;i++)t=t.dbl();return t}var r=this.curve.a,f=this.curve.tinv,d=this.x,n=this.y,a=this.z,s=a.redSqr().redSqr(),c=n.redAdd(n);for(i=0;i<e;i++){var h=d.redSqr(),o=c.redSqr(),u=o.redSqr(),b=h.redAdd(h).redIAdd(h).redIAdd(r.redMul(s)),h=d.redMul(o),o=b.redSqr().redISub(h.redAdd(h)),h=h.redISub(o),b=(b=b.redMul(h)).redIAdd(b).redISub(u),h=c.redMul(a);i+1<e&&(s=s.redMul(u)),d=o,a=h,c=b}return this.curve.jpoint(d,c.redMul(f),a)},c.prototype.dbl=function(){return this.isInfinity()?this:this.curve.zeroA?this._zeroDbl():this.curve.threeA?this._threeDbl():this._dbl()},c.prototype._zeroDbl=function(){var e,t,i,r,f,d=this.zOne?(i=this.x.redSqr(),e=(r=this.y.redSqr()).redSqr(),f=(f=this.x.redAdd(r).redSqr().redISub(i).redISub(e)).redIAdd(f),r=(t=i.redAdd(i).redIAdd(i)).redSqr().redISub(f).redISub(f),i=(i=(i=e.redIAdd(e)).redIAdd(i)).redIAdd(i),e=r,t=t.redMul(f.redISub(r)).redISub(i),this.y.redAdd(this.y)):(f=this.x.redSqr(),d=(r=this.y.redSqr()).redSqr(),i=(i=this.x.redAdd(r).redSqr().redISub(f).redISub(d)).redIAdd(i),f=(r=f.redAdd(f).redIAdd(f)).redSqr(),d=(d=(d=d.redIAdd(d)).redIAdd(d)).redIAdd(d),e=f.redISub(i).redISub(i),t=r.redMul(i.redISub(e)).redISub(d),(d=this.y.redMul(this.z)).redIAdd(d));return this.curve.jpoint(e,t,d)},c.prototype._threeDbl=function(){var e,t,i,r,f,d,n,a;return this.zOne?(e=this.x.redSqr(),r=(t=this.y.redSqr()).redSqr(),n=(n=this.x.redAdd(t).redSqr().redISub(e).redISub(r)).redIAdd(n),i=f=(a=e.redAdd(e).redIAdd(e).redIAdd(this.curve.a)).redSqr().redISub(n).redISub(n),d=(d=(d=r.redIAdd(r)).redIAdd(d)).redIAdd(d),t=a.redMul(n.redISub(f)).redISub(d),e=this.y.redAdd(this.y)):(r=this.z.redSqr(),a=this.y.redSqr(),n=this.x.redMul(a),f=(f=this.x.redSub(r).redMul(this.x.redAdd(r))).redAdd(f).redIAdd(f),n=(d=(d=n.redIAdd(n)).redIAdd(d)).redAdd(d),i=f.redSqr().redISub(n),e=this.y.redAdd(this.z).redSqr().redISub(a).redISub(r),a=(a=(a=(a=a.redSqr()).redIAdd(a)).redIAdd(a)).redIAdd(a),t=f.redMul(d.redISub(i)).redISub(a)),this.curve.jpoint(i,t,e)},c.prototype._dbl=function(){var e=this.curve.a,t=this.x,i=this.y,r=this.z,f=r.redSqr().redSqr(),d=t.redSqr(),n=i.redSqr(),e=d.redAdd(d).redIAdd(d).redIAdd(e.redMul(f)),f=t.redAdd(t),t=(f=f.redIAdd(f)).redMul(n),f=e.redSqr().redISub(t.redAdd(t)),t=t.redISub(f),n=n.redSqr();n=(n=(n=n.redIAdd(n)).redIAdd(n)).redIAdd(n);n=e.redMul(t).redISub(n),r=i.redAdd(i).redMul(r);return this.curve.jpoint(f,n,r)},c.prototype.trpl=function(){if(!this.curve.zeroA)return this.dbl().add(this);var e=this.x.redSqr(),t=this.y.redSqr(),i=this.z.redSqr(),r=t.redSqr(),f=e.redAdd(e).redIAdd(e),d=f.redSqr(),n=this.x.redAdd(t).redSqr().redISub(e).redISub(r),e=(n=(n=(n=n.redIAdd(n)).redAdd(n).redIAdd(n)).redISub(d)).redSqr(),r=r.redIAdd(r);r=(r=(r=r.redIAdd(r)).redIAdd(r)).redIAdd(r);d=f.redIAdd(n).redSqr().redISub(d).redISub(e).redISub(r),t=t.redMul(d);t=(t=t.redIAdd(t)).redIAdd(t);t=this.x.redMul(e).redISub(t);t=(t=t.redIAdd(t)).redIAdd(t);d=this.y.redMul(d.redMul(r.redISub(d)).redISub(n.redMul(e)));d=(d=(d=d.redIAdd(d)).redIAdd(d)).redIAdd(d);e=this.z.redAdd(n).redSqr().redISub(i).redISub(e);return this.curve.jpoint(t,d,e)},c.prototype.mul=function(e,t){return e=new y(e,t),this.curve._wnafMul(this,e)},c.prototype.eq=function(e){if("affine"===e.type)return this.eq(e.toJ());if(this===e)return!0;var t=this.z.redSqr(),i=e.z.redSqr();if(0!==this.x.redMul(i).redISub(e.x.redMul(t)).cmpn(0))return!1;t=t.redMul(this.z),i=i.redMul(e.z);return 0===this.y.redMul(i).redISub(e.y.redMul(t)).cmpn(0)},c.prototype.eqXToP=function(e){var t=this.z.redSqr(),i=e.toRed(this.curve.red).redMul(t);if(0===this.x.cmp(i))return!0;for(var r=e.clone(),f=this.curve.redN.redMul(t);;){if(r.iadd(this.curve.n),0<=r.cmp(this.curve.p))return!1;if(i.redIAdd(f),0===this.x.cmp(i))return!0}},c.prototype.inspect=function(){return this.isInfinity()?"<EC JPoint Infinity>":"<EC JPoint x: "+this.x.toString(16,2)+" y: "+this.y.toString(16,2)+" z: "+this.z.toString(16,2)+">"},c.prototype.isInfinity=function(){return 0===this.z.cmpn(0)}},{"../utils":15,"./base":2,"bn.js":16,inherits:32}],7:[function(e,t,i){"use strict";var r,f=i,i=e("hash.js"),d=e("./curve"),n=e("./utils").assert;function a(e){"short"===e.type?this.curve=new d.short(e):"edwards"===e.type?this.curve=new d.edwards(e):this.curve=new d.mont(e),this.g=this.curve.g,this.n=this.curve.n,this.hash=e.hash,n(this.g.validate(),"Invalid curve"),n(this.g.mul(this.n).isInfinity(),"Invalid curve, G*N != O")}function s(t,i){Object.defineProperty(f,t,{configurable:!0,enumerable:!0,get:function(){var e=new a(i);return Object.defineProperty(f,t,{configurable:!0,enumerable:!0,value:e}),e}})}f.PresetCurve=a,s("p192",{type:"short",prime:"p192",p:"ffffffff ffffffff ffffffff fffffffe ffffffff ffffffff",a:"ffffffff ffffffff ffffffff fffffffe ffffffff fffffffc",b:"64210519 e59c80e7 0fa7e9ab 72243049 feb8deec c146b9b1",n:"ffffffff ffffffff ffffffff 99def836 146bc9b1 b4d22831",hash:i.sha256,gRed:!1,g:["188da80e b03090f6 7cbf20eb 43a18800 f4ff0afd 82ff1012","07192b95 ffc8da78 631011ed 6b24cdd5 73f977a1 1e794811"]}),s("p224",{type:"short",prime:"p224",p:"ffffffff ffffffff ffffffff ffffffff 00000000 00000000 00000001",a:"ffffffff ffffffff ffffffff fffffffe ffffffff ffffffff fffffffe",b:"b4050a85 0c04b3ab f5413256 5044b0b7 d7bfd8ba 270b3943 2355ffb4",n:"ffffffff ffffffff ffffffff ffff16a2 e0b8f03e 13dd2945 5c5c2a3d",hash:i.sha256,gRed:!1,g:["b70e0cbd 6bb4bf7f 321390b9 4a03c1d3 56c21122 343280d6 115c1d21","bd376388 b5f723fb 4c22dfe6 cd4375a0 5a074764 44d58199 85007e34"]}),s("p256",{type:"short",prime:null,p:"ffffffff 00000001 00000000 00000000 00000000 ffffffff ffffffff ffffffff",a:"ffffffff 00000001 00000000 00000000 00000000 ffffffff ffffffff fffffffc",b:"5ac635d8 aa3a93e7 b3ebbd55 769886bc 651d06b0 cc53b0f6 3bce3c3e 27d2604b",n:"ffffffff 00000000 ffffffff ffffffff bce6faad a7179e84 f3b9cac2 fc632551",hash:i.sha256,gRed:!1,g:["6b17d1f2 e12c4247 f8bce6e5 63a440f2 77037d81 2deb33a0 f4a13945 d898c296","4fe342e2 fe1a7f9b 8ee7eb4a 7c0f9e16 2bce3357 6b315ece cbb64068 37bf51f5"]}),s("p384",{type:"short",prime:null,p:"ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff fffffffe ffffffff 00000000 00000000 ffffffff",a:"ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff fffffffe ffffffff 00000000 00000000 fffffffc",b:"b3312fa7 e23ee7e4 988e056b e3f82d19 181d9c6e fe814112 0314088f 5013875a c656398d 8a2ed19d 2a85c8ed d3ec2aef",n:"ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff c7634d81 f4372ddf 581a0db2 48b0a77a ecec196a ccc52973",hash:i.sha384,gRed:!1,g:["aa87ca22 be8b0537 8eb1c71e f320ad74 6e1d3b62 8ba79b98 59f741e0 82542a38 5502f25d bf55296c 3a545e38 72760ab7","3617de4a 96262c6f 5d9e98bf 9292dc29 f8f41dbd 289a147c e9da3113 b5f0b8c0 0a60b1ce 1d7e819d 7a431d7c 90ea0e5f"]}),s("p521",{type:"short",prime:null,p:"000001ff ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff",a:"000001ff ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff fffffffc",b:"00000051 953eb961 8e1c9a1f 929a21a0 b68540ee a2da725b 99b315f3 b8b48991 8ef109e1 56193951 ec7e937b 1652c0bd 3bb1bf07 3573df88 3d2c34f1 ef451fd4 6b503f00",n:"000001ff ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff fffffffa 51868783 bf2f966b 7fcc0148 f709a5d0 3bb5c9b8 899c47ae bb6fb71e 91386409",hash:i.sha512,gRed:!1,g:["000000c6 858e06b7 0404e9cd 9e3ecb66 2395b442 9c648139 053fb521 f828af60 6b4d3dba a14b5e77 efe75928 fe1dc127 a2ffa8de 3348b3c1 856a429b f97e7e31 c2e5bd66","00000118 39296a78 9a3bc004 5c8a5fb4 2c7d1bd9 98f54449 579b4468 17afbd17 273e662c 97ee7299 5ef42640 c550b901 3fad0761 353c7086 a272c240 88be9476 9fd16650"]}),s("curve25519",{type:"mont",prime:"p25519",p:"7fffffffffffffff ffffffffffffffff ffffffffffffffff ffffffffffffffed",a:"76d06",b:"1",n:"1000000000000000 0000000000000000 14def9dea2f79cd6 5812631a5cf5d3ed",hash:i.sha256,gRed:!1,g:["9"]}),s("ed25519",{type:"edwards",prime:"p25519",p:"7fffffffffffffff ffffffffffffffff ffffffffffffffff ffffffffffffffed",a:"-1",c:"1",d:"52036cee2b6ffe73 8cc740797779e898 00700a4d4141d8ab 75eb4dca135978a3",n:"1000000000000000 0000000000000000 14def9dea2f79cd6 5812631a5cf5d3ed",hash:i.sha256,gRed:!1,g:["216936d3cd6e53fec0a4e231fdd6dc5c692cc7609525a7b2c9562d608f25d51a","6666666666666666666666666666666666666666666666666666666666666658"]});try{r=e("./precomputed/secp256k1")}catch(e){r=void 0}s("secp256k1",{type:"short",prime:"k256",p:"ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff fffffffe fffffc2f",a:"0",b:"7",n:"ffffffff ffffffff ffffffff fffffffe baaedce6 af48a03b bfd25e8c d0364141",h:"1",hash:i.sha256,beta:"7ae96a2b657c07106e64479eac3434e99cf0497512f58995c1396c28719501ee",lambda:"5363ad4cc05c30e0a5261c028812645a122e22ea20816678df02967c1b23bd72",basis:[{a:"3086d221a7d46bcde86c90e49284eb15",b:"-e4437ed6010e88286f547fa90abfe4c3"},{a:"114ca50f7a8e2f3f657c1108d9d44cfd8",b:"3086d221a7d46bcde86c90e49284eb15"}],gRed:!1,g:["79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798","483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8",r]})},{"./curve":4,"./precomputed/secp256k1":14,"./utils":15,"hash.js":19}],8:[function(e,t,i){"use strict";var u=e("bn.js"),b=e("hmac-drbg"),r=e("../utils"),f=e("../curves"),d=e("brorand"),a=r.assert,n=e("./key"),l=e("./signature");function s(e){if(!(this instanceof s))return new s(e);"string"==typeof e&&(a(Object.prototype.hasOwnProperty.call(f,e),"Unknown curve "+e),e=f[e]),e instanceof f.PresetCurve&&(e={curve:e}),this.curve=e.curve.curve,this.n=this.curve.n,this.nh=this.n.ushrn(1),this.g=this.curve.g,this.g=e.curve.g,this.g.precompute(e.curve.n.bitLength()+1),this.hash=e.hash||e.curve.hash}(t.exports=s).prototype.keyPair=function(e){return new n(this,e)},s.prototype.keyFromPrivate=function(e,t){return n.fromPrivate(this,e,t)},s.prototype.keyFromPublic=function(e,t){return n.fromPublic(this,e,t)},s.prototype.genKeyPair=function(e){e=e||{};for(var t=new b({hash:this.hash,pers:e.pers,persEnc:e.persEnc||"utf8",entropy:e.entropy||d(this.hash.hmacStrength),entropyEnc:e.entropy&&e.entropyEnc||"utf8",nonce:this.n.toArray()}),i=this.n.byteLength(),r=this.n.sub(new u(2));;){var f=new u(t.generate(i));if(!(0<f.cmp(r)))return f.iaddn(1),this.keyFromPrivate(f)}},s.prototype._truncateToN=function(e,t){var i=8*e.byteLength()-this.n.bitLength();return 0<i&&(e=e.ushrn(i)),!t&&0<=e.cmp(this.n)?e.sub(this.n):e},s.prototype.sign=function(e,t,i,r){"object"==typeof i&&(r=i,i=null),r=r||{},t=this.keyFromPrivate(t,i),e=this._truncateToN(new u(e,16));for(var f=this.n.byteLength(),i=t.getPrivate().toArray("be",f),f=e.toArray("be",f),d=new b({hash:this.hash,entropy:i,nonce:f,pers:r.pers,persEnc:r.persEnc||"utf8"}),n=this.n.sub(new u(1)),a=0;;a++){var s=r.k?r.k(a):new u(d.generate(this.n.byteLength()));if(!((s=this._truncateToN(s,!0)).cmpn(1)<=0||0<=s.cmp(n))){var c=this.g.mul(s);if(!c.isInfinity()){var h=c.getX(),o=h.umod(this.n);if(0!==o.cmpn(0)){s=s.invm(this.n).mul(o.mul(t.getPrivate()).iadd(e));if(0!==(s=s.umod(this.n)).cmpn(0)){h=(c.getY().isOdd()?1:0)|(0!==h.cmp(o)?2:0);return r.canonical&&0<s.cmp(this.nh)&&(s=this.n.sub(s),h^=1),new l({r:o,s:s,recoveryParam:h})}}}}}},s.prototype.verify=function(e,t,i,r){e=this._truncateToN(new u(e,16)),i=this.keyFromPublic(i,r);r=(t=new l(t,"hex")).r,t=t.s;if(r.cmpn(1)<0||0<=r.cmp(this.n))return!1;if(t.cmpn(1)<0||0<=t.cmp(this.n))return!1;var f,t=t.invm(this.n),e=t.mul(e).umod(this.n),t=t.mul(r).umod(this.n);return this.curve._maxwellTrick?!(f=this.g.jmulAdd(e,i.getPublic(),t)).isInfinity()&&f.eqXToP(r):!(f=this.g.mulAdd(e,i.getPublic(),t)).isInfinity()&&0===f.getX().umod(this.n).cmp(r)},s.prototype.recoverPubKey=function(e,t,i,r){a((3&i)===i,"The recovery param is more than two bits"),t=new l(t,r);var f=this.n,d=new u(e),n=t.r,r=t.s,e=1&i,i=i>>1;if(0<=n.cmp(this.curve.p.umod(this.curve.n))&&i)throw new Error("Unable to find sencond key candinate");n=i?this.curve.pointFromX(n.add(this.curve.n),e):this.curve.pointFromX(n,e);t=t.r.invm(f),d=f.sub(d).mul(t).umod(f),f=r.mul(t).umod(f);return this.g.mulAdd(d,n,f)},s.prototype.getKeyRecoveryParam=function(e,t,i,r){if(null!==(t=new l(t,r)).recoveryParam)return t.recoveryParam;for(var f,d=0;d<4;d++){try{f=this.recoverPubKey(e,t,d)}catch(e){continue}if(f.eq(i))return d}throw new Error("Unable to find valid recovery factor")}},{"../curves":7,"../utils":15,"./key":9,"./signature":10,"bn.js":16,brorand:17,"hmac-drbg":31}],9:[function(e,t,i){"use strict";var r=e("bn.js"),f=e("../utils").assert;function d(e,t){this.ec=e,this.priv=null,this.pub=null,t.priv&&this._importPrivate(t.priv,t.privEnc),t.pub&&this._importPublic(t.pub,t.pubEnc)}(t.exports=d).fromPublic=function(e,t,i){return t instanceof d?t:new d(e,{pub:t,pubEnc:i})},d.fromPrivate=function(e,t,i){return t instanceof d?t:new d(e,{priv:t,privEnc:i})},d.prototype.validate=function(){var e=this.getPublic();return e.isInfinity()?{result:!1,reason:"Invalid public key"}:e.validate()?e.mul(this.ec.curve.n).isInfinity()?{result:!0,reason:null}:{result:!1,reason:"Public key * N != O"}:{result:!1,reason:"Public key is not a point"}},d.prototype.getPublic=function(e,t){return"string"==typeof e&&(t=e,e=null),this.pub||(this.pub=this.ec.g.mul(this.priv)),t?this.pub.encode(t,e):this.pub},d.prototype.getPrivate=function(e){return"hex"===e?this.priv.toString(16,2):this.priv},d.prototype._importPrivate=function(e,t){this.priv=new r(e,t||16),this.priv=this.priv.umod(this.ec.curve.n)},d.prototype._importPublic=function(e,t){if(e.x||e.y)return"mont"===this.ec.curve.type?f(e.x,"Need x coordinate"):"short"!==this.ec.curve.type&&"edwards"!==this.ec.curve.type||f(e.x&&e.y,"Need both x and y coordinate"),void(this.pub=this.ec.curve.point(e.x,e.y));this.pub=this.ec.curve.decodePoint(e,t)},d.prototype.derive=function(e){return e.validate()||f(e.validate(),"public point not validated"),e.mul(this.priv).getX()},d.prototype.sign=function(e,t,i){return this.ec.sign(e,this,t,i)},d.prototype.verify=function(e,t){return this.ec.verify(e,t,this)},d.prototype.inspect=function(){return"<Key priv: "+(this.priv&&this.priv.toString(16,2))+" pub: "+(this.pub&&this.pub.inspect())+" >"}},{"../utils":15,"bn.js":16}],10:[function(e,t,i){"use strict";var f=e("bn.js"),d=e("../utils"),r=d.assert;function n(e,t){if(e instanceof n)return e;this._importDER(e,t)||(r(e.r&&e.s,"Signature without r or s"),this.r=new f(e.r,16),this.s=new f(e.s,16),void 0===e.recoveryParam?this.recoveryParam=null:this.recoveryParam=e.recoveryParam)}function a(){this.place=0}function s(e,t){var i=e[t.place++];if(!(128&i))return i;var r=15&i;if(0==r||4<r)return!1;for(var f=0,d=0,n=t.place;d<r;d++,n++)f<<=8,f|=e[n],f>>>=0;return!(f<=127)&&(t.place=n,f)}function c(e){for(var t=0,i=e.length-1;!e[t]&&!(128&e[t+1])&&t<i;)t++;return 0===t?e:e.slice(t)}function h(e,t){if(t<128)e.push(t);else{var i=1+(Math.log(t)/Math.LN2>>>3);for(e.push(128|i);--i;)e.push(t>>>(i<<3)&255);e.push(t)}}(t.exports=n).prototype._importDER=function(e,t){e=d.toArray(e,t);var i=new a;if(48!==e[i.place++])return!1;var r=s(e,i);if(!1===r)return!1;if(r+i.place!==e.length)return!1;if(2!==e[i.place++])return!1;t=s(e,i);if(!1===t)return!1;r=e.slice(i.place,t+i.place);if(i.place+=t,2!==e[i.place++])return!1;t=s(e,i);if(!1===t)return!1;if(e.length!==t+i.place)return!1;i=e.slice(i.place,t+i.place);if(0===r[0]){if(!(128&r[1]))return!1;r=r.slice(1)}if(0===i[0]){if(!(128&i[1]))return!1;i=i.slice(1)}return this.r=new f(r),this.s=new f(i),!(this.recoveryParam=null)},n.prototype.toDER=function(e){var t=this.r.toArray(),i=this.s.toArray();for(128&t[0]&&(t=[0].concat(t)),128&i[0]&&(i=[0].concat(i)),t=c(t),i=c(i);!(i[0]||128&i[1]);)i=i.slice(1);var r=[2];h(r,t.length),(r=r.concat(t)).push(2),h(r,i.length);t=r.concat(i),r=[48];return h(r,t.length),r=r.concat(t),d.encode(r,e)}},{"../utils":15,"bn.js":16}],11:[function(e,t,i){"use strict";var r=e("hash.js"),f=e("../curves"),d=e("../utils"),n=d.assert,a=d.parseBytes,s=e("./key"),c=e("./signature");function h(e){if(n("ed25519"===e,"only tested with ed25519 so far"),!(this instanceof h))return new h(e);e=f[e].curve,this.curve=e,this.g=e.g,this.g.precompute(e.n.bitLength()+1),this.pointClass=e.point().constructor,this.encodingLength=Math.ceil(e.n.bitLength()/8),this.hash=r.sha512}(t.exports=h).prototype.sign=function(e,t){e=a(e);var i=this.keyFromSecret(t),r=this.hashInt(i.messagePrefix(),e),f=this.g.mul(r),t=this.encodePoint(f),i=this.hashInt(t,i.pubBytes(),e).mul(i.priv()),i=r.add(i).umod(this.curve.n);return this.makeSignature({R:f,S:i,Rencoded:t})},h.prototype.verify=function(e,t,i){e=a(e),t=this.makeSignature(t);var r=this.keyFromPublic(i),i=this.hashInt(t.Rencoded(),r.pubBytes(),e),e=this.g.mul(t.S());return t.R().add(r.pub().mul(i)).eq(e)},h.prototype.hashInt=function(){for(var e=this.hash(),t=0;t<arguments.length;t++)e.update(arguments[t]);return d.intFromLE(e.digest()).umod(this.curve.n)},h.prototype.keyFromPublic=function(e){return s.fromPublic(this,e)},h.prototype.keyFromSecret=function(e){return s.fromSecret(this,e)},h.prototype.makeSignature=function(e){return e instanceof c?e:new c(this,e)},h.prototype.encodePoint=function(e){var t=e.getY().toArray("le",this.encodingLength);return t[this.encodingLength-1]|=e.getX().isOdd()?128:0,t},h.prototype.decodePoint=function(e){var t=(e=d.parseBytes(e)).length-1,i=e.slice(0,t).concat(-129&e[t]),t=0!=(128&e[t]),i=d.intFromLE(i);return this.curve.pointFromY(i,t)},h.prototype.encodeInt=function(e){return e.toArray("le",this.encodingLength)},h.prototype.decodeInt=function(e){return d.intFromLE(e)},h.prototype.isPoint=function(e){return e instanceof this.pointClass}},{"../curves":7,"../utils":15,"./key":12,"./signature":13,"hash.js":19}],12:[function(e,t,i){"use strict";var r=e("../utils"),f=r.assert,d=r.parseBytes,e=r.cachedProperty;function n(e,t){this.eddsa=e,this._secret=d(t.secret),e.isPoint(t.pub)?this._pub=t.pub:this._pubBytes=d(t.pub)}n.fromPublic=function(e,t){return t instanceof n?t:new n(e,{pub:t})},n.fromSecret=function(e,t){return t instanceof n?t:new n(e,{secret:t})},n.prototype.secret=function(){return this._secret},e(n,"pubBytes",function(){return this.eddsa.encodePoint(this.pub())}),e(n,"pub",function(){return this._pubBytes?this.eddsa.decodePoint(this._pubBytes):this.eddsa.g.mul(this.priv())}),e(n,"privBytes",function(){var e=this.eddsa,t=this.hash(),i=e.encodingLength-1,e=t.slice(0,e.encodingLength);return e[0]&=248,e[i]&=127,e[i]|=64,e}),e(n,"priv",function(){return this.eddsa.decodeInt(this.privBytes())}),e(n,"hash",function(){return this.eddsa.hash().update(this.secret()).digest()}),e(n,"messagePrefix",function(){return this.hash().slice(this.eddsa.encodingLength)}),n.prototype.sign=function(e){return f(this._secret,"KeyPair can only verify"),this.eddsa.sign(e,this)},n.prototype.verify=function(e,t){return this.eddsa.verify(e,t,this)},n.prototype.getSecret=function(e){return f(this._secret,"KeyPair is public only"),r.encode(this.secret(),e)},n.prototype.getPublic=function(e){return r.encode(this.pubBytes(),e)},t.exports=n},{"../utils":15}],13:[function(e,t,i){"use strict";var r=e("bn.js"),f=e("../utils"),d=f.assert,e=f.cachedProperty,n=f.parseBytes;function a(e,t){this.eddsa=e,"object"!=typeof t&&(t=n(t)),Array.isArray(t)&&(t={R:t.slice(0,e.encodingLength),S:t.slice(e.encodingLength)}),d(t.R&&t.S,"Signature without R or S"),e.isPoint(t.R)&&(this._R=t.R),t.S instanceof r&&(this._S=t.S),this._Rencoded=Array.isArray(t.R)?t.R:t.Rencoded,this._Sencoded=Array.isArray(t.S)?t.S:t.Sencoded}e(a,"S",function(){return this.eddsa.decodeInt(this.Sencoded())}),e(a,"R",function(){return this.eddsa.decodePoint(this.Rencoded())}),e(a,"Rencoded",function(){return this.eddsa.encodePoint(this.R())}),e(a,"Sencoded",function(){return this.eddsa.encodeInt(this.S())}),a.prototype.toBytes=function(){return this.Rencoded().concat(this.Sencoded())},a.prototype.toHex=function(){return f.encode(this.toBytes(),"hex").toUpperCase()},t.exports=a},{"../utils":15,"bn.js":16}],14:[function(e,t,i){t.exports={doubles:{step:4,points:[["e60fce93b59e9ec53011aabc21c23e97b2a31369b87a5ae9c44ee89e2a6dec0a","f7e3507399e595929db99f34f57937101296891e44d23f0be1f32cce69616821"],["8282263212c609d9ea2a6e3e172de238d8c39cabd5ac1ca10646e23fd5f51508","11f8a8098557dfe45e8256e830b60ace62d613ac2f7b17bed31b6eaff6e26caf"],["175e159f728b865a72f99cc6c6fc846de0b93833fd2222ed73fce5b551e5b739","d3506e0d9e3c79eba4ef97a51ff71f5eacb5955add24345c6efa6ffee9fed695"],["363d90d447b00c9c99ceac05b6262ee053441c7e55552ffe526bad8f83ff4640","4e273adfc732221953b445397f3363145b9a89008199ecb62003c7f3bee9de9"],["8b4b5f165df3c2be8c6244b5b745638843e4a781a15bcd1b69f79a55dffdf80c","4aad0a6f68d308b4b3fbd7813ab0da04f9e336546162ee56b3eff0c65fd4fd36"],["723cbaa6e5db996d6bf771c00bd548c7b700dbffa6c0e77bcb6115925232fcda","96e867b5595cc498a921137488824d6e2660a0653779494801dc069d9eb39f5f"],["eebfa4d493bebf98ba5feec812c2d3b50947961237a919839a533eca0e7dd7fa","5d9a8ca3970ef0f269ee7edaf178089d9ae4cdc3a711f712ddfd4fdae1de8999"],["100f44da696e71672791d0a09b7bde459f1215a29b3c03bfefd7835b39a48db0","cdd9e13192a00b772ec8f3300c090666b7ff4a18ff5195ac0fbd5cd62bc65a09"],["e1031be262c7ed1b1dc9227a4a04c017a77f8d4464f3b3852c8acde6e534fd2d","9d7061928940405e6bb6a4176597535af292dd419e1ced79a44f18f29456a00d"],["feea6cae46d55b530ac2839f143bd7ec5cf8b266a41d6af52d5e688d9094696d","e57c6b6c97dce1bab06e4e12bf3ecd5c981c8957cc41442d3155debf18090088"],["da67a91d91049cdcb367be4be6ffca3cfeed657d808583de33fa978bc1ec6cb1","9bacaa35481642bc41f463f7ec9780e5dec7adc508f740a17e9ea8e27a68be1d"],["53904faa0b334cdda6e000935ef22151ec08d0f7bb11069f57545ccc1a37b7c0","5bc087d0bc80106d88c9eccac20d3c1c13999981e14434699dcb096b022771c8"],["8e7bcd0bd35983a7719cca7764ca906779b53a043a9b8bcaeff959f43ad86047","10b7770b2a3da4b3940310420ca9514579e88e2e47fd68b3ea10047e8460372a"],["385eed34c1cdff21e6d0818689b81bde71a7f4f18397e6690a841e1599c43862","283bebc3e8ea23f56701de19e9ebf4576b304eec2086dc8cc0458fe5542e5453"],["6f9d9b803ecf191637c73a4413dfa180fddf84a5947fbc9c606ed86c3fac3a7","7c80c68e603059ba69b8e2a30e45c4d47ea4dd2f5c281002d86890603a842160"],["3322d401243c4e2582a2147c104d6ecbf774d163db0f5e5313b7e0e742d0e6bd","56e70797e9664ef5bfb019bc4ddaf9b72805f63ea2873af624f3a2e96c28b2a0"],["85672c7d2de0b7da2bd1770d89665868741b3f9af7643397721d74d28134ab83","7c481b9b5b43b2eb6374049bfa62c2e5e77f17fcc5298f44c8e3094f790313a6"],["948bf809b1988a46b06c9f1919413b10f9226c60f668832ffd959af60c82a0a","53a562856dcb6646dc6b74c5d1c3418c6d4dff08c97cd2bed4cb7f88d8c8e589"],["6260ce7f461801c34f067ce0f02873a8f1b0e44dfc69752accecd819f38fd8e8","bc2da82b6fa5b571a7f09049776a1ef7ecd292238051c198c1a84e95b2b4ae17"],["e5037de0afc1d8d43d8348414bbf4103043ec8f575bfdc432953cc8d2037fa2d","4571534baa94d3b5f9f98d09fb990bddbd5f5b03ec481f10e0e5dc841d755bda"],["e06372b0f4a207adf5ea905e8f1771b4e7e8dbd1c6a6c5b725866a0ae4fce725","7a908974bce18cfe12a27bb2ad5a488cd7484a7787104870b27034f94eee31dd"],["213c7a715cd5d45358d0bbf9dc0ce02204b10bdde2a3f58540ad6908d0559754","4b6dad0b5ae462507013ad06245ba190bb4850f5f36a7eeddff2c27534b458f2"],["4e7c272a7af4b34e8dbb9352a5419a87e2838c70adc62cddf0cc3a3b08fbd53c","17749c766c9d0b18e16fd09f6def681b530b9614bff7dd33e0b3941817dcaae6"],["fea74e3dbe778b1b10f238ad61686aa5c76e3db2be43057632427e2840fb27b6","6e0568db9b0b13297cf674deccb6af93126b596b973f7b77701d3db7f23cb96f"],["76e64113f677cf0e10a2570d599968d31544e179b760432952c02a4417bdde39","c90ddf8dee4e95cf577066d70681f0d35e2a33d2b56d2032b4b1752d1901ac01"],["c738c56b03b2abe1e8281baa743f8f9a8f7cc643df26cbee3ab150242bcbb891","893fb578951ad2537f718f2eacbfbbbb82314eef7880cfe917e735d9699a84c3"],["d895626548b65b81e264c7637c972877d1d72e5f3a925014372e9f6588f6c14b","febfaa38f2bc7eae728ec60818c340eb03428d632bb067e179363ed75d7d991f"],["b8da94032a957518eb0f6433571e8761ceffc73693e84edd49150a564f676e03","2804dfa44805a1e4d7c99cc9762808b092cc584d95ff3b511488e4e74efdf6e7"],["e80fea14441fb33a7d8adab9475d7fab2019effb5156a792f1a11778e3c0df5d","eed1de7f638e00771e89768ca3ca94472d155e80af322ea9fcb4291b6ac9ec78"],["a301697bdfcd704313ba48e51d567543f2a182031efd6915ddc07bbcc4e16070","7370f91cfb67e4f5081809fa25d40f9b1735dbf7c0a11a130c0d1a041e177ea1"],["90ad85b389d6b936463f9d0512678de208cc330b11307fffab7ac63e3fb04ed4","e507a3620a38261affdcbd9427222b839aefabe1582894d991d4d48cb6ef150"],["8f68b9d2f63b5f339239c1ad981f162ee88c5678723ea3351b7b444c9ec4c0da","662a9f2dba063986de1d90c2b6be215dbbea2cfe95510bfdf23cbf79501fff82"],["e4f3fb0176af85d65ff99ff9198c36091f48e86503681e3e6686fd5053231e11","1e63633ad0ef4f1c1661a6d0ea02b7286cc7e74ec951d1c9822c38576feb73bc"],["8c00fa9b18ebf331eb961537a45a4266c7034f2f0d4e1d0716fb6eae20eae29e","efa47267fea521a1a9dc343a3736c974c2fadafa81e36c54e7d2a4c66702414b"],["e7a26ce69dd4829f3e10cec0a9e98ed3143d084f308b92c0997fddfc60cb3e41","2a758e300fa7984b471b006a1aafbb18d0a6b2c0420e83e20e8a9421cf2cfd51"],["b6459e0ee3662ec8d23540c223bcbdc571cbcb967d79424f3cf29eb3de6b80ef","67c876d06f3e06de1dadf16e5661db3c4b3ae6d48e35b2ff30bf0b61a71ba45"],["d68a80c8280bb840793234aa118f06231d6f1fc67e73c5a5deda0f5b496943e8","db8ba9fff4b586d00c4b1f9177b0e28b5b0e7b8f7845295a294c84266b133120"],["324aed7df65c804252dc0270907a30b09612aeb973449cea4095980fc28d3d5d","648a365774b61f2ff130c0c35aec1f4f19213b0c7e332843967224af96ab7c84"],["4df9c14919cde61f6d51dfdbe5fee5dceec4143ba8d1ca888e8bd373fd054c96","35ec51092d8728050974c23a1d85d4b5d506cdc288490192ebac06cad10d5d"],["9c3919a84a474870faed8a9c1cc66021523489054d7f0308cbfc99c8ac1f98cd","ddb84f0f4a4ddd57584f044bf260e641905326f76c64c8e6be7e5e03d4fc599d"],["6057170b1dd12fdf8de05f281d8e06bb91e1493a8b91d4cc5a21382120a959e5","9a1af0b26a6a4807add9a2daf71df262465152bc3ee24c65e899be932385a2a8"],["a576df8e23a08411421439a4518da31880cef0fba7d4df12b1a6973eecb94266","40a6bf20e76640b2c92b97afe58cd82c432e10a7f514d9f3ee8be11ae1b28ec8"],["7778a78c28dec3e30a05fe9629de8c38bb30d1f5cf9a3a208f763889be58ad71","34626d9ab5a5b22ff7098e12f2ff580087b38411ff24ac563b513fc1fd9f43ac"],["928955ee637a84463729fd30e7afd2ed5f96274e5ad7e5cb09eda9c06d903ac","c25621003d3f42a827b78a13093a95eeac3d26efa8a8d83fc5180e935bcd091f"],["85d0fef3ec6db109399064f3a0e3b2855645b4a907ad354527aae75163d82751","1f03648413a38c0be29d496e582cf5663e8751e96877331582c237a24eb1f962"],["ff2b0dce97eece97c1c9b6041798b85dfdfb6d8882da20308f5404824526087e","493d13fef524ba188af4c4dc54d07936c7b7ed6fb90e2ceb2c951e01f0c29907"],["827fbbe4b1e880ea9ed2b2e6301b212b57f1ee148cd6dd28780e5e2cf856e241","c60f9c923c727b0b71bef2c67d1d12687ff7a63186903166d605b68baec293ec"],["eaa649f21f51bdbae7be4ae34ce6e5217a58fdce7f47f9aa7f3b58fa2120e2b3","be3279ed5bbbb03ac69a80f89879aa5a01a6b965f13f7e59d47a5305ba5ad93d"],["e4a42d43c5cf169d9391df6decf42ee541b6d8f0c9a137401e23632dda34d24f","4d9f92e716d1c73526fc99ccfb8ad34ce886eedfa8d8e4f13a7f7131deba9414"],["1ec80fef360cbdd954160fadab352b6b92b53576a88fea4947173b9d4300bf19","aeefe93756b5340d2f3a4958a7abbf5e0146e77f6295a07b671cdc1cc107cefd"],["146a778c04670c2f91b00af4680dfa8bce3490717d58ba889ddb5928366642be","b318e0ec3354028add669827f9d4b2870aaa971d2f7e5ed1d0b297483d83efd0"],["fa50c0f61d22e5f07e3acebb1aa07b128d0012209a28b9776d76a8793180eef9","6b84c6922397eba9b72cd2872281a68a5e683293a57a213b38cd8d7d3f4f2811"],["da1d61d0ca721a11b1a5bf6b7d88e8421a288ab5d5bba5220e53d32b5f067ec2","8157f55a7c99306c79c0766161c91e2966a73899d279b48a655fba0f1ad836f1"],["a8e282ff0c9706907215ff98e8fd416615311de0446f1e062a73b0610d064e13","7f97355b8db81c09abfb7f3c5b2515888b679a3e50dd6bd6cef7c73111f4cc0c"],["174a53b9c9a285872d39e56e6913cab15d59b1fa512508c022f382de8319497c","ccc9dc37abfc9c1657b4155f2c47f9e6646b3a1d8cb9854383da13ac079afa73"],["959396981943785c3d3e57edf5018cdbe039e730e4918b3d884fdff09475b7ba","2e7e552888c331dd8ba0386a4b9cd6849c653f64c8709385e9b8abf87524f2fd"],["d2a63a50ae401e56d645a1153b109a8fcca0a43d561fba2dbb51340c9d82b151","e82d86fb6443fcb7565aee58b2948220a70f750af484ca52d4142174dcf89405"],["64587e2335471eb890ee7896d7cfdc866bacbdbd3839317b3436f9b45617e073","d99fcdd5bf6902e2ae96dd6447c299a185b90a39133aeab358299e5e9faf6589"],["8481bde0e4e4d885b3a546d3e549de042f0aa6cea250e7fd358d6c86dd45e458","38ee7b8cba5404dd84a25bf39cecb2ca900a79c42b262e556d64b1b59779057e"],["13464a57a78102aa62b6979ae817f4637ffcfed3c4b1ce30bcd6303f6caf666b","69be159004614580ef7e433453ccb0ca48f300a81d0942e13f495a907f6ecc27"],["bc4a9df5b713fe2e9aef430bcc1dc97a0cd9ccede2f28588cada3a0d2d83f366","d3a81ca6e785c06383937adf4b798caa6e8a9fbfa547b16d758d666581f33c1"],["8c28a97bf8298bc0d23d8c749452a32e694b65e30a9472a3954ab30fe5324caa","40a30463a3305193378fedf31f7cc0eb7ae784f0451cb9459e71dc73cbef9482"],["8ea9666139527a8c1dd94ce4f071fd23c8b350c5a4bb33748c4ba111faccae0","620efabbc8ee2782e24e7c0cfb95c5d735b783be9cf0f8e955af34a30e62b945"],["dd3625faef5ba06074669716bbd3788d89bdde815959968092f76cc4eb9a9787","7a188fa3520e30d461da2501045731ca941461982883395937f68d00c644a573"],["f710d79d9eb962297e4f6232b40e8f7feb2bc63814614d692c12de752408221e","ea98e67232d3b3295d3b535532115ccac8612c721851617526ae47a9c77bfc82"]]},naf:{wnd:7,points:[["f9308a019258c31049344f85f89d5229b531c845836f99b08601f113bce036f9","388f7b0f632de8140fe337e62a37f3566500a99934c2231b6cb9fd7584b8e672"],["2f8bde4d1a07209355b4a7250a5c5128e88b84bddc619ab7cba8d569b240efe4","d8ac222636e5e3d6d4dba9dda6c9c426f788271bab0d6840dca87d3aa6ac62d6"],["5cbdf0646e5db4eaa398f365f2ea7a0e3d419b7e0330e39ce92bddedcac4f9bc","6aebca40ba255960a3178d6d861a54dba813d0b813fde7b5a5082628087264da"],["acd484e2f0c7f65309ad178a9f559abde09796974c57e714c35f110dfc27ccbe","cc338921b0a7d9fd64380971763b61e9add888a4375f8e0f05cc262ac64f9c37"],["774ae7f858a9411e5ef4246b70c65aac5649980be5c17891bbec17895da008cb","d984a032eb6b5e190243dd56d7b7b365372db1e2dff9d6a8301d74c9c953c61b"],["f28773c2d975288bc7d1d205c3748651b075fbc6610e58cddeeddf8f19405aa8","ab0902e8d880a89758212eb65cdaf473a1a06da521fa91f29b5cb52db03ed81"],["d7924d4f7d43ea965a465ae3095ff41131e5946f3c85f79e44adbcf8e27e080e","581e2872a86c72a683842ec228cc6defea40af2bd896d3a5c504dc9ff6a26b58"],["defdea4cdb677750a420fee807eacf21eb9898ae79b9768766e4faa04a2d4a34","4211ab0694635168e997b0ead2a93daeced1f4a04a95c0f6cfb199f69e56eb77"],["2b4ea0a797a443d293ef5cff444f4979f06acfebd7e86d277475656138385b6c","85e89bc037945d93b343083b5a1c86131a01f60c50269763b570c854e5c09b7a"],["352bbf4a4cdd12564f93fa332ce333301d9ad40271f8107181340aef25be59d5","321eb4075348f534d59c18259dda3e1f4a1b3b2e71b1039c67bd3d8bcf81998c"],["2fa2104d6b38d11b0230010559879124e42ab8dfeff5ff29dc9cdadd4ecacc3f","2de1068295dd865b64569335bd5dd80181d70ecfc882648423ba76b532b7d67"],["9248279b09b4d68dab21a9b066edda83263c3d84e09572e269ca0cd7f5453714","73016f7bf234aade5d1aa71bdea2b1ff3fc0de2a887912ffe54a32ce97cb3402"],["daed4f2be3a8bf278e70132fb0beb7522f570e144bf615c07e996d443dee8729","a69dce4a7d6c98e8d4a1aca87ef8d7003f83c230f3afa726ab40e52290be1c55"],["c44d12c7065d812e8acf28d7cbb19f9011ecd9e9fdf281b0e6a3b5e87d22e7db","2119a460ce326cdc76c45926c982fdac0e106e861edf61c5a039063f0e0e6482"],["6a245bf6dc698504c89a20cfded60853152b695336c28063b61c65cbd269e6b4","e022cf42c2bd4a708b3f5126f16a24ad8b33ba48d0423b6efd5e6348100d8a82"],["1697ffa6fd9de627c077e3d2fe541084ce13300b0bec1146f95ae57f0d0bd6a5","b9c398f186806f5d27561506e4557433a2cf15009e498ae7adee9d63d01b2396"],["605bdb019981718b986d0f07e834cb0d9deb8360ffb7f61df982345ef27a7479","2972d2de4f8d20681a78d93ec96fe23c26bfae84fb14db43b01e1e9056b8c49"],["62d14dab4150bf497402fdc45a215e10dcb01c354959b10cfe31c7e9d87ff33d","80fc06bd8cc5b01098088a1950eed0db01aa132967ab472235f5642483b25eaf"],["80c60ad0040f27dade5b4b06c408e56b2c50e9f56b9b8b425e555c2f86308b6f","1c38303f1cc5c30f26e66bad7fe72f70a65eed4cbe7024eb1aa01f56430bd57a"],["7a9375ad6167ad54aa74c6348cc54d344cc5dc9487d847049d5eabb0fa03c8fb","d0e3fa9eca8726909559e0d79269046bdc59ea10c70ce2b02d499ec224dc7f7"],["d528ecd9b696b54c907a9ed045447a79bb408ec39b68df504bb51f459bc3ffc9","eecf41253136e5f99966f21881fd656ebc4345405c520dbc063465b521409933"],["49370a4b5f43412ea25f514e8ecdad05266115e4a7ecb1387231808f8b45963","758f3f41afd6ed428b3081b0512fd62a54c3f3afbb5b6764b653052a12949c9a"],["77f230936ee88cbbd73df930d64702ef881d811e0e1498e2f1c13eb1fc345d74","958ef42a7886b6400a08266e9ba1b37896c95330d97077cbbe8eb3c7671c60d6"],["f2dac991cc4ce4b9ea44887e5c7c0bce58c80074ab9d4dbaeb28531b7739f530","e0dedc9b3b2f8dad4da1f32dec2531df9eb5fbeb0598e4fd1a117dba703a3c37"],["463b3d9f662621fb1b4be8fbbe2520125a216cdfc9dae3debcba4850c690d45b","5ed430d78c296c3543114306dd8622d7c622e27c970a1de31cb377b01af7307e"],["f16f804244e46e2a09232d4aff3b59976b98fac14328a2d1a32496b49998f247","cedabd9b82203f7e13d206fcdf4e33d92a6c53c26e5cce26d6579962c4e31df6"],["caf754272dc84563b0352b7a14311af55d245315ace27c65369e15f7151d41d1","cb474660ef35f5f2a41b643fa5e460575f4fa9b7962232a5c32f908318a04476"],["2600ca4b282cb986f85d0f1709979d8b44a09c07cb86d7c124497bc86f082120","4119b88753c15bd6a693b03fcddbb45d5ac6be74ab5f0ef44b0be9475a7e4b40"],["7635ca72d7e8432c338ec53cd12220bc01c48685e24f7dc8c602a7746998e435","91b649609489d613d1d5e590f78e6d74ecfc061d57048bad9e76f302c5b9c61"],["754e3239f325570cdbbf4a87deee8a66b7f2b33479d468fbc1a50743bf56cc18","673fb86e5bda30fb3cd0ed304ea49a023ee33d0197a695d0c5d98093c536683"],["e3e6bd1071a1e96aff57859c82d570f0330800661d1c952f9fe2694691d9b9e8","59c9e0bba394e76f40c0aa58379a3cb6a5a2283993e90c4167002af4920e37f5"],["186b483d056a033826ae73d88f732985c4ccb1f32ba35f4b4cc47fdcf04aa6eb","3b952d32c67cf77e2e17446e204180ab21fb8090895138b4a4a797f86e80888b"],["df9d70a6b9876ce544c98561f4be4f725442e6d2b737d9c91a8321724ce0963f","55eb2dafd84d6ccd5f862b785dc39d4ab157222720ef9da217b8c45cf2ba2417"],["5edd5cc23c51e87a497ca815d5dce0f8ab52554f849ed8995de64c5f34ce7143","efae9c8dbc14130661e8cec030c89ad0c13c66c0d17a2905cdc706ab7399a868"],["290798c2b6476830da12fe02287e9e777aa3fba1c355b17a722d362f84614fba","e38da76dcd440621988d00bcf79af25d5b29c094db2a23146d003afd41943e7a"],["af3c423a95d9f5b3054754efa150ac39cd29552fe360257362dfdecef4053b45","f98a3fd831eb2b749a93b0e6f35cfb40c8cd5aa667a15581bc2feded498fd9c6"],["766dbb24d134e745cccaa28c99bf274906bb66b26dcf98df8d2fed50d884249a","744b1152eacbe5e38dcc887980da38b897584a65fa06cedd2c924f97cbac5996"],["59dbf46f8c94759ba21277c33784f41645f7b44f6c596a58ce92e666191abe3e","c534ad44175fbc300f4ea6ce648309a042ce739a7919798cd85e216c4a307f6e"],["f13ada95103c4537305e691e74e9a4a8dd647e711a95e73cb62dc6018cfd87b8","e13817b44ee14de663bf4bc808341f326949e21a6a75c2570778419bdaf5733d"],["7754b4fa0e8aced06d4167a2c59cca4cda1869c06ebadfb6488550015a88522c","30e93e864e669d82224b967c3020b8fa8d1e4e350b6cbcc537a48b57841163a2"],["948dcadf5990e048aa3874d46abef9d701858f95de8041d2a6828c99e2262519","e491a42537f6e597d5d28a3224b1bc25df9154efbd2ef1d2cbba2cae5347d57e"],["7962414450c76c1689c7b48f8202ec37fb224cf5ac0bfa1570328a8a3d7c77ab","100b610ec4ffb4760d5c1fc133ef6f6b12507a051f04ac5760afa5b29db83437"],["3514087834964b54b15b160644d915485a16977225b8847bb0dd085137ec47ca","ef0afbb2056205448e1652c48e8127fc6039e77c15c2378b7e7d15a0de293311"],["d3cc30ad6b483e4bc79ce2c9dd8bc54993e947eb8df787b442943d3f7b527eaf","8b378a22d827278d89c5e9be8f9508ae3c2ad46290358630afb34db04eede0a4"],["1624d84780732860ce1c78fcbfefe08b2b29823db913f6493975ba0ff4847610","68651cf9b6da903e0914448c6cd9d4ca896878f5282be4c8cc06e2a404078575"],["733ce80da955a8a26902c95633e62a985192474b5af207da6df7b4fd5fc61cd4","f5435a2bd2badf7d485a4d8b8db9fcce3e1ef8e0201e4578c54673bc1dc5ea1d"],["15d9441254945064cf1a1c33bbd3b49f8966c5092171e699ef258dfab81c045c","d56eb30b69463e7234f5137b73b84177434800bacebfc685fc37bbe9efe4070d"],["a1d0fcf2ec9de675b612136e5ce70d271c21417c9d2b8aaaac138599d0717940","edd77f50bcb5a3cab2e90737309667f2641462a54070f3d519212d39c197a629"],["e22fbe15c0af8ccc5780c0735f84dbe9a790badee8245c06c7ca37331cb36980","a855babad5cd60c88b430a69f53a1a7a38289154964799be43d06d77d31da06"],["311091dd9860e8e20ee13473c1155f5f69635e394704eaa74009452246cfa9b3","66db656f87d1f04fffd1f04788c06830871ec5a64feee685bd80f0b1286d8374"],["34c1fd04d301be89b31c0442d3e6ac24883928b45a9340781867d4232ec2dbdf","9414685e97b1b5954bd46f730174136d57f1ceeb487443dc5321857ba73abee"],["f219ea5d6b54701c1c14de5b557eb42a8d13f3abbcd08affcc2a5e6b049b8d63","4cb95957e83d40b0f73af4544cccf6b1f4b08d3c07b27fb8d8c2962a400766d1"],["d7b8740f74a8fbaab1f683db8f45de26543a5490bca627087236912469a0b448","fa77968128d9c92ee1010f337ad4717eff15db5ed3c049b3411e0315eaa4593b"],["32d31c222f8f6f0ef86f7c98d3a3335ead5bcd32abdd94289fe4d3091aa824bf","5f3032f5892156e39ccd3d7915b9e1da2e6dac9e6f26e961118d14b8462e1661"],["7461f371914ab32671045a155d9831ea8793d77cd59592c4340f86cbc18347b5","8ec0ba238b96bec0cbdddcae0aa442542eee1ff50c986ea6b39847b3cc092ff6"],["ee079adb1df1860074356a25aa38206a6d716b2c3e67453d287698bad7b2b2d6","8dc2412aafe3be5c4c5f37e0ecc5f9f6a446989af04c4e25ebaac479ec1c8c1e"],["16ec93e447ec83f0467b18302ee620f7e65de331874c9dc72bfd8616ba9da6b5","5e4631150e62fb40d0e8c2a7ca5804a39d58186a50e497139626778e25b0674d"],["eaa5f980c245f6f038978290afa70b6bd8855897f98b6aa485b96065d537bd99","f65f5d3e292c2e0819a528391c994624d784869d7e6ea67fb18041024edc07dc"],["78c9407544ac132692ee1910a02439958ae04877151342ea96c4b6b35a49f51","f3e0319169eb9b85d5404795539a5e68fa1fbd583c064d2462b675f194a3ddb4"],["494f4be219a1a77016dcd838431aea0001cdc8ae7a6fc688726578d9702857a5","42242a969283a5f339ba7f075e36ba2af925ce30d767ed6e55f4b031880d562c"],["a598a8030da6d86c6bc7f2f5144ea549d28211ea58faa70ebf4c1e665c1fe9b5","204b5d6f84822c307e4b4a7140737aec23fc63b65b35f86a10026dbd2d864e6b"],["c41916365abb2b5d09192f5f2dbeafec208f020f12570a184dbadc3e58595997","4f14351d0087efa49d245b328984989d5caf9450f34bfc0ed16e96b58fa9913"],["841d6063a586fa475a724604da03bc5b92a2e0d2e0a36acfe4c73a5514742881","73867f59c0659e81904f9a1c7543698e62562d6744c169ce7a36de01a8d6154"],["5e95bb399a6971d376026947f89bde2f282b33810928be4ded112ac4d70e20d5","39f23f366809085beebfc71181313775a99c9aed7d8ba38b161384c746012865"],["36e4641a53948fd476c39f8a99fd974e5ec07564b5315d8bf99471bca0ef2f66","d2424b1b1abe4eb8164227b085c9aa9456ea13493fd563e06fd51cf5694c78fc"],["336581ea7bfbbb290c191a2f507a41cf5643842170e914faeab27c2c579f726","ead12168595fe1be99252129b6e56b3391f7ab1410cd1e0ef3dcdcabd2fda224"],["8ab89816dadfd6b6a1f2634fcf00ec8403781025ed6890c4849742706bd43ede","6fdcef09f2f6d0a044e654aef624136f503d459c3e89845858a47a9129cdd24e"],["1e33f1a746c9c5778133344d9299fcaa20b0938e8acff2544bb40284b8c5fb94","60660257dd11b3aa9c8ed618d24edff2306d320f1d03010e33a7d2057f3b3b6"],["85b7c1dcb3cec1b7ee7f30ded79dd20a0ed1f4cc18cbcfcfa410361fd8f08f31","3d98a9cdd026dd43f39048f25a8847f4fcafad1895d7a633c6fed3c35e999511"],["29df9fbd8d9e46509275f4b125d6d45d7fbe9a3b878a7af872a2800661ac5f51","b4c4fe99c775a606e2d8862179139ffda61dc861c019e55cd2876eb2a27d84b"],["a0b1cae06b0a847a3fea6e671aaf8adfdfe58ca2f768105c8082b2e449fce252","ae434102edde0958ec4b19d917a6a28e6b72da1834aff0e650f049503a296cf2"],["4e8ceafb9b3e9a136dc7ff67e840295b499dfb3b2133e4ba113f2e4c0e121e5","cf2174118c8b6d7a4b48f6d534ce5c79422c086a63460502b827ce62a326683c"],["d24a44e047e19b6f5afb81c7ca2f69080a5076689a010919f42725c2b789a33b","6fb8d5591b466f8fc63db50f1c0f1c69013f996887b8244d2cdec417afea8fa3"],["ea01606a7a6c9cdd249fdfcfacb99584001edd28abbab77b5104e98e8e3b35d4","322af4908c7312b0cfbfe369f7a7b3cdb7d4494bc2823700cfd652188a3ea98d"],["af8addbf2b661c8a6c6328655eb96651252007d8c5ea31be4ad196de8ce2131f","6749e67c029b85f52a034eafd096836b2520818680e26ac8f3dfbcdb71749700"],["e3ae1974566ca06cc516d47e0fb165a674a3dabcfca15e722f0e3450f45889","2aeabe7e4531510116217f07bf4d07300de97e4874f81f533420a72eeb0bd6a4"],["591ee355313d99721cf6993ffed1e3e301993ff3ed258802075ea8ced397e246","b0ea558a113c30bea60fc4775460c7901ff0b053d25ca2bdeee98f1a4be5d196"],["11396d55fda54c49f19aa97318d8da61fa8584e47b084945077cf03255b52984","998c74a8cd45ac01289d5833a7beb4744ff536b01b257be4c5767bea93ea57a4"],["3c5d2a1ba39c5a1790000738c9e0c40b8dcdfd5468754b6405540157e017aa7a","b2284279995a34e2f9d4de7396fc18b80f9b8b9fdd270f6661f79ca4c81bd257"],["cc8704b8a60a0defa3a99a7299f2e9c3fbc395afb04ac078425ef8a1793cc030","bdd46039feed17881d1e0862db347f8cf395b74fc4bcdc4e940b74e3ac1f1b13"],["c533e4f7ea8555aacd9777ac5cad29b97dd4defccc53ee7ea204119b2889b197","6f0a256bc5efdf429a2fb6242f1a43a2d9b925bb4a4b3a26bb8e0f45eb596096"],["c14f8f2ccb27d6f109f6d08d03cc96a69ba8c34eec07bbcf566d48e33da6593","c359d6923bb398f7fd4473e16fe1c28475b740dd098075e6c0e8649113dc3a38"],["a6cbc3046bc6a450bac24789fa17115a4c9739ed75f8f21ce441f72e0b90e6ef","21ae7f4680e889bb130619e2c0f95a360ceb573c70603139862afd617fa9b9f"],["347d6d9a02c48927ebfb86c1359b1caf130a3c0267d11ce6344b39f99d43cc38","60ea7f61a353524d1c987f6ecec92f086d565ab687870cb12689ff1e31c74448"],["da6545d2181db8d983f7dcb375ef5866d47c67b1bf31c8cf855ef7437b72656a","49b96715ab6878a79e78f07ce5680c5d6673051b4935bd897fea824b77dc208a"],["c40747cc9d012cb1a13b8148309c6de7ec25d6945d657146b9d5994b8feb1111","5ca560753be2a12fc6de6caf2cb489565db936156b9514e1bb5e83037e0fa2d4"],["4e42c8ec82c99798ccf3a610be870e78338c7f713348bd34c8203ef4037f3502","7571d74ee5e0fb92a7a8b33a07783341a5492144cc54bcc40a94473693606437"],["3775ab7089bc6af823aba2e1af70b236d251cadb0c86743287522a1b3b0dedea","be52d107bcfa09d8bcb9736a828cfa7fac8db17bf7a76a2c42ad961409018cf7"],["cee31cbf7e34ec379d94fb814d3d775ad954595d1314ba8846959e3e82f74e26","8fd64a14c06b589c26b947ae2bcf6bfa0149ef0be14ed4d80f448a01c43b1c6d"],["b4f9eaea09b6917619f6ea6a4eb5464efddb58fd45b1ebefcdc1a01d08b47986","39e5c9925b5a54b07433a4f18c61726f8bb131c012ca542eb24a8ac07200682a"],["d4263dfc3d2df923a0179a48966d30ce84e2515afc3dccc1b77907792ebcc60e","62dfaf07a0f78feb30e30d6295853ce189e127760ad6cf7fae164e122a208d54"],["48457524820fa65a4f8d35eb6930857c0032acc0a4a2de422233eeda897612c4","25a748ab367979d98733c38a1fa1c2e7dc6cc07db2d60a9ae7a76aaa49bd0f77"],["dfeeef1881101f2cb11644f3a2afdfc2045e19919152923f367a1767c11cceda","ecfb7056cf1de042f9420bab396793c0c390bde74b4bbdff16a83ae09a9a7517"],["6d7ef6b17543f8373c573f44e1f389835d89bcbc6062ced36c82df83b8fae859","cd450ec335438986dfefa10c57fea9bcc521a0959b2d80bbf74b190dca712d10"],["e75605d59102a5a2684500d3b991f2e3f3c88b93225547035af25af66e04541f","f5c54754a8f71ee540b9b48728473e314f729ac5308b06938360990e2bfad125"],["eb98660f4c4dfaa06a2be453d5020bc99a0c2e60abe388457dd43fefb1ed620c","6cb9a8876d9cb8520609af3add26cd20a0a7cd8a9411131ce85f44100099223e"],["13e87b027d8514d35939f2e6892b19922154596941888336dc3563e3b8dba942","fef5a3c68059a6dec5d624114bf1e91aac2b9da568d6abeb2570d55646b8adf1"],["ee163026e9fd6fe017c38f06a5be6fc125424b371ce2708e7bf4491691e5764a","1acb250f255dd61c43d94ccc670d0f58f49ae3fa15b96623e5430da0ad6c62b2"],["b268f5ef9ad51e4d78de3a750c2dc89b1e626d43505867999932e5db33af3d80","5f310d4b3c99b9ebb19f77d41c1dee018cf0d34fd4191614003e945a1216e423"],["ff07f3118a9df035e9fad85eb6c7bfe42b02f01ca99ceea3bf7ffdba93c4750d","438136d603e858a3a5c440c38eccbaddc1d2942114e2eddd4740d098ced1f0d8"],["8d8b9855c7c052a34146fd20ffb658bea4b9f69e0d825ebec16e8c3ce2b526a1","cdb559eedc2d79f926baf44fb84ea4d44bcf50fee51d7ceb30e2e7f463036758"],["52db0b5384dfbf05bfa9d472d7ae26dfe4b851ceca91b1eba54263180da32b63","c3b997d050ee5d423ebaf66a6db9f57b3180c902875679de924b69d84a7b375"],["e62f9490d3d51da6395efd24e80919cc7d0f29c3f3fa48c6fff543becbd43352","6d89ad7ba4876b0b22c2ca280c682862f342c8591f1daf5170e07bfd9ccafa7d"],["7f30ea2476b399b4957509c88f77d0191afa2ff5cb7b14fd6d8e7d65aaab1193","ca5ef7d4b231c94c3b15389a5f6311e9daff7bb67b103e9880ef4bff637acaec"],["5098ff1e1d9f14fb46a210fada6c903fef0fb7b4a1dd1d9ac60a0361800b7a00","9731141d81fc8f8084d37c6e7542006b3ee1b40d60dfe5362a5b132fd17ddc0"],["32b78c7de9ee512a72895be6b9cbefa6e2f3c4ccce445c96b9f2c81e2778ad58","ee1849f513df71e32efc3896ee28260c73bb80547ae2275ba497237794c8753c"],["e2cb74fddc8e9fbcd076eef2a7c72b0ce37d50f08269dfc074b581550547a4f7","d3aa2ed71c9dd2247a62df062736eb0baddea9e36122d2be8641abcb005cc4a4"],["8438447566d4d7bedadc299496ab357426009a35f235cb141be0d99cd10ae3a8","c4e1020916980a4da5d01ac5e6ad330734ef0d7906631c4f2390426b2edd791f"],["4162d488b89402039b584c6fc6c308870587d9c46f660b878ab65c82c711d67e","67163e903236289f776f22c25fb8a3afc1732f2b84b4e95dbda47ae5a0852649"],["3fad3fa84caf0f34f0f89bfd2dcf54fc175d767aec3e50684f3ba4a4bf5f683d","cd1bc7cb6cc407bb2f0ca647c718a730cf71872e7d0d2a53fa20efcdfe61826"],["674f2600a3007a00568c1a7ce05d0816c1fb84bf1370798f1c69532faeb1a86b","299d21f9413f33b3edf43b257004580b70db57da0b182259e09eecc69e0d38a5"],["d32f4da54ade74abb81b815ad1fb3b263d82d6c692714bcff87d29bd5ee9f08f","f9429e738b8e53b968e99016c059707782e14f4535359d582fc416910b3eea87"],["30e4e670435385556e593657135845d36fbb6931f72b08cb1ed954f1e3ce3ff6","462f9bce619898638499350113bbc9b10a878d35da70740dc695a559eb88db7b"],["be2062003c51cc3004682904330e4dee7f3dcd10b01e580bf1971b04d4cad297","62188bc49d61e5428573d48a74e1c655b1c61090905682a0d5558ed72dccb9bc"],["93144423ace3451ed29e0fb9ac2af211cb6e84a601df5993c419859fff5df04a","7c10dfb164c3425f5c71a3f9d7992038f1065224f72bb9d1d902a6d13037b47c"],["b015f8044f5fcbdcf21ca26d6c34fb8197829205c7b7d2a7cb66418c157b112c","ab8c1e086d04e813744a655b2df8d5f83b3cdc6faa3088c1d3aea1454e3a1d5f"],["d5e9e1da649d97d89e4868117a465a3a4f8a18de57a140d36b3f2af341a21b52","4cb04437f391ed73111a13cc1d4dd0db1693465c2240480d8955e8592f27447a"],["d3ae41047dd7ca065dbf8ed77b992439983005cd72e16d6f996a5316d36966bb","bd1aeb21ad22ebb22a10f0303417c6d964f8cdd7df0aca614b10dc14d125ac46"],["463e2763d885f958fc66cdd22800f0a487197d0a82e377b49f80af87c897b065","bfefacdb0e5d0fd7df3a311a94de062b26b80c61fbc97508b79992671ef7ca7f"],["7985fdfd127c0567c6f53ec1bb63ec3158e597c40bfe747c83cddfc910641917","603c12daf3d9862ef2b25fe1de289aed24ed291e0ec6708703a5bd567f32ed03"],["74a1ad6b5f76e39db2dd249410eac7f99e74c59cb83d2d0ed5ff1543da7703e9","cc6157ef18c9c63cd6193d83631bbea0093e0968942e8c33d5737fd790e0db08"],["30682a50703375f602d416664ba19b7fc9bab42c72747463a71d0896b22f6da3","553e04f6b018b4fa6c8f39e7f311d3176290d0e0f19ca73f17714d9977a22ff8"],["9e2158f0d7c0d5f26c3791efefa79597654e7a2b2464f52b1ee6c1347769ef57","712fcdd1b9053f09003a3481fa7762e9ffd7c8ef35a38509e2fbf2629008373"],["176e26989a43c9cfeba4029c202538c28172e566e3c4fce7322857f3be327d66","ed8cc9d04b29eb877d270b4878dc43c19aefd31f4eee09ee7b47834c1fa4b1c3"],["75d46efea3771e6e68abb89a13ad747ecf1892393dfc4f1b7004788c50374da8","9852390a99507679fd0b86fd2b39a868d7efc22151346e1a3ca4726586a6bed8"],["809a20c67d64900ffb698c4c825f6d5f2310fb0451c869345b7319f645605721","9e994980d9917e22b76b061927fa04143d096ccc54963e6a5ebfa5f3f8e286c1"],["1b38903a43f7f114ed4500b4eac7083fdefece1cf29c63528d563446f972c180","4036edc931a60ae889353f77fd53de4a2708b26b6f5da72ad3394119daf408f9"]]}}},{}],15:[function(e,t,i){"use strict";var r=i,f=e("bn.js"),i=e("minimalistic-assert"),e=e("minimalistic-crypto-utils");r.assert=i,r.toArray=e.toArray,r.zero2=e.zero2,r.toHex=e.toHex,r.encode=e.encode,r.getNAF=function(e,t,i){var r=new Array(Math.max(e.bitLength(),i)+1);r.fill(0);for(var f=1<<t+1,d=e.clone(),n=0;n<r.length;n++){var a,s=d.andln(f-1);d.isOdd()?(a=(f>>1)-1<s?(f>>1)-s:s,d.isubn(a)):a=0,r[n]=a,d.iushrn(1)}return r},r.getJSF=function(e,t){var i=[[],[]];e=e.clone(),t=t.clone();for(var r,f=0,d=0;0<e.cmpn(-f)||0<t.cmpn(-d);){var n,a=e.andln(3)+f&3,s=t.andln(3)+d&3;3===s&&(s=-1),n=0==(1&(a=3===a?-1:a))?0:3!==(r=e.andln(7)+f&7)&&5!==r||2!==s?a:-a,i[0].push(n),s=0==(1&s)?0:3!==(r=t.andln(7)+d&7)&&5!==r||2!==a?s:-s,i[1].push(s),2*f===n+1&&(f=1-f),2*d===s+1&&(d=1-d),e.iushrn(1),t.iushrn(1)}return i},r.cachedProperty=function(e,t,i){var r="_"+t;e.prototype[t]=function(){return void 0!==this[r]?this[r]:this[r]=i.call(this)}},r.parseBytes=function(e){return"string"==typeof e?r.toArray(e,"hex"):e},r.intFromLE=function(e){return new f(e,"hex","le")}},{"bn.js":16,"minimalistic-assert":33,"minimalistic-crypto-utils":34}],16:[function(_,e,t){!function(e,t){"use strict";function p(e,t){if(!e)throw new Error(t||"Assertion failed")}function i(e,t){e.super_=t;function i(){}i.prototype=t.prototype,e.prototype=new i,e.prototype.constructor=e}function m(e,t,i){if(m.isBN(e))return e;this.negative=0,this.words=null,this.length=0,(this.red=null)!==e&&("le"!==t&&"be"!==t||(i=t,t=10),this._init(e||0,t||10,i||"be"))}var r;"object"==typeof e?e.exports=m:t.BN=m,(m.BN=m).wordSize=26;try{r=_("buffer").Buffer}catch(e){}function n(e,t,i){for(var r=0,f=Math.min(e.length,i),d=t;d<f;d++){var n=e.charCodeAt(d)-48;r<<=4,r|=49<=n&&n<=54?n-49+10:17<=n&&n<=22?n-17+10:15&n}return r}function o(e,t,i,r){for(var f=0,d=Math.min(e.length,i),n=t;n<d;n++){var a=e.charCodeAt(n)-48;f*=r,f+=49<=a?a-49+10:17<=a?a-17+10:a}return f}m.isBN=function(e){return e instanceof m||null!==e&&"object"==typeof e&&e.constructor.wordSize===m.wordSize&&Array.isArray(e.words)},m.max=function(e,t){return 0<e.cmp(t)?e:t},m.min=function(e,t){return e.cmp(t)<0?e:t},m.prototype._init=function(e,t,i){if("number"==typeof e)return this._initNumber(e,t,i);if("object"==typeof e)return this._initArray(e,t,i);p((t="hex"===t?16:t)===(0|t)&&2<=t&&t<=36);var r=0;"-"===(e=e.toString().replace(/\s+/g,""))[0]&&r++,16===t?this._parseHex(e,r):this._parseBase(e,t,r),"-"===e[0]&&(this.negative=1),this.strip(),"le"===i&&this._initArray(this.toArray(),t,i)},m.prototype._initNumber=function(e,t,i){e<0&&(this.negative=1,e=-e),e<67108864?(this.words=[67108863&e],this.length=1):e<4503599627370496?(this.words=[67108863&e,e/67108864&67108863],this.length=2):(p(e<9007199254740992),this.words=[67108863&e,e/67108864&67108863,1],this.length=3),"le"===i&&this._initArray(this.toArray(),t,i)},m.prototype._initArray=function(e,t,i){if(p("number"==typeof e.length),e.length<=0)return this.words=[0],this.length=1,this;this.length=Math.ceil(e.length/3),this.words=new Array(this.length);for(var r,f,d=0;d<this.length;d++)this.words[d]=0;var n=0;if("be"===i)for(d=e.length-1,r=0;0<=d;d-=3)f=e[d]|e[d-1]<<8|e[d-2]<<16,this.words[r]|=f<<n&67108863,this.words[r+1]=f>>>26-n&67108863,26<=(n+=24)&&(n-=26,r++);else if("le"===i)for(r=d=0;d<e.length;d+=3)f=e[d]|e[d+1]<<8|e[d+2]<<16,this.words[r]|=f<<n&67108863,this.words[r+1]=f>>>26-n&67108863,26<=(n+=24)&&(n-=26,r++);return this.strip()},m.prototype._parseHex=function(e,t){this.length=Math.ceil((e.length-t)/6),this.words=new Array(this.length);for(var i,r=0;r<this.length;r++)this.words[r]=0;for(var f=0,r=e.length-6,d=0;t<=r;r-=6)i=n(e,r,r+6),this.words[d]|=i<<f&67108863,this.words[d+1]|=i>>>26-f&4194303,26<=(f+=24)&&(f-=26,d++);r+6!==t&&(i=n(e,t,r+6),this.words[d]|=i<<f&67108863,this.words[d+1]|=i>>>26-f&4194303),this.strip()},m.prototype._parseBase=function(e,t,i){this.words=[0];for(var r=0,f=this.length=1;f<=67108863;f*=t)r++;r--,f=f/t|0;for(var d=e.length-i,n=d%r,a=Math.min(d,d-n)+i,s=0,c=i;c<a;c+=r)s=o(e,c,c+r,t),this.imuln(f),this.words[0]+s<67108864?this.words[0]+=s:this._iaddn(s);if(0!=n){for(var h=1,s=o(e,c,e.length,t),c=0;c<n;c++)h*=t;this.imuln(h),this.words[0]+s<67108864?this.words[0]+=s:this._iaddn(s)}},m.prototype.copy=function(e){e.words=new Array(this.length);for(var t=0;t<this.length;t++)e.words[t]=this.words[t];e.length=this.length,e.negative=this.negative,e.red=this.red},m.prototype.clone=function(){var e=new m(null);return this.copy(e),e},m.prototype._expand=function(e){for(;this.length<e;)this.words[this.length++]=0;return this},m.prototype.strip=function(){for(;1<this.length&&0===this.words[this.length-1];)this.length--;return this._normSign()},m.prototype._normSign=function(){return 1===this.length&&0===this.words[0]&&(this.negative=0),this},m.prototype.inspect=function(){return(this.red?"<BN-R: ":"<BN: ")+this.toString(16)+">"};var u=["","0","00","000","0000","00000","000000","0000000","00000000","000000000","0000000000","00000000000","000000000000","0000000000000","00000000000000","000000000000000","0000000000000000","00000000000000000","000000000000000000","0000000000000000000","00000000000000000000","000000000000000000000","0000000000000000000000","00000000000000000000000","000000000000000000000000","0000000000000000000000000"],b=[0,0,25,16,12,11,10,9,8,8,7,7,7,7,6,6,6,6,6,6,6,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5],l=[0,0,33554432,43046721,16777216,48828125,60466176,40353607,16777216,43046721,1e7,19487171,35831808,62748517,7529536,11390625,16777216,24137569,34012224,47045881,64e6,4084101,5153632,6436343,7962624,9765625,11881376,14348907,17210368,20511149,243e5,28629151,33554432,39135393,45435424,52521875,60466176];function f(e,t,i){i.negative=t.negative^e.negative;var r=e.length+t.length|0,r=(i.length=r)-1|0,f=67108863&(o=(0|e.words[0])*(0|t.words[0])),d=o/67108864|0;i.words[0]=f;for(var n=1;n<r;n++){for(var a=d>>>26,s=67108863&d,c=Math.min(n,t.length-1),h=Math.max(0,n-e.length+1);h<=c;h++){var o,u=n-h|0;a+=(o=(0|e.words[u])*(0|t.words[h])+s)/67108864|0,s=67108863&o}i.words[n]=0|s,d=0|a}return 0!==d?i.words[n]=0|d:i.length--,i.strip()}m.prototype.toString=function(e,t){if(t=0|t||1,16===(e=e||10)||"hex"===e){a="";for(var i=0,r=0,f=0;f<this.length;f++){var d=this.words[f],n=(16777215&(d<<i|r)).toString(16),a=0!==(r=d>>>24-i&16777215)||f!==this.length-1?u[6-n.length]+n+a:n+a;26<=(i+=2)&&(i-=26,f--)}for(0!==r&&(a=r.toString(16)+a);a.length%t!=0;)a="0"+a;return a=0!==this.negative?"-"+a:a}if(e===(0|e)&&2<=e&&e<=36){var s=b[e],c=l[e];for(a="",(h=this.clone()).negative=0;!h.isZero();){var h,o=h.modn(c).toString(e);a=(h=h.idivn(c)).isZero()?o+a:u[s-o.length]+o+a}for(this.isZero()&&(a="0"+a);a.length%t!=0;)a="0"+a;return a=0!==this.negative?"-"+a:a}p(!1,"Base should be between 2 and 36")},m.prototype.toNumber=function(){var e=this.words[0];return 2===this.length?e+=67108864*this.words[1]:3===this.length&&1===this.words[2]?e+=4503599627370496+67108864*this.words[1]:2<this.length&&p(!1,"Number can only safely store up to 53 bits"),0!==this.negative?-e:e},m.prototype.toJSON=function(){return this.toString(16)},m.prototype.toBuffer=function(e,t){return p(void 0!==r),this.toArrayLike(r,e,t)},m.prototype.toArray=function(e,t){return this.toArrayLike(Array,e,t)},m.prototype.toArrayLike=function(e,t,i){var r=this.byteLength(),f=i||Math.max(1,r);p(r<=f,"byte array longer than desired length"),p(0<f,"Requested array length <= 0"),this.strip();var d,n,t="le"===t,a=new e(f),s=this.clone();if(t){for(n=0;!s.isZero();n++)d=s.andln(255),s.iushrn(8),a[n]=d;for(;n<f;n++)a[n]=0}else{for(n=0;n<f-r;n++)a[n]=0;for(n=0;!s.isZero();n++)d=s.andln(255),s.iushrn(8),a[f-n-1]=d}return a},Math.clz32?m.prototype._countBits=function(e){return 32-Math.clz32(e)}:m.prototype._countBits=function(e){var t=e,e=0;return 4096<=t&&(e+=13,t>>>=13),64<=t&&(e+=7,t>>>=7),8<=t&&(e+=4,t>>>=4),2<=t&&(e+=2,t>>>=2),e+t},m.prototype._zeroBits=function(e){if(0===e)return 26;var t=e,e=0;return 0==(8191&t)&&(e+=13,t>>>=13),0==(127&t)&&(e+=7,t>>>=7),0==(15&t)&&(e+=4,t>>>=4),0==(3&t)&&(e+=2,t>>>=2),0==(1&t)&&e++,e},m.prototype.bitLength=function(){var e=this.words[this.length-1],e=this._countBits(e);return 26*(this.length-1)+e},m.prototype.zeroBits=function(){if(this.isZero())return 0;for(var e=0,t=0;t<this.length;t++){var i=this._zeroBits(this.words[t]);if(e+=i,26!==i)break}return e},m.prototype.byteLength=function(){return Math.ceil(this.bitLength()/8)},m.prototype.toTwos=function(e){return 0!==this.negative?this.abs().inotn(e).iaddn(1):this.clone()},m.prototype.fromTwos=function(e){return this.testn(e-1)?this.notn(e).iaddn(1).ineg():this.clone()},m.prototype.isNeg=function(){return 0!==this.negative},m.prototype.neg=function(){return this.clone().ineg()},m.prototype.ineg=function(){return this.isZero()||(this.negative^=1),this},m.prototype.iuor=function(e){for(;this.length<e.length;)this.words[this.length++]=0;for(var t=0;t<e.length;t++)this.words[t]=this.words[t]|e.words[t];return this.strip()},m.prototype.ior=function(e){return p(0==(this.negative|e.negative)),this.iuor(e)},m.prototype.or=function(e){return this.length>e.length?this.clone().ior(e):e.clone().ior(this)},m.prototype.uor=function(e){return this.length>e.length?this.clone().iuor(e):e.clone().iuor(this)},m.prototype.iuand=function(e){for(var t=this.length>e.length?e:this,i=0;i<t.length;i++)this.words[i]=this.words[i]&e.words[i];return this.length=t.length,this.strip()},m.prototype.iand=function(e){return p(0==(this.negative|e.negative)),this.iuand(e)},m.prototype.and=function(e){return this.length>e.length?this.clone().iand(e):e.clone().iand(this)},m.prototype.uand=function(e){return this.length>e.length?this.clone().iuand(e):e.clone().iuand(this)},m.prototype.iuxor=function(e){for(var t,i=this.length>e.length?(t=this,e):(t=e,this),r=0;r<i.length;r++)this.words[r]=t.words[r]^i.words[r];if(this!==t)for(;r<t.length;r++)this.words[r]=t.words[r];return this.length=t.length,this.strip()},m.prototype.ixor=function(e){return p(0==(this.negative|e.negative)),this.iuxor(e)},m.prototype.xor=function(e){return this.length>e.length?this.clone().ixor(e):e.clone().ixor(this)},m.prototype.uxor=function(e){return this.length>e.length?this.clone().iuxor(e):e.clone().iuxor(this)},m.prototype.inotn=function(e){p("number"==typeof e&&0<=e);var t=0|Math.ceil(e/26),e=e%26;this._expand(t),0<e&&t--;for(var i=0;i<t;i++)this.words[i]=67108863&~this.words[i];return 0<e&&(this.words[i]=~this.words[i]&67108863>>26-e),this.strip()},m.prototype.notn=function(e){return this.clone().inotn(e)},m.prototype.setn=function(e,t){p("number"==typeof e&&0<=e);var i=e/26|0,e=e%26;return this._expand(1+i),this.words[i]=t?this.words[i]|1<<e:this.words[i]&~(1<<e),this.strip()},m.prototype.iadd=function(e){var t,i,r;if(0!==this.negative&&0===e.negative)return this.negative=0,t=this.isub(e),this.negative^=1,this._normSign();if(0===this.negative&&0!==e.negative)return e.negative=0,t=this.isub(e),e.negative=1,t._normSign();r=this.length>e.length?(i=this,e):(i=e,this);for(var f=0,d=0;d<r.length;d++)t=(0|i.words[d])+(0|r.words[d])+f,this.words[d]=67108863&t,f=t>>>26;for(;0!==f&&d<i.length;d++)t=(0|i.words[d])+f,this.words[d]=67108863&t,f=t>>>26;if(this.length=i.length,0!==f)this.words[this.length]=f,this.length++;else if(i!==this)for(;d<i.length;d++)this.words[d]=i.words[d];return this},m.prototype.add=function(e){var t;return 0!==e.negative&&0===this.negative?(e.negative=0,t=this.sub(e),e.negative^=1,t):0===e.negative&&0!==this.negative?(this.negative=0,t=e.sub(this),this.negative=1,t):this.length>e.length?this.clone().iadd(e):e.clone().iadd(this)},m.prototype.isub=function(e){if(0!==e.negative){e.negative=0;var t=this.iadd(e);return e.negative=1,t._normSign()}if(0!==this.negative)return this.negative=0,this.iadd(e),this.negative=1,this._normSign();var i,r,f=this.cmp(e);if(0===f)return this.negative=0,this.length=1,this.words[0]=0,this;r=0<f?(i=this,e):(i=e,this);for(var d=0,n=0;n<r.length;n++)d=(t=(0|i.words[n])-(0|r.words[n])+d)>>26,this.words[n]=67108863&t;for(;0!==d&&n<i.length;n++)d=(t=(0|i.words[n])+d)>>26,this.words[n]=67108863&t;if(0===d&&n<i.length&&i!==this)for(;n<i.length;n++)this.words[n]=i.words[n];return this.length=Math.max(this.length,n),i!==this&&(this.negative=1),this.strip()},m.prototype.sub=function(e){return this.clone().isub(e)};var d=function(e,t,i){var r=e.words,f=t.words,d=i.words,n=0|r[0],a=8191&n,s=n>>>13,c=0|r[1],h=8191&c,o=c>>>13,u=0|r[2],b=8191&u,l=u>>>13,p=0|r[3],m=8191&p,v=p>>>13,g=0|r[4],y=8191&g,M=g>>>13,w=0|r[5],S=8191&w,_=w>>>13,A=0|r[6],x=8191&A,I=A>>>13,z=0|r[7],q=8191&z,R=z>>>13,k=0|r[8],P=8191&k,j=k>>>13,N=0|r[9],E=8191&N,B=N>>>13,L=0|f[0],O=8191&L,F=L>>>13,T=0|f[1],C=8191&T,Z=T>>>13,J=0|f[2],H=8191&J,D=J>>>13,X=0|f[3],K=8191&X,V=X>>>13,W=0|f[4],U=8191&W,Y=W>>>13,G=0|f[5],Q=8191&G,$=G>>>13,n=0|f[6],c=8191&n,u=n>>>13,p=0|f[7],g=8191&p,w=p>>>13,A=0|f[8],z=8191&A,k=A>>>13,r=0|f[9],N=8191&r,L=r>>>13;i.negative=e.negative^t.negative,i.length=19;var X=(0+Math.imul(a,O)|0)+((8191&(J=Math.imul(a,F)+Math.imul(s,O)|0))<<13)|0,ee=(Math.imul(s,F)+(J>>>13)|0)+(X>>>26)|0;X&=67108863,T=Math.imul(h,O),J=Math.imul(h,F)+Math.imul(o,O)|0,W=Math.imul(o,F);G=(ee+(T+Math.imul(a,C)|0)|0)+((8191&(J=(J+Math.imul(a,Z)|0)+Math.imul(s,C)|0))<<13)|0;ee=((W+Math.imul(s,Z)|0)+(J>>>13)|0)+(G>>>26)|0,G&=67108863,T=Math.imul(b,O),J=Math.imul(b,F)+Math.imul(l,O)|0,W=Math.imul(l,F),T=T+Math.imul(h,C)|0,J=(J+Math.imul(h,Z)|0)+Math.imul(o,C)|0,W=W+Math.imul(o,Z)|0;n=(ee+(T+Math.imul(a,H)|0)|0)+((8191&(J=(J+Math.imul(a,D)|0)+Math.imul(s,H)|0))<<13)|0;ee=((W+Math.imul(s,D)|0)+(J>>>13)|0)+(n>>>26)|0,n&=67108863,T=Math.imul(m,O),J=Math.imul(m,F)+Math.imul(v,O)|0,W=Math.imul(v,F),T=T+Math.imul(b,C)|0,J=(J+Math.imul(b,Z)|0)+Math.imul(l,C)|0,W=W+Math.imul(l,Z)|0,T=T+Math.imul(h,H)|0,J=(J+Math.imul(h,D)|0)+Math.imul(o,H)|0,W=W+Math.imul(o,D)|0;p=(ee+(T+Math.imul(a,K)|0)|0)+((8191&(J=(J+Math.imul(a,V)|0)+Math.imul(s,K)|0))<<13)|0;ee=((W+Math.imul(s,V)|0)+(J>>>13)|0)+(p>>>26)|0,p&=67108863,T=Math.imul(y,O),J=Math.imul(y,F)+Math.imul(M,O)|0,W=Math.imul(M,F),T=T+Math.imul(m,C)|0,J=(J+Math.imul(m,Z)|0)+Math.imul(v,C)|0,W=W+Math.imul(v,Z)|0,T=T+Math.imul(b,H)|0,J=(J+Math.imul(b,D)|0)+Math.imul(l,H)|0,W=W+Math.imul(l,D)|0,T=T+Math.imul(h,K)|0,J=(J+Math.imul(h,V)|0)+Math.imul(o,K)|0,W=W+Math.imul(o,V)|0;A=(ee+(T+Math.imul(a,U)|0)|0)+((8191&(J=(J+Math.imul(a,Y)|0)+Math.imul(s,U)|0))<<13)|0;ee=((W+Math.imul(s,Y)|0)+(J>>>13)|0)+(A>>>26)|0,A&=67108863,T=Math.imul(S,O),J=Math.imul(S,F)+Math.imul(_,O)|0,W=Math.imul(_,F),T=T+Math.imul(y,C)|0,J=(J+Math.imul(y,Z)|0)+Math.imul(M,C)|0,W=W+Math.imul(M,Z)|0,T=T+Math.imul(m,H)|0,J=(J+Math.imul(m,D)|0)+Math.imul(v,H)|0,W=W+Math.imul(v,D)|0,T=T+Math.imul(b,K)|0,J=(J+Math.imul(b,V)|0)+Math.imul(l,K)|0,W=W+Math.imul(l,V)|0,T=T+Math.imul(h,U)|0,J=(J+Math.imul(h,Y)|0)+Math.imul(o,U)|0,W=W+Math.imul(o,Y)|0;f=(ee+(T+Math.imul(a,Q)|0)|0)+((8191&(J=(J+Math.imul(a,$)|0)+Math.imul(s,Q)|0))<<13)|0;ee=((W+Math.imul(s,$)|0)+(J>>>13)|0)+(f>>>26)|0,f&=67108863,T=Math.imul(x,O),J=Math.imul(x,F)+Math.imul(I,O)|0,W=Math.imul(I,F),T=T+Math.imul(S,C)|0,J=(J+Math.imul(S,Z)|0)+Math.imul(_,C)|0,W=W+Math.imul(_,Z)|0,T=T+Math.imul(y,H)|0,J=(J+Math.imul(y,D)|0)+Math.imul(M,H)|0,W=W+Math.imul(M,D)|0,T=T+Math.imul(m,K)|0,J=(J+Math.imul(m,V)|0)+Math.imul(v,K)|0,W=W+Math.imul(v,V)|0,T=T+Math.imul(b,U)|0,J=(J+Math.imul(b,Y)|0)+Math.imul(l,U)|0,W=W+Math.imul(l,Y)|0,T=T+Math.imul(h,Q)|0,J=(J+Math.imul(h,$)|0)+Math.imul(o,Q)|0,W=W+Math.imul(o,$)|0;r=(ee+(T+Math.imul(a,c)|0)|0)+((8191&(J=(J+Math.imul(a,u)|0)+Math.imul(s,c)|0))<<13)|0;ee=((W+Math.imul(s,u)|0)+(J>>>13)|0)+(r>>>26)|0,r&=67108863,T=Math.imul(q,O),J=Math.imul(q,F)+Math.imul(R,O)|0,W=Math.imul(R,F),T=T+Math.imul(x,C)|0,J=(J+Math.imul(x,Z)|0)+Math.imul(I,C)|0,W=W+Math.imul(I,Z)|0,T=T+Math.imul(S,H)|0,J=(J+Math.imul(S,D)|0)+Math.imul(_,H)|0,W=W+Math.imul(_,D)|0,T=T+Math.imul(y,K)|0,J=(J+Math.imul(y,V)|0)+Math.imul(M,K)|0,W=W+Math.imul(M,V)|0,T=T+Math.imul(m,U)|0,J=(J+Math.imul(m,Y)|0)+Math.imul(v,U)|0,W=W+Math.imul(v,Y)|0,T=T+Math.imul(b,Q)|0,J=(J+Math.imul(b,$)|0)+Math.imul(l,Q)|0,W=W+Math.imul(l,$)|0,T=T+Math.imul(h,c)|0,J=(J+Math.imul(h,u)|0)+Math.imul(o,c)|0,W=W+Math.imul(o,u)|0;e=(ee+(T+Math.imul(a,g)|0)|0)+((8191&(J=(J+Math.imul(a,w)|0)+Math.imul(s,g)|0))<<13)|0;ee=((W+Math.imul(s,w)|0)+(J>>>13)|0)+(e>>>26)|0,e&=67108863,T=Math.imul(P,O),J=Math.imul(P,F)+Math.imul(j,O)|0,W=Math.imul(j,F),T=T+Math.imul(q,C)|0,J=(J+Math.imul(q,Z)|0)+Math.imul(R,C)|0,W=W+Math.imul(R,Z)|0,T=T+Math.imul(x,H)|0,J=(J+Math.imul(x,D)|0)+Math.imul(I,H)|0,W=W+Math.imul(I,D)|0,T=T+Math.imul(S,K)|0,J=(J+Math.imul(S,V)|0)+Math.imul(_,K)|0,W=W+Math.imul(_,V)|0,T=T+Math.imul(y,U)|0,J=(J+Math.imul(y,Y)|0)+Math.imul(M,U)|0,W=W+Math.imul(M,Y)|0,T=T+Math.imul(m,Q)|0,J=(J+Math.imul(m,$)|0)+Math.imul(v,Q)|0,W=W+Math.imul(v,$)|0,T=T+Math.imul(b,c)|0,J=(J+Math.imul(b,u)|0)+Math.imul(l,c)|0,W=W+Math.imul(l,u)|0,T=T+Math.imul(h,g)|0,J=(J+Math.imul(h,w)|0)+Math.imul(o,g)|0,W=W+Math.imul(o,w)|0;t=(ee+(T+Math.imul(a,z)|0)|0)+((8191&(J=(J+Math.imul(a,k)|0)+Math.imul(s,z)|0))<<13)|0;ee=((W+Math.imul(s,k)|0)+(J>>>13)|0)+(t>>>26)|0,t&=67108863,T=Math.imul(E,O),J=Math.imul(E,F)+Math.imul(B,O)|0,W=Math.imul(B,F),T=T+Math.imul(P,C)|0,J=(J+Math.imul(P,Z)|0)+Math.imul(j,C)|0,W=W+Math.imul(j,Z)|0,T=T+Math.imul(q,H)|0,J=(J+Math.imul(q,D)|0)+Math.imul(R,H)|0,W=W+Math.imul(R,D)|0,T=T+Math.imul(x,K)|0,J=(J+Math.imul(x,V)|0)+Math.imul(I,K)|0,W=W+Math.imul(I,V)|0,T=T+Math.imul(S,U)|0,J=(J+Math.imul(S,Y)|0)+Math.imul(_,U)|0,W=W+Math.imul(_,Y)|0,T=T+Math.imul(y,Q)|0,J=(J+Math.imul(y,$)|0)+Math.imul(M,Q)|0,W=W+Math.imul(M,$)|0,T=T+Math.imul(m,c)|0,J=(J+Math.imul(m,u)|0)+Math.imul(v,c)|0,W=W+Math.imul(v,u)|0,T=T+Math.imul(b,g)|0,J=(J+Math.imul(b,w)|0)+Math.imul(l,g)|0,W=W+Math.imul(l,w)|0,T=T+Math.imul(h,z)|0,J=(J+Math.imul(h,k)|0)+Math.imul(o,z)|0,W=W+Math.imul(o,k)|0;a=(ee+(T+Math.imul(a,N)|0)|0)+((8191&(J=(J+Math.imul(a,L)|0)+Math.imul(s,N)|0))<<13)|0;ee=((W+Math.imul(s,L)|0)+(J>>>13)|0)+(a>>>26)|0,a&=67108863,T=Math.imul(E,C),J=Math.imul(E,Z)+Math.imul(B,C)|0,W=Math.imul(B,Z),T=T+Math.imul(P,H)|0,J=(J+Math.imul(P,D)|0)+Math.imul(j,H)|0,W=W+Math.imul(j,D)|0,T=T+Math.imul(q,K)|0,J=(J+Math.imul(q,V)|0)+Math.imul(R,K)|0,W=W+Math.imul(R,V)|0,T=T+Math.imul(x,U)|0,J=(J+Math.imul(x,Y)|0)+Math.imul(I,U)|0,W=W+Math.imul(I,Y)|0,T=T+Math.imul(S,Q)|0,J=(J+Math.imul(S,$)|0)+Math.imul(_,Q)|0,W=W+Math.imul(_,$)|0,T=T+Math.imul(y,c)|0,J=(J+Math.imul(y,u)|0)+Math.imul(M,c)|0,W=W+Math.imul(M,u)|0,T=T+Math.imul(m,g)|0,J=(J+Math.imul(m,w)|0)+Math.imul(v,g)|0,W=W+Math.imul(v,w)|0,T=T+Math.imul(b,z)|0,J=(J+Math.imul(b,k)|0)+Math.imul(l,z)|0,W=W+Math.imul(l,k)|0;h=(ee+(T+Math.imul(h,N)|0)|0)+((8191&(J=(J+Math.imul(h,L)|0)+Math.imul(o,N)|0))<<13)|0;ee=((W+Math.imul(o,L)|0)+(J>>>13)|0)+(h>>>26)|0,h&=67108863,T=Math.imul(E,H),J=Math.imul(E,D)+Math.imul(B,H)|0,W=Math.imul(B,D),T=T+Math.imul(P,K)|0,J=(J+Math.imul(P,V)|0)+Math.imul(j,K)|0,W=W+Math.imul(j,V)|0,T=T+Math.imul(q,U)|0,J=(J+Math.imul(q,Y)|0)+Math.imul(R,U)|0,W=W+Math.imul(R,Y)|0,T=T+Math.imul(x,Q)|0,J=(J+Math.imul(x,$)|0)+Math.imul(I,Q)|0,W=W+Math.imul(I,$)|0,T=T+Math.imul(S,c)|0,J=(J+Math.imul(S,u)|0)+Math.imul(_,c)|0,W=W+Math.imul(_,u)|0,T=T+Math.imul(y,g)|0,J=(J+Math.imul(y,w)|0)+Math.imul(M,g)|0,W=W+Math.imul(M,w)|0,T=T+Math.imul(m,z)|0,J=(J+Math.imul(m,k)|0)+Math.imul(v,z)|0,W=W+Math.imul(v,k)|0;b=(ee+(T+Math.imul(b,N)|0)|0)+((8191&(J=(J+Math.imul(b,L)|0)+Math.imul(l,N)|0))<<13)|0;ee=((W+Math.imul(l,L)|0)+(J>>>13)|0)+(b>>>26)|0,b&=67108863,T=Math.imul(E,K),J=Math.imul(E,V)+Math.imul(B,K)|0,W=Math.imul(B,V),T=T+Math.imul(P,U)|0,J=(J+Math.imul(P,Y)|0)+Math.imul(j,U)|0,W=W+Math.imul(j,Y)|0,T=T+Math.imul(q,Q)|0,J=(J+Math.imul(q,$)|0)+Math.imul(R,Q)|0,W=W+Math.imul(R,$)|0,T=T+Math.imul(x,c)|0,J=(J+Math.imul(x,u)|0)+Math.imul(I,c)|0,W=W+Math.imul(I,u)|0,T=T+Math.imul(S,g)|0,J=(J+Math.imul(S,w)|0)+Math.imul(_,g)|0,W=W+Math.imul(_,w)|0,T=T+Math.imul(y,z)|0,J=(J+Math.imul(y,k)|0)+Math.imul(M,z)|0,W=W+Math.imul(M,k)|0;m=(ee+(T+Math.imul(m,N)|0)|0)+((8191&(J=(J+Math.imul(m,L)|0)+Math.imul(v,N)|0))<<13)|0;ee=((W+Math.imul(v,L)|0)+(J>>>13)|0)+(m>>>26)|0,m&=67108863,T=Math.imul(E,U),J=Math.imul(E,Y)+Math.imul(B,U)|0,W=Math.imul(B,Y),T=T+Math.imul(P,Q)|0,J=(J+Math.imul(P,$)|0)+Math.imul(j,Q)|0,W=W+Math.imul(j,$)|0,T=T+Math.imul(q,c)|0,J=(J+Math.imul(q,u)|0)+Math.imul(R,c)|0,W=W+Math.imul(R,u)|0,T=T+Math.imul(x,g)|0,J=(J+Math.imul(x,w)|0)+Math.imul(I,g)|0,W=W+Math.imul(I,w)|0,T=T+Math.imul(S,z)|0,J=(J+Math.imul(S,k)|0)+Math.imul(_,z)|0,W=W+Math.imul(_,k)|0;y=(ee+(T+Math.imul(y,N)|0)|0)+((8191&(J=(J+Math.imul(y,L)|0)+Math.imul(M,N)|0))<<13)|0;ee=((W+Math.imul(M,L)|0)+(J>>>13)|0)+(y>>>26)|0,y&=67108863,T=Math.imul(E,Q),J=Math.imul(E,$)+Math.imul(B,Q)|0,W=Math.imul(B,$),T=T+Math.imul(P,c)|0,J=(J+Math.imul(P,u)|0)+Math.imul(j,c)|0,W=W+Math.imul(j,u)|0,T=T+Math.imul(q,g)|0,J=(J+Math.imul(q,w)|0)+Math.imul(R,g)|0,W=W+Math.imul(R,w)|0,T=T+Math.imul(x,z)|0,J=(J+Math.imul(x,k)|0)+Math.imul(I,z)|0,W=W+Math.imul(I,k)|0;S=(ee+(T+Math.imul(S,N)|0)|0)+((8191&(J=(J+Math.imul(S,L)|0)+Math.imul(_,N)|0))<<13)|0;ee=((W+Math.imul(_,L)|0)+(J>>>13)|0)+(S>>>26)|0,S&=67108863,T=Math.imul(E,c),J=Math.imul(E,u)+Math.imul(B,c)|0,W=Math.imul(B,u),T=T+Math.imul(P,g)|0,J=(J+Math.imul(P,w)|0)+Math.imul(j,g)|0,W=W+Math.imul(j,w)|0,T=T+Math.imul(q,z)|0,J=(J+Math.imul(q,k)|0)+Math.imul(R,z)|0,W=W+Math.imul(R,k)|0;x=(ee+(T+Math.imul(x,N)|0)|0)+((8191&(J=(J+Math.imul(x,L)|0)+Math.imul(I,N)|0))<<13)|0;ee=((W+Math.imul(I,L)|0)+(J>>>13)|0)+(x>>>26)|0,x&=67108863,T=Math.imul(E,g),J=Math.imul(E,w)+Math.imul(B,g)|0,W=Math.imul(B,w),T=T+Math.imul(P,z)|0,J=(J+Math.imul(P,k)|0)+Math.imul(j,z)|0,W=W+Math.imul(j,k)|0;q=(ee+(T+Math.imul(q,N)|0)|0)+((8191&(J=(J+Math.imul(q,L)|0)+Math.imul(R,N)|0))<<13)|0;ee=((W+Math.imul(R,L)|0)+(J>>>13)|0)+(q>>>26)|0,q&=67108863,T=Math.imul(E,z),J=Math.imul(E,k)+Math.imul(B,z)|0,W=Math.imul(B,k);P=(ee+(T+Math.imul(P,N)|0)|0)+((8191&(J=(J+Math.imul(P,L)|0)+Math.imul(j,N)|0))<<13)|0;ee=((W+Math.imul(j,L)|0)+(J>>>13)|0)+(P>>>26)|0,P&=67108863;N=(ee+Math.imul(E,N)|0)+((8191&(J=Math.imul(E,L)+Math.imul(B,N)|0))<<13)|0;return ee=(Math.imul(B,L)+(J>>>13)|0)+(N>>>26)|0,N&=67108863,d[0]=X,d[1]=G,d[2]=n,d[3]=p,d[4]=A,d[5]=f,d[6]=r,d[7]=e,d[8]=t,d[9]=a,d[10]=h,d[11]=b,d[12]=m,d[13]=y,d[14]=S,d[15]=x,d[16]=q,d[17]=P,d[18]=N,0!=ee&&(d[19]=ee,i.length++),i};function a(e,t,i){return(new s).mulp(e,t,i)}function s(e,t){this.x=e,this.y=t}Math.imul||(d=f),m.prototype.mulTo=function(e,t){var i=this.length+e.length,t=(10===this.length&&10===e.length?d:i<63?f:i<1024?function(e,t,i){i.negative=t.negative^e.negative,i.length=e.length+t.length;for(var r=0,f=0,d=0;d<i.length-1;d++){for(var n=f,f=0,a=67108863&r,s=Math.min(d,t.length-1),c=Math.max(0,d-e.length+1);c<=s;c++){var h=d-c,o=(0|e.words[h])*(0|t.words[c]),h=67108863&o,a=67108863&(h=h+a|0);f+=(n=(n=n+(o/67108864|0)|0)+(h>>>26)|0)>>>26,n&=67108863}i.words[d]=a,r=n,n=f}return 0!==r?i.words[d]=r:i.length--,i.strip()}:a)(this,e,t);return t},s.prototype.makeRBT=function(e){for(var t=new Array(e),i=m.prototype._countBits(e)-1,r=0;r<e;r++)t[r]=this.revBin(r,i,e);return t},s.prototype.revBin=function(e,t,i){if(0===e||e===i-1)return e;for(var r=0,f=0;f<t;f++)r|=(1&e)<<t-f-1,e>>=1;return r},s.prototype.permute=function(e,t,i,r,f,d){for(var n=0;n<d;n++)r[n]=t[e[n]],f[n]=i[e[n]]},s.prototype.transform=function(e,t,i,r,f,d){this.permute(d,e,t,i,r,f);for(var n=1;n<f;n<<=1)for(var a=n<<1,s=Math.cos(2*Math.PI/a),c=Math.sin(2*Math.PI/a),h=0;h<f;h+=a)for(var o=s,u=c,b=0;b<n;b++){var l=i[h+b],p=r[h+b],m=o*(g=i[h+b+n])-u*(v=r[h+b+n]),v=o*v+u*g,g=m;i[h+b]=l+g,r[h+b]=p+v,i[h+b+n]=l-g,r[h+b+n]=p-v,b!==a&&(m=s*o-c*u,u=s*u+c*o,o=m)}},s.prototype.guessLen13b=function(e,t){for(var e=1&(r=1|Math.max(t,e)),i=0,r=r/2|0;r;r>>>=1)i++;return 1<<i+1+e},s.prototype.conjugate=function(e,t,i){if(!(i<=1))for(var r=0;r<i/2;r++){var f=e[r];e[r]=e[i-r-1],e[i-r-1]=f,f=t[r],t[r]=-t[i-r-1],t[i-r-1]=-f}},s.prototype.normalize13b=function(e,t){for(var i=0,r=0;r<t/2;r++){var f=8192*Math.round(e[2*r+1]/t)+Math.round(e[2*r]/t)+i;e[r]=67108863&f,i=f<67108864?0:f/67108864|0}return e},s.prototype.convert13b=function(e,t,i,r){for(var f=0,d=0;d<t;d++)f+=0|e[d],i[2*d]=8191&f,f>>>=13,i[2*d+1]=8191&f,f>>>=13;for(d=2*t;d<r;++d)i[d]=0;p(0===f),p(0==(-8192&f))},s.prototype.stub=function(e){for(var t=new Array(e),i=0;i<e;i++)t[i]=0;return t},s.prototype.mulp=function(e,t,i){var r=2*this.guessLen13b(e.length,t.length),f=this.makeRBT(r),d=this.stub(r),n=new Array(r),a=new Array(r),s=new Array(r),c=new Array(r),h=new Array(r),o=new Array(r),u=i.words;u.length=r,this.convert13b(e.words,e.length,n,r),this.convert13b(t.words,t.length,c,r),this.transform(n,d,a,s,r,f),this.transform(c,d,h,o,r,f);for(var b=0;b<r;b++){var l=a[b]*h[b]-s[b]*o[b];s[b]=a[b]*o[b]+s[b]*h[b],a[b]=l}return this.conjugate(a,s,r),this.transform(a,s,u,d,r,f),this.conjugate(u,d,r),this.normalize13b(u,r),i.negative=e.negative^t.negative,i.length=e.length+t.length,i.strip()},m.prototype.mul=function(e){var t=new m(null);return t.words=new Array(this.length+e.length),this.mulTo(e,t)},m.prototype.mulf=function(e){var t=new m(null);return t.words=new Array(this.length+e.length),a(this,e,t)},m.prototype.imul=function(e){return this.clone().mulTo(e,this)},m.prototype.imuln=function(e){p("number"==typeof e),p(e<67108864);for(var t=0,i=0;i<this.length;i++){var r=(0|this.words[i])*e,f=(67108863&r)+(67108863&t);t>>=26,t+=r/67108864|0,t+=f>>>26,this.words[i]=67108863&f}return 0!==t&&(this.words[i]=t,this.length++),this},m.prototype.muln=function(e){return this.clone().imuln(e)},m.prototype.sqr=function(){return this.mul(this)},m.prototype.isqr=function(){return this.imul(this.clone())},m.prototype.pow=function(e){var t=function(e){for(var t=new Array(e.bitLength()),i=0;i<t.length;i++){var r=i/26|0,f=i%26;t[i]=(e.words[r]&1<<f)>>>f}return t}(e);if(0===t.length)return new m(1);for(var i=this,r=0;r<t.length&&0===t[r];r++,i=i.sqr());if(++r<t.length)for(var f=i.sqr();r<t.length;r++,f=f.sqr())0!==t[r]&&(i=i.mul(f));return i},m.prototype.iushln=function(e){p("number"==typeof e&&0<=e);var t=e%26,i=(e-t)/26,r=67108863>>>26-t<<26-t;if(0!=t){for(var f=0,d=0;d<this.length;d++){var n=this.words[d]&r,a=(0|this.words[d])-n<<t;this.words[d]=a|f,f=n>>>26-t}f&&(this.words[d]=f,this.length++)}if(0!=i){for(d=this.length-1;0<=d;d--)this.words[d+i]=this.words[d];for(d=0;d<i;d++)this.words[d]=0;this.length+=i}return this.strip()},m.prototype.ishln=function(e){return p(0===this.negative),this.iushln(e)},m.prototype.iushrn=function(e,t,i){var r;p("number"==typeof e&&0<=e),r=t?(t-t%26)/26:0;var f=e%26,d=Math.min((e-f)/26,this.length),n=67108863^67108863>>>f<<f,a=i;if(r-=d,r=Math.max(0,r),a){for(var s=0;s<d;s++)a.words[s]=this.words[s];a.length=d}if(0!==d)if(this.length>d)for(this.length-=d,s=0;s<this.length;s++)this.words[s]=this.words[s+d];else this.words[0]=0,this.length=1;for(var c=0,s=this.length-1;0<=s&&(0!==c||r<=s);s--){var h=0|this.words[s];this.words[s]=c<<26-f|h>>>f,c=h&n}return a&&0!==c&&(a.words[a.length++]=c),0===this.length&&(this.words[0]=0,this.length=1),this.strip()},m.prototype.ishrn=function(e,t,i){return p(0===this.negative),this.iushrn(e,t,i)},m.prototype.shln=function(e){return this.clone().ishln(e)},m.prototype.ushln=function(e){return this.clone().iushln(e)},m.prototype.shrn=function(e){return this.clone().ishrn(e)},m.prototype.ushrn=function(e){return this.clone().iushrn(e)},m.prototype.testn=function(e){p("number"==typeof e&&0<=e);var t=e%26,e=(e-t)/26,t=1<<t;return!(this.length<=e)&&!!(this.words[e]&t)},m.prototype.imaskn=function(e){p("number"==typeof e&&0<=e);var t=e%26,e=(e-t)/26;return p(0===this.negative,"imaskn works only with positive numbers"),this.length<=e?this:(0!=t&&e++,this.length=Math.min(e,this.length),0!=t&&(t=67108863^67108863>>>t<<t,this.words[this.length-1]&=t),this.strip())},m.prototype.maskn=function(e){return this.clone().imaskn(e)},m.prototype.iaddn=function(e){return p("number"==typeof e),p(e<67108864),e<0?this.isubn(-e):0!==this.negative?(1===this.length&&(0|this.words[0])<e?(this.words[0]=e-(0|this.words[0]),this.negative=0):(this.negative=0,this.isubn(e),this.negative=1),this):this._iaddn(e)},m.prototype._iaddn=function(e){this.words[0]+=e;for(var t=0;t<this.length&&67108864<=this.words[t];t++)this.words[t]-=67108864,t===this.length-1?this.words[t+1]=1:this.words[t+1]++;return this.length=Math.max(this.length,t+1),this},m.prototype.isubn=function(e){if(p("number"==typeof e),p(e<67108864),e<0)return this.iaddn(-e);if(0!==this.negative)return this.negative=0,this.iaddn(e),this.negative=1,this;if(this.words[0]-=e,1===this.length&&this.words[0]<0)this.words[0]=-this.words[0],this.negative=1;else for(var t=0;t<this.length&&this.words[t]<0;t++)this.words[t]+=67108864,--this.words[t+1];return this.strip()},m.prototype.addn=function(e){return this.clone().iaddn(e)},m.prototype.subn=function(e){return this.clone().isubn(e)},m.prototype.iabs=function(){return this.negative=0,this},m.prototype.abs=function(){return this.clone().iabs()},m.prototype._ishlnsubmul=function(e,t,i){var r,f=e.length+i;this._expand(f);for(var d=0,n=0;n<e.length;n++){r=(0|this.words[n+i])+d;var a=(0|e.words[n])*t,d=((r-=67108863&a)>>26)-(a/67108864|0);this.words[n+i]=67108863&r}for(;n<this.length-i;n++)d=(r=(0|this.words[n+i])+d)>>26,this.words[n+i]=67108863&r;if(0===d)return this.strip();for(p(-1===d),n=d=0;n<this.length;n++)d=(r=-(0|this.words[n])+d)>>26,this.words[n]=67108863&r;return this.negative=1,this.strip()},m.prototype._wordDiv=function(e,t){var i=this.length-e.length,r=this.clone(),f=e,d=0|f.words[f.length-1];0!=(i=26-this._countBits(d))&&(f=f.ushln(i),r.iushln(i),d=0|f.words[f.length-1]);var n,a=r.length-f.length;if("mod"!==t){(n=new m(null)).length=1+a,n.words=new Array(n.length);for(var s=0;s<n.length;s++)n.words[s]=0}e=r.clone()._ishlnsubmul(f,1,a);0===e.negative&&(r=e,n&&(n.words[a]=1));for(var c=a-1;0<=c;c--){var h=67108864*(0|r.words[f.length+c])+(0|r.words[f.length+c-1]),h=Math.min(h/d|0,67108863);for(r._ishlnsubmul(f,h,c);0!==r.negative;)h--,r.negative=0,r._ishlnsubmul(f,1,c),r.isZero()||(r.negative^=1);n&&(n.words[c]=h)}return n&&n.strip(),r.strip(),"div"!==t&&0!=i&&r.iushrn(i),{div:n||null,mod:r}},m.prototype.divmod=function(e,t,i){return p(!e.isZero()),this.isZero()?{div:new m(0),mod:new m(0)}:0!==this.negative&&0===e.negative?(d=this.neg().divmod(e,t),"mod"!==t&&(r=d.div.neg()),"div"!==t&&(f=d.mod.neg(),i&&0!==f.negative&&f.iadd(e)),{div:r,mod:f}):0===this.negative&&0!==e.negative?(d=this.divmod(e.neg(),t),{div:r="mod"!==t?d.div.neg():r,mod:d.mod}):0!=(this.negative&e.negative)?(d=this.neg().divmod(e.neg(),t),"div"!==t&&(f=d.mod.neg(),i&&0!==f.negative&&f.isub(e)),{div:d.div,mod:f}):e.length>this.length||this.cmp(e)<0?{div:new m(0),mod:this}:1===e.length?"div"===t?{div:this.divn(e.words[0]),mod:null}:"mod"===t?{div:null,mod:new m(this.modn(e.words[0]))}:{div:this.divn(e.words[0]),mod:new m(this.modn(e.words[0]))}:this._wordDiv(e,t);var r,f,d},m.prototype.div=function(e){return this.divmod(e,"div",!1).div},m.prototype.mod=function(e){return this.divmod(e,"mod",!1).mod},m.prototype.umod=function(e){return this.divmod(e,"mod",!0).mod},m.prototype.divRound=function(e){var t=this.divmod(e);if(t.mod.isZero())return t.div;var i=0!==t.div.negative?t.mod.isub(e):t.mod,r=e.ushrn(1),e=e.andln(1),r=i.cmp(r);return r<0||1===e&&0===r?t.div:0!==t.div.negative?t.div.isubn(1):t.div.iaddn(1)},m.prototype.modn=function(e){p(e<=67108863);for(var t=(1<<26)%e,i=0,r=this.length-1;0<=r;r--)i=(t*i+(0|this.words[r]))%e;return i},m.prototype.idivn=function(e){p(e<=67108863);for(var t=0,i=this.length-1;0<=i;i--){var r=(0|this.words[i])+67108864*t;this.words[i]=r/e|0,t=r%e}return this.strip()},m.prototype.divn=function(e){return this.clone().idivn(e)},m.prototype.egcd=function(e){p(0===e.negative),p(!e.isZero());for(var t=this,i=e.clone(),t=0!==t.negative?t.umod(e):t.clone(),r=new m(1),f=new m(0),d=new m(0),n=new m(1),a=0;t.isEven()&&i.isEven();)t.iushrn(1),i.iushrn(1),++a;for(var s=i.clone(),c=t.clone();!t.isZero();){for(var h=0,o=1;0==(t.words[0]&o)&&h<26;++h,o<<=1);if(0<h)for(t.iushrn(h);0<h--;)(r.isOdd()||f.isOdd())&&(r.iadd(s),f.isub(c)),r.iushrn(1),f.iushrn(1);for(var u=0,b=1;0==(i.words[0]&b)&&u<26;++u,b<<=1);if(0<u)for(i.iushrn(u);0<u--;)(d.isOdd()||n.isOdd())&&(d.iadd(s),n.isub(c)),d.iushrn(1),n.iushrn(1);0<=t.cmp(i)?(t.isub(i),r.isub(d),f.isub(n)):(i.isub(t),d.isub(r),n.isub(f))}return{a:d,b:n,gcd:i.iushln(a)}},m.prototype._invmp=function(e){p(0===e.negative),p(!e.isZero());for(var t,i=this,r=e.clone(),i=0!==i.negative?i.umod(e):i.clone(),f=new m(1),d=new m(0),n=r.clone();0<i.cmpn(1)&&0<r.cmpn(1);){for(var a=0,s=1;0==(i.words[0]&s)&&a<26;++a,s<<=1);if(0<a)for(i.iushrn(a);0<a--;)f.isOdd()&&f.iadd(n),f.iushrn(1);for(var c=0,h=1;0==(r.words[0]&h)&&c<26;++c,h<<=1);if(0<c)for(r.iushrn(c);0<c--;)d.isOdd()&&d.iadd(n),d.iushrn(1);0<=i.cmp(r)?(i.isub(r),f.isub(d)):(r.isub(i),d.isub(f))}return(t=0===i.cmpn(1)?f:d).cmpn(0)<0&&t.iadd(e),t},m.prototype.gcd=function(e){if(this.isZero())return e.abs();if(e.isZero())return this.abs();var t=this.clone(),i=e.clone();t.negative=0;for(var r=i.negative=0;t.isEven()&&i.isEven();r++)t.iushrn(1),i.iushrn(1);for(;;){for(;t.isEven();)t.iushrn(1);for(;i.isEven();)i.iushrn(1);var f=t.cmp(i);if(f<0)var d=t,t=i,i=d;else if(0===f||0===i.cmpn(1))break;t.isub(i)}return i.iushln(r)},m.prototype.invm=function(e){return this.egcd(e).a.umod(e)},m.prototype.isEven=function(){return 0==(1&this.words[0])},m.prototype.isOdd=function(){return 1==(1&this.words[0])},m.prototype.andln=function(e){return this.words[0]&e},m.prototype.bincn=function(e){p("number"==typeof e);var t=e%26,e=(e-t)/26,t=1<<t;if(this.length<=e)return this._expand(1+e),this.words[e]|=t,this;for(var i=t,r=e;0!==i&&r<this.length;r++){var f=0|this.words[r],i=(f+=i)>>>26;f&=67108863,this.words[r]=f}return 0!==i&&(this.words[r]=i,this.length++),this},m.prototype.isZero=function(){return 1===this.length&&0===this.words[0]},m.prototype.cmpn=function(e){var t=e<0;return 0===this.negative||t?0===this.negative&&t?1:(this.strip(),e=1<this.length?1:(p((e=t?-e:e)<=67108863,"Number is too big"),(t=0|this.words[0])===e?0:t<e?-1:1),0!==this.negative?0|-e:e):-1},m.prototype.cmp=function(e){if(0!==this.negative&&0===e.negative)return-1;if(0===this.negative&&0!==e.negative)return 1;e=this.ucmp(e);return 0!==this.negative?0|-e:e},m.prototype.ucmp=function(e){if(this.length>e.length)return 1;if(this.length<e.length)return-1;for(var t=0,i=this.length-1;0<=i;i--){var r=0|this.words[i],f=0|e.words[i];if(r!=f){r<f?t=-1:f<r&&(t=1);break}}return t},m.prototype.gtn=function(e){return 1===this.cmpn(e)},m.prototype.gt=function(e){return 1===this.cmp(e)},m.prototype.gten=function(e){return 0<=this.cmpn(e)},m.prototype.gte=function(e){return 0<=this.cmp(e)},m.prototype.ltn=function(e){return-1===this.cmpn(e)},m.prototype.lt=function(e){return-1===this.cmp(e)},m.prototype.lten=function(e){return this.cmpn(e)<=0},m.prototype.lte=function(e){return this.cmp(e)<=0},m.prototype.eqn=function(e){return 0===this.cmpn(e)},m.prototype.eq=function(e){return 0===this.cmp(e)},m.red=function(e){return new w(e)},m.prototype.toRed=function(e){return p(!this.red,"Already a number in reduction context"),p(0===this.negative,"red works only with positives"),e.convertTo(this)._forceRed(e)},m.prototype.fromRed=function(){return p(this.red,"fromRed works only with numbers in reduction context"),this.red.convertFrom(this)},m.prototype._forceRed=function(e){return this.red=e,this},m.prototype.forceRed=function(e){return p(!this.red,"Already a number in reduction context"),this._forceRed(e)},m.prototype.redAdd=function(e){return p(this.red,"redAdd works only with red numbers"),this.red.add(this,e)},m.prototype.redIAdd=function(e){return p(this.red,"redIAdd works only with red numbers"),this.red.iadd(this,e)},m.prototype.redSub=function(e){return p(this.red,"redSub works only with red numbers"),this.red.sub(this,e)},m.prototype.redISub=function(e){return p(this.red,"redISub works only with red numbers"),this.red.isub(this,e)},m.prototype.redShl=function(e){return p(this.red,"redShl works only with red numbers"),this.red.shl(this,e)},m.prototype.redMul=function(e){return p(this.red,"redMul works only with red numbers"),this.red._verify2(this,e),this.red.mul(this,e)},m.prototype.redIMul=function(e){return p(this.red,"redMul works only with red numbers"),this.red._verify2(this,e),this.red.imul(this,e)},m.prototype.redSqr=function(){return p(this.red,"redSqr works only with red numbers"),this.red._verify1(this),this.red.sqr(this)},m.prototype.redISqr=function(){return p(this.red,"redISqr works only with red numbers"),this.red._verify1(this),this.red.isqr(this)},m.prototype.redSqrt=function(){return p(this.red,"redSqrt works only with red numbers"),this.red._verify1(this),this.red.sqrt(this)},m.prototype.redInvm=function(){return p(this.red,"redInvm works only with red numbers"),this.red._verify1(this),this.red.invm(this)},m.prototype.redNeg=function(){return p(this.red,"redNeg works only with red numbers"),this.red._verify1(this),this.red.neg(this)},m.prototype.redPow=function(e){return p(this.red&&!e.red,"redPow(normalNum)"),this.red._verify1(this),this.red.pow(this,e)};var c={k256:null,p224:null,p192:null,p25519:null};function h(e,t){this.name=e,this.p=new m(t,16),this.n=this.p.bitLength(),this.k=new m(1).iushln(this.n).isub(this.p),this.tmp=this._tmp()}function v(){h.call(this,"k256","ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff fffffffe fffffc2f")}function g(){h.call(this,"p224","ffffffff ffffffff ffffffff ffffffff 00000000 00000000 00000001")}function y(){h.call(this,"p192","ffffffff ffffffff ffffffff fffffffe ffffffff ffffffff")}function M(){h.call(this,"25519","7fffffffffffffff ffffffffffffffff ffffffffffffffff ffffffffffffffed")}function w(e){var t;"string"==typeof e?(t=m._prime(e),this.m=t.p,this.prime=t):(p(e.gtn(1),"modulus must be greater than 1"),this.m=e,this.prime=null)}function S(e){w.call(this,e),this.shift=this.m.bitLength(),this.shift%26!=0&&(this.shift+=26-this.shift%26),this.r=new m(1).iushln(this.shift),this.r2=this.imod(this.r.sqr()),this.rinv=this.r._invmp(this.m),this.minv=this.rinv.mul(this.r).isubn(1).div(this.m),this.minv=this.minv.umod(this.r),this.minv=this.r.sub(this.minv)}h.prototype._tmp=function(){var e=new m(null);return e.words=new Array(Math.ceil(this.n/13)),e},h.prototype.ireduce=function(e){for(var t,i=e;this.split(i,this.tmp),t=(i=(i=this.imulK(i)).iadd(this.tmp)).bitLength(),t>this.n;);e=t<this.n?-1:i.ucmp(this.p);return 0===e?(i.words[0]=0,i.length=1):0<e?i.isub(this.p):void 0!==i.strip?i.strip():i._strip(),i},h.prototype.split=function(e,t){e.iushrn(this.n,0,t)},h.prototype.imulK=function(e){return e.imul(this.k)},i(v,h),v.prototype.split=function(e,t){for(var i=Math.min(e.length,9),r=0;r<i;r++)t.words[r]=e.words[r];if(t.length=i,e.length<=9)return e.words[0]=0,void(e.length=1);var f=e.words[9];for(t.words[t.length++]=4194303&f,r=10;r<e.length;r++){var d=0|e.words[r];e.words[r-10]=(4194303&d)<<4|f>>>22,f=d}f>>>=22,0===(e.words[r-10]=f)&&10<e.length?e.length-=10:e.length-=9},v.prototype.imulK=function(e){e.words[e.length]=0,e.words[e.length+1]=0,e.length+=2;for(var t=0,i=0;i<e.length;i++){var r=0|e.words[i];t+=977*r,e.words[i]=67108863&t,t=64*r+(t/67108864|0)}return 0===e.words[e.length-1]&&(e.length--,0===e.words[e.length-1]&&e.length--),e},i(g,h),i(y,h),i(M,h),M.prototype.imulK=function(e){for(var t=0,i=0;i<e.length;i++){var r=19*(0|e.words[i])+t,f=67108863&r;r>>>=26,e.words[i]=f,t=r}return 0!==t&&(e.words[e.length++]=t),e},m._prime=function(e){if(c[e])return c[e];var t;if("k256"===e)t=new v;else if("p224"===e)t=new g;else if("p192"===e)t=new y;else{if("p25519"!==e)throw new Error("Unknown prime "+e);t=new M}return c[e]=t},w.prototype._verify1=function(e){p(0===e.negative,"red works only with positives"),p(e.red,"red works only with red numbers")},w.prototype._verify2=function(e,t){p(0==(e.negative|t.negative),"red works only with positives"),p(e.red&&e.red===t.red,"red works only with red numbers")},w.prototype.imod=function(e){return(this.prime?this.prime.ireduce(e):e.umod(this.m))._forceRed(this)},w.prototype.neg=function(e){return e.isZero()?e.clone():this.m.sub(e)._forceRed(this)},w.prototype.add=function(e,t){this._verify2(e,t);t=e.add(t);return 0<=t.cmp(this.m)&&t.isub(this.m),t._forceRed(this)},w.prototype.iadd=function(e,t){this._verify2(e,t);t=e.iadd(t);return 0<=t.cmp(this.m)&&t.isub(this.m),t},w.prototype.sub=function(e,t){this._verify2(e,t);t=e.sub(t);return t.cmpn(0)<0&&t.iadd(this.m),t._forceRed(this)},w.prototype.isub=function(e,t){this._verify2(e,t);t=e.isub(t);return t.cmpn(0)<0&&t.iadd(this.m),t},w.prototype.shl=function(e,t){return this._verify1(e),this.imod(e.ushln(t))},w.prototype.imul=function(e,t){return this._verify2(e,t),this.imod(e.imul(t))},w.prototype.mul=function(e,t){return this._verify2(e,t),this.imod(e.mul(t))},w.prototype.isqr=function(e){return this.imul(e,e.clone())},w.prototype.sqr=function(e){return this.mul(e,e)},w.prototype.sqrt=function(e){if(e.isZero())return e.clone();var t=this.m.andln(3);if(p(t%2==1),3===t){t=this.m.add(new m(1)).iushrn(2);return this.pow(e,t)}for(var i=this.m.subn(1),r=0;!i.isZero()&&0===i.andln(1);)r++,i.iushrn(1);p(!i.isZero());for(var f=new m(1).toRed(this),d=f.redNeg(),n=this.m.subn(1).iushrn(1),a=new m(2*(a=this.m.bitLength())*a).toRed(this);0!==this.pow(a,n).cmp(d);)a.redIAdd(d);for(var s=this.pow(a,i),c=this.pow(e,i.addn(1).iushrn(1)),h=this.pow(e,i),o=r;0!==h.cmp(f);){for(var u=h,b=0;0!==u.cmp(f);b++)u=u.redSqr();p(b<o);var l=this.pow(s,new m(1).iushln(o-b-1)),c=c.redMul(l),s=l.redSqr(),h=h.redMul(s),o=b}return c},w.prototype.invm=function(e){e=e._invmp(this.m);return 0!==e.negative?(e.negative=0,this.imod(e).redNeg()):this.imod(e)},w.prototype.pow=function(e,t){if(t.isZero())return new m(1).toRed(this);if(0===t.cmpn(1))return e.clone();var i=new Array(16);i[0]=new m(1).toRed(this),i[1]=e;for(var r=2;r<i.length;r++)i[r]=this.mul(i[r-1],e);var f=i[0],d=0,n=0,a=t.bitLength()%26;for(0===a&&(a=26),r=t.length-1;0<=r;r--){for(var s=t.words[r],c=a-1;0<=c;c--){var h=s>>c&1;f!==i[0]&&(f=this.sqr(f)),0!=h||0!==d?(d<<=1,d|=h,(4===++n||0===r&&0===c)&&(f=this.mul(f,i[d]),d=n=0)):n=0}a=26}return f},w.prototype.convertTo=function(e){var t=e.umod(this.m);return t===e?t.clone():t},w.prototype.convertFrom=function(e){e=e.clone();return e.red=null,e},m.mont=function(e){return new S(e)},i(S,w),S.prototype.convertTo=function(e){return this.imod(e.ushln(this.shift))},S.prototype.convertFrom=function(e){e=this.imod(e.mul(this.rinv));return e.red=null,e},S.prototype.imul=function(e,t){if(e.isZero()||t.isZero())return e.words[0]=0,e.length=1,e;e=e.imul(t),t=e.maskn(this.shift).mul(this.minv).imaskn(this.shift).mul(this.m),e=e.isub(t).iushrn(this.shift),t=e;return 0<=e.cmp(this.m)?t=e.isub(this.m):e.cmpn(0)<0&&(t=e.iadd(this.m)),t._forceRed(this)},S.prototype.mul=function(e,t){if(e.isZero()||t.isZero())return new m(0)._forceRed(this);e=e.mul(t),t=e.maskn(this.shift).mul(this.minv).imaskn(this.shift).mul(this.m),e=e.isub(t).iushrn(this.shift),t=e;return 0<=e.cmp(this.m)?t=e.isub(this.m):e.cmpn(0)<0&&(t=e.iadd(this.m)),t._forceRed(this)},S.prototype.invm=function(e){return this.imod(e._invmp(this.m).mul(this.r2))._forceRed(this)}}(void 0===e||e,this)},{buffer:18}],17:[function(e,t,i){var r;function f(e){this.rand=e}if(t.exports=function(e){return(r=r||new f(null)).generate(e)},(t.exports.Rand=f).prototype.generate=function(e){return this._rand(e)},f.prototype._rand=function(e){if(this.rand.getBytes)return this.rand.getBytes(e);for(var t=new Uint8Array(e),i=0;i<t.length;i++)t[i]=this.rand.getByte();return t},"object"==typeof self)self.crypto&&self.crypto.getRandomValues?f.prototype._rand=function(e){e=new Uint8Array(e);return self.crypto.getRandomValues(e),e}:self.msCrypto&&self.msCrypto.getRandomValues?f.prototype._rand=function(e){e=new Uint8Array(e);return self.msCrypto.getRandomValues(e),e}:"object"==typeof window&&(f.prototype._rand=function(){throw new Error("Not implemented yet")});else try{var d=e("crypto");if("function"!=typeof d.randomBytes)throw new Error("Not supported");f.prototype._rand=function(e){return d.randomBytes(e)}}catch(e){}},{crypto:18}],18:[function(e,t,i){},{}],19:[function(e,t,i){i.utils=e("./hash/utils"),i.common=e("./hash/common"),i.sha=e("./hash/sha"),i.ripemd=e("./hash/ripemd"),i.hmac=e("./hash/hmac"),i.sha1=i.sha.sha1,i.sha256=i.sha.sha256,i.sha224=i.sha.sha224,i.sha384=i.sha.sha384,i.sha512=i.sha.sha512,i.ripemd160=i.ripemd.ripemd160},{"./hash/common":20,"./hash/hmac":21,"./hash/ripemd":22,"./hash/sha":23,"./hash/utils":30}],20:[function(e,t,i){"use strict";var r=e("./utils"),f=e("minimalistic-assert");function d(){this.pending=null,this.pendingTotal=0,this.blockSize=this.constructor.blockSize,this.outSize=this.constructor.outSize,this.hmacStrength=this.constructor.hmacStrength,this.padLength=this.constructor.padLength/8,this.endian="big",this._delta8=this.blockSize/8,this._delta32=this.blockSize/32}(i.BlockHash=d).prototype.update=function(e,t){if(e=r.toArray(e,t),this.pending?this.pending=this.pending.concat(e):this.pending=e,this.pendingTotal+=e.length,this.pending.length>=this._delta8){t=(e=this.pending).length%this._delta8;this.pending=e.slice(e.length-t,e.length),0===this.pending.length&&(this.pending=null),e=r.join32(e,0,e.length-t,this.endian);for(var i=0;i<e.length;i+=this._delta32)this._update(e,i,i+this._delta32)}return this},d.prototype.digest=function(e){return this.update(this._pad()),f(null===this.pending),this._digest(e)},d.prototype._pad=function(){var e=this.pendingTotal,t=this._delta8,i=t-(e+this.padLength)%t,r=new Array(i+this.padLength);r[0]=128;for(var f=1;f<i;f++)r[f]=0;if(e<<=3,"big"===this.endian){for(var d=8;d<this.padLength;d++)r[f++]=0;r[f++]=0,r[f++]=0,r[f++]=0,r[f++]=0,r[f++]=e>>>24&255,r[f++]=e>>>16&255,r[f++]=e>>>8&255,r[f++]=255&e}else for(r[f++]=255&e,r[f++]=e>>>8&255,r[f++]=e>>>16&255,r[f++]=e>>>24&255,r[f++]=0,r[f++]=0,r[f++]=0,r[f++]=0,d=8;d<this.padLength;d++)r[f++]=0;return r}},{"./utils":30,"minimalistic-assert":33}],21:[function(e,t,i){"use strict";var r=e("./utils"),f=e("minimalistic-assert");function d(e,t,i){if(!(this instanceof d))return new d(e,t,i);this.Hash=e,this.blockSize=e.blockSize/8,this.outSize=e.outSize/8,this.inner=null,this.outer=null,this._init(r.toArray(t,i))}(t.exports=d).prototype._init=function(e){e.length>this.blockSize&&(e=(new this.Hash).update(e).digest()),f(e.length<=this.blockSize);for(var t=e.length;t<this.blockSize;t++)e.push(0);for(t=0;t<e.length;t++)e[t]^=54;for(this.inner=(new this.Hash).update(e),t=0;t<e.length;t++)e[t]^=106;this.outer=(new this.Hash).update(e)},d.prototype.update=function(e,t){return this.inner.update(e,t),this},d.prototype.digest=function(e){return this.outer.update(this.inner.digest()),this.outer.digest(e)}},{"./utils":30,"minimalistic-assert":33}],22:[function(e,t,i){"use strict";var r=e("./utils"),e=e("./common"),p=r.rotl32,m=r.sum32,v=r.sum32_3,g=r.sum32_4,f=e.BlockHash;function d(){if(!(this instanceof d))return new d;f.call(this),this.h=[1732584193,4023233417,2562383102,271733878,3285377520],this.endian="little"}function y(e,t,i,r){return e<=15?t^i^r:e<=31?t&i|~t&r:e<=47?(t|~i)^r:e<=63?t&r|i&~r:t^(i|~r)}r.inherits(d,f),(i.ripemd160=d).blockSize=512,d.outSize=160,d.hmacStrength=192,d.padLength=64,d.prototype._update=function(e,t){for(var i,r=h=this.h[0],f=l=this.h[1],d=b=this.h[2],n=u=this.h[3],a=o=this.h[4],s=0;s<80;s++)var c=m(p(g(h,y(s,l,b,u),e[M[s]+t],(i=s)<=15?0:i<=31?1518500249:i<=47?1859775393:i<=63?2400959708:2840853838),S[s]),o),h=o,o=u,u=p(b,10),b=l,l=c,c=m(p(g(r,y(79-s,f,d,n),e[w[s]+t],(i=s)<=15?1352829926:i<=31?1548603684:i<=47?1836072691:i<=63?2053994217:0),_[s]),a),r=a,a=n,n=p(d,10),d=f,f=c;c=v(this.h[1],b,n),this.h[1]=v(this.h[2],u,a),this.h[2]=v(this.h[3],o,r),this.h[3]=v(this.h[4],h,f),this.h[4]=v(this.h[0],l,d),this.h[0]=c},d.prototype._digest=function(e){return"hex"===e?r.toHex32(this.h,"little"):r.split32(this.h,"little")};var M=[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,7,4,13,1,10,6,15,3,12,0,9,5,2,14,11,8,3,10,14,4,9,15,8,1,2,7,0,6,13,11,5,12,1,9,11,10,0,8,12,4,13,3,7,15,14,5,6,2,4,0,5,9,7,12,2,10,14,1,3,8,11,6,15,13],w=[5,14,7,0,9,2,11,4,13,6,15,8,1,10,3,12,6,11,3,7,0,13,5,10,14,15,8,12,4,9,1,2,15,5,1,3,7,14,6,9,11,8,12,2,10,0,4,13,8,6,4,1,3,11,15,0,5,12,2,13,9,7,10,14,12,15,10,4,1,5,8,7,6,2,13,14,0,3,9,11],S=[11,14,15,12,5,8,7,9,11,13,14,15,6,7,9,8,7,6,8,13,11,9,7,15,7,12,15,9,11,7,13,12,11,13,6,7,14,9,13,15,14,8,13,6,5,12,7,5,11,12,14,15,14,15,9,8,9,14,5,6,8,6,5,12,9,15,5,11,6,8,13,12,5,12,13,14,11,8,5,6],_=[8,9,9,11,13,15,15,5,7,7,8,11,14,14,12,6,9,13,15,7,12,8,9,11,7,7,12,7,6,15,13,11,9,7,15,11,8,6,6,14,12,13,5,14,13,13,7,5,15,5,8,11,14,14,6,14,6,9,12,9,12,5,15,8,8,5,12,9,12,5,14,6,8,13,6,5,15,13,11,11]},{"./common":20,"./utils":30}],23:[function(e,t,i){"use strict";i.sha1=e("./sha/1"),i.sha224=e("./sha/224"),i.sha256=e("./sha/256"),i.sha384=e("./sha/384"),i.sha512=e("./sha/512")},{"./sha/1":24,"./sha/224":25,"./sha/256":26,"./sha/384":27,"./sha/512":28}],24:[function(e,t,i){"use strict";var r=e("../utils"),f=e("../common"),e=e("./common"),h=r.rotl32,o=r.sum32,u=r.sum32_5,b=e.ft_1,d=f.BlockHash,l=[1518500249,1859775393,2400959708,3395469782];function n(){if(!(this instanceof n))return new n;d.call(this),this.h=[1732584193,4023233417,2562383102,271733878,3285377520],this.W=new Array(80)}r.inherits(n,d),(t.exports=n).blockSize=512,n.outSize=160,n.hmacStrength=80,n.padLength=64,n.prototype._update=function(e,t){for(var i=this.W,r=0;r<16;r++)i[r]=e[t+r];for(;r<i.length;r++)i[r]=h(i[r-3]^i[r-8]^i[r-14]^i[r-16],1);for(var f=this.h[0],d=this.h[1],n=this.h[2],a=this.h[3],s=this.h[4],r=0;r<i.length;r++)var c=~~(r/20),c=u(h(f,5),b(c,d,n,a),s,i[r],l[c]),s=a,a=n,n=h(d,30),d=f,f=c;this.h[0]=o(this.h[0],f),this.h[1]=o(this.h[1],d),this.h[2]=o(this.h[2],n),this.h[3]=o(this.h[3],a),this.h[4]=o(this.h[4],s)},n.prototype._digest=function(e){return"hex"===e?r.toHex32(this.h,"big"):r.split32(this.h,"big")}},{"../common":20,"../utils":30,"./common":29}],25:[function(e,t,i){"use strict";var r=e("../utils"),f=e("./256");function d(){if(!(this instanceof d))return new d;f.call(this),this.h=[3238371032,914150663,812702999,4144912697,4290775857,1750603025,1694076839,3204075428]}r.inherits(d,f),(t.exports=d).blockSize=512,d.outSize=224,d.hmacStrength=192,d.padLength=64,d.prototype._digest=function(e){return"hex"===e?r.toHex32(this.h.slice(0,7),"big"):r.split32(this.h.slice(0,7),"big")}},{"../utils":30,"./256":26}],26:[function(e,t,i){"use strict";var r=e("../utils"),f=e("../common"),d=e("./common"),l=e("minimalistic-assert"),p=r.sum32,m=r.sum32_4,v=r.sum32_5,g=d.ch32,y=d.maj32,M=d.s0_256,w=d.s1_256,S=d.g0_256,_=d.g1_256,n=f.BlockHash,a=[1116352408,1899447441,3049323471,3921009573,961987163,1508970993,2453635748,2870763221,3624381080,310598401,607225278,1426881987,1925078388,2162078206,2614888103,3248222580,3835390401,4022224774,264347078,604807628,770255983,1249150122,1555081692,1996064986,2554220882,2821834349,2952996808,3210313671,3336571891,3584528711,113926993,338241895,666307205,773529912,1294757372,1396182291,1695183700,1986661051,2177026350,2456956037,2730485921,2820302411,3259730800,3345764771,3516065817,3600352804,4094571909,275423344,430227734,506948616,659060556,883997877,958139571,1322822218,1537002063,1747873779,1955562222,2024104815,2227730452,2361852424,2428436474,2756734187,3204031479,3329325298];function s(){if(!(this instanceof s))return new s;n.call(this),this.h=[1779033703,3144134277,1013904242,2773480762,1359893119,2600822924,528734635,1541459225],this.k=a,this.W=new Array(64)}r.inherits(s,n),(t.exports=s).blockSize=512,s.outSize=256,s.hmacStrength=192,s.padLength=64,s.prototype._update=function(e,t){for(var i=this.W,r=0;r<16;r++)i[r]=e[t+r];for(;r<i.length;r++)i[r]=m(_(i[r-2]),i[r-7],S(i[r-15]),i[r-16]);var f=this.h[0],d=this.h[1],n=this.h[2],a=this.h[3],s=this.h[4],c=this.h[5],h=this.h[6],o=this.h[7];for(l(this.k.length===i.length),r=0;r<i.length;r++)var u=v(o,w(s),g(s,c,h),this.k[r],i[r]),b=p(M(f),y(f,d,n)),o=h,h=c,c=s,s=p(a,u),a=n,n=d,d=f,f=p(u,b);this.h[0]=p(this.h[0],f),this.h[1]=p(this.h[1],d),this.h[2]=p(this.h[2],n),this.h[3]=p(this.h[3],a),this.h[4]=p(this.h[4],s),this.h[5]=p(this.h[5],c),this.h[6]=p(this.h[6],h),this.h[7]=p(this.h[7],o)},s.prototype._digest=function(e){return"hex"===e?r.toHex32(this.h,"big"):r.split32(this.h,"big")}},{"../common":20,"../utils":30,"./common":29,"minimalistic-assert":33}],27:[function(e,t,i){"use strict";var r=e("../utils"),f=e("./512");function d(){if(!(this instanceof d))return new d;f.call(this),this.h=[3418070365,3238371032,1654270250,914150663,2438529370,812702999,355462360,4144912697,1731405415,4290775857,2394180231,1750603025,3675008525,1694076839,1203062813,3204075428]}r.inherits(d,f),(t.exports=d).blockSize=1024,d.outSize=384,d.hmacStrength=192,d.padLength=128,d.prototype._digest=function(e){return"hex"===e?r.toHex32(this.h.slice(0,12),"big"):r.split32(this.h.slice(0,12),"big")}},{"../utils":30,"./512":28}],28:[function(e,t,i){"use strict";var r=e("../utils"),f=e("../common"),P=e("minimalistic-assert"),j=r.rotr64_hi,N=r.rotr64_lo,u=r.shr64_hi,b=r.shr64_lo,E=r.sum64,B=r.sum64_hi,L=r.sum64_lo,l=r.sum64_4_hi,p=r.sum64_4_lo,O=r.sum64_5_hi,F=r.sum64_5_lo,d=f.BlockHash,n=[1116352408,3609767458,1899447441,602891725,3049323471,3964484399,3921009573,2173295548,961987163,4081628472,1508970993,3053834265,2453635748,2937671579,2870763221,3664609560,3624381080,2734883394,310598401,1164996542,607225278,1323610764,1426881987,3590304994,1925078388,4068182383,2162078206,991336113,2614888103,633803317,3248222580,3479774868,3835390401,2666613458,4022224774,944711139,264347078,2341262773,604807628,2007800933,770255983,1495990901,1249150122,1856431235,1555081692,3175218132,1996064986,2198950837,2554220882,3999719339,2821834349,766784016,2952996808,2566594879,3210313671,3203337956,3336571891,1034457026,3584528711,2466948901,113926993,3758326383,338241895,168717936,666307205,1188179964,773529912,1546045734,1294757372,1522805485,1396182291,2643833823,1695183700,2343527390,1986661051,1014477480,2177026350,1206759142,2456956037,344077627,2730485921,1290863460,2820302411,3158454273,3259730800,3505952657,3345764771,106217008,3516065817,3606008344,3600352804,1432725776,4094571909,1467031594,275423344,851169720,430227734,3100823752,506948616,1363258195,659060556,3750685593,883997877,3785050280,958139571,3318307427,1322822218,3812723403,1537002063,2003034995,1747873779,3602036899,1955562222,1575990012,2024104815,1125592928,2227730452,2716904306,2361852424,442776044,2428436474,593698344,2756734187,3733110249,3204031479,2999351573,3329325298,3815920427,3391569614,3928383900,3515267271,566280711,3940187606,3454069534,4118630271,4000239992,116418474,1914138554,174292421,2731055270,289380356,3203993006,460393269,320620315,685471733,587496836,852142971,1086792851,1017036298,365543100,1126000580,2618297676,1288033470,3409855158,1501505948,4234509866,1607167915,987167468,1816402316,1246189591];function a(){if(!(this instanceof a))return new a;d.call(this),this.h=[1779033703,4089235720,3144134277,2227873595,1013904242,4271175723,2773480762,1595750129,1359893119,2917565137,2600822924,725511199,528734635,4215389547,1541459225,327033209],this.k=n,this.W=new Array(160)}r.inherits(a,d),(t.exports=a).blockSize=1024,a.outSize=512,a.hmacStrength=192,a.padLength=128,a.prototype._prepareBlock=function(e,t){for(var i=this.W,r=0;r<32;r++)i[r]=e[t+r];for(;r<i.length;r+=2){var f=function(e,t){var i=j(e,t,19),r=j(t,e,29),t=u(e,t,6),t=i^r^t;t<0&&(t+=4294967296);return t}(i[r-4],i[r-3]),d=function(e,t){var i=N(e,t,19),r=N(t,e,29),t=b(e,t,6),t=i^r^t;t<0&&(t+=4294967296);return t}(i[r-4],i[r-3]),n=i[r-14],a=i[r-13],s=function(e,t){var i=j(e,t,1),r=j(e,t,8),t=u(e,t,7),t=i^r^t;t<0&&(t+=4294967296);return t}(i[r-30],i[r-29]),c=function(e,t){var i=N(e,t,1),r=N(e,t,8),t=b(e,t,7),t=i^r^t;t<0&&(t+=4294967296);return t}(i[r-30],i[r-29]),h=i[r-32],o=i[r-31];i[r]=l(f,d,n,a,s,c,h,o),i[r+1]=p(f,d,n,a,s,c,h,o)}},a.prototype._update=function(e,t){this._prepareBlock(e,t);var i=this.W,r=this.h[0],f=this.h[1],d=this.h[2],n=this.h[3],a=this.h[4],s=this.h[5],c=this.h[6],h=this.h[7],o=this.h[8],u=this.h[9],b=this.h[10],l=this.h[11],p=this.h[12],m=this.h[13],v=this.h[14],g=this.h[15];P(this.k.length===i.length);for(var y=0;y<i.length;y+=2)var M=v,w=g,S=function(e,t){var i=j(e,t,14),r=j(e,t,18),e=j(t,e,9),e=i^r^e;e<0&&(e+=4294967296);return e}(o,u),_=function(e,t){var i=N(e,t,14),r=N(e,t,18),e=N(t,e,9),e=i^r^e;e<0&&(e+=4294967296);return e}(o,u),A=function(e,t,i){i=e&t^~e&i;i<0&&(i+=4294967296);return i}(o,b,p),x=function(e,t,i){i=e&t^~e&i;i<0&&(i+=4294967296);return i}(u,l,m),I=this.k[y],z=this.k[y+1],q=i[y],R=i[y+1],k=O(M,w,S,_,A,x,I,z,q,R),q=F(M,w,S,_,A,x,I,z,q,R),M=function(e,t){var i=j(e,t,28),r=j(t,e,2),e=j(t,e,7),e=i^r^e;e<0&&(e+=4294967296);return e}(r,f),w=function(e,t){var i=N(e,t,28),r=N(t,e,2),e=N(t,e,7),e=i^r^e;e<0&&(e+=4294967296);return e}(r,f),S=function(e,t,i){i=e&t^e&i^t&i;i<0&&(i+=4294967296);return i}(r,d,a),_=function(e,t,i){i=e&t^e&i^t&i;i<0&&(i+=4294967296);return i}(f,n,s),R=B(M,w,S,_),_=L(M,w,S,_),v=p,g=m,p=b,m=l,b=o,l=u,o=B(c,h,k,q),u=L(h,h,k,q),c=a,h=s,a=d,s=n,d=r,n=f,r=B(k,q,R,_),f=L(k,q,R,_);E(this.h,0,r,f),E(this.h,2,d,n),E(this.h,4,a,s),E(this.h,6,c,h),E(this.h,8,o,u),E(this.h,10,b,l),E(this.h,12,p,m),E(this.h,14,v,g)},a.prototype._digest=function(e){return"hex"===e?r.toHex32(this.h,"big"):r.split32(this.h,"big")}},{"../common":20,"../utils":30,"minimalistic-assert":33}],29:[function(e,t,i){"use strict";var r=e("../utils").rotr32;function f(e,t,i){return e&t^~e&i}function d(e,t,i){return e&t^e&i^t&i}function n(e,t,i){return e^t^i}i.ft_1=function(e,t,i,r){return 0===e?f(t,i,r):1===e||3===e?t^i^r:2===e?d(t,i,r):void 0},i.ch32=f,i.maj32=d,i.p32=n,i.s0_256=function(e){return r(e,2)^r(e,13)^r(e,22)},i.s1_256=function(e){return r(e,6)^r(e,11)^r(e,25)},i.g0_256=function(e){return r(e,7)^r(e,18)^e>>>3},i.g1_256=function(e){return r(e,17)^r(e,19)^e>>>10}},{"../utils":30}],30:[function(e,t,i){"use strict";var s=e("minimalistic-assert"),e=e("inherits");function d(e){return(e>>>24|e>>>8&65280|e<<8&16711680|(255&e)<<24)>>>0}function r(e){return 1===e.length?"0"+e:e}function n(e){return 7===e.length?"0"+e:6===e.length?"00"+e:5===e.length?"000"+e:4===e.length?"0000"+e:3===e.length?"00000"+e:2===e.length?"000000"+e:1===e.length?"0000000"+e:e}i.inherits=e,i.toArray=function(e,t){if(Array.isArray(e))return e.slice();if(!e)return[];var i,r,f=[];if("string"==typeof e)if(t){if("hex"===t)for((e=e.replace(/[^a-z0-9]+/gi,"")).length%2!=0&&(e="0"+e),n=0;n<e.length;n+=2)f.push(parseInt(e[n]+e[n+1],16))}else for(var d=0,n=0;n<e.length;n++){var a=e.charCodeAt(n);a<128?f[d++]=a:a<2048?(f[d++]=a>>6|192,f[d++]=63&a|128):(r=n,55296!=(64512&(i=e).charCodeAt(r))||r<0||r+1>=i.length||56320!=(64512&i.charCodeAt(r+1))?f[d++]=a>>12|224:(a=65536+((1023&a)<<10)+(1023&e.charCodeAt(++n)),f[d++]=a>>18|240,f[d++]=a>>12&63|128),f[d++]=a>>6&63|128,f[d++]=63&a|128)}else for(n=0;n<e.length;n++)f[n]=0|e[n];return f},i.toHex=function(e){for(var t="",i=0;i<e.length;i++)t+=r(e[i].toString(16));return t},i.htonl=d,i.toHex32=function(e,t){for(var i="",r=0;r<e.length;r++){var f=e[r];i+=n((f="little"===t?d(f):f).toString(16))}return i},i.zero2=r,i.zero8=n,i.join32=function(e,t,i,r){s((i-=t)%4==0);for(var f=new Array(i/4),d=0,n=t;d<f.length;d++,n+=4){var a="big"===r?e[n]<<24|e[n+1]<<16|e[n+2]<<8|e[n+3]:e[n+3]<<24|e[n+2]<<16|e[n+1]<<8|e[n];f[d]=a>>>0}return f},i.split32=function(e,t){for(var i=new Array(4*e.length),r=0,f=0;r<e.length;r++,f+=4){var d=e[r];"big"===t?(i[f]=d>>>24,i[f+1]=d>>>16&255,i[f+2]=d>>>8&255,i[f+3]=255&d):(i[f+3]=d>>>24,i[f+2]=d>>>16&255,i[f+1]=d>>>8&255,i[f]=255&d)}return i},i.rotr32=function(e,t){return e>>>t|e<<32-t},i.rotl32=function(e,t){return e<<t|e>>>32-t},i.sum32=function(e,t){return e+t>>>0},i.sum32_3=function(e,t,i){return e+t+i>>>0},i.sum32_4=function(e,t,i,r){return e+t+i+r>>>0},i.sum32_5=function(e,t,i,r,f){return e+t+i+r+f>>>0},i.sum64=function(e,t,i,r){var f=e[t],d=r+e[t+1]>>>0,f=(d<r?1:0)+i+f;e[t]=f>>>0,e[t+1]=d},i.sum64_hi=function(e,t,i,r){return(t+r>>>0<t?1:0)+e+i>>>0},i.sum64_lo=function(e,t,i,r){return t+r>>>0},i.sum64_4_hi=function(e,t,i,r,f,d,n,a){var s=0,c=t;return s+=(c=c+r>>>0)<t?1:0,s+=(c=c+d>>>0)<d?1:0,e+i+f+n+(s+=(c=c+a>>>0)<a?1:0)>>>0},i.sum64_4_lo=function(e,t,i,r,f,d,n,a){return t+r+d+a>>>0},i.sum64_5_hi=function(e,t,i,r,f,d,n,a,s,c){var h=0,o=t;return h+=(o=o+r>>>0)<t?1:0,h+=(o=o+d>>>0)<d?1:0,h+=(o=o+a>>>0)<a?1:0,e+i+f+n+s+(h+=(o=o+c>>>0)<c?1:0)>>>0},i.sum64_5_lo=function(e,t,i,r,f,d,n,a,s,c){return t+r+d+a+c>>>0},i.rotr64_hi=function(e,t,i){return(t<<32-i|e>>>i)>>>0},i.rotr64_lo=function(e,t,i){return(e<<32-i|t>>>i)>>>0},i.shr64_hi=function(e,t,i){return e>>>i},i.shr64_lo=function(e,t,i){return(e<<32-i|t>>>i)>>>0}},{inherits:32,"minimalistic-assert":33}],31:[function(e,t,i){"use strict";var r=e("hash.js"),d=e("minimalistic-crypto-utils"),f=e("minimalistic-assert");function n(e){if(!(this instanceof n))return new n(e);this.hash=e.hash,this.predResist=!!e.predResist,this.outLen=this.hash.outSize,this.minEntropy=e.minEntropy||this.hash.hmacStrength,this._reseed=null,this.reseedInterval=null,this.K=null,this.V=null;var t=d.toArray(e.entropy,e.entropyEnc||"hex"),i=d.toArray(e.nonce,e.nonceEnc||"hex"),e=d.toArray(e.pers,e.persEnc||"hex");f(t.length>=this.minEntropy/8,"Not enough entropy. Minimum is: "+this.minEntropy+" bits"),this._init(t,i,e)}(t.exports=n).prototype._init=function(e,t,i){i=e.concat(t).concat(i);this.K=new Array(this.outLen/8),this.V=new Array(this.outLen/8);for(var r=0;r<this.V.length;r++)this.K[r]=0,this.V[r]=1;this._update(i),this._reseed=1,this.reseedInterval=281474976710656},n.prototype._hmac=function(){return new r.hmac(this.hash,this.K)},n.prototype._update=function(e){var t=this._hmac().update(this.V).update([0]);e&&(t=t.update(e)),this.K=t.digest(),this.V=this._hmac().update(this.V).digest(),e&&(this.K=this._hmac().update(this.V).update([1]).update(e).digest(),this.V=this._hmac().update(this.V).digest())},n.prototype.reseed=function(e,t,i,r){"string"!=typeof t&&(r=i,i=t,t=null),e=d.toArray(e,t),i=d.toArray(i,r),f(e.length>=this.minEntropy/8,"Not enough entropy. Minimum is: "+this.minEntropy+" bits"),this._update(e.concat(i||[])),this._reseed=1},n.prototype.generate=function(e,t,i,r){if(this._reseed>this.reseedInterval)throw new Error("Reseed is required");"string"!=typeof t&&(r=i,i=t,t=null),i&&(i=d.toArray(i,r||"hex"),this._update(i));for(var f=[];f.length<e;)this.V=this._hmac().update(this.V).digest(),f=f.concat(this.V);r=f.slice(0,e);return this._update(i),this._reseed++,d.encode(r,t)}},{"hash.js":19,"minimalistic-assert":33,"minimalistic-crypto-utils":34}],32:[function(e,t,i){"function"==typeof Object.create?t.exports=function(e,t){t&&(e.super_=t,e.prototype=Object.create(t.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}}))}:t.exports=function(e,t){var i;t&&(e.super_=t,(i=function(){}).prototype=t.prototype,e.prototype=new i,e.prototype.constructor=e)}},{}],33:[function(e,t,i){function r(e,t){if(!e)throw new Error(t||"Assertion failed")}(t.exports=r).equal=function(e,t,i){if(e!=t)throw new Error(i||"Assertion failed: "+e+" != "+t)}},{}],34:[function(e,t,i){"use strict";function r(e){return 1===e.length?"0"+e:e}function f(e){for(var t="",i=0;i<e.length;i++)t+=r(e[i].toString(16));return t}i.toArray=function(e,t){if(Array.isArray(e))return e.slice();if(!e)return[];var i=[];if("string"!=typeof e){for(var r=0;r<e.length;r++)i[r]=0|e[r];return i}if("hex"===t){(e=e.replace(/[^a-z0-9]+/gi,"")).length%2!=0&&(e="0"+e);for(r=0;r<e.length;r+=2)i.push(parseInt(e[r]+e[r+1],16))}else for(r=0;r<e.length;r++){var f=e.charCodeAt(r),d=f>>8,f=255&f;d?i.push(d,f):i.push(f)}return i},i.zero2=r,i.toHex=f,i.encode=function(e,t){return"hex"===t?f(e):e}},{}],35:[function(e,t,i){t.exports={name:"elliptic",version:"6.5.4",description:"EC cryptography",main:"lib/elliptic.js",files:["lib"],scripts:{lint:"eslint lib test","lint:fix":"npm run lint -- --fix",unit:"istanbul test _mocha --reporter=spec test/index.js",test:"npm run lint && npm run unit",version:"grunt dist && git add dist/"},repository:{type:"git",url:"git@github.com:indutny/elliptic"},keywords:["EC","Elliptic","curve","Cryptography"],author:"Fedor Indutny <fedor@indutny.com>",license:"MIT",bugs:{url:"https://github.com/indutny/elliptic/issues"},homepage:"https://github.com/indutny/elliptic",devDependencies:{brfs:"^2.0.2",coveralls:"^3.1.0",eslint:"^7.6.0",grunt:"^1.2.1","grunt-browserify":"^5.3.0","grunt-cli":"^1.3.2","grunt-contrib-connect":"^3.0.0","grunt-contrib-copy":"^1.0.0","grunt-contrib-uglify":"^5.0.0","grunt-mocha-istanbul":"^5.0.2","grunt-saucelabs":"^9.0.1",istanbul:"^0.4.5",mocha:"^8.0.1"},dependencies:{"bn.js":"^4.11.9",brorand:"^1.1.0","hash.js":"^1.0.0","hmac-drbg":"^1.0.1",inherits:"^2.0.4","minimalistic-assert":"^1.0.1","minimalistic-crypto-utils":"^1.0.1"}}},{}]},{},[1])(1)});

const injectLib = (url) => {
    let lib = document.createElement("script")
    lib.type = "text/javascript"
    lib.src = url
    document.head.appendChild(lib)
}

injectLib("https://cdnjs.cloudflare.com/ajax/libs/jszip/3.6.0/jszip.min.js")
injectLib("https://cdn.jsdelivr.net/npm/mersennetwister@0.2.3/src/MersenneTwister.min.js")

const STORAGE_KEY = "hiddenThread"

let getStorage = () => {
    let storage = localStorage.getItem(STORAGE_KEY) || "{}"
    return JSON.parse(storage)
}
let storage = getStorage()
let setStorage = (value) => {
    let newStorage = {
        ...getStorage(),
        ...value
    }
    storage = newStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newStorage))
}

///////////////////////////////////////////////////////////////////////////////
// Misc

function arrayToBase64( arr ) {
    let binary = '';
    let len = arr.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode( arr[ i ] );
    }
    return window.btoa( binary );
}

function arrayToBase64url(byteArray) {
    return btoa(Array.from(new Uint8Array(byteArray)).map(val => {
        return String.fromCharCode(val);
    }).join('')).replace(/\+/g, '-').replace(/\//g, '_').replace(/\=/g, '');
}

function base64urlToArray(b64urlstring) {
    return new Uint8Array(atob(b64urlstring.replace(/-/g, '+').replace(/_/g, '/')).split('').map(val => {
        return val.charCodeAt(0);
    }));
}


/*
https://gist.github.com/diafygi/90a3e80ca1c2793220e5/
*/
var BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
var arrayToBase58 = function(B) {
    var d = [],   //the array for storing the stream of base58 digits
        s = "",   //the result string variable that will be returned
        j,        //the iterator variable for the base58 digit array (d)
        c,        //the carry amount variable that is used to overflow from the current base58 digit to the next base58 digit
        n;        //a temporary placeholder variable for the current base58 digit
    for(var i = 0; i < B.length; i++) { //loop through each byte in the input stream
        j = 0,                           //reset the base58 digit iterator
            c = B[i];                        //set the initial carry amount equal to the current byte amount
        s += c || s.length ^ i ? "" : 1; //prepend the result string with a "1" (0 in base58) if the byte stream is zero and non-zero bytes haven't been seen yet (to ensure correct decode length)
        while(j in d || c) {             //start looping through the digits until there are no more digits and no carry amount
            n = d[j];                    //set the placeholder for the current base58 digit
            n = n ? n * 256 + c : c;     //shift the current base58 one byte and add the carry amount (or just add the carry amount if this is a new digit)
            c = n / 58 | 0;              //find the new carry amount (floored integer of current digit divided by 58)
            d[j] = n % 58;               //reset the current base58 digit to the remainder (the carry amount will pass on the overflow)
            j++                          //iterate to the next base58 digit
        }
    }
    while(j--)        //since the base58 digits are backwards, loop through them in reverse order
        s += BASE58_ALPHABET[d[j]]; //lookup the character associated with each base58 digit
    return s          //return the final base58 string
}
function base58ToArray(S){var d=[],b=[],i,j,c,n;for(i in S){j=0,c=BASE58_ALPHABET.indexOf(S[i]);if(c<0)return undefined;c||b.length^i?i:b.push(0);while(j in d||c){n=d[j];n=n?n*58+c:c;c=n>>8;d[j]=n%256;j++}}while(j--)b.push(d[j]);return new Uint8Array(b)};


/* Randomize array in-place using Durstenfeld shuffle algorithm */
// steps: [1, array.length - 1]
function shuffleArray(array, steps)
{
    let end = array.length - 1 - steps;
    if (end < 0) end = 0;
    let mt = new MersenneTwister(1337);
    for (let i = array.length - 1; i > end; i--) {
        let j = Math.floor(mt.random() * (i + 1));
        let temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
}

function getShuffledIndexList(length, steps)
{
    let arrayIndexList = new Array(length / 4 * 3);
    for (let i = 0, j = 0; i < length; i++)
    {
        // Skip alpha channel
        if ((i + 1) % 4 != 0)
        {
            arrayIndexList[j] = i;
            j++;
        }
    }
    shuffleArray(arrayIndexList, steps);
    return arrayIndexList;
}

///////////////////////////////////////////////////////////////////////////////



///////////////////////////////////////////////////////////////////////////////
// AES

async function getKeyMaterial(password)
{
    let enc = new TextEncoder();
    let key = await window.crypto.subtle.importKey(
        "raw",
        enc.encode(password), {
            name: "PBKDF2"
        },
        false, ["deriveBits", "deriveKey"]
    );
    return key;
}

async function getKey(password, salt)
{
    let keyMaterial = await getKeyMaterial(password);
    let key = await window.crypto.subtle.deriveKey(
        {
            "name": "PBKDF2",
            salt: salt,
            "iterations": 1000,
            "hash": "SHA-256"
        },
        keyMaterial,
        {
            "name": "AES-CBC",
            "length": 256
        },
        true,
        ["encrypt", "decrypt"]
    );
    return key;
}

async function encrypt(password, data)
{
    const iv = window.crypto.getRandomValues(new Uint8Array(IV_SIZE));
    const algorithm = {
        iv,
        name: 'AES-CBC',
    };

    // В качестве соли для пароля используется IV
    let key = await getKey(password, iv);
    const encryptedData = await window.crypto.subtle.encrypt(
        algorithm,
        key,
        data,
    );

    let res = new Uint8Array(iv.length + encryptedData.byteLength);
    res.set(iv);
    res.set(new Uint8Array(encryptedData), iv.length);
    return res;
}

async function decrypt(password, data, onlyFirstBlock)
{
    let iv = data.subarray(0, IV_SIZE);
    const algorithm = {
        iv,
        name: 'AES-CBC',
    };

    let key = await getKey(password, iv);
    let encryptedData = onlyFirstBlock ?
        data.subarray(IV_SIZE, IV_SIZE + BLOCK_SIZE) :
        data.subarray(IV_SIZE);
    const decryptedData = await window.crypto.subtle.decrypt(
        algorithm,
        key,
        encryptedData,
    );
    return new Uint8Array(decryptedData);
}

///////////////////////////////////////////////////////////////////////////////



///////////////////////////////////////////////////////////////////////////////
// ECC

function importPublicKeyArrayFromPrivateKey(privateKeyBase58)
{
    // WebCrypto не умеет получать публичный ключ из приватного, поэтому используется elliptic.js
    try
    {
        let e = new elliptic.ec('p256')
        let publicKeyArray = e.keyFromPrivate(base58ToArray(privateKeyBase58)).getPublic().encode();
        return new Uint8Array(publicKeyArray);
    }
    catch (e)
    {
        throw new Error('Не удалось получить публичный ключ из приватного: ' + e + ' stack:\n' + e.stack);
    }
}

async function exportPrivateKey(privateKey)
{
    let privateKeyJwk = await window.crypto.subtle.exportKey(
        "jwk",
        privateKey
    );
    return arrayToBase58(base64urlToArray(privateKeyJwk.d));
}

async function importPrivateKey(privateKeyBase58, isForSign = true)
{
    async function importPrivateKeyImpl(privateKeyJwk)
    {
        return await window.crypto.subtle.importKey(
            "jwk",
            privateKeyJwk,
            {
                name: isForSign ? 'ECDSA' : 'ECDH',
                namedCurve: "P-256"
            },
            true,
            [isForSign ? 'sign' : 'deriveKey']
        );
    }

    let privateKey = null;
    let privateKeyJwk = {
        'crv': 'P-256',
        'd': arrayToBase64url(base58ToArray(privateKeyBase58)),
        'ext': true,
        'key_ops': [isForSign ? 'sign' : 'deriveKey'],
        'kty': 'EC',
        'x': '',
        'y': ''
    }

    try
    {
        privateKey = await importPrivateKeyImpl(privateKeyJwk);
    }
    catch (e)
    {
        // Если браузер не поддерживает импорт приватного ключа без публичного,
        // то генерируем его
        let publicKeyArray = importPublicKeyArrayFromPrivateKey(privateKeyBase58);
        privateKeyJwk.x = arrayToBase64url(publicKeyArray.subarray(1, 33));
        privateKeyJwk.y = arrayToBase64url(publicKeyArray.subarray(33));
        try
        {
            privateKey = await importPrivateKeyImpl(privateKeyJwk);
        }
        catch (e)
        {
            throw new Error('HiddenThread: не удалось импортировать приватный ключ: ' + e);
        }
    }
    return privateKey;
}

async function exportPublicKey(publicKey)
{
    let publicKeyArray = await window.crypto.subtle.exportKey(
        "raw",
        publicKey
    );
    return arrayToBase58(new Uint8Array(publicKeyArray));
}

async function importPublicKey(publicKeyRaw, isForVerify = true)
{
    let publicKey = await window.crypto.subtle.importKey(
        "raw",
        publicKeyRaw,
        {
            name: isForVerify ? "ECDSA" : "ECDH",
            namedCurve: "P-256"
        },
        true,
        [isForVerify ? 'verify' : '']
    );
    return publicKey;
}

async function generateKeyPair()
{
    let keyPair = await window.crypto.subtle.generateKey(
        {
            name: "ECDSA",
            namedCurve: "P-256"
        },
        true,
        ["sign", "verify"]);

    let privateKey = await exportPrivateKey(keyPair.privateKey);
    let publicKey = await exportPublicKey(keyPair.publicKey);
    let pair = [privateKey, publicKey]
    return pair;
}

async function sign(privateKeyBase58, data)
{
    let signature = await window.crypto.subtle.sign(
        {
            name: "ECDSA",
            hash: {name: "SHA-256"},
        },
        await importPrivateKey(privateKeyBase58),
        data
    );

    return new Uint8Array(signature);
}

async function verify(publicKey, signature, data)
{
    let result = await window.crypto.subtle.verify(
        {
            name: "ECDSA",
            hash: {name: "SHA-256"},
        },
        await importPublicKey(publicKey),
        signature,
        data
    );

    return result;
}

async function deriveSecretKey(privateKeyBase58, publicKeyBase58) {
    let secret = await window.crypto.subtle.deriveKey(
        {
            name: "ECDH",
            public: await importPublicKey(base58ToArray(publicKeyBase58), false)
        },
        await importPrivateKey(privateKeyBase58, false),
        {
            name: "AES-CBC",
            length: 256
        },
        true,
        ["encrypt", "decrypt"]
    );

    let secretRaw = await window.crypto.subtle.exportKey('raw', secret);
    return arrayToBase58(new Uint8Array(secretRaw));
}

///////////////////////////////////////////////////////////////////////////////



///////////////////////////////////////////////////////////////////////////////
// LSB steganography

// Порядок упаковки:
// color (RGB), x, y, channel bit(0..7)
function hideDataToArray(array, data)
{
    let requiredSteps = data.length * 8;
    let arrayIndexList = getShuffledIndexList(array.length, requiredSteps);
    let arrayIndex = arrayIndexList.length - 1; // Идем назад, т.к. индексы перемешаны с конца
    let arrayBitIndex = 0;
    for (let dataIndex = 0; dataIndex < data.length; dataIndex++)
    {
        for (let bitIndex = 7; bitIndex >= 0; bitIndex--)
        {
            let bit = (data[dataIndex] >> bitIndex) & 1;
            array[arrayIndexList[arrayIndex]] &= ~(1 << arrayBitIndex); // Clear bit
            array[arrayIndexList[arrayIndex]] |= bit << arrayBitIndex; // Set bit
            arrayIndex--;
            if (arrayIndex < 0)
            {
                arrayIndex = arrayIndexList.length - 1;
                arrayBitIndex++;
                if (arrayBitIndex == 8 && dataIndex < (data.length - 1))
                {
                    throw new Error('Не удалось вместить данные в контейнер, осталось ещё '+
                        (data.length - dataIndex - 1) + ' из ' + data.length + ' байт');
                }
            }
        }
    }
}

function extractDataFromArray(array, data)
{
    let requiredSteps = data.length * 8;
    let arrayIndexList = getShuffledIndexList(array.length, requiredSteps);
    let arrayBitIndex = 0;
    let dataBitIndex = 7;
    let dataIndex = 0;
    let arrayIndex = arrayIndexList.length - 1; // Идем назад, т.к. индексы перемешаны с конца
    while (true)
    {
        let bit = (array[arrayIndexList[arrayIndex]] >> arrayBitIndex) & 1;
        data[dataIndex] |= bit << dataBitIndex;
        dataBitIndex--;
        if (dataBitIndex < 0)
        {
            dataBitIndex = 7;
            dataIndex++;
            if (dataIndex >= data.length) { return; }
        }

        arrayIndex--;
        if (arrayIndex < 0)
        {
            arrayIndex = arrayIndexList.length - 1;
            arrayBitIndex++;
            if (arrayBitIndex == 8)
            {
                throw new Error('Неожиданный конец контейнера, ожидалось ещё '+
                    (data.length - dataIndex) + ' из ' + data.length + ' байт');
            }
        }
    }
}

///////////////////////////////////////////////////////////////////////////////



async function hideDataToImage(file, data)
{
    let imageBitmap = await createImageBitmap(file);
    let rgbCount = imageBitmap.width * imageBitmap.height * 3;
    if (rgbCount < data.length)
    {
        let rest = Math.ceil((data.length - rgbCount) / 3);
        throw new Error('Невозможно вместить данные в контейнер, необходимо ещё '+
            'как минимум ' + rest + ' пикселей. Выбери картинку с большим разрешением.');
    }

    let canvas = document.createElement('canvas');
    canvas.width = imageBitmap.width;
    canvas.height = imageBitmap.height;

    let ctx = canvas.getContext('2d');
    ctx.drawImage(imageBitmap, 0, 0, canvas.width, canvas.height);
    let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    hideDataToArray(imageData.data, data);
    ctx.putImageData(imageData, 0, 0);

    let percent = (data.length / (imageData.data.length / 4 * 3) * 100).toFixed(2);
    return { 'canvas': canvas, 'len': data.length, 'percent': percent };
}

function createHeader(type, totalLength)
{
    let header = new Uint8Array(BLOCK_SIZE);
    header.set(new TextEncoder().encode('ht'));
    let version = 0x01;
    header[2] = version & 0xFF;
    header[3] = (version >> 8) & 0xFF;
    let blocksCount = Math.ceil((BLOCK_SIZE + totalLength + 1) / BLOCK_SIZE);
    header[4] = blocksCount & 0xFF;
    header[5] = (blocksCount >> 8) & 0xFF;
    header[6] = (blocksCount >> 16) & 0xFF;
    header[7] = (blocksCount >> 24) & 0xFF;
    let time = Math.ceil(new Date().getTime() / 1000);
    header[8] = time & 0xFF;
    header[9] = (time >> 8) & 0xFF;
    header[10] = (time >> 16) & 0xFF;
    header[11] = (time >> 24) & 0xFF;
    header[12] = type;
    header[15] = 0x01; // PKCS#7 padding

    return header;
}

async function packPost(message, files, privateKey)
{
    let zip = new JSZip();
    zip.file("_post.txt", message);
    for (let i = 0; i < files.length; i++) {
        let f = files[i];
        zip.file(f.name, f);
    }

    let archive = await zip.generateAsync({
        type:"uint8array",
        compression: "DEFLATE",
        compressionOptions: {
            level: 6 // [1..9]
        }
    });

    let data = null;
    // Если указан приватный ключ, подписываем пост
    if (privateKey.length > 0)
    {
        let header = createHeader(SIGNED_POST_TYPE, PUBLIC_KEY_SIZE + SIGNATURE_SIZE + archive.length);
        let publicKeyArray = importPublicKeyArrayFromPrivateKey(privateKey);

        data = new Uint8Array(BLOCK_SIZE + PUBLIC_KEY_SIZE + SIGNATURE_SIZE + archive.length);
        data.set(header);
        data.set(publicKeyArray, BLOCK_SIZE);
        // Сигнатура будет вставлена после подписывания поста
        data.set(archive, BLOCK_SIZE + PUBLIC_KEY_SIZE + SIGNATURE_SIZE);

        let signatureArray = await sign(privateKey, data);
        if (signatureArray.length != SIGNATURE_SIZE || publicKeyArray.length != PUBLIC_KEY_SIZE)
        {
            console.log(signatureArray);
            console.log(publicKeyArray);
            throw new Error("signatureArray or publicKeyArray size incorrect");
        }
        data.set(signatureArray, BLOCK_SIZE + PUBLIC_KEY_SIZE);
    }
    else
    {
        let header = createHeader(NORMAL_POST_TYPE, archive.length);
        data = new Uint8Array(header.length + archive.length);
        data.set(header);
        data.set(archive, header.length);
    }

    return data;
}

async function createHiddenPostImpl(image, message, files, password, privateKey, otherPublicKey)
{
    let oneTimePublicKey = null;
    if (otherPublicKey.length > 0)
    {
        // Создаем одноразовую пару ключей
        let pair = await generateKeyPair();
        // Генерируем секрет с одноразовым приватным ключом и публичным ключом получателя
        password = await deriveSecretKey(pair[0], otherPublicKey)
        // Получатель сгенерирует секрет нашим одноразовым публичным ключом и своим приватным
        oneTimePublicKey = base58ToArray(pair[1]);
    }

    let postData = await packPost(message, files, privateKey);

    let encryptedData = await encrypt(password, postData);

    if (oneTimePublicKey != null)
    {
        // Вставляем одноразовый ключ в начало массива данных
        let keyAndData = new Uint8Array(oneTimePublicKey.length + encryptedData.length);
        keyAndData.set(oneTimePublicKey);
        keyAndData.set(encryptedData, oneTimePublicKey.length);
        encryptedData = keyAndData;
    }

    let imageResult = await hideDataToImage(image, encryptedData);

    return imageResult;
}

function createHiddenPost()
{
    let imageContainerDiv = document.getElementById('imageContainerDiv');
    imageContainerDiv.innerHTML = '';

    let containers = document.getElementById('hiddenContainerInput').files;

    if (containers.length == 0)
    {
        alert('Выбери картинку-контейнер!');
        return;
    }

    if (containers[0].type != 'image/png' &&
        containers[0].type != 'image/jpeg' &&
        containers[0].type != 'image/jpeg')
    {
        alert('Выбранный файл должен быть JPG или PNG картинкой!');
        return;
    }

    createHiddenPostImpl(containers[0],
        document.getElementById('hiddenPostInput').value,
        document.getElementById('hiddenFilesInput').files,
        document.getElementById('hiddenThreadPassword').value,
        document.getElementById('privateKey').value,
        document.getElementById('otherPublicKey').value)
        .then(function(imageResult){
            let img = document.createElement('img');
            img.style = "max-width: 100%; max-height: 100%;";
            img.src = imageResult.canvas.toDataURL("image/png");

            imageContainerDiv.appendChild(createElementFromHTML('<span>Сохрани изображение ниже и вставь в форму отправки, если оно не вставилось автоматически:</span>'));
            imageContainerDiv.appendChild(document.createElement('br'));
            imageContainerDiv.appendChild(img);

            imageResult.canvas.toBlob(function(blob) {
                blob.name = 'image.png';
                window.FormFiles.addMultiFiles([blob]);
            });

            alert('Спрятано ' + imageResult.len + ' байт (занято ' + imageResult.percent + '% изображения)');
        })
        .catch(function(e){
            console.log('Ошибка при создании скрытопоста: ' + e + ' stack:\n' + e.stack);
            alert('Ошибка при создании скрытопоста: ' + e);
        });
}





function createFileLinksDiv(files)
{
    let fileLinksDiv = document.createElement('div');
    if (files.length == 0)
    {
        return fileLinksDiv;
    }

    fileLinksDiv.innerHTML += 'Файлы: ';
    for (let i = 0; i < files.length; i++)
    {
        let link = document.createElement('a');
        link.target = "_blank";
        link.innerText = files[i].name;
        link.href = URL.createObjectURL(files[i].data);
        fileLinksDiv.appendChild(link);
        fileLinksDiv.innerHTML += ' ';

        let downloadLink = document.createElement('a');
        downloadLink.download = files[i].name;
        downloadLink.innerText = '\u2193';
        downloadLink.href = URL.createObjectURL(files[i].data);
        fileLinksDiv.appendChild(downloadLink);

        if (i < files.length - 1)
        {
            fileLinksDiv.innerHTML += ', ';
        }
    }
    return fileLinksDiv;
}

// Добавление HTML скрытопоста к основному посту
function addHiddenPostToHtml(postId, postResult)
{
    console.log('HiddenThread: postResult:');
    console.log(postResult);
    let postBodyDiv = document.createElement('div');
    postBodyDiv.id = 'hidden_post-body-' + postId;
    postBodyDiv.classList.add("post");
    postBodyDiv.classList.add("post_type_reply");
    postBodyDiv.setAttribute('data-num', String(postId));

    let postMetadata = document.createElement('div');
    postMetadata.style = 'font-family: courier new;';
    let postArticle = document.createElement('article');
    postArticle.id = 'hidden_m' + postId;
    postArticle.classList.add("post__message");

    let postArticleMessage = document.createElement('div');
    postArticleMessage.innerText = postResult.post.message;

    if (postResult.isPrivate)
    {
        postMetadata.appendChild(createElementFromHTML('<div style="color:orange;"><i>Этот пост виден только с твоим приватным ключом</i></div>'));
    }
    let timeString = (new Date(postResult.header.timestamp * 1000))
        .toISOString().replace('T',' ').replace(/\.\d+Z/g,'');
    postMetadata.appendChild(createElementFromHTML('<div>Дата создания скрытопоста (UTC): '+timeString+'</div>'));
    postMetadata.appendChild(createFileLinksDiv(postResult.post.files));

    if (postResult.verifyResult != null)
    {
        let postArticleSign = document.createElement('div');
        postArticleSign.innerHTML =
            'Публичный ключ: <span ' +
            (postResult.verifyResult.isVerified ? 'style="color:green;"' : 'style="color:red;"') + '>' +
            postResult.verifyResult.publicKey + '</span>'+
            (postResult.verifyResult.isVerified ? '' : ' (неверная подпись!)');
        postMetadata.appendChild(postArticleSign);
    }
    postArticle.appendChild(postMetadata);
    postArticle.appendChild(document.createElement('br'));
    postArticle.appendChild(postArticleMessage);

    let postRefsDiv = document.createElement('div');
    postRefsDiv.id = 'hidden_refmap-' + postId;
    postRefsDiv.classList.add("post__refmap");
    postRefsDiv.style = 'display: block;';

    postBodyDiv.appendChild(postArticle);
    postBodyDiv.appendChild(postRefsDiv);

    let clearPost = document.getElementById('post-' + postId);
    clearPost.appendChild(document.createElement('br'));
    clearPost.appendChild(postBodyDiv);
}

// Добавление HTML скрытопоста в объект основного поста (для всплывающих постов)
function addHiddenPostToObj(postId)
{
    let thread = window.Post(window.thread.id);
    let currentPost = thread.getPostsObj()[String(postId)];
    let postArticle = document.getElementById('hidden_m' + postId);
    currentPost.ajax.comment = currentPost.ajax.comment + '<br>' + postArticle.innerHTML;
}

function createElementFromHTML(htmlString)
{
    let div = document.createElement('div');
    div.innerHTML = htmlString.trim();
    return div.firstElementChild;
}

function createReplyLink(postId)
{
    let threadId = window.thread.id;
    return '<a href="/' + window.board + '/res/' + threadId + '.html#' + postId +
        '" class="post-reply-link" data-thread="' + threadId + '" data-num="' + postId +
        '">&gt;&gt;' + postId + '</a>';
}

function addReplyLinks(postId, text)
{
    let thread = window.Post(window.thread.id);
    let postArticle = document.getElementById('hidden_m' + postId);

    let linkRegex = '&gt;&gt;(\\d{1,10})';
    const linkMatches = postArticle.innerHTML.matchAll(linkRegex);

    let refPostIdSet = new Set();
    let indexDiff = 0;
    for (const match of linkMatches)
    {
        let refPostId = match[1];

        // Добавление ссылки на другой пост (замена текста ">>..." на ссылку) в HTML
        let replyStr = createReplyLink(refPostId);
        let oldLength = '&gt;&gt;'.length + refPostId.length;
        postArticle.innerHTML = postArticle.innerHTML.substr(0, match.index + indexDiff) + replyStr +
            postArticle.innerHTML.substr(match.index + indexDiff + oldLength);
        indexDiff += replyStr.length - oldLength;

        if (!refPostIdSet.has(refPostId))
        {
            refPostIdSet.add(refPostId);
            // Добавление ссылки на текущий пост в ответы другого поста
            // В HTML:
            let refPostRefs =
                document.getElementById('hidden_refmap-' + refPostId) ||
                document.getElementById('refmap-' + refPostId);
            if (refPostRefs != null)
            {
                refPostRefs.style = "display: block;";
                refPostRefs.appendChild(createElementFromHTML(createReplyLink(postId)));

                // В Object (для всплывающих постов):
                let refPost = thread.getPostsObj()[refPostId];
                if (refPost)
                {
                    if (refPost.replies == undefined)
                    {
                        refPost.replies = new Array();
                    }
                    refPost.replies.push(postId);
                }
            }
        }
    }
}

function renderHiddenPost(postId, postResult)
{
    addHiddenPostToHtml(postId, postResult);
    addReplyLinks(postId, postResult.post.message);
    addHiddenPostToObj(postId); // Текст скрытопоста берется из HTML
}

async function unzipPostData(zipData)
{
    let zip = new JSZip();

    let postMessage = '';
    let files = [];
    let filesCount = 0;
    try
    {
        let archive = await zip.loadAsync(zipData);

        for (const filename in archive.files)
        {
            filesCount++;
            if (filesCount > MAX_FILES_COUNT) break;

            if (filename == '_post.txt')
            {
                postMessage = await archive.file(filename).async('string');
                if (postMessage.length > MESSAGE_MAX_LENGTH)
                {
                    postMessage = postMessage.substring(0, MESSAGE_MAX_LENGTH) +
                        '...(часть сообщения обрезана, смотри файл '+filename+')';
                    let postMessageFileData = await archive.file(filename).async('blob');
                    files.push({'name': filename, 'data': postMessageFileData});
                }
            }
            else
            {
                let fileData = await archive.file(filename).async('blob');
                files.push({'name': filename, 'data': fileData});
            }
        }
    }
    catch (e)
    {
        console.log('HiddenThread: Ошибка при распаковке архива: ' + e + ' stack:\n' + e.stack);
    }

    return {'message': postMessage, 'files': files};
}

async function verifyPostData(data)
{
    let keySigPair = [data.subarray(BLOCK_SIZE, BLOCK_SIZE + PUBLIC_KEY_SIZE),
        // Копируем сигнатуру
        new Uint8Array(data.subarray(BLOCK_SIZE + PUBLIC_KEY_SIZE,
            BLOCK_SIZE + PUBLIC_KEY_SIZE + SIGNATURE_SIZE))];

    // Обнуляем поле с сигнатурой, чтобы получить корректный хэш при проверке
    data.set(new Uint8Array(SIGNATURE_SIZE), BLOCK_SIZE + PUBLIC_KEY_SIZE);

    let isVerified = false;
    try
    {
        isVerified = await verify(keySigPair[0], keySigPair[1], data);
    }
    catch (e)
    {
        console.log('HiddenThread: Ошибка при проверке подписи: ' + e + ' stack:\n' + e.stack);
    }
    let verifyResult = {'publicKey': arrayToBase58(keySigPair[0]),
        'signature': arrayToBase58(keySigPair[1]),
        'isVerified': isVerified};
    return verifyResult;
}

function parseHeader(header)
{
    return {
        'magic': new TextDecoder().decode(header.subarray(0, 2)),
        'version': header[2] + (header[3] << 8),
        'blocksCount': header[4] + (header[5] << 8) + (header[6] << 16) + (header[7] << 24),
        'timestamp': header[8] + (header[9] << 8) + (header[10] << 16) + (header[11] << 24),
        'type': header[12]
    };
}

async function decryptData(password, imageArray, dataOffset)
{
    // Извлекаем IV и первый блок AES
    let hiddenDataHeader = new Uint8Array(dataOffset + IV_SIZE + BLOCK_SIZE);
    extractDataFromArray(imageArray, hiddenDataHeader);
    hiddenDataHeader = hiddenDataHeader.subarray(dataOffset);
    let dataHeader = null;
    try
    {
        dataHeader = await decrypt(password, hiddenDataHeader, true);
    }
    catch (e)
    {
        //console.log('Не удалось расшифровать заголовок, либо неверный пароль, либо это не скрытопост: ' + e);
        return null;
    }

    let header = parseHeader(dataHeader);
    if (header.magic != 'ht')
    {
        console.log('HiddenThread: Неверная сигнатура: ' + header.magic);
        return null;
    }

    console.log('HiddenThread: version ' + header.version);
    console.log('HiddenThread: blocksCount ' + header.blocksCount);
    console.log('HiddenThread: timestamp ' + header.timestamp);
    console.log('HiddenThread: type ' + header.type);

    let maxHiddenDataLength = imageArray.length / 4 * 3;
    let hiddenDataLength = IV_SIZE + header.blocksCount * BLOCK_SIZE;
    console.log('HiddenThread: hiddenDataLength (+IV) ' + hiddenDataLength);
    if (hiddenDataLength > maxHiddenDataLength)
    {
        console.log('HiddenThread: blocksCount * BLOCK_SIZE: ' + (header.blocksCount * BLOCK_SIZE) + ' > maxHiddenDataLength: ' + maxHiddenDataLength);
        return null;
    }

    // Заголовок верный, расшифровываем остальной пост
    let hiddenData = new Uint8Array(dataOffset + hiddenDataLength);
    extractDataFromArray(imageArray, hiddenData);
    hiddenData = hiddenData.subarray(dataOffset);

    let decryptedData = null;
    try
    {
        decryptedData = await decrypt(password, hiddenData);
    }
    catch (e)
    {
        //console.log('HiddenThread: Не удалось расшифровать данные: ' + e);
        return null;
    }
    return {
        'header': header,
        'data': decryptedData
    };
}

async function loadPostFromImage(img, password, privateKey)
{
    let canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    let ctx = canvas.getContext("2d")
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // Пробуем расшифровать как публичный пост
    let isPrivate = false;
    let decryptedData = await decryptData(password, imageData.data, 0);
    if (decryptedData == null && privateKey.length > 0)
    {
        isPrivate = true;
        // Извлекаем одноразовый публичный ключ
        let hiddenOneTimePublicKey = new Uint8Array(PUBLIC_KEY_SIZE);
        extractDataFromArray(imageData.data, hiddenOneTimePublicKey);
        // Генерируем секрет с одноразовым публичным ключом отправителя и своим приватным ключом
        let oneTimePublicKey = arrayToBase58(hiddenOneTimePublicKey);

        let secretPassword = null
        try
        {
            secretPassword = await deriveSecretKey(privateKey, oneTimePublicKey);
        }
        catch (e)
        {
            // console.log('HiddenThread: Не удалось сгенерировать секрет: ' + e);
        }

        if (secretPassword != null)
        {
            // Пробуем расшифровать как приватный пост
            decryptedData = await decryptData(secretPassword, imageData.data, PUBLIC_KEY_SIZE);
        }
    }

    // Расшифровать не получилось
    if (decryptedData == null) return null;

    let zipOffset = null;
    let verifyResult = null;
    if (decryptedData.header.type == SIGNED_POST_TYPE)
    {
        verifyResult = await verifyPostData(decryptedData.data);
        zipOffset = BLOCK_SIZE + PUBLIC_KEY_SIZE + SIGNATURE_SIZE;
    }
    else
    {
        zipOffset = BLOCK_SIZE;
    }

    let post = await unzipPostData(decryptedData.data.subarray(zipOffset));

    return {
        'header': decryptedData.header,
        'post': post,
        'verifyResult': verifyResult,
        'isPrivate': isPrivate,
    };
}

function loadHiddenPosts()
{
    if (!window.gLoadedHiddenPosts) {
        // Список id всех просмотренных постов
        window.gLoadedHiddenPosts = new Set();
    }

    let threadId = window.thread.id
    let thread = window.Post(threadId)
    let postIdList = thread.threadPosts()
    let postsObject = thread.getPostsObj()

    let incrementCounter = (counterId) => {
        let el = document.getElementById(counterId)
        el.textContent = String(parseInt(el.textContent) + 1)
    }

    for (let id of postIdList)
    {
        if (!window.gLoadedHiddenPosts.has(id))
        {
            window.gLoadedHiddenPosts.add(id);

            let postAjax = postsObject[id].ajax;
            if (!postAjax) continue;

            let postFiles = postAjax.files;
            if (postFiles.length > 0 && postFiles[0].path.endsWith('.png'))
            {
                let url = postFiles[0].path;
                let img = new Image();
                img.onload = (async () => {
                    console.log(`HiddenThread: loading post ${id} ${url}`)
                    incrementCounter("imagesLoadedCount")

                    let hiddenThreadPasswordEl = document.getElementById('hiddenThreadPassword')
                    let privateKeyEl = document.getElementById('privateKey')
                    let postResult = await loadPostFromImage(img, hiddenThreadPasswordEl.value, privateKeyEl.value)
                    if (postResult) {
                        incrementCounter("hiddenPostsLoadedCount")
                        renderHiddenPost(id, postResult)
                    }
                })
                img.setAttribute("src", url)
                incrementCounter("imagesCount")
            }
        }
    }
}


function createInterface()
{
    let toggleText = () => {
        return storage.hide
            ? "Открыть"
            : "Закрыть"
    }
    let formTemplate = `
        <div id="hiddenPostDiv">
            <hr>
            <div style="position: relative; display: flex; justify-content: center; align-items: center">
                <p style="font-size:x-large;">Скрытотред v0.1</p>
                <span id="hiddenThreadToggle" style="position: absolute; right: 0; cursor: pointer">${toggleText()}</span>
            </div>
            <div id="hiddenThreadForm" style="display: ${storage.hide ? 'none' : ''}">
                <div style="padding:5px;">
                    <span style="padding-right: 5px;">Пароль:</span>
                    <input id="hiddenThreadPassword" /> 
                    <input id="loadHiddenPostsButton" type="button" style="padding: 5px;" value="Загрузить скрытопосты" />
                    <!--<input id="clearLoadedPosts" type="button" style="padding: 5px;" value="X" />-->
                </div>
                <div style="padding:5px;text-align:center;">
                    <!--<span id="loadingStatus" style="display: none">Загрузка...</span>-->
                    Загружено картинок: <span id="imagesLoadedCount">0</span>/<span id="imagesCount">0</span>
                    <br>
                    Загружено скрытопостов: <span id="hiddenPostsLoadedCount">0</span>
                </div>
                <textarea
                    id="hiddenPostInput"
                    placeholder="Пиши скрытый текст тут"
                    style="box-sizing: border-box; display: inline-block; width: 100%; padding: 5px;"
                    rows="10"
                ></textarea>
                <div id="hiddenFilesDiv" style="padding: 5px;">
                    <span>Выбери скрытые файлы: </span>
                    <input id="hiddenFilesInput" type="file" multiple="true" />
                    <span>Выбери картинку-контейнер: </span>
                    <input id="hiddenContainerInput" type="file" />
                    <br>
                    <input id="hiddenFilesClearButton" class="mt-1" type="button" value="Очистить список файлов" />
                </div>
                <div style="padding: 5px;">
                    <div style="font-size:large;text-align:center;">Подписать пост</div>
                    Приватный ключ (ECDSA p256, base58): <br>
                    <input
                        id="privateKey"
                        style="box-sizing: border-box; display: inline-block; width: 100%; padding: 5px;"
                    />
                    <br>
                    Публичный ключ:
                    <br>
                    <input
                        id="publicKey"
                        readonly
                        style="box-sizing: border-box; display: inline-block; width: 100%; padding: 5px;"
                    />
                    <br>
                    <div align="center" class="mt-1">
                        <input id="generateKeyPairButton" type="button" style="padding: 5px;" value="Сгенерировать ключи" />
                    </div>
                </div>
                <div style="padding: 5px;">
                    <div style="font-size:large;text-align:center;">Приватный пост</div>
                    Публичный ключ получателя: <br>
                    <input id="otherPublicKey" style="box-sizing: border-box; display: inline-block; width: 100%; padding: 5px;">
                </div>
                <br>
                <div align="center">
                    <input id="createHiddenPostButton" type="button" value="Создать картинку со скрытопостом" style="padding: 5px;">
                </div>
                <div id="imageContainerDiv" />
            </div>
            <hr>
        </div>
    `
    let style = document.createElement("style")
    let css = `
        #hiddenPostDiv .mt-1 { margin-top: 1em; }
        #hiddenPostDiv input, textarea {
            border: 1px solid var(--theme_default_btnborder);
            background: var(--theme_default_altbtnbg);
            color: var(--theme_default_btntext);
        }
        #hiddenPostDiv input[type=button] {
            color: var(--theme_default_btntext);
        }
    `
    if (style.styleSheet){
        // This is required for IE8 and below.
        style.styleSheet.cssText = css;
    } else {
        style.appendChild(document.createTextNode(css));
    }
    document.head.appendChild(style)

    // render
    document.getElementById('postform').insertAdjacentHTML("beforeend", formTemplate);

    // listeners

    let toggleEl = document.getElementById("hiddenThreadToggle")
    toggleEl.onclick = () => {
        setStorage({ hide: !storage.hide })
        toggleEl.textContent = toggleText()
        let formEl = document.getElementById("hiddenThreadForm")
        formEl.style.display = storage.hide
            ? "none"
            : ""
    }

    document.getElementById('loadHiddenPostsButton').onclick = loadHiddenPosts

    // document.getElementById('clearLoadedPosts').onclick = function()
    // {
    //     window.gLoadedHiddenPosts.clear();
    //     document.getElementById('imagesCount').textContent = '0';
    //     document.getElementById('imagesLoadedCount').textContent = '0';
    //     document.getElementById('hiddenPostsLoadedCount').textContent = '0';
    // }
    document.getElementById('hiddenFilesClearButton').onclick = function() {
        document.getElementById('hiddenFilesInput').value = null;
        document.getElementById("hiddenContainerInput").value = null
    }
    document.getElementById('createHiddenPostButton').onclick = function() {
        createHiddenPost();
    }
    document.getElementById('generateKeyPairButton').onclick = function() {
        generateKeyPair()
            .then(function(pair){
                document.getElementById('privateKey').value = pair[0];
                document.getElementById('publicKey').value = pair[1];
            });
    }
    document.getElementById('privateKey').oninput = function() {
        let privateKey = document.getElementById('privateKey').value;
        let publicKeyArray = null;
        try
        {
            publicKeyArray = importPublicKeyArrayFromPrivateKey(privateKey);
        }
        catch (e) {}

        if (publicKeyArray && publicKeyArray.length > 0)
        {
            document.getElementById('publicKey').value = arrayToBase58(publicKeyArray);
        }
        else
        {
            document.getElementById('publicKey').value = '';
        }
    }
}

(function()
{
    'use strict';
    createInterface();
})();
