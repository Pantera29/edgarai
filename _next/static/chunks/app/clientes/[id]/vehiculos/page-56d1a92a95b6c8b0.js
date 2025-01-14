(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[739],{62898:function(e,n,t){"use strict";t.d(n,{Z:function(){return createLucideIcon}});var r=t(2265),i={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"};/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let toKebabCase=e=>e.replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase().trim(),createLucideIcon=(e,n)=>{let t=(0,r.forwardRef)(({color:t="currentColor",size:u=24,strokeWidth:o=2,absoluteStrokeWidth:a,className:s="",children:l,...c},d)=>(0,r.createElement)("svg",{ref:d,...i,width:u,height:u,stroke:t,strokeWidth:a?24*Number(o)/Number(u):o,className:["lucide",`lucide-${toKebabCase(e)}`,s].join(" "),...c},[...n.map(([e,n])=>(0,r.createElement)(e,n)),...Array.isArray(l)?l:[l]]));return t.displayName=`${e}`,t}},82146:function(e,n,t){Promise.resolve().then(t.bind(t,32607))},85744:function(e,n,t){"use strict";function composeEventHandlers(e,n,{checkForDefaultPrevented:t=!0}={}){return function(r){if(e?.(r),!1===t||!r.defaultPrevented)return n?.(r)}}t.d(n,{M:function(){return composeEventHandlers}})},20966:function(e,n,t){"use strict";t.d(n,{M:function(){return useId}});var r,i=t(2265),u=t(51030),o=(r||(r=t.t(i,2)))["useId".toString()]||(()=>void 0),a=0;function useId(e){let[n,t]=i.useState(o());return(0,u.b)(()=>{e||t(e=>e??String(a++))},[e]),e||(n?`radix-${n}`:"")}},85606:function(e,n,t){"use strict";t.d(n,{z:function(){return Presence}});var r=t(2265),i=t(42210),u=t(51030);function useStateMachine(e,n){return r.useReducer((e,t)=>{let r=n[e][t];return r??e},e)}var Presence=e=>{let{present:n,children:t}=e,u=usePresence(n),o="function"==typeof t?t({present:u.isPresent}):r.Children.only(t),a=(0,i.e)(u.ref,getElementRef(o)),s="function"==typeof t;return s||u.isPresent?r.cloneElement(o,{ref:a}):null};function usePresence(e){let[n,t]=r.useState(),i=r.useRef({}),o=r.useRef(e),a=r.useRef("none"),s=e?"mounted":"unmounted",[l,c]=useStateMachine(s,{mounted:{UNMOUNT:"unmounted",ANIMATION_OUT:"unmountSuspended"},unmountSuspended:{MOUNT:"mounted",ANIMATION_END:"unmounted"},unmounted:{MOUNT:"mounted"}});return r.useEffect(()=>{let e=getAnimationName(i.current);a.current="mounted"===l?e:"none"},[l]),(0,u.b)(()=>{let n=i.current,t=o.current,r=t!==e;if(r){let r=a.current,i=getAnimationName(n);e?c("MOUNT"):"none"===i||n?.display==="none"?c("UNMOUNT"):t&&r!==i?c("ANIMATION_OUT"):c("UNMOUNT"),o.current=e}},[e,c]),(0,u.b)(()=>{if(n){let e;let t=n.ownerDocument.defaultView??window,handleAnimationEnd=r=>{let u=getAnimationName(i.current),a=u.includes(r.animationName);if(r.target===n&&a&&(c("ANIMATION_END"),!o.current)){let r=n.style.animationFillMode;n.style.animationFillMode="forwards",e=t.setTimeout(()=>{"forwards"===n.style.animationFillMode&&(n.style.animationFillMode=r)})}},handleAnimationStart=e=>{e.target===n&&(a.current=getAnimationName(i.current))};return n.addEventListener("animationstart",handleAnimationStart),n.addEventListener("animationcancel",handleAnimationEnd),n.addEventListener("animationend",handleAnimationEnd),()=>{t.clearTimeout(e),n.removeEventListener("animationstart",handleAnimationStart),n.removeEventListener("animationcancel",handleAnimationEnd),n.removeEventListener("animationend",handleAnimationEnd)}}c("ANIMATION_END")},[n,c]),{isPresent:["mounted","unmountSuspended"].includes(l),ref:r.useCallback(e=>{e&&(i.current=getComputedStyle(e)),t(e)},[])}}function getAnimationName(e){return e?.animationName||"none"}function getElementRef(e){let n=Object.getOwnPropertyDescriptor(e.props,"ref")?.get,t=n&&"isReactWarning"in n&&n.isReactWarning;return t?e.ref:(t=(n=Object.getOwnPropertyDescriptor(e,"ref")?.get)&&"isReactWarning"in n&&n.isReactWarning)?e.props.ref:e.props.ref||e.ref}Presence.displayName="Presence"},16459:function(e,n,t){"use strict";t.d(n,{W:function(){return useCallbackRef}});var r=t(2265);function useCallbackRef(e){let n=r.useRef(e);return r.useEffect(()=>{n.current=e}),r.useMemo(()=>(...e)=>n.current?.(...e),[])}},73763:function(e,n,t){"use strict";t.d(n,{T:function(){return useControllableState}});var r=t(2265),i=t(16459);function useControllableState({prop:e,defaultProp:n,onChange:t=()=>{}}){let[u,o]=useUncontrolledState({defaultProp:n,onChange:t}),a=void 0!==e,s=a?e:u,l=(0,i.W)(t),c=r.useCallback(n=>{if(a){let t="function"==typeof n?n(e):n;t!==e&&l(t)}else o(n)},[a,e,o,l]);return[s,c]}function useUncontrolledState({defaultProp:e,onChange:n}){let t=r.useState(e),[u]=t,o=r.useRef(u),a=(0,i.W)(n);return r.useEffect(()=>{o.current!==u&&(a(u),o.current=u)},[u,o,a]),t}},51030:function(e,n,t){"use strict";t.d(n,{b:function(){return i}});var r=t(2265),i=globalThis?.document?r.useLayoutEffect:()=>{}},96061:function(e,n,t){"use strict";t.d(n,{j:function(){return cva}});var r=t(57042);let falsyToString=e=>"boolean"==typeof e?`${e}`:0===e?"0":e,i=r.W,cva=(e,n)=>t=>{var r;if((null==n?void 0:n.variants)==null)return i(e,null==t?void 0:t.class,null==t?void 0:t.className);let{variants:u,defaultVariants:o}=n,a=Object.keys(u).map(e=>{let n=null==t?void 0:t[e],r=null==o?void 0:o[e];if(null===n)return null;let i=falsyToString(n)||falsyToString(r);return u[e][i]}),s=t&&Object.entries(t).reduce((e,n)=>{let[t,r]=n;return void 0===r||(e[t]=r),e},{}),l=null==n?void 0:null===(r=n.compoundVariants)||void 0===r?void 0:r.reduce((e,n)=>{let{class:t,className:r,...i}=n;return Object.entries(i).every(e=>{let[n,t]=e;return Array.isArray(t)?t.includes({...o,...s}[n]):({...o,...s})[n]===t})?[...e,t,r]:e},[]);return i(e,a,l,null==t?void 0:t.class,null==t?void 0:t.className)}}},function(e){e.O(0,[360,580,432,607,971,472,744],function(){return e(e.s=82146)}),_N_E=e.O()}]);