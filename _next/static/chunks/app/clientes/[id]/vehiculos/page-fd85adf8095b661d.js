(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[739],{62898:function(e,t,r){"use strict";r.d(t,{Z:function(){return createLucideIcon}});var n=r(2265),o={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"};/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let toKebabCase=e=>e.replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase().trim(),createLucideIcon=(e,t)=>{let r=(0,n.forwardRef)(({color:r="currentColor",size:u=24,strokeWidth:c=2,absoluteStrokeWidth:i,className:s="",children:a,...l},f)=>(0,n.createElement)("svg",{ref:f,...o,width:u,height:u,stroke:r,strokeWidth:i?24*Number(c)/Number(u):c,className:["lucide",`lucide-${toKebabCase(e)}`,s].join(" "),...l},[...t.map(([e,t])=>(0,n.createElement)(e,t)),...Array.isArray(a)?a:[a]]));return r.displayName=`${e}`,r}},82146:function(e,t,r){Promise.resolve().then(r.bind(r,32607))},85744:function(e,t,r){"use strict";function composeEventHandlers(e,t,{checkForDefaultPrevented:r=!0}={}){return function(n){if(e?.(n),!1===r||!n.defaultPrevented)return t?.(n)}}r.d(t,{M:function(){return composeEventHandlers}})},56989:function(e,t,r){"use strict";r.d(t,{b:function(){return createContextScope},k:function(){return createContext2}});var n=r(2265),o=r(57437);function createContext2(e,t){let r=n.createContext(t),Provider=e=>{let{children:t,...u}=e,c=n.useMemo(()=>u,Object.values(u));return(0,o.jsx)(r.Provider,{value:c,children:t})};return Provider.displayName=e+"Provider",[Provider,function(o){let u=n.useContext(r);if(u)return u;if(void 0!==t)return t;throw Error(`\`${o}\` must be used within \`${e}\``)}]}function createContextScope(e,t=[]){let r=[];function createContext3(t,u){let c=n.createContext(u),i=r.length;r=[...r,u];let Provider=t=>{let{scope:r,children:u,...s}=t,a=r?.[e]?.[i]||c,l=n.useMemo(()=>s,Object.values(s));return(0,o.jsx)(a.Provider,{value:l,children:u})};return Provider.displayName=t+"Provider",[Provider,function(r,o){let s=o?.[e]?.[i]||c,a=n.useContext(s);if(a)return a;if(void 0!==u)return u;throw Error(`\`${r}\` must be used within \`${t}\``)}]}let createScope=()=>{let t=r.map(e=>n.createContext(e));return function(r){let o=r?.[e]||t;return n.useMemo(()=>({[`__scope${e}`]:{...r,[e]:o}}),[r,o])}};return createScope.scopeName=e,[createContext3,composeContextScopes(createScope,...t)]}function composeContextScopes(...e){let t=e[0];if(1===e.length)return t;let createScope=()=>{let r=e.map(e=>({useScope:e(),scopeName:e.scopeName}));return function(e){let o=r.reduce((t,{useScope:r,scopeName:n})=>{let o=r(e),u=o[`__scope${n}`];return{...t,...u}},{});return n.useMemo(()=>({[`__scope${t.scopeName}`]:o}),[o])}};return createScope.scopeName=t.scopeName,createScope}},20966:function(e,t,r){"use strict";r.d(t,{M:function(){return useId}});var n,o=r(2265),u=r(51030),c=(n||(n=r.t(o,2)))["useId".toString()]||(()=>void 0),i=0;function useId(e){let[t,r]=o.useState(c());return(0,u.b)(()=>{e||r(e=>e??String(i++))},[e]),e||(t?`radix-${t}`:"")}},16459:function(e,t,r){"use strict";r.d(t,{W:function(){return useCallbackRef}});var n=r(2265);function useCallbackRef(e){let t=n.useRef(e);return n.useEffect(()=>{t.current=e}),n.useMemo(()=>(...e)=>t.current?.(...e),[])}},73763:function(e,t,r){"use strict";r.d(t,{T:function(){return useControllableState}});var n=r(2265),o=r(16459);function useControllableState({prop:e,defaultProp:t,onChange:r=()=>{}}){let[u,c]=useUncontrolledState({defaultProp:t,onChange:r}),i=void 0!==e,s=i?e:u,a=(0,o.W)(r),l=n.useCallback(t=>{if(i){let r="function"==typeof t?t(e):t;r!==e&&a(r)}else c(t)},[i,e,c,a]);return[s,l]}function useUncontrolledState({defaultProp:e,onChange:t}){let r=n.useState(e),[u]=r,c=n.useRef(u),i=(0,o.W)(t);return n.useEffect(()=>{c.current!==u&&(i(u),c.current=u)},[u,c,i]),r}},51030:function(e,t,r){"use strict";r.d(t,{b:function(){return o}});var n=r(2265),o=globalThis?.document?n.useLayoutEffect:()=>{}}},function(e){e.O(0,[660,682,82,584,607,971,472,744],function(){return e(e.s=82146)}),_N_E=e.O()}]);