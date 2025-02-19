"use strict";(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[1799],{5478:function(e,t,n){n.d(t,{Ry:function(){return l}});var r=new WeakMap,o=new WeakMap,a={},c=0,i=function(e){return e&&(e.host||i(e.parentNode))},u=function(e,t,n,u){var l=(Array.isArray(e)?e:[e]).map(function(e){if(t.contains(e))return e;var n=i(e);return n&&t.contains(n)?n:(console.error("aria-hidden",e,"in not contained inside",t,". Doing nothing"),null)}).filter(function(e){return!!e});a[n]||(a[n]=new WeakMap);var d=a[n],s=[],f=new Set,v=new Set(l),p=function(e){!e||f.has(e)||(f.add(e),p(e.parentNode))};l.forEach(p);var h=function(e){!e||v.has(e)||Array.prototype.forEach.call(e.children,function(e){if(f.has(e))h(e);else try{var t=e.getAttribute(u),a=null!==t&&"false"!==t,c=(r.get(e)||0)+1,i=(d.get(e)||0)+1;r.set(e,c),d.set(e,i),s.push(e),1===c&&a&&o.set(e,!0),1===i&&e.setAttribute(n,"true"),a||e.setAttribute(u,"true")}catch(t){console.error("aria-hidden: cannot operate on ",e,t)}})};return h(t),f.clear(),c++,function(){s.forEach(function(e){var t=r.get(e)-1,a=d.get(e)-1;r.set(e,t),d.set(e,a),t||(o.has(e)||e.removeAttribute(u),o.delete(e)),a||e.removeAttribute(n)}),--c||(r=new WeakMap,r=new WeakMap,o=new WeakMap,a={})}},l=function(e,t,n){void 0===n&&(n="data-aria-hidden");var r=Array.from(Array.isArray(e)?e:[e]),o=t||("undefined"==typeof document?null:(Array.isArray(e)?e[0]:e).ownerDocument.body);return o?(r.push.apply(r,Array.from(o.querySelectorAll("[aria-live]"))),u(r,o,n,"aria-hidden")):function(){return null}}},39763:function(e,t,n){n.d(t,{Z:function(){return c}});var r=n(2265),o={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"};let a=e=>e.replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase().trim(),c=(e,t)=>{let n=(0,r.forwardRef)((n,c)=>{let{color:i="currentColor",size:u=24,strokeWidth:l=2,absoluteStrokeWidth:d,className:s="",children:f,...v}=n;return(0,r.createElement)("svg",{ref:c,...o,width:u,height:u,stroke:i,strokeWidth:d?24*Number(l)/Number(u):l,className:["lucide","lucide-".concat(a(e)),s].join(" "),...v},[...t.map(e=>{let[t,n]=e;return(0,r.createElement)(t,n)}),...Array.isArray(f)?f:[f]])});return n.displayName="".concat(e),n}},87922:function(e,t,n){n.d(t,{Z:function(){return $}});var r,o,a,c,i,u,l,d=n(5853),s=n(2265),f="right-scroll-bar-position",v="width-before-scroll-bar";function p(e,t){return"function"==typeof e?e(t):e&&(e.current=t),e}var h="undefined"!=typeof window?s.useLayoutEffect:s.useEffect,m=new WeakMap,g=(void 0===r&&(r={}),(void 0===o&&(o=function(e){return e}),a=[],c=!1,i={read:function(){if(c)throw Error("Sidecar: could not `read` from an `assigned` medium. `read` could be used only with `useMedium`.");return a.length?a[a.length-1]:null},useMedium:function(e){var t=o(e,c);return a.push(t),function(){a=a.filter(function(e){return e!==t})}},assignSyncMedium:function(e){for(c=!0;a.length;){var t=a;a=[],t.forEach(e)}a={push:function(t){return e(t)},filter:function(){return a}}},assignMedium:function(e){c=!0;var t=[];if(a.length){var n=a;a=[],n.forEach(e),t=a}var r=function(){var n=t;t=[],n.forEach(e)},o=function(){return Promise.resolve().then(r)};o(),a={push:function(e){t.push(e),o()},filter:function(e){return t=t.filter(e),a}}}}).options=(0,d.pi)({async:!0,ssr:!1},r),i),y=function(){},b=s.forwardRef(function(e,t){var n,r,o,a,c=s.useRef(null),i=s.useState({onScrollCapture:y,onWheelCapture:y,onTouchMoveCapture:y}),u=i[0],l=i[1],f=e.forwardProps,v=e.children,b=e.className,E=e.removeScrollBar,w=e.enabled,S=e.shards,k=e.sideCar,C=e.noIsolation,A=e.inert,N=e.allowPinchZoom,L=e.as,M=e.gapMode,T=(0,d._T)(e,["forwardProps","children","className","removeScrollBar","enabled","shards","sideCar","noIsolation","inert","allowPinchZoom","as","gapMode"]),x=(n=[c,t],r=function(e){return n.forEach(function(t){return p(t,e)})},(o=(0,s.useState)(function(){return{value:null,callback:r,facade:{get current(){return o.value},set current(value){var e=o.value;e!==value&&(o.value=value,o.callback(value,e))}}}})[0]).callback=r,a=o.facade,h(function(){var e=m.get(a);if(e){var t=new Set(e),r=new Set(n),o=a.current;t.forEach(function(e){r.has(e)||p(e,null)}),r.forEach(function(e){t.has(e)||p(e,o)})}m.set(a,n)},[n]),a),R=(0,d.pi)((0,d.pi)({},T),u);return s.createElement(s.Fragment,null,w&&s.createElement(k,{sideCar:g,removeScrollBar:E,shards:S,noIsolation:C,inert:A,setCallbacks:l,allowPinchZoom:!!N,lockRef:c,gapMode:M}),f?s.cloneElement(s.Children.only(v),(0,d.pi)((0,d.pi)({},R),{ref:x})):s.createElement(void 0===L?"div":L,(0,d.pi)({},R,{className:b,ref:x}),v))});b.defaultProps={enabled:!0,removeScrollBar:!0,inert:!1},b.classNames={fullWidth:v,zeroRight:f};var E=function(e){var t=e.sideCar,n=(0,d._T)(e,["sideCar"]);if(!t)throw Error("Sidecar: please provide `sideCar` property to import the right car");var r=t.read();if(!r)throw Error("Sidecar medium not found");return s.createElement(r,(0,d.pi)({},n))};E.isSideCarExport=!0;var w=function(){var e=0,t=null;return{add:function(r){if(0==e&&(t=function(){if(!document)return null;var e=document.createElement("style");e.type="text/css";var t=l||n.nc;return t&&e.setAttribute("nonce",t),e}())){var o,a;(o=t).styleSheet?o.styleSheet.cssText=r:o.appendChild(document.createTextNode(r)),a=t,(document.head||document.getElementsByTagName("head")[0]).appendChild(a)}e++},remove:function(){--e||!t||(t.parentNode&&t.parentNode.removeChild(t),t=null)}}},S=function(){var e=w();return function(t,n){s.useEffect(function(){return e.add(t),function(){e.remove()}},[t&&n])}},k=function(){var e=S();return function(t){return e(t.styles,t.dynamic),null}},C={left:0,top:0,right:0,gap:0},A=function(e){return parseInt(e||"",10)||0},N=function(e){var t=window.getComputedStyle(document.body),n=t["padding"===e?"paddingLeft":"marginLeft"],r=t["padding"===e?"paddingTop":"marginTop"],o=t["padding"===e?"paddingRight":"marginRight"];return[A(n),A(r),A(o)]},L=function(e){if(void 0===e&&(e="margin"),"undefined"==typeof window)return C;var t=N(e),n=document.documentElement.clientWidth,r=window.innerWidth;return{left:t[0],top:t[1],right:t[2],gap:Math.max(0,r-n+t[2]-t[0])}},M=k(),T="data-scroll-locked",x=function(e,t,n,r){var o=e.left,a=e.top,c=e.right,i=e.gap;return void 0===n&&(n="margin"),"\n  .".concat("with-scroll-bars-hidden"," {\n   overflow: hidden ").concat(r,";\n   padding-right: ").concat(i,"px ").concat(r,";\n  }\n  body[").concat(T,"] {\n    overflow: hidden ").concat(r,";\n    overscroll-behavior: contain;\n    ").concat([t&&"position: relative ".concat(r,";"),"margin"===n&&"\n    padding-left: ".concat(o,"px;\n    padding-top: ").concat(a,"px;\n    padding-right: ").concat(c,"px;\n    margin-left:0;\n    margin-top:0;\n    margin-right: ").concat(i,"px ").concat(r,";\n    "),"padding"===n&&"padding-right: ".concat(i,"px ").concat(r,";")].filter(Boolean).join(""),"\n  }\n  \n  .").concat(f," {\n    right: ").concat(i,"px ").concat(r,";\n  }\n  \n  .").concat(v," {\n    margin-right: ").concat(i,"px ").concat(r,";\n  }\n  \n  .").concat(f," .").concat(f," {\n    right: 0 ").concat(r,";\n  }\n  \n  .").concat(v," .").concat(v," {\n    margin-right: 0 ").concat(r,";\n  }\n  \n  body[").concat(T,"] {\n    ").concat("--removed-body-scroll-bar-size",": ").concat(i,"px;\n  }\n")},R=function(){var e=parseInt(document.body.getAttribute(T)||"0",10);return isFinite(e)?e:0},W=function(){s.useEffect(function(){return document.body.setAttribute(T,(R()+1).toString()),function(){var e=R()-1;e<=0?document.body.removeAttribute(T):document.body.setAttribute(T,e.toString())}},[])},P=function(e){var t=e.noRelative,n=e.noImportant,r=e.gapMode,o=void 0===r?"margin":r;W();var a=s.useMemo(function(){return L(o)},[o]);return s.createElement(M,{styles:x(a,!t,o,n?"":"!important")})},O=!1;if("undefined"!=typeof window)try{var I=Object.defineProperty({},"passive",{get:function(){return O=!0,!0}});window.addEventListener("test",I,I),window.removeEventListener("test",I,I)}catch(e){O=!1}var j=!!O&&{passive:!1},F=function(e,t){if(!(e instanceof Element))return!1;var n=window.getComputedStyle(e);return"hidden"!==n[t]&&!(n.overflowY===n.overflowX&&"TEXTAREA"!==e.tagName&&"visible"===n[t])},_=function(e,t){var n=t.ownerDocument,r=t;do{if("undefined"!=typeof ShadowRoot&&r instanceof ShadowRoot&&(r=r.host),B(e,r)){var o=D(e,r);if(o[1]>o[2])return!0}r=r.parentNode}while(r&&r!==n.body);return!1},B=function(e,t){return"v"===e?F(t,"overflowY"):F(t,"overflowX")},D=function(e,t){return"v"===e?[t.scrollTop,t.scrollHeight,t.clientHeight]:[t.scrollLeft,t.scrollWidth,t.clientWidth]},K=function(e,t,n,r,o){var a,c=(a=window.getComputedStyle(t).direction,"h"===e&&"rtl"===a?-1:1),i=c*r,u=n.target,l=t.contains(u),d=!1,s=i>0,f=0,v=0;do{var p=D(e,u),h=p[0],m=p[1]-p[2]-c*h;(h||m)&&B(e,u)&&(f+=m,v+=h),u instanceof ShadowRoot?u=u.host:u=u.parentNode}while(!l&&u!==document.body||l&&(t.contains(u)||t===u));return s&&(o&&1>Math.abs(f)||!o&&i>f)?d=!0:!s&&(o&&1>Math.abs(v)||!o&&-i>v)&&(d=!0),d},X=function(e){return"changedTouches"in e?[e.changedTouches[0].clientX,e.changedTouches[0].clientY]:[0,0]},Y=function(e){return[e.deltaX,e.deltaY]},Z=function(e){return e&&"current"in e?e.current:e},H=0,q=[],z=(u=function(e){var t=s.useRef([]),n=s.useRef([0,0]),r=s.useRef(),o=s.useState(H++)[0],a=s.useState(k)[0],c=s.useRef(e);s.useEffect(function(){c.current=e},[e]),s.useEffect(function(){if(e.inert){document.body.classList.add("block-interactivity-".concat(o));var t=(0,d.ev)([e.lockRef.current],(e.shards||[]).map(Z),!0).filter(Boolean);return t.forEach(function(e){return e.classList.add("allow-interactivity-".concat(o))}),function(){document.body.classList.remove("block-interactivity-".concat(o)),t.forEach(function(e){return e.classList.remove("allow-interactivity-".concat(o))})}}},[e.inert,e.lockRef.current,e.shards]);var i=s.useCallback(function(e,t){if("touches"in e&&2===e.touches.length||"wheel"===e.type&&e.ctrlKey)return!c.current.allowPinchZoom;var o,a=X(e),i=n.current,u="deltaX"in e?e.deltaX:i[0]-a[0],l="deltaY"in e?e.deltaY:i[1]-a[1],d=e.target,s=Math.abs(u)>Math.abs(l)?"h":"v";if("touches"in e&&"h"===s&&"range"===d.type)return!1;var f=_(s,d);if(!f)return!0;if(f?o=s:(o="v"===s?"h":"v",f=_(s,d)),!f)return!1;if(!r.current&&"changedTouches"in e&&(u||l)&&(r.current=o),!o)return!0;var v=r.current||o;return K(v,t,e,"h"===v?u:l,!0)},[]),u=s.useCallback(function(e){if(q.length&&q[q.length-1]===a){var n="deltaY"in e?Y(e):X(e),r=t.current.filter(function(t){var r;return t.name===e.type&&(t.target===e.target||e.target===t.shadowParent)&&(r=t.delta)[0]===n[0]&&r[1]===n[1]})[0];if(r&&r.should){e.cancelable&&e.preventDefault();return}if(!r){var o=(c.current.shards||[]).map(Z).filter(Boolean).filter(function(t){return t.contains(e.target)});(o.length>0?i(e,o[0]):!c.current.noIsolation)&&e.cancelable&&e.preventDefault()}}},[]),l=s.useCallback(function(e,n,r,o){var a={name:e,delta:n,target:r,should:o,shadowParent:function(e){for(var t=null;null!==e;)e instanceof ShadowRoot&&(t=e.host,e=e.host),e=e.parentNode;return t}(r)};t.current.push(a),setTimeout(function(){t.current=t.current.filter(function(e){return e!==a})},1)},[]),f=s.useCallback(function(e){n.current=X(e),r.current=void 0},[]),v=s.useCallback(function(t){l(t.type,Y(t),t.target,i(t,e.lockRef.current))},[]),p=s.useCallback(function(t){l(t.type,X(t),t.target,i(t,e.lockRef.current))},[]);s.useEffect(function(){return q.push(a),e.setCallbacks({onScrollCapture:v,onWheelCapture:v,onTouchMoveCapture:p}),document.addEventListener("wheel",u,j),document.addEventListener("touchmove",u,j),document.addEventListener("touchstart",f,j),function(){q=q.filter(function(e){return e!==a}),document.removeEventListener("wheel",u,j),document.removeEventListener("touchmove",u,j),document.removeEventListener("touchstart",f,j)}},[]);var h=e.removeScrollBar,m=e.inert;return s.createElement(s.Fragment,null,m?s.createElement(a,{styles:"\n  .block-interactivity-".concat(o," {pointer-events: none;}\n  .allow-interactivity-").concat(o," {pointer-events: all;}\n")}):null,h?s.createElement(P,{gapMode:e.gapMode}):null)},g.useMedium(u),E),U=s.forwardRef(function(e,t){return s.createElement(b,(0,d.pi)({},e,{ref:t,sideCar:z}))});U.classNames=b.classNames;var $=U},86097:function(e,t,n){n.d(t,{EW:function(){return a}});var r=n(2265),o=0;function a(){r.useEffect(()=>{var e,t;let n=document.querySelectorAll("[data-radix-focus-guard]");return document.body.insertAdjacentElement("afterbegin",null!==(e=n[0])&&void 0!==e?e:c()),document.body.insertAdjacentElement("beforeend",null!==(t=n[1])&&void 0!==t?t:c()),o++,()=>{1===o&&document.querySelectorAll("[data-radix-focus-guard]").forEach(e=>e.remove()),o--}},[])}function c(){let e=document.createElement("span");return e.setAttribute("data-radix-focus-guard",""),e.tabIndex=0,e.style.outline="none",e.style.opacity="0",e.style.position="fixed",e.style.pointerEvents="none",e}},99103:function(e,t,n){let r;n.d(t,{M:function(){return f}});var o=n(2265),a=n(98575),c=n(66840),i=n(26606),u=n(57437),l="focusScope.autoFocusOnMount",d="focusScope.autoFocusOnUnmount",s={bubbles:!1,cancelable:!0},f=o.forwardRef((e,t)=>{let{loop:n=!1,trapped:r=!1,onMountAutoFocus:f,onUnmountAutoFocus:g,...y}=e,[b,E]=o.useState(null),w=(0,i.W)(f),S=(0,i.W)(g),k=o.useRef(null),C=(0,a.e)(t,e=>E(e)),A=o.useRef({paused:!1,pause(){this.paused=!0},resume(){this.paused=!1}}).current;o.useEffect(()=>{if(r){let e=function(e){if(A.paused||!b)return;let t=e.target;b.contains(t)?k.current=t:h(k.current,{select:!0})},t=function(e){if(A.paused||!b)return;let t=e.relatedTarget;null===t||b.contains(t)||h(k.current,{select:!0})};document.addEventListener("focusin",e),document.addEventListener("focusout",t);let n=new MutationObserver(function(e){if(document.activeElement===document.body)for(let t of e)t.removedNodes.length>0&&h(b)});return b&&n.observe(b,{childList:!0,subtree:!0}),()=>{document.removeEventListener("focusin",e),document.removeEventListener("focusout",t),n.disconnect()}}},[r,b,A.paused]),o.useEffect(()=>{if(b){m.add(A);let e=document.activeElement;if(!b.contains(e)){let t=new CustomEvent(l,s);b.addEventListener(l,w),b.dispatchEvent(t),t.defaultPrevented||(function(e){let{select:t=!1}=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{},n=document.activeElement;for(let r of e)if(h(r,{select:t}),document.activeElement!==n)return}(v(b).filter(e=>"A"!==e.tagName),{select:!0}),document.activeElement===e&&h(b))}return()=>{b.removeEventListener(l,w),setTimeout(()=>{let t=new CustomEvent(d,s);b.addEventListener(d,S),b.dispatchEvent(t),t.defaultPrevented||h(null!=e?e:document.body,{select:!0}),b.removeEventListener(d,S),m.remove(A)},0)}}},[b,w,S,A]);let N=o.useCallback(e=>{if(!n&&!r||A.paused)return;let t="Tab"===e.key&&!e.altKey&&!e.ctrlKey&&!e.metaKey,o=document.activeElement;if(t&&o){let t=e.currentTarget,[r,a]=function(e){let t=v(e);return[p(t,e),p(t.reverse(),e)]}(t);r&&a?e.shiftKey||o!==a?e.shiftKey&&o===r&&(e.preventDefault(),n&&h(a,{select:!0})):(e.preventDefault(),n&&h(r,{select:!0})):o===t&&e.preventDefault()}},[n,r,A.paused]);return(0,u.jsx)(c.WV.div,{tabIndex:-1,...y,ref:C,onKeyDown:N})});function v(e){let t=[],n=document.createTreeWalker(e,NodeFilter.SHOW_ELEMENT,{acceptNode:e=>{let t="INPUT"===e.tagName&&"hidden"===e.type;return e.disabled||e.hidden||t?NodeFilter.FILTER_SKIP:e.tabIndex>=0?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_SKIP}});for(;n.nextNode();)t.push(n.currentNode);return t}function p(e,t){for(let n of e)if(!function(e,t){let{upTo:n}=t;if("hidden"===getComputedStyle(e).visibility)return!0;for(;e&&(void 0===n||e!==n);){if("none"===getComputedStyle(e).display)return!0;e=e.parentElement}return!1}(n,{upTo:t}))return n}function h(e){let{select:t=!1}=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{};if(e&&e.focus){var n;let r=document.activeElement;e.focus({preventScroll:!0}),e!==r&&(n=e)instanceof HTMLInputElement&&"select"in n&&t&&e.select()}}f.displayName="FocusScope";var m=(r=[],{add(e){let t=r[0];e!==t&&(null==t||t.pause()),(r=g(r,e)).unshift(e)},remove(e){var t;null===(t=(r=g(r,e))[0])||void 0===t||t.resume()}});function g(e,t){let n=[...e],r=n.indexOf(t);return -1!==r&&n.splice(r,1),n}},90535:function(e,t,n){n.d(t,{j:function(){return c}});var r=n(61994);let o=e=>"boolean"==typeof e?`${e}`:0===e?"0":e,a=r.W,c=(e,t)=>n=>{var r;if((null==t?void 0:t.variants)==null)return a(e,null==n?void 0:n.class,null==n?void 0:n.className);let{variants:c,defaultVariants:i}=t,u=Object.keys(c).map(e=>{let t=null==n?void 0:n[e],r=null==i?void 0:i[e];if(null===t)return null;let a=o(t)||o(r);return c[e][a]}),l=n&&Object.entries(n).reduce((e,t)=>{let[n,r]=t;return void 0===r||(e[n]=r),e},{});return a(e,u,null==t?void 0:null===(r=t.compoundVariants)||void 0===r?void 0:r.reduce((e,t)=>{let{class:n,className:r,...o}=t;return Object.entries(o).every(e=>{let[t,n]=e;return Array.isArray(n)?n.includes({...i,...l}[t]):({...i,...l})[t]===n})?[...e,n,r]:e},[]),null==n?void 0:n.class,null==n?void 0:n.className)}},5853:function(e,t,n){n.d(t,{_T:function(){return o},ev:function(){return c},mG:function(){return a},pi:function(){return r}});var r=function(){return(r=Object.assign||function(e){for(var t,n=1,r=arguments.length;n<r;n++)for(var o in t=arguments[n])Object.prototype.hasOwnProperty.call(t,o)&&(e[o]=t[o]);return e}).apply(this,arguments)};function o(e,t){var n={};for(var r in e)Object.prototype.hasOwnProperty.call(e,r)&&0>t.indexOf(r)&&(n[r]=e[r]);if(null!=e&&"function"==typeof Object.getOwnPropertySymbols)for(var o=0,r=Object.getOwnPropertySymbols(e);o<r.length;o++)0>t.indexOf(r[o])&&Object.prototype.propertyIsEnumerable.call(e,r[o])&&(n[r[o]]=e[r[o]]);return n}function a(e,t,n,r){return new(n||(n=Promise))(function(o,a){function c(e){try{u(r.next(e))}catch(e){a(e)}}function i(e){try{u(r.throw(e))}catch(e){a(e)}}function u(e){var t;e.done?o(e.value):((t=e.value)instanceof n?t:new n(function(e){e(t)})).then(c,i)}u((r=r.apply(e,t||[])).next())})}function c(e,t,n){if(n||2==arguments.length)for(var r,o=0,a=t.length;o<a;o++)!r&&o in t||(r||(r=Array.prototype.slice.call(t,0,o)),r[o]=t[o]);return e.concat(r||Array.prototype.slice.call(t))}"function"==typeof SuppressedError&&SuppressedError}}]);