"use strict";(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[1915],{41915:function(e,t,r){r.d(t,{Dx:function(){return $},aU:function(){return et},dk:function(){return ee},fC:function(){return Z},l_:function(){return Q},x8:function(){return er},zt:function(){return J}});var n=r(2265),o=r(54887),i=r(6741),a=r(98575),s=r(67822),l=r(73966),u=r(15278),c=r(83832),d=r(71599),p=r(66840),f=r(26606),v=r(80886),w=r(61188),m=r(95098),E=r(57437),x="ToastProvider",[y,T,h]=(0,s.B)("Toast"),[g,b]=(0,l.b)("Toast",[h]),[C,P]=g(x),R=e=>{let{__scopeToast:t,label:r="Notification",duration:o=5e3,swipeDirection:i="right",swipeThreshold:a=50,children:s}=e,[l,u]=n.useState(null),[c,d]=n.useState(0),p=n.useRef(!1),f=n.useRef(!1);return r.trim()||console.error("Invalid prop `label` supplied to `".concat(x,"`. Expected non-empty `string`.")),(0,E.jsx)(y.Provider,{scope:t,children:(0,E.jsx)(C,{scope:t,label:r,duration:o,swipeDirection:i,swipeThreshold:a,toastCount:c,viewport:l,onViewportChange:u,onToastAdd:n.useCallback(()=>d(e=>e+1),[]),onToastRemove:n.useCallback(()=>d(e=>e-1),[]),isFocusedToastEscapeKeyDownRef:p,isClosePausedRef:f,children:s})})};R.displayName=x;var j="ToastViewport",L=["F8"],N="toast.viewportPause",D="toast.viewportResume",M=n.forwardRef((e,t)=>{let{__scopeToast:r,hotkey:o=L,label:i="Notifications ({hotkey})",...s}=e,l=P(j,r),c=T(r),d=n.useRef(null),f=n.useRef(null),v=n.useRef(null),w=n.useRef(null),m=(0,a.e)(t,w,l.onViewportChange),x=o.join("+").replace(/Key/g,"").replace(/Digit/g,""),h=l.toastCount>0;n.useEffect(()=>{let e=e=>{var t;0!==o.length&&o.every(t=>e[t]||e.code===t)&&(null===(t=w.current)||void 0===t||t.focus())};return document.addEventListener("keydown",e),()=>document.removeEventListener("keydown",e)},[o]),n.useEffect(()=>{let e=d.current,t=w.current;if(h&&e&&t){let r=()=>{if(!l.isClosePausedRef.current){let e=new CustomEvent(N);t.dispatchEvent(e),l.isClosePausedRef.current=!0}},n=()=>{if(l.isClosePausedRef.current){let e=new CustomEvent(D);t.dispatchEvent(e),l.isClosePausedRef.current=!1}},o=t=>{e.contains(t.relatedTarget)||n()},i=()=>{e.contains(document.activeElement)||n()};return e.addEventListener("focusin",r),e.addEventListener("focusout",o),e.addEventListener("pointermove",r),e.addEventListener("pointerleave",i),window.addEventListener("blur",r),window.addEventListener("focus",n),()=>{e.removeEventListener("focusin",r),e.removeEventListener("focusout",o),e.removeEventListener("pointermove",r),e.removeEventListener("pointerleave",i),window.removeEventListener("blur",r),window.removeEventListener("focus",n)}}},[h,l.isClosePausedRef]);let g=n.useCallback(e=>{let{tabbingDirection:t}=e,r=c().map(e=>{let r=e.ref.current,n=[r,...function(e){let t=[],r=document.createTreeWalker(e,NodeFilter.SHOW_ELEMENT,{acceptNode:e=>{let t="INPUT"===e.tagName&&"hidden"===e.type;return e.disabled||e.hidden||t?NodeFilter.FILTER_SKIP:e.tabIndex>=0?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_SKIP}});for(;r.nextNode();)t.push(r.currentNode);return t}(r)];return"forwards"===t?n:n.reverse()});return("forwards"===t?r.reverse():r).flat()},[c]);return n.useEffect(()=>{let e=w.current;if(e){let t=t=>{let r=t.altKey||t.ctrlKey||t.metaKey;if("Tab"===t.key&&!r){var n,o,i;let r=document.activeElement,a=t.shiftKey;if(t.target===e&&a){null===(n=f.current)||void 0===n||n.focus();return}let s=g({tabbingDirection:a?"backwards":"forwards"}),l=s.findIndex(e=>e===r);G(s.slice(l+1))?t.preventDefault():a?null===(o=f.current)||void 0===o||o.focus():null===(i=v.current)||void 0===i||i.focus()}};return e.addEventListener("keydown",t),()=>e.removeEventListener("keydown",t)}},[c,g]),(0,E.jsxs)(u.I0,{ref:d,role:"region","aria-label":i.replace("{hotkey}",x),tabIndex:-1,style:{pointerEvents:h?void 0:"none"},children:[h&&(0,E.jsx)(F,{ref:f,onFocusFromOutsideViewport:()=>{G(g({tabbingDirection:"forwards"}))}}),(0,E.jsx)(y.Slot,{scope:r,children:(0,E.jsx)(p.WV.ol,{tabIndex:-1,...s,ref:m})}),h&&(0,E.jsx)(F,{ref:v,onFocusFromOutsideViewport:()=>{G(g({tabbingDirection:"backwards"}))}})]})});M.displayName=j;var k="ToastFocusProxy",F=n.forwardRef((e,t)=>{let{__scopeToast:r,onFocusFromOutsideViewport:n,...o}=e,i=P(k,r);return(0,E.jsx)(m.T,{"aria-hidden":!0,tabIndex:0,...o,ref:t,style:{position:"fixed"},onFocus:e=>{var t;let r=e.relatedTarget;(null===(t=i.viewport)||void 0===t?void 0:t.contains(r))||n()}})});F.displayName=k;var S="Toast",I=n.forwardRef((e,t)=>{let{forceMount:r,open:n,defaultOpen:o,onOpenChange:a,...s}=e,[l=!0,u]=(0,v.T)({prop:n,defaultProp:o,onChange:a});return(0,E.jsx)(d.z,{present:r||l,children:(0,E.jsx)(W,{open:l,...s,ref:t,onClose:()=>u(!1),onPause:(0,f.W)(e.onPause),onResume:(0,f.W)(e.onResume),onSwipeStart:(0,i.M)(e.onSwipeStart,e=>{e.currentTarget.setAttribute("data-swipe","start")}),onSwipeMove:(0,i.M)(e.onSwipeMove,e=>{let{x:t,y:r}=e.detail.delta;e.currentTarget.setAttribute("data-swipe","move"),e.currentTarget.style.setProperty("--radix-toast-swipe-move-x","".concat(t,"px")),e.currentTarget.style.setProperty("--radix-toast-swipe-move-y","".concat(r,"px"))}),onSwipeCancel:(0,i.M)(e.onSwipeCancel,e=>{e.currentTarget.setAttribute("data-swipe","cancel"),e.currentTarget.style.removeProperty("--radix-toast-swipe-move-x"),e.currentTarget.style.removeProperty("--radix-toast-swipe-move-y"),e.currentTarget.style.removeProperty("--radix-toast-swipe-end-x"),e.currentTarget.style.removeProperty("--radix-toast-swipe-end-y")}),onSwipeEnd:(0,i.M)(e.onSwipeEnd,e=>{let{x:t,y:r}=e.detail.delta;e.currentTarget.setAttribute("data-swipe","end"),e.currentTarget.style.removeProperty("--radix-toast-swipe-move-x"),e.currentTarget.style.removeProperty("--radix-toast-swipe-move-y"),e.currentTarget.style.setProperty("--radix-toast-swipe-end-x","".concat(t,"px")),e.currentTarget.style.setProperty("--radix-toast-swipe-end-y","".concat(r,"px")),u(!1)})})})});I.displayName=S;var[A,K]=g(S,{onClose(){}}),W=n.forwardRef((e,t)=>{let{__scopeToast:r,type:s="foreground",duration:l,open:c,onClose:d,onEscapeKeyDown:v,onPause:w,onResume:m,onSwipeStart:x,onSwipeMove:T,onSwipeCancel:h,onSwipeEnd:g,...b}=e,C=P(S,r),[R,j]=n.useState(null),L=(0,a.e)(t,e=>j(e)),M=n.useRef(null),k=n.useRef(null),F=l||C.duration,I=n.useRef(0),K=n.useRef(F),W=n.useRef(0),{onToastAdd:_,onToastRemove:O}=C,U=(0,f.W)(()=>{var e;(null==R?void 0:R.contains(document.activeElement))&&(null===(e=C.viewport)||void 0===e||e.focus()),d()}),H=n.useCallback(e=>{e&&e!==1/0&&(window.clearTimeout(W.current),I.current=new Date().getTime(),W.current=window.setTimeout(U,e))},[U]);n.useEffect(()=>{let e=C.viewport;if(e){let t=()=>{H(K.current),null==m||m()},r=()=>{let e=new Date().getTime()-I.current;K.current=K.current-e,window.clearTimeout(W.current),null==w||w()};return e.addEventListener(N,r),e.addEventListener(D,t),()=>{e.removeEventListener(N,r),e.removeEventListener(D,t)}}},[C.viewport,F,w,m,H]),n.useEffect(()=>{c&&!C.isClosePausedRef.current&&H(F)},[c,F,C.isClosePausedRef,H]),n.useEffect(()=>(_(),()=>O()),[_,O]);let X=n.useMemo(()=>R?function e(t){let r=[];return Array.from(t.childNodes).forEach(t=>{if(t.nodeType===t.TEXT_NODE&&t.textContent&&r.push(t.textContent),t.nodeType===t.ELEMENT_NODE){let n=t.ariaHidden||t.hidden||"none"===t.style.display,o=""===t.dataset.radixToastAnnounceExclude;if(!n){if(o){let e=t.dataset.radixToastAnnounceAlt;e&&r.push(e)}else r.push(...e(t))}}}),r}(R):null,[R]);return C.viewport?(0,E.jsxs)(E.Fragment,{children:[X&&(0,E.jsx)(V,{__scopeToast:r,role:"status","aria-live":"foreground"===s?"assertive":"polite","aria-atomic":!0,children:X}),(0,E.jsx)(A,{scope:r,onClose:U,children:o.createPortal((0,E.jsx)(y.ItemSlot,{scope:r,children:(0,E.jsx)(u.fC,{asChild:!0,onEscapeKeyDown:(0,i.M)(v,()=>{C.isFocusedToastEscapeKeyDownRef.current||U(),C.isFocusedToastEscapeKeyDownRef.current=!1}),children:(0,E.jsx)(p.WV.li,{role:"status","aria-live":"off","aria-atomic":!0,tabIndex:0,"data-state":c?"open":"closed","data-swipe-direction":C.swipeDirection,...b,ref:L,style:{userSelect:"none",touchAction:"none",...e.style},onKeyDown:(0,i.M)(e.onKeyDown,e=>{"Escape"!==e.key||(null==v||v(e.nativeEvent),e.nativeEvent.defaultPrevented||(C.isFocusedToastEscapeKeyDownRef.current=!0,U()))}),onPointerDown:(0,i.M)(e.onPointerDown,e=>{0===e.button&&(M.current={x:e.clientX,y:e.clientY})}),onPointerMove:(0,i.M)(e.onPointerMove,e=>{if(!M.current)return;let t=e.clientX-M.current.x,r=e.clientY-M.current.y,n=!!k.current,o=["left","right"].includes(C.swipeDirection),i=["left","up"].includes(C.swipeDirection)?Math.min:Math.max,a=o?i(0,t):0,s=o?0:i(0,r),l="touch"===e.pointerType?10:2,u={x:a,y:s},c={originalEvent:e,delta:u};n?(k.current=u,Y("toast.swipeMove",T,c,{discrete:!1})):B(u,C.swipeDirection,l)?(k.current=u,Y("toast.swipeStart",x,c,{discrete:!1}),e.target.setPointerCapture(e.pointerId)):(Math.abs(t)>l||Math.abs(r)>l)&&(M.current=null)}),onPointerUp:(0,i.M)(e.onPointerUp,e=>{let t=k.current,r=e.target;if(r.hasPointerCapture(e.pointerId)&&r.releasePointerCapture(e.pointerId),k.current=null,M.current=null,t){let r=e.currentTarget,n={originalEvent:e,delta:t};B(t,C.swipeDirection,C.swipeThreshold)?Y("toast.swipeEnd",g,n,{discrete:!0}):Y("toast.swipeCancel",h,n,{discrete:!0}),r.addEventListener("click",e=>e.preventDefault(),{once:!0})}})})})}),C.viewport)})]}):null}),V=e=>{let{__scopeToast:t,children:r,...o}=e,i=P(S,t),[a,s]=n.useState(!1),[l,u]=n.useState(!1);return function(){let e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:()=>{},t=(0,f.W)(e);(0,w.b)(()=>{let e=0,r=0;return e=window.requestAnimationFrame(()=>r=window.requestAnimationFrame(t)),()=>{window.cancelAnimationFrame(e),window.cancelAnimationFrame(r)}},[t])}(()=>s(!0)),n.useEffect(()=>{let e=window.setTimeout(()=>u(!0),1e3);return()=>window.clearTimeout(e)},[]),l?null:(0,E.jsx)(c.h,{asChild:!0,children:(0,E.jsx)(m.T,{...o,children:a&&(0,E.jsxs)(E.Fragment,{children:[i.label," ",r]})})})},_=n.forwardRef((e,t)=>{let{__scopeToast:r,...n}=e;return(0,E.jsx)(p.WV.div,{...n,ref:t})});_.displayName="ToastTitle";var O=n.forwardRef((e,t)=>{let{__scopeToast:r,...n}=e;return(0,E.jsx)(p.WV.div,{...n,ref:t})});O.displayName="ToastDescription";var U="ToastAction",H=n.forwardRef((e,t)=>{let{altText:r,...n}=e;return r.trim()?(0,E.jsx)(z,{altText:r,asChild:!0,children:(0,E.jsx)(q,{...n,ref:t})}):(console.error("Invalid prop `altText` supplied to `".concat(U,"`. Expected non-empty `string`.")),null)});H.displayName=U;var X="ToastClose",q=n.forwardRef((e,t)=>{let{__scopeToast:r,...n}=e,o=K(X,r);return(0,E.jsx)(z,{asChild:!0,children:(0,E.jsx)(p.WV.button,{type:"button",...n,ref:t,onClick:(0,i.M)(e.onClick,o.onClose)})})});q.displayName=X;var z=n.forwardRef((e,t)=>{let{__scopeToast:r,altText:n,...o}=e;return(0,E.jsx)(p.WV.div,{"data-radix-toast-announce-exclude":"","data-radix-toast-announce-alt":n||void 0,...o,ref:t})});function Y(e,t,r,n){let{discrete:o}=n,i=r.originalEvent.currentTarget,a=new CustomEvent(e,{bubbles:!0,cancelable:!0,detail:r});t&&i.addEventListener(e,t,{once:!0}),o?(0,p.jH)(i,a):i.dispatchEvent(a)}var B=function(e,t){let r=arguments.length>2&&void 0!==arguments[2]?arguments[2]:0,n=Math.abs(e.x),o=Math.abs(e.y),i=n>o;return"left"===t||"right"===t?i&&n>r:!i&&o>r};function G(e){let t=document.activeElement;return e.some(e=>e===t||(e.focus(),document.activeElement!==t))}var J=R,Q=M,Z=I,$=_,ee=O,et=H,er=q}}]);