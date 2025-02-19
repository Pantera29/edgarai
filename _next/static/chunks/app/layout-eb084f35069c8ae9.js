(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[3185],{63684:function(e,t,n){Promise.resolve().then(n.bind(n,12533)),Promise.resolve().then(n.bind(n,81103)),Promise.resolve().then(n.t.bind(n,44742,23)),Promise.resolve().then(n.t.bind(n,47960,23))},12533:function(e,t,n){"use strict";n.d(t,{ThemeProvider:function(){return p}});var r=n(57437),o=n(2265);let i=["light","dark"],a="(prefers-color-scheme: dark)",s="undefined"==typeof window,l=(0,o.createContext)(void 0),d=e=>(0,o.useContext)(l)?o.createElement(o.Fragment,null,e.children):o.createElement(c,e),u=["light","dark"],c=({forcedTheme:e,disableTransitionOnChange:t=!1,enableSystem:n=!0,enableColorScheme:r=!0,storageKey:s="theme",themes:d=u,defaultTheme:c=n?"system":"light",attribute:p="data-theme",value:y,children:g,nonce:b})=>{let[N,w]=(0,o.useState)(()=>f(s,c)),[T,E]=(0,o.useState)(()=>f(s)),S=y?Object.values(y):d,$=(0,o.useCallback)(e=>{let o=e;if(!o)return;"system"===e&&n&&(o=v());let a=y?y[o]:o,s=t?h():null,l=document.documentElement;if("class"===p?(l.classList.remove(...S),a&&l.classList.add(a)):a?l.setAttribute(p,a):l.removeAttribute(p),r){let e=i.includes(c)?c:null,t=i.includes(o)?o:e;l.style.colorScheme=t}null==s||s()},[]),O=(0,o.useCallback)(e=>{w(e);try{localStorage.setItem(s,e)}catch(e){}},[e]),_=(0,o.useCallback)(t=>{E(v(t)),"system"===N&&n&&!e&&$("system")},[N,e]);(0,o.useEffect)(()=>{let e=window.matchMedia(a);return e.addListener(_),_(e),()=>e.removeListener(_)},[_]),(0,o.useEffect)(()=>{let e=e=>{e.key===s&&O(e.newValue||c)};return window.addEventListener("storage",e),()=>window.removeEventListener("storage",e)},[O]),(0,o.useEffect)(()=>{$(null!=e?e:N)},[e,N]);let C=(0,o.useMemo)(()=>({theme:N,setTheme:O,forcedTheme:e,resolvedTheme:"system"===N?T:N,themes:n?[...d,"system"]:d,systemTheme:n?T:void 0}),[N,O,e,T,n,d]);return o.createElement(l.Provider,{value:C},o.createElement(m,{forcedTheme:e,disableTransitionOnChange:t,enableSystem:n,enableColorScheme:r,storageKey:s,themes:d,defaultTheme:c,attribute:p,value:y,children:g,attrs:S,nonce:b}),g)},m=(0,o.memo)(({forcedTheme:e,storageKey:t,attribute:n,enableSystem:r,enableColorScheme:s,defaultTheme:l,value:d,attrs:u,nonce:c})=>{let m="system"===l,f="class"===n?`var d=document.documentElement,c=d.classList;c.remove(${u.map(e=>`'${e}'`).join(",")});`:`var d=document.documentElement,n='${n}',s='setAttribute';`,h=s?i.includes(l)&&l?`if(e==='light'||e==='dark'||!e)d.style.colorScheme=e||'${l}'`:"if(e==='light'||e==='dark')d.style.colorScheme=e":"",v=(e,t=!1,r=!0)=>{let o=d?d[e]:e,a=t?e+"|| ''":`'${o}'`,l="";return s&&r&&!t&&i.includes(e)&&(l+=`d.style.colorScheme = '${e}';`),"class"===n?l+=t||o?`c.add(${a})`:"null":o&&(l+=`d[s](n,${a})`),l},p=e?`!function(){${f}${v(e)}}()`:r?`!function(){try{${f}var e=localStorage.getItem('${t}');if('system'===e||(!e&&${m})){var t='${a}',m=window.matchMedia(t);if(m.media!==t||m.matches){${v("dark")}}else{${v("light")}}}else if(e){${d?`var x=${JSON.stringify(d)};`:""}${v(d?"x[e]":"e",!0)}}${m?"":"else{"+v(l,!1,!1)+"}"}${h}}catch(e){}}()`:`!function(){try{${f}var e=localStorage.getItem('${t}');if(e){${d?`var x=${JSON.stringify(d)};`:""}${v(d?"x[e]":"e",!0)}}else{${v(l,!1,!1)};}${h}}catch(t){}}();`;return o.createElement("script",{nonce:c,dangerouslySetInnerHTML:{__html:p}})},()=>!0),f=(e,t)=>{let n;if(!s){try{n=localStorage.getItem(e)||void 0}catch(e){}return n||t}},h=()=>{let e=document.createElement("style");return e.appendChild(document.createTextNode("*{-webkit-transition:none!important;-moz-transition:none!important;-o-transition:none!important;-ms-transition:none!important;transition:none!important}")),document.head.appendChild(e),()=>{window.getComputedStyle(document.body),setTimeout(()=>{document.head.removeChild(e)},1)}},v=e=>(e||(e=window.matchMedia(a)),e.matches?"dark":"light");function p(e){let{children:t,...n}=e;return(0,r.jsx)(d,{...n,children:t})}},81103:function(e,t,n){"use strict";n.d(t,{TooltipProvider:function(){return s},_v:function(){return u},aJ:function(){return d},u:function(){return l}});var r=n(57437),o=n(2265),i=n(61312),a=n(94508);let s=i.zt,l=i.fC,d=i.xz,u=o.forwardRef((e,t)=>{let{className:n,sideOffset:o=4,...s}=e;return(0,r.jsx)(i.VY,{ref:t,sideOffset:o,className:(0,a.cn)("z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",n),...s})});u.displayName=i.VY.displayName},94508:function(e,t,n){"use strict";n.d(t,{S:function(){return a},cn:function(){return i}});var r=n(61994),o=n(53335);function i(){for(var e=arguments.length,t=Array(e),n=0;n<e;n++)t[n]=arguments[n];return(0,o.m6)((0,r.W)(t))}function a(){return"/edgarai"}},47960:function(){},44742:function(e){e.exports={style:{fontFamily:"'__Inter_d65c78', '__Inter_Fallback_d65c78'",fontStyle:"normal"},className:"__className_d65c78"}},71599:function(e,t,n){"use strict";n.d(t,{z:function(){return a}});var r=n(2265),o=n(98575),i=n(61188),a=e=>{var t,n;let a,l;let{present:d,children:u}=e,c=function(e){var t,n;let[o,a]=r.useState(),l=r.useRef({}),d=r.useRef(e),u=r.useRef("none"),[c,m]=(t=e?"mounted":"unmounted",n={mounted:{UNMOUNT:"unmounted",ANIMATION_OUT:"unmountSuspended"},unmountSuspended:{MOUNT:"mounted",ANIMATION_END:"unmounted"},unmounted:{MOUNT:"mounted"}},r.useReducer((e,t)=>{let r=n[e][t];return null!=r?r:e},t));return r.useEffect(()=>{let e=s(l.current);u.current="mounted"===c?e:"none"},[c]),(0,i.b)(()=>{let t=l.current,n=d.current;if(n!==e){let r=u.current,o=s(t);e?m("MOUNT"):"none"===o||(null==t?void 0:t.display)==="none"?m("UNMOUNT"):n&&r!==o?m("ANIMATION_OUT"):m("UNMOUNT"),d.current=e}},[e,m]),(0,i.b)(()=>{if(o){var e;let t;let n=null!==(e=o.ownerDocument.defaultView)&&void 0!==e?e:window,r=e=>{let r=s(l.current).includes(e.animationName);if(e.target===o&&r&&(m("ANIMATION_END"),!d.current)){let e=o.style.animationFillMode;o.style.animationFillMode="forwards",t=n.setTimeout(()=>{"forwards"===o.style.animationFillMode&&(o.style.animationFillMode=e)})}},i=e=>{e.target===o&&(u.current=s(l.current))};return o.addEventListener("animationstart",i),o.addEventListener("animationcancel",r),o.addEventListener("animationend",r),()=>{n.clearTimeout(t),o.removeEventListener("animationstart",i),o.removeEventListener("animationcancel",r),o.removeEventListener("animationend",r)}}m("ANIMATION_END")},[o,m]),{isPresent:["mounted","unmountSuspended"].includes(c),ref:r.useCallback(e=>{e&&(l.current=getComputedStyle(e)),a(e)},[])}}(d),m="function"==typeof u?u({present:c.isPresent}):r.Children.only(u),f=(0,o.e)(c.ref,(a=null===(t=Object.getOwnPropertyDescriptor(m.props,"ref"))||void 0===t?void 0:t.get)&&"isReactWarning"in a&&a.isReactWarning?m.ref:(a=null===(n=Object.getOwnPropertyDescriptor(m,"ref"))||void 0===n?void 0:n.get)&&"isReactWarning"in a&&a.isReactWarning?m.props.ref:m.props.ref||m.ref);return"function"==typeof u||c.isPresent?r.cloneElement(m,{ref:f}):null};function s(e){return(null==e?void 0:e.animationName)||"none"}a.displayName="Presence"},95098:function(e,t,n){"use strict";n.d(t,{T:function(){return a},f:function(){return s}});var r=n(2265),o=n(66840),i=n(57437),a=r.forwardRef((e,t)=>(0,i.jsx)(o.WV.span,{...e,ref:t,style:{position:"absolute",border:0,width:1,height:1,padding:0,margin:-1,overflow:"hidden",clip:"rect(0, 0, 0, 0)",whiteSpace:"nowrap",wordWrap:"normal",...e.style}}));a.displayName="VisuallyHidden";var s=a}},function(e){e.O(0,[3540,6137,8841,6008,1312,2971,2117,1744],function(){return e(e.s=63684)}),_N_E=e.O()}]);