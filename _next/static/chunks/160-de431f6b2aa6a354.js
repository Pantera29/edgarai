"use strict";(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[160],{17158:function(e,n,r){r.d(n,{Z:function(){return o}});var t=r(62898);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let o=(0,t.Z)("ChevronRight",[["path",{d:"m9 18 6-6-6-6",key:"mthhwq"}]])},76369:function(e,n,r){r.d(n,{Z:function(){return o}});var t=r(62898);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let o=(0,t.Z)("Circle",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}]])},17472:function(e,n,r){r.d(n,{Z:function(){return o}});var t=r(62898);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let o=(0,t.Z)("MoreHorizontal",[["circle",{cx:"12",cy:"12",r:"1",key:"41hilf"}],["circle",{cx:"19",cy:"12",r:"1",key:"1wjl8i"}],["circle",{cx:"5",cy:"12",r:"1",key:"1pcz8c"}]])},23291:function(e,n,r){r.d(n,{oC:function(){return eJ},VY:function(){return eX},ZA:function(){return eY},ck:function(){return eq},wU:function(){return e0},__:function(){return eH},Uv:function(){return eB},Ee:function(){return eQ},Rk:function(){return e$},fC:function(){return eU},Z0:function(){return e1},Tr:function(){return Sub2},tu:function(){return e6},fF:function(){return e2},xz:function(){return ez}});var t=r(2265),o=r(85744),a=r(42210),u=r(56989),i=r(73763),l=r(9381),c=r(27733),d=r(65400),s=r(79249),p=r(31244),f=r(52759),h=r(20966),g=r(64402),w=r(52730),v=r(85606),m=r(44356),M=r(67256),x=r(16459),y=r(85859),C=r(73386),b=r(57437),D=["Enter"," "],j=["ArrowUp","PageDown","End"],R=["ArrowDown","PageUp","Home",...j],P={ltr:[...D,"ArrowRight"],rtl:[...D,"ArrowLeft"]},k={ltr:["ArrowLeft"],rtl:["ArrowRight"]},_="Menu",[I,S,E]=(0,c.B)(_),[T,N]=(0,u.b)(_,[E,g.D7,m.Pc]),O=(0,g.D7)(),F=(0,m.Pc)(),[A,K]=T(_),[L,V]=T(_),Menu=e=>{let{__scopeMenu:n,open:r=!1,children:o,dir:a,onOpenChange:u,modal:i=!0}=e,l=O(n),[c,s]=t.useState(null),p=t.useRef(!1),f=(0,x.W)(u),h=(0,d.gm)(a);return t.useEffect(()=>{let handleKeyDown=()=>{p.current=!0,document.addEventListener("pointerdown",handlePointer,{capture:!0,once:!0}),document.addEventListener("pointermove",handlePointer,{capture:!0,once:!0})},handlePointer=()=>p.current=!1;return document.addEventListener("keydown",handleKeyDown,{capture:!0}),()=>{document.removeEventListener("keydown",handleKeyDown,{capture:!0}),document.removeEventListener("pointerdown",handlePointer,{capture:!0}),document.removeEventListener("pointermove",handlePointer,{capture:!0})}},[]),(0,b.jsx)(g.fC,{...l,children:(0,b.jsx)(A,{scope:n,open:r,onOpenChange:f,content:c,onContentChange:s,children:(0,b.jsx)(L,{scope:n,onClose:t.useCallback(()=>f(!1),[f]),isUsingKeyboardRef:p,dir:h,modal:i,children:o})})})};Menu.displayName=_;var G=t.forwardRef((e,n)=>{let{__scopeMenu:r,...t}=e,o=O(r);return(0,b.jsx)(g.ee,{...o,...t,ref:n})});G.displayName="MenuAnchor";var W="MenuPortal",[Z,U]=T(W,{forceMount:void 0}),MenuPortal=e=>{let{__scopeMenu:n,forceMount:r,children:t,container:o}=e,a=K(W,n);return(0,b.jsx)(Z,{scope:n,forceMount:r,children:(0,b.jsx)(v.z,{present:r||a.open,children:(0,b.jsx)(w.h,{asChild:!0,container:o,children:t})})})};MenuPortal.displayName=W;var z="MenuContent",[B,X]=T(z),Y=t.forwardRef((e,n)=>{let r=U(z,e.__scopeMenu),{forceMount:t=r.forceMount,...o}=e,a=K(z,e.__scopeMenu),u=V(z,e.__scopeMenu);return(0,b.jsx)(I.Provider,{scope:e.__scopeMenu,children:(0,b.jsx)(v.z,{present:t||a.open,children:(0,b.jsx)(I.Slot,{scope:e.__scopeMenu,children:u.modal?(0,b.jsx)(H,{...o,ref:n}):(0,b.jsx)(q,{...o,ref:n})})})})}),H=t.forwardRef((e,n)=>{let r=K(z,e.__scopeMenu),u=t.useRef(null),i=(0,a.e)(n,u);return t.useEffect(()=>{let e=u.current;if(e)return(0,y.Ry)(e)},[]),(0,b.jsx)(J,{...e,ref:i,trapFocus:r.open,disableOutsidePointerEvents:r.open,disableOutsideScroll:!0,onFocusOutside:(0,o.M)(e.onFocusOutside,e=>e.preventDefault(),{checkForDefaultPrevented:!1}),onDismiss:()=>r.onOpenChange(!1)})}),q=t.forwardRef((e,n)=>{let r=K(z,e.__scopeMenu);return(0,b.jsx)(J,{...e,ref:n,trapFocus:!1,disableOutsidePointerEvents:!1,disableOutsideScroll:!1,onDismiss:()=>r.onOpenChange(!1)})}),J=t.forwardRef((e,n)=>{let{__scopeMenu:r,loop:u=!1,trapFocus:i,onOpenAutoFocus:l,onCloseAutoFocus:c,disableOutsidePointerEvents:d,onEntryFocus:h,onEscapeKeyDown:w,onPointerDownOutside:v,onFocusOutside:x,onInteractOutside:y,onDismiss:D,disableOutsideScroll:P,...k}=e,_=K(z,r),I=V(z,r),E=O(r),T=F(r),N=S(r),[A,L]=t.useState(null),G=t.useRef(null),W=(0,a.e)(n,G,_.onContentChange),Z=t.useRef(0),U=t.useRef(""),X=t.useRef(0),Y=t.useRef(null),H=t.useRef("right"),q=t.useRef(0),J=P?C.Z:t.Fragment,Q=P?{as:M.g7,allowPinchZoom:!0}:void 0,handleTypeaheadSearch=e=>{let n=U.current+e,r=N().filter(e=>!e.disabled),t=document.activeElement,o=r.find(e=>e.ref.current===t)?.textValue,a=r.map(e=>e.textValue),u=getNextMatch(a,n,o),i=r.find(e=>e.textValue===u)?.ref.current;!function updateSearch(e){U.current=e,window.clearTimeout(Z.current),""!==e&&(Z.current=window.setTimeout(()=>updateSearch(""),1e3))}(n),i&&setTimeout(()=>i.focus())};t.useEffect(()=>()=>window.clearTimeout(Z.current),[]),(0,p.EW)();let $=t.useCallback(e=>{let n=H.current===Y.current?.side;return n&&isPointerInGraceArea(e,Y.current?.area)},[]);return(0,b.jsx)(B,{scope:r,searchRef:U,onItemEnter:t.useCallback(e=>{$(e)&&e.preventDefault()},[$]),onItemLeave:t.useCallback(e=>{$(e)||(G.current?.focus(),L(null))},[$]),onTriggerLeave:t.useCallback(e=>{$(e)&&e.preventDefault()},[$]),pointerGraceTimerRef:X,onPointerGraceIntentChange:t.useCallback(e=>{Y.current=e},[]),children:(0,b.jsx)(J,{...Q,children:(0,b.jsx)(f.M,{asChild:!0,trapped:i,onMountAutoFocus:(0,o.M)(l,e=>{e.preventDefault(),G.current?.focus({preventScroll:!0})}),onUnmountAutoFocus:c,children:(0,b.jsx)(s.XB,{asChild:!0,disableOutsidePointerEvents:d,onEscapeKeyDown:w,onPointerDownOutside:v,onFocusOutside:x,onInteractOutside:y,onDismiss:D,children:(0,b.jsx)(m.fC,{asChild:!0,...T,dir:I.dir,orientation:"vertical",loop:u,currentTabStopId:A,onCurrentTabStopIdChange:L,onEntryFocus:(0,o.M)(h,e=>{I.isUsingKeyboardRef.current||e.preventDefault()}),preventScrollOnEntryFocus:!0,children:(0,b.jsx)(g.VY,{role:"menu","aria-orientation":"vertical","data-state":getOpenState(_.open),"data-radix-menu-content":"",dir:I.dir,...E,...k,ref:W,style:{outline:"none",...k.style},onKeyDown:(0,o.M)(k.onKeyDown,e=>{let n=e.target,r=n.closest("[data-radix-menu-content]")===e.currentTarget,t=e.ctrlKey||e.altKey||e.metaKey,o=1===e.key.length;r&&("Tab"===e.key&&e.preventDefault(),!t&&o&&handleTypeaheadSearch(e.key));let a=G.current;if(e.target!==a||!R.includes(e.key))return;e.preventDefault();let u=N().filter(e=>!e.disabled),i=u.map(e=>e.ref.current);j.includes(e.key)&&i.reverse(),focusFirst(i)}),onBlur:(0,o.M)(e.onBlur,e=>{e.currentTarget.contains(e.target)||(window.clearTimeout(Z.current),U.current="")}),onPointerMove:(0,o.M)(e.onPointerMove,whenMouse(e=>{let n=e.target,r=q.current!==e.clientX;if(e.currentTarget.contains(n)&&r){let n=e.clientX>q.current?"right":"left";H.current=n,q.current=e.clientX}}))})})})})})})});Y.displayName=z;var Q=t.forwardRef((e,n)=>{let{__scopeMenu:r,...t}=e;return(0,b.jsx)(l.WV.div,{role:"group",...t,ref:n})});Q.displayName="MenuGroup";var $=t.forwardRef((e,n)=>{let{__scopeMenu:r,...t}=e;return(0,b.jsx)(l.WV.div,{...t,ref:n})});$.displayName="MenuLabel";var ee="MenuItem",en="menu.itemSelect",er=t.forwardRef((e,n)=>{let{disabled:r=!1,onSelect:u,...i}=e,c=t.useRef(null),d=V(ee,e.__scopeMenu),s=X(ee,e.__scopeMenu),p=(0,a.e)(n,c),f=t.useRef(!1);return(0,b.jsx)(et,{...i,ref:p,disabled:r,onClick:(0,o.M)(e.onClick,()=>{let e=c.current;if(!r&&e){let n=new CustomEvent(en,{bubbles:!0,cancelable:!0});e.addEventListener(en,e=>u?.(e),{once:!0}),(0,l.jH)(e,n),n.defaultPrevented?f.current=!1:d.onClose()}}),onPointerDown:n=>{e.onPointerDown?.(n),f.current=!0},onPointerUp:(0,o.M)(e.onPointerUp,e=>{f.current||e.currentTarget?.click()}),onKeyDown:(0,o.M)(e.onKeyDown,e=>{let n=""!==s.searchRef.current;!r&&(!n||" "!==e.key)&&D.includes(e.key)&&(e.currentTarget.click(),e.preventDefault())})})});er.displayName=ee;var et=t.forwardRef((e,n)=>{let{__scopeMenu:r,disabled:u=!1,textValue:i,...c}=e,d=X(ee,r),s=F(r),p=t.useRef(null),f=(0,a.e)(n,p),[h,g]=t.useState(!1),[w,v]=t.useState("");return t.useEffect(()=>{let e=p.current;e&&v((e.textContent??"").trim())},[c.children]),(0,b.jsx)(I.ItemSlot,{scope:r,disabled:u,textValue:i??w,children:(0,b.jsx)(m.ck,{asChild:!0,...s,focusable:!u,children:(0,b.jsx)(l.WV.div,{role:"menuitem","data-highlighted":h?"":void 0,"aria-disabled":u||void 0,"data-disabled":u?"":void 0,...c,ref:f,onPointerMove:(0,o.M)(e.onPointerMove,whenMouse(e=>{if(u)d.onItemLeave(e);else if(d.onItemEnter(e),!e.defaultPrevented){let n=e.currentTarget;n.focus({preventScroll:!0})}})),onPointerLeave:(0,o.M)(e.onPointerLeave,whenMouse(e=>d.onItemLeave(e))),onFocus:(0,o.M)(e.onFocus,()=>g(!0)),onBlur:(0,o.M)(e.onBlur,()=>g(!1))})})})}),eo=t.forwardRef((e,n)=>{let{checked:r=!1,onCheckedChange:t,...a}=e;return(0,b.jsx)(ep,{scope:e.__scopeMenu,checked:r,children:(0,b.jsx)(er,{role:"menuitemcheckbox","aria-checked":isIndeterminate(r)?"mixed":r,...a,ref:n,"data-state":getCheckedState(r),onSelect:(0,o.M)(a.onSelect,()=>t?.(!!isIndeterminate(r)||!r),{checkForDefaultPrevented:!1})})})});eo.displayName="MenuCheckboxItem";var ea="MenuRadioGroup",[eu,ei]=T(ea,{value:void 0,onValueChange:()=>{}}),el=t.forwardRef((e,n)=>{let{value:r,onValueChange:t,...o}=e,a=(0,x.W)(t);return(0,b.jsx)(eu,{scope:e.__scopeMenu,value:r,onValueChange:a,children:(0,b.jsx)(Q,{...o,ref:n})})});el.displayName=ea;var ec="MenuRadioItem",ed=t.forwardRef((e,n)=>{let{value:r,...t}=e,a=ei(ec,e.__scopeMenu),u=r===a.value;return(0,b.jsx)(ep,{scope:e.__scopeMenu,checked:u,children:(0,b.jsx)(er,{role:"menuitemradio","aria-checked":u,...t,ref:n,"data-state":getCheckedState(u),onSelect:(0,o.M)(t.onSelect,()=>a.onValueChange?.(r),{checkForDefaultPrevented:!1})})})});ed.displayName=ec;var es="MenuItemIndicator",[ep,ef]=T(es,{checked:!1}),eh=t.forwardRef((e,n)=>{let{__scopeMenu:r,forceMount:t,...o}=e,a=ef(es,r);return(0,b.jsx)(v.z,{present:t||isIndeterminate(a.checked)||!0===a.checked,children:(0,b.jsx)(l.WV.span,{...o,ref:n,"data-state":getCheckedState(a.checked)})})});eh.displayName=es;var eg=t.forwardRef((e,n)=>{let{__scopeMenu:r,...t}=e;return(0,b.jsx)(l.WV.div,{role:"separator","aria-orientation":"horizontal",...t,ref:n})});eg.displayName="MenuSeparator";var ew=t.forwardRef((e,n)=>{let{__scopeMenu:r,...t}=e,o=O(r);return(0,b.jsx)(g.Eh,{...o,...t,ref:n})});ew.displayName="MenuArrow";var ev="MenuSub",[em,eM]=T(ev),MenuSub=e=>{let{__scopeMenu:n,children:r,open:o=!1,onOpenChange:a}=e,u=K(ev,n),i=O(n),[l,c]=t.useState(null),[d,s]=t.useState(null),p=(0,x.W)(a);return t.useEffect(()=>(!1===u.open&&p(!1),()=>p(!1)),[u.open,p]),(0,b.jsx)(g.fC,{...i,children:(0,b.jsx)(A,{scope:n,open:o,onOpenChange:p,content:d,onContentChange:s,children:(0,b.jsx)(em,{scope:n,contentId:(0,h.M)(),triggerId:(0,h.M)(),trigger:l,onTriggerChange:c,children:r})})})};MenuSub.displayName=ev;var ex="MenuSubTrigger",ey=t.forwardRef((e,n)=>{let r=K(ex,e.__scopeMenu),u=V(ex,e.__scopeMenu),i=eM(ex,e.__scopeMenu),l=X(ex,e.__scopeMenu),c=t.useRef(null),{pointerGraceTimerRef:d,onPointerGraceIntentChange:s}=l,p={__scopeMenu:e.__scopeMenu},f=t.useCallback(()=>{c.current&&window.clearTimeout(c.current),c.current=null},[]);return t.useEffect(()=>f,[f]),t.useEffect(()=>{let e=d.current;return()=>{window.clearTimeout(e),s(null)}},[d,s]),(0,b.jsx)(G,{asChild:!0,...p,children:(0,b.jsx)(et,{id:i.triggerId,"aria-haspopup":"menu","aria-expanded":r.open,"aria-controls":i.contentId,"data-state":getOpenState(r.open),...e,ref:(0,a.F)(n,i.onTriggerChange),onClick:n=>{e.onClick?.(n),e.disabled||n.defaultPrevented||(n.currentTarget.focus(),r.open||r.onOpenChange(!0))},onPointerMove:(0,o.M)(e.onPointerMove,whenMouse(n=>{l.onItemEnter(n),n.defaultPrevented||e.disabled||r.open||c.current||(l.onPointerGraceIntentChange(null),c.current=window.setTimeout(()=>{r.onOpenChange(!0),f()},100))})),onPointerLeave:(0,o.M)(e.onPointerLeave,whenMouse(e=>{f();let n=r.content?.getBoundingClientRect();if(n){let t=r.content?.dataset.side,o="right"===t,a=n[o?"left":"right"],u=n[o?"right":"left"];l.onPointerGraceIntentChange({area:[{x:e.clientX+(o?-5:5),y:e.clientY},{x:a,y:n.top},{x:u,y:n.top},{x:u,y:n.bottom},{x:a,y:n.bottom}],side:t}),window.clearTimeout(d.current),d.current=window.setTimeout(()=>l.onPointerGraceIntentChange(null),300)}else{if(l.onTriggerLeave(e),e.defaultPrevented)return;l.onPointerGraceIntentChange(null)}})),onKeyDown:(0,o.M)(e.onKeyDown,n=>{let t=""!==l.searchRef.current;!e.disabled&&(!t||" "!==n.key)&&P[u.dir].includes(n.key)&&(r.onOpenChange(!0),r.content?.focus(),n.preventDefault())})})})});ey.displayName=ex;var eC="MenuSubContent",eb=t.forwardRef((e,n)=>{let r=U(z,e.__scopeMenu),{forceMount:u=r.forceMount,...i}=e,l=K(z,e.__scopeMenu),c=V(z,e.__scopeMenu),d=eM(eC,e.__scopeMenu),s=t.useRef(null),p=(0,a.e)(n,s);return(0,b.jsx)(I.Provider,{scope:e.__scopeMenu,children:(0,b.jsx)(v.z,{present:u||l.open,children:(0,b.jsx)(I.Slot,{scope:e.__scopeMenu,children:(0,b.jsx)(J,{id:d.contentId,"aria-labelledby":d.triggerId,...i,ref:p,align:"start",side:"rtl"===c.dir?"left":"right",disableOutsidePointerEvents:!1,disableOutsideScroll:!1,trapFocus:!1,onOpenAutoFocus:e=>{c.isUsingKeyboardRef.current&&s.current?.focus(),e.preventDefault()},onCloseAutoFocus:e=>e.preventDefault(),onFocusOutside:(0,o.M)(e.onFocusOutside,e=>{e.target!==d.trigger&&l.onOpenChange(!1)}),onEscapeKeyDown:(0,o.M)(e.onEscapeKeyDown,e=>{c.onClose(),e.preventDefault()}),onKeyDown:(0,o.M)(e.onKeyDown,e=>{let n=e.currentTarget.contains(e.target),r=k[c.dir].includes(e.key);n&&r&&(l.onOpenChange(!1),d.trigger?.focus(),e.preventDefault())})})})})})});function getOpenState(e){return e?"open":"closed"}function isIndeterminate(e){return"indeterminate"===e}function getCheckedState(e){return isIndeterminate(e)?"indeterminate":e?"checked":"unchecked"}function focusFirst(e){let n=document.activeElement;for(let r of e)if(r===n||(r.focus(),document.activeElement!==n))return}function wrapArray(e,n){return e.map((r,t)=>e[(n+t)%e.length])}function getNextMatch(e,n,r){let t=n.length>1&&Array.from(n).every(e=>e===n[0]),o=t?n[0]:n,a=r?e.indexOf(r):-1,u=wrapArray(e,Math.max(a,0)),i=1===o.length;i&&(u=u.filter(e=>e!==r));let l=u.find(e=>e.toLowerCase().startsWith(o.toLowerCase()));return l!==r?l:void 0}function isPointInPolygon(e,n){let{x:r,y:t}=e,o=!1;for(let e=0,a=n.length-1;e<n.length;a=e++){let u=n[e].x,i=n[e].y,l=n[a].x,c=n[a].y,d=i>t!=c>t&&r<(l-u)*(t-i)/(c-i)+u;d&&(o=!o)}return o}function isPointerInGraceArea(e,n){if(!n)return!1;let r={x:e.clientX,y:e.clientY};return isPointInPolygon(r,n)}function whenMouse(e){return n=>"mouse"===n.pointerType?e(n):void 0}eb.displayName=eC;var eD="DropdownMenu",[ej,eR]=(0,u.b)(eD,[N]),eP=N(),[ek,e_]=ej(eD),DropdownMenu=e=>{let{__scopeDropdownMenu:n,children:r,dir:o,open:a,defaultOpen:u,onOpenChange:l,modal:c=!0}=e,d=eP(n),s=t.useRef(null),[p=!1,f]=(0,i.T)({prop:a,defaultProp:u,onChange:l});return(0,b.jsx)(ek,{scope:n,triggerId:(0,h.M)(),triggerRef:s,contentId:(0,h.M)(),open:p,onOpenChange:f,onOpenToggle:t.useCallback(()=>f(e=>!e),[f]),modal:c,children:(0,b.jsx)(Menu,{...d,open:p,onOpenChange:f,dir:o,modal:c,children:r})})};DropdownMenu.displayName=eD;var eI="DropdownMenuTrigger",eS=t.forwardRef((e,n)=>{let{__scopeDropdownMenu:r,disabled:t=!1,...u}=e,i=e_(eI,r),c=eP(r);return(0,b.jsx)(G,{asChild:!0,...c,children:(0,b.jsx)(l.WV.button,{type:"button",id:i.triggerId,"aria-haspopup":"menu","aria-expanded":i.open,"aria-controls":i.open?i.contentId:void 0,"data-state":i.open?"open":"closed","data-disabled":t?"":void 0,disabled:t,...u,ref:(0,a.F)(n,i.triggerRef),onPointerDown:(0,o.M)(e.onPointerDown,e=>{t||0!==e.button||!1!==e.ctrlKey||(i.onOpenToggle(),i.open||e.preventDefault())}),onKeyDown:(0,o.M)(e.onKeyDown,e=>{!t&&(["Enter"," "].includes(e.key)&&i.onOpenToggle(),"ArrowDown"===e.key&&i.onOpenChange(!0),["Enter"," ","ArrowDown"].includes(e.key)&&e.preventDefault())})})})});eS.displayName=eI;var DropdownMenuPortal=e=>{let{__scopeDropdownMenu:n,...r}=e,t=eP(n);return(0,b.jsx)(MenuPortal,{...t,...r})};DropdownMenuPortal.displayName="DropdownMenuPortal";var eE="DropdownMenuContent",eT=t.forwardRef((e,n)=>{let{__scopeDropdownMenu:r,...a}=e,u=e_(eE,r),i=eP(r),l=t.useRef(!1);return(0,b.jsx)(Y,{id:u.contentId,"aria-labelledby":u.triggerId,...i,...a,ref:n,onCloseAutoFocus:(0,o.M)(e.onCloseAutoFocus,e=>{l.current||u.triggerRef.current?.focus(),l.current=!1,e.preventDefault()}),onInteractOutside:(0,o.M)(e.onInteractOutside,e=>{let n=e.detail.originalEvent,r=0===n.button&&!0===n.ctrlKey,t=2===n.button||r;(!u.modal||t)&&(l.current=!0)}),style:{...e.style,"--radix-dropdown-menu-content-transform-origin":"var(--radix-popper-transform-origin)","--radix-dropdown-menu-content-available-width":"var(--radix-popper-available-width)","--radix-dropdown-menu-content-available-height":"var(--radix-popper-available-height)","--radix-dropdown-menu-trigger-width":"var(--radix-popper-anchor-width)","--radix-dropdown-menu-trigger-height":"var(--radix-popper-anchor-height)"}})});eT.displayName=eE;var eN=t.forwardRef((e,n)=>{let{__scopeDropdownMenu:r,...t}=e,o=eP(r);return(0,b.jsx)(Q,{...o,...t,ref:n})});eN.displayName="DropdownMenuGroup";var eO=t.forwardRef((e,n)=>{let{__scopeDropdownMenu:r,...t}=e,o=eP(r);return(0,b.jsx)($,{...o,...t,ref:n})});eO.displayName="DropdownMenuLabel";var eF=t.forwardRef((e,n)=>{let{__scopeDropdownMenu:r,...t}=e,o=eP(r);return(0,b.jsx)(er,{...o,...t,ref:n})});eF.displayName="DropdownMenuItem";var eA=t.forwardRef((e,n)=>{let{__scopeDropdownMenu:r,...t}=e,o=eP(r);return(0,b.jsx)(eo,{...o,...t,ref:n})});eA.displayName="DropdownMenuCheckboxItem";var eK=t.forwardRef((e,n)=>{let{__scopeDropdownMenu:r,...t}=e,o=eP(r);return(0,b.jsx)(el,{...o,...t,ref:n})});eK.displayName="DropdownMenuRadioGroup";var eL=t.forwardRef((e,n)=>{let{__scopeDropdownMenu:r,...t}=e,o=eP(r);return(0,b.jsx)(ed,{...o,...t,ref:n})});eL.displayName="DropdownMenuRadioItem";var eV=t.forwardRef((e,n)=>{let{__scopeDropdownMenu:r,...t}=e,o=eP(r);return(0,b.jsx)(eh,{...o,...t,ref:n})});eV.displayName="DropdownMenuItemIndicator";var eG=t.forwardRef((e,n)=>{let{__scopeDropdownMenu:r,...t}=e,o=eP(r);return(0,b.jsx)(eg,{...o,...t,ref:n})});eG.displayName="DropdownMenuSeparator",t.forwardRef((e,n)=>{let{__scopeDropdownMenu:r,...t}=e,o=eP(r);return(0,b.jsx)(ew,{...o,...t,ref:n})}).displayName="DropdownMenuArrow";var eW=t.forwardRef((e,n)=>{let{__scopeDropdownMenu:r,...t}=e,o=eP(r);return(0,b.jsx)(ey,{...o,...t,ref:n})});eW.displayName="DropdownMenuSubTrigger";var eZ=t.forwardRef((e,n)=>{let{__scopeDropdownMenu:r,...t}=e,o=eP(r);return(0,b.jsx)(eb,{...o,...t,ref:n,style:{...e.style,"--radix-dropdown-menu-content-transform-origin":"var(--radix-popper-transform-origin)","--radix-dropdown-menu-content-available-width":"var(--radix-popper-available-width)","--radix-dropdown-menu-content-available-height":"var(--radix-popper-available-height)","--radix-dropdown-menu-trigger-width":"var(--radix-popper-anchor-width)","--radix-dropdown-menu-trigger-height":"var(--radix-popper-anchor-height)"}})});eZ.displayName="DropdownMenuSubContent";var eU=DropdownMenu,ez=eS,eB=DropdownMenuPortal,eX=eT,eY=eN,eH=eO,eq=eF,eJ=eA,eQ=eK,e$=eL,e0=eV,e1=eG,Sub2=e=>{let{__scopeDropdownMenu:n,children:r,open:t,onOpenChange:o,defaultOpen:a}=e,u=eP(n),[l=!1,c]=(0,i.T)({prop:t,defaultProp:a,onChange:o});return(0,b.jsx)(MenuSub,{...u,open:l,onOpenChange:c,children:r})},e2=eW,e6=eZ}}]);