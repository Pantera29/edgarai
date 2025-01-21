"use strict";(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[3513],{67822:function(e,t,n){n.d(t,{B:function(){return a}});var r=n(2265),o=n(73966),u=n(98575),i=n(37053),l=n(57437);function a(e){let t=e+"CollectionProvider",[n,a]=(0,o.b)(t),[c,s]=n(t,{collectionRef:{current:null},itemMap:new Map}),f=e=>{let{scope:t,children:n}=e,o=r.useRef(null),u=r.useRef(new Map).current;return(0,l.jsx)(c,{scope:t,itemMap:u,collectionRef:o,children:n})};f.displayName=t;let d=e+"CollectionSlot",m=r.forwardRef((e,t)=>{let{scope:n,children:r}=e,o=s(d,n),a=(0,u.e)(t,o.collectionRef);return(0,l.jsx)(i.g7,{ref:a,children:r})});m.displayName=d;let p=e+"CollectionItemSlot",v="data-radix-collection-item",w=r.forwardRef((e,t)=>{let{scope:n,children:o,...a}=e,c=r.useRef(null),f=(0,u.e)(t,c),d=s(p,n);return r.useEffect(()=>(d.itemMap.set(c,{ref:c,...a}),()=>void d.itemMap.delete(c))),(0,l.jsx)(i.g7,{[v]:"",ref:f,children:o})});return w.displayName=p,[{Provider:f,Slot:m,ItemSlot:w},function(t){let n=s(e+"CollectionConsumer",t);return r.useCallback(()=>{let e=n.collectionRef.current;if(!e)return[];let t=Array.from(e.querySelectorAll("[".concat(v,"]")));return Array.from(n.itemMap.values()).sort((e,n)=>t.indexOf(e.ref.current)-t.indexOf(n.ref.current))},[n.collectionRef,n.itemMap])},a]}},29114:function(e,t,n){n.d(t,{gm:function(){return u}});var r=n(2265);n(57437);var o=r.createContext(void 0);function u(e){let t=r.useContext(o);return e||t||"ltr"}},71599:function(e,t,n){n.d(t,{z:function(){return i}});var r=n(2265),o=n(98575),u=n(61188),i=e=>{var t,n;let i,a;let{present:c,children:s}=e,f=function(e){var t,n;let[o,i]=r.useState(),a=r.useRef({}),c=r.useRef(e),s=r.useRef("none"),[f,d]=(t=e?"mounted":"unmounted",n={mounted:{UNMOUNT:"unmounted",ANIMATION_OUT:"unmountSuspended"},unmountSuspended:{MOUNT:"mounted",ANIMATION_END:"unmounted"},unmounted:{MOUNT:"mounted"}},r.useReducer((e,t)=>{let r=n[e][t];return null!=r?r:e},t));return r.useEffect(()=>{let e=l(a.current);s.current="mounted"===f?e:"none"},[f]),(0,u.b)(()=>{let t=a.current,n=c.current;if(n!==e){let r=s.current,o=l(t);e?d("MOUNT"):"none"===o||(null==t?void 0:t.display)==="none"?d("UNMOUNT"):n&&r!==o?d("ANIMATION_OUT"):d("UNMOUNT"),c.current=e}},[e,d]),(0,u.b)(()=>{if(o){var e;let t;let n=null!==(e=o.ownerDocument.defaultView)&&void 0!==e?e:window,r=e=>{let r=l(a.current).includes(e.animationName);if(e.target===o&&r&&(d("ANIMATION_END"),!c.current)){let e=o.style.animationFillMode;o.style.animationFillMode="forwards",t=n.setTimeout(()=>{"forwards"===o.style.animationFillMode&&(o.style.animationFillMode=e)})}},u=e=>{e.target===o&&(s.current=l(a.current))};return o.addEventListener("animationstart",u),o.addEventListener("animationcancel",r),o.addEventListener("animationend",r),()=>{n.clearTimeout(t),o.removeEventListener("animationstart",u),o.removeEventListener("animationcancel",r),o.removeEventListener("animationend",r)}}d("ANIMATION_END")},[o,d]),{isPresent:["mounted","unmountSuspended"].includes(f),ref:r.useCallback(e=>{e&&(a.current=getComputedStyle(e)),i(e)},[])}}(c),d="function"==typeof s?s({present:f.isPresent}):r.Children.only(s),m=(0,o.e)(f.ref,(i=null===(t=Object.getOwnPropertyDescriptor(d.props,"ref"))||void 0===t?void 0:t.get)&&"isReactWarning"in i&&i.isReactWarning?d.ref:(i=null===(n=Object.getOwnPropertyDescriptor(d,"ref"))||void 0===n?void 0:n.get)&&"isReactWarning"in i&&i.isReactWarning?d.props.ref:d.props.ref||d.ref);return"function"==typeof s||f.isPresent?r.cloneElement(d,{ref:m}):null};function l(e){return(null==e?void 0:e.animationName)||"none"}i.displayName="Presence"},1353:function(e,t,n){n.d(t,{Pc:function(){return R},ck:function(){return F},fC:function(){return O}});var r=n(2265),o=n(6741),u=n(67822),i=n(98575),l=n(73966),a=n(99255),c=n(66840),s=n(26606),f=n(80886),d=n(29114),m=n(57437),p="rovingFocusGroup.onEntryFocus",v={bubbles:!1,cancelable:!0},w="RovingFocusGroup",[g,M,y]=(0,u.B)(w),[N,R]=(0,l.b)(w,[y]),[b,A]=N(w),T=r.forwardRef((e,t)=>(0,m.jsx)(g.Provider,{scope:e.__scopeRovingFocusGroup,children:(0,m.jsx)(g.Slot,{scope:e.__scopeRovingFocusGroup,children:(0,m.jsx)(I,{...e,ref:t})})}));T.displayName=w;var I=r.forwardRef((e,t)=>{let{__scopeRovingFocusGroup:n,orientation:u,loop:l=!1,dir:a,currentTabStopId:w,defaultCurrentTabStopId:g,onCurrentTabStopIdChange:y,onEntryFocus:N,preventScrollOnEntryFocus:R=!1,...A}=e,T=r.useRef(null),I=(0,i.e)(t,T),E=(0,d.gm)(a),[h=null,x]=(0,f.T)({prop:w,defaultProp:g,onChange:y}),[O,F]=r.useState(!1),S=(0,s.W)(N),D=M(n),P=r.useRef(!1),[U,k]=r.useState(0);return r.useEffect(()=>{let e=T.current;if(e)return e.addEventListener(p,S),()=>e.removeEventListener(p,S)},[S]),(0,m.jsx)(b,{scope:n,orientation:u,dir:E,loop:l,currentTabStopId:h,onItemFocus:r.useCallback(e=>x(e),[x]),onItemShiftTab:r.useCallback(()=>F(!0),[]),onFocusableItemAdd:r.useCallback(()=>k(e=>e+1),[]),onFocusableItemRemove:r.useCallback(()=>k(e=>e-1),[]),children:(0,m.jsx)(c.WV.div,{tabIndex:O||0===U?-1:0,"data-orientation":u,...A,ref:I,style:{outline:"none",...e.style},onMouseDown:(0,o.M)(e.onMouseDown,()=>{P.current=!0}),onFocus:(0,o.M)(e.onFocus,e=>{let t=!P.current;if(e.target===e.currentTarget&&t&&!O){let t=new CustomEvent(p,v);if(e.currentTarget.dispatchEvent(t),!t.defaultPrevented){let e=D().filter(e=>e.focusable);C([e.find(e=>e.active),e.find(e=>e.id===h),...e].filter(Boolean).map(e=>e.ref.current),R)}}P.current=!1}),onBlur:(0,o.M)(e.onBlur,()=>F(!1))})})}),E="RovingFocusGroupItem",h=r.forwardRef((e,t)=>{let{__scopeRovingFocusGroup:n,focusable:u=!0,active:i=!1,tabStopId:l,...s}=e,f=(0,a.M)(),d=l||f,p=A(E,n),v=p.currentTabStopId===d,w=M(n),{onFocusableItemAdd:y,onFocusableItemRemove:N}=p;return r.useEffect(()=>{if(u)return y(),()=>N()},[u,y,N]),(0,m.jsx)(g.ItemSlot,{scope:n,id:d,focusable:u,active:i,children:(0,m.jsx)(c.WV.span,{tabIndex:v?0:-1,"data-orientation":p.orientation,...s,ref:t,onMouseDown:(0,o.M)(e.onMouseDown,e=>{u?p.onItemFocus(d):e.preventDefault()}),onFocus:(0,o.M)(e.onFocus,()=>p.onItemFocus(d)),onKeyDown:(0,o.M)(e.onKeyDown,e=>{if("Tab"===e.key&&e.shiftKey){p.onItemShiftTab();return}if(e.target!==e.currentTarget)return;let t=function(e,t,n){var r;let o=(r=e.key,"rtl"!==n?r:"ArrowLeft"===r?"ArrowRight":"ArrowRight"===r?"ArrowLeft":r);if(!("vertical"===t&&["ArrowLeft","ArrowRight"].includes(o))&&!("horizontal"===t&&["ArrowUp","ArrowDown"].includes(o)))return x[o]}(e,p.orientation,p.dir);if(void 0!==t){if(e.metaKey||e.ctrlKey||e.altKey||e.shiftKey)return;e.preventDefault();let o=w().filter(e=>e.focusable).map(e=>e.ref.current);if("last"===t)o.reverse();else if("prev"===t||"next"===t){var n,r;"prev"===t&&o.reverse();let u=o.indexOf(e.currentTarget);o=p.loop?(n=o,r=u+1,n.map((e,t)=>n[(r+t)%n.length])):o.slice(u+1)}setTimeout(()=>C(o))}})})})});h.displayName=E;var x={ArrowLeft:"prev",ArrowUp:"prev",ArrowRight:"next",ArrowDown:"next",PageUp:"first",Home:"first",PageDown:"last",End:"last"};function C(e){let t=arguments.length>1&&void 0!==arguments[1]&&arguments[1],n=document.activeElement;for(let r of e)if(r===n||(r.focus({preventScroll:t}),document.activeElement!==n))return}var O=T,F=h}}]);