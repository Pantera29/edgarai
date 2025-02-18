"use strict";(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[7641],{6394:function(e,t,r){r.d(t,{f:function(){return s}});var n=r(2265),o=r(66840),a=r(57437),i=n.forwardRef((e,t)=>(0,a.jsx)(o.WV.label,{...e,ref:t,onMouseDown:t=>{var r;t.target.closest("button, input, select, textarea")||(null===(r=e.onMouseDown)||void 0===r||r.call(e,t),!t.defaultPrevented&&t.detail>1&&t.preventDefault())}}));i.displayName="Label";var s=i},41915:function(e,t,r){r.d(t,{Dx:function(){return $},aU:function(){return et},dk:function(){return ee},fC:function(){return Z},l_:function(){return Q},x8:function(){return er},zt:function(){return J}});var n=r(2265),o=r(54887),a=r(6741),i=r(98575),s=r(67822),l=r(73966),u=r(15278),c=r(83832),d=r(71599),f=r(66840),p=r(26606),v=r(80886),w=r(61188),m=r(95098),x=r(57437),y="ToastProvider",[E,T,h]=(0,s.B)("Toast"),[g,b]=(0,l.b)("Toast",[h]),[C,P]=g(y),R=e=>{let{__scopeToast:t,label:r="Notification",duration:o=5e3,swipeDirection:a="right",swipeThreshold:i=50,children:s}=e,[l,u]=n.useState(null),[c,d]=n.useState(0),f=n.useRef(!1),p=n.useRef(!1);return r.trim()||console.error("Invalid prop `label` supplied to `".concat(y,"`. Expected non-empty `string`.")),(0,x.jsx)(E.Provider,{scope:t,children:(0,x.jsx)(C,{scope:t,label:r,duration:o,swipeDirection:a,swipeThreshold:i,toastCount:c,viewport:l,onViewportChange:u,onToastAdd:n.useCallback(()=>d(e=>e+1),[]),onToastRemove:n.useCallback(()=>d(e=>e-1),[]),isFocusedToastEscapeKeyDownRef:f,isClosePausedRef:p,children:s})})};R.displayName=y;var j="ToastViewport",D=["F8"],L="toast.viewportPause",N="toast.viewportResume",M=n.forwardRef((e,t)=>{let{__scopeToast:r,hotkey:o=D,label:a="Notifications ({hotkey})",...s}=e,l=P(j,r),c=T(r),d=n.useRef(null),p=n.useRef(null),v=n.useRef(null),w=n.useRef(null),m=(0,i.e)(t,w,l.onViewportChange),y=o.join("+").replace(/Key/g,"").replace(/Digit/g,""),h=l.toastCount>0;n.useEffect(()=>{let e=e=>{var t;0!==o.length&&o.every(t=>e[t]||e.code===t)&&(null===(t=w.current)||void 0===t||t.focus())};return document.addEventListener("keydown",e),()=>document.removeEventListener("keydown",e)},[o]),n.useEffect(()=>{let e=d.current,t=w.current;if(h&&e&&t){let r=()=>{if(!l.isClosePausedRef.current){let e=new CustomEvent(L);t.dispatchEvent(e),l.isClosePausedRef.current=!0}},n=()=>{if(l.isClosePausedRef.current){let e=new CustomEvent(N);t.dispatchEvent(e),l.isClosePausedRef.current=!1}},o=t=>{e.contains(t.relatedTarget)||n()},a=()=>{e.contains(document.activeElement)||n()};return e.addEventListener("focusin",r),e.addEventListener("focusout",o),e.addEventListener("pointermove",r),e.addEventListener("pointerleave",a),window.addEventListener("blur",r),window.addEventListener("focus",n),()=>{e.removeEventListener("focusin",r),e.removeEventListener("focusout",o),e.removeEventListener("pointermove",r),e.removeEventListener("pointerleave",a),window.removeEventListener("blur",r),window.removeEventListener("focus",n)}}},[h,l.isClosePausedRef]);let g=n.useCallback(e=>{let{tabbingDirection:t}=e,r=c().map(e=>{let r=e.ref.current,n=[r,...function(e){let t=[],r=document.createTreeWalker(e,NodeFilter.SHOW_ELEMENT,{acceptNode:e=>{let t="INPUT"===e.tagName&&"hidden"===e.type;return e.disabled||e.hidden||t?NodeFilter.FILTER_SKIP:e.tabIndex>=0?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_SKIP}});for(;r.nextNode();)t.push(r.currentNode);return t}(r)];return"forwards"===t?n:n.reverse()});return("forwards"===t?r.reverse():r).flat()},[c]);return n.useEffect(()=>{let e=w.current;if(e){let t=t=>{let r=t.altKey||t.ctrlKey||t.metaKey;if("Tab"===t.key&&!r){var n,o,a;let r=document.activeElement,i=t.shiftKey;if(t.target===e&&i){null===(n=p.current)||void 0===n||n.focus();return}let s=g({tabbingDirection:i?"backwards":"forwards"}),l=s.findIndex(e=>e===r);G(s.slice(l+1))?t.preventDefault():i?null===(o=p.current)||void 0===o||o.focus():null===(a=v.current)||void 0===a||a.focus()}};return e.addEventListener("keydown",t),()=>e.removeEventListener("keydown",t)}},[c,g]),(0,x.jsxs)(u.I0,{ref:d,role:"region","aria-label":a.replace("{hotkey}",y),tabIndex:-1,style:{pointerEvents:h?void 0:"none"},children:[h&&(0,x.jsx)(F,{ref:p,onFocusFromOutsideViewport:()=>{G(g({tabbingDirection:"forwards"}))}}),(0,x.jsx)(E.Slot,{scope:r,children:(0,x.jsx)(f.WV.ol,{tabIndex:-1,...s,ref:m})}),h&&(0,x.jsx)(F,{ref:v,onFocusFromOutsideViewport:()=>{G(g({tabbingDirection:"backwards"}))}})]})});M.displayName=j;var k="ToastFocusProxy",F=n.forwardRef((e,t)=>{let{__scopeToast:r,onFocusFromOutsideViewport:n,...o}=e,a=P(k,r);return(0,x.jsx)(m.T,{"aria-hidden":!0,tabIndex:0,...o,ref:t,style:{position:"fixed"},onFocus:e=>{var t;let r=e.relatedTarget;(null===(t=a.viewport)||void 0===t?void 0:t.contains(r))||n()}})});F.displayName=k;var S="Toast",I=n.forwardRef((e,t)=>{let{forceMount:r,open:n,defaultOpen:o,onOpenChange:i,...s}=e,[l=!0,u]=(0,v.T)({prop:n,defaultProp:o,onChange:i});return(0,x.jsx)(d.z,{present:r||l,children:(0,x.jsx)(W,{open:l,...s,ref:t,onClose:()=>u(!1),onPause:(0,p.W)(e.onPause),onResume:(0,p.W)(e.onResume),onSwipeStart:(0,a.M)(e.onSwipeStart,e=>{e.currentTarget.setAttribute("data-swipe","start")}),onSwipeMove:(0,a.M)(e.onSwipeMove,e=>{let{x:t,y:r}=e.detail.delta;e.currentTarget.setAttribute("data-swipe","move"),e.currentTarget.style.setProperty("--radix-toast-swipe-move-x","".concat(t,"px")),e.currentTarget.style.setProperty("--radix-toast-swipe-move-y","".concat(r,"px"))}),onSwipeCancel:(0,a.M)(e.onSwipeCancel,e=>{e.currentTarget.setAttribute("data-swipe","cancel"),e.currentTarget.style.removeProperty("--radix-toast-swipe-move-x"),e.currentTarget.style.removeProperty("--radix-toast-swipe-move-y"),e.currentTarget.style.removeProperty("--radix-toast-swipe-end-x"),e.currentTarget.style.removeProperty("--radix-toast-swipe-end-y")}),onSwipeEnd:(0,a.M)(e.onSwipeEnd,e=>{let{x:t,y:r}=e.detail.delta;e.currentTarget.setAttribute("data-swipe","end"),e.currentTarget.style.removeProperty("--radix-toast-swipe-move-x"),e.currentTarget.style.removeProperty("--radix-toast-swipe-move-y"),e.currentTarget.style.setProperty("--radix-toast-swipe-end-x","".concat(t,"px")),e.currentTarget.style.setProperty("--radix-toast-swipe-end-y","".concat(r,"px")),u(!1)})})})});I.displayName=S;var[A,K]=g(S,{onClose(){}}),W=n.forwardRef((e,t)=>{let{__scopeToast:r,type:s="foreground",duration:l,open:c,onClose:d,onEscapeKeyDown:v,onPause:w,onResume:m,onSwipeStart:y,onSwipeMove:T,onSwipeCancel:h,onSwipeEnd:g,...b}=e,C=P(S,r),[R,j]=n.useState(null),D=(0,i.e)(t,e=>j(e)),M=n.useRef(null),k=n.useRef(null),F=l||C.duration,I=n.useRef(0),K=n.useRef(F),W=n.useRef(0),{onToastAdd:_,onToastRemove:O}=C,U=(0,p.W)(()=>{var e;(null==R?void 0:R.contains(document.activeElement))&&(null===(e=C.viewport)||void 0===e||e.focus()),d()}),H=n.useCallback(e=>{e&&e!==1/0&&(window.clearTimeout(W.current),I.current=new Date().getTime(),W.current=window.setTimeout(U,e))},[U]);n.useEffect(()=>{let e=C.viewport;if(e){let t=()=>{H(K.current),null==m||m()},r=()=>{let e=new Date().getTime()-I.current;K.current=K.current-e,window.clearTimeout(W.current),null==w||w()};return e.addEventListener(L,r),e.addEventListener(N,t),()=>{e.removeEventListener(L,r),e.removeEventListener(N,t)}}},[C.viewport,F,w,m,H]),n.useEffect(()=>{c&&!C.isClosePausedRef.current&&H(F)},[c,F,C.isClosePausedRef,H]),n.useEffect(()=>(_(),()=>O()),[_,O]);let X=n.useMemo(()=>R?function e(t){let r=[];return Array.from(t.childNodes).forEach(t=>{if(t.nodeType===t.TEXT_NODE&&t.textContent&&r.push(t.textContent),t.nodeType===t.ELEMENT_NODE){let n=t.ariaHidden||t.hidden||"none"===t.style.display,o=""===t.dataset.radixToastAnnounceExclude;if(!n){if(o){let e=t.dataset.radixToastAnnounceAlt;e&&r.push(e)}else r.push(...e(t))}}}),r}(R):null,[R]);return C.viewport?(0,x.jsxs)(x.Fragment,{children:[X&&(0,x.jsx)(V,{__scopeToast:r,role:"status","aria-live":"foreground"===s?"assertive":"polite","aria-atomic":!0,children:X}),(0,x.jsx)(A,{scope:r,onClose:U,children:o.createPortal((0,x.jsx)(E.ItemSlot,{scope:r,children:(0,x.jsx)(u.fC,{asChild:!0,onEscapeKeyDown:(0,a.M)(v,()=>{C.isFocusedToastEscapeKeyDownRef.current||U(),C.isFocusedToastEscapeKeyDownRef.current=!1}),children:(0,x.jsx)(f.WV.li,{role:"status","aria-live":"off","aria-atomic":!0,tabIndex:0,"data-state":c?"open":"closed","data-swipe-direction":C.swipeDirection,...b,ref:D,style:{userSelect:"none",touchAction:"none",...e.style},onKeyDown:(0,a.M)(e.onKeyDown,e=>{"Escape"!==e.key||(null==v||v(e.nativeEvent),e.nativeEvent.defaultPrevented||(C.isFocusedToastEscapeKeyDownRef.current=!0,U()))}),onPointerDown:(0,a.M)(e.onPointerDown,e=>{0===e.button&&(M.current={x:e.clientX,y:e.clientY})}),onPointerMove:(0,a.M)(e.onPointerMove,e=>{if(!M.current)return;let t=e.clientX-M.current.x,r=e.clientY-M.current.y,n=!!k.current,o=["left","right"].includes(C.swipeDirection),a=["left","up"].includes(C.swipeDirection)?Math.min:Math.max,i=o?a(0,t):0,s=o?0:a(0,r),l="touch"===e.pointerType?10:2,u={x:i,y:s},c={originalEvent:e,delta:u};n?(k.current=u,Y("toast.swipeMove",T,c,{discrete:!1})):B(u,C.swipeDirection,l)?(k.current=u,Y("toast.swipeStart",y,c,{discrete:!1}),e.target.setPointerCapture(e.pointerId)):(Math.abs(t)>l||Math.abs(r)>l)&&(M.current=null)}),onPointerUp:(0,a.M)(e.onPointerUp,e=>{let t=k.current,r=e.target;if(r.hasPointerCapture(e.pointerId)&&r.releasePointerCapture(e.pointerId),k.current=null,M.current=null,t){let r=e.currentTarget,n={originalEvent:e,delta:t};B(t,C.swipeDirection,C.swipeThreshold)?Y("toast.swipeEnd",g,n,{discrete:!0}):Y("toast.swipeCancel",h,n,{discrete:!0}),r.addEventListener("click",e=>e.preventDefault(),{once:!0})}})})})}),C.viewport)})]}):null}),V=e=>{let{__scopeToast:t,children:r,...o}=e,a=P(S,t),[i,s]=n.useState(!1),[l,u]=n.useState(!1);return function(){let e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:()=>{},t=(0,p.W)(e);(0,w.b)(()=>{let e=0,r=0;return e=window.requestAnimationFrame(()=>r=window.requestAnimationFrame(t)),()=>{window.cancelAnimationFrame(e),window.cancelAnimationFrame(r)}},[t])}(()=>s(!0)),n.useEffect(()=>{let e=window.setTimeout(()=>u(!0),1e3);return()=>window.clearTimeout(e)},[]),l?null:(0,x.jsx)(c.h,{asChild:!0,children:(0,x.jsx)(m.T,{...o,children:i&&(0,x.jsxs)(x.Fragment,{children:[a.label," ",r]})})})},_=n.forwardRef((e,t)=>{let{__scopeToast:r,...n}=e;return(0,x.jsx)(f.WV.div,{...n,ref:t})});_.displayName="ToastTitle";var O=n.forwardRef((e,t)=>{let{__scopeToast:r,...n}=e;return(0,x.jsx)(f.WV.div,{...n,ref:t})});O.displayName="ToastDescription";var U="ToastAction",H=n.forwardRef((e,t)=>{let{altText:r,...n}=e;return r.trim()?(0,x.jsx)(z,{altText:r,asChild:!0,children:(0,x.jsx)(q,{...n,ref:t})}):(console.error("Invalid prop `altText` supplied to `".concat(U,"`. Expected non-empty `string`.")),null)});H.displayName=U;var X="ToastClose",q=n.forwardRef((e,t)=>{let{__scopeToast:r,...n}=e,o=K(X,r);return(0,x.jsx)(z,{asChild:!0,children:(0,x.jsx)(f.WV.button,{type:"button",...n,ref:t,onClick:(0,a.M)(e.onClick,o.onClose)})})});q.displayName=X;var z=n.forwardRef((e,t)=>{let{__scopeToast:r,altText:n,...o}=e;return(0,x.jsx)(f.WV.div,{"data-radix-toast-announce-exclude":"","data-radix-toast-announce-alt":n||void 0,...o,ref:t})});function Y(e,t,r,n){let{discrete:o}=n,a=r.originalEvent.currentTarget,i=new CustomEvent(e,{bubbles:!0,cancelable:!0,detail:r});t&&a.addEventListener(e,t,{once:!0}),o?(0,f.jH)(a,i):a.dispatchEvent(i)}var B=function(e,t){let r=arguments.length>2&&void 0!==arguments[2]?arguments[2]:0,n=Math.abs(e.x),o=Math.abs(e.y),a=n>o;return"left"===t||"right"===t?a&&n>r:!a&&o>r};function G(e){let t=document.activeElement;return e.some(e=>e===t||(e.focus(),document.activeElement!==t))}var J=R,Q=M,Z=I,$=_,ee=O,et=H,er=q}}]);