"use strict";(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[5963],{92451:function(e,t,n){n.d(t,{Z:function(){return r}});let r=(0,n(39763).Z)("ChevronLeft",[["path",{d:"m15 18-6-6 6-6",key:"1wnfg3"}]])},61312:function(e,t,n){n.d(t,{VY:function(){return S},fC:function(){return F},xz:function(){return H},zt:function(){return z}});var r=n(2265),o=n(6741),i=n(98575),l=n(73966),a=n(15278),u=n(99255),s=n(26008),c=(n(83832),n(71599)),d=n(66840),p=n(37053),f=n(80886),h=n(95098),x=n(57437),[v,g]=(0,l.b)("Tooltip",[s.D7]),y=(0,s.D7)(),b="TooltipProvider",w="tooltip.open",[m,C]=v(b),T=e=>{let{__scopeTooltip:t,delayDuration:n=700,skipDelayDuration:o=300,disableHoverableContent:i=!1,children:l}=e,[a,u]=r.useState(!0),s=r.useRef(!1),c=r.useRef(0);return r.useEffect(()=>{let e=c.current;return()=>window.clearTimeout(e)},[]),(0,x.jsx)(m,{scope:t,isOpenDelayed:a,delayDuration:n,onOpen:r.useCallback(()=>{window.clearTimeout(c.current),u(!1)},[]),onClose:r.useCallback(()=>{window.clearTimeout(c.current),c.current=window.setTimeout(()=>u(!0),o)},[o]),isPointerInTransitRef:s,onPointerInTransitChange:r.useCallback(e=>{s.current=e},[]),disableHoverableContent:i,children:l})};T.displayName=b;var E="Tooltip",[k,L]=v(E),M=e=>{let{__scopeTooltip:t,children:n,open:o,defaultOpen:i=!1,onOpenChange:l,disableHoverableContent:a,delayDuration:c}=e,d=C(E,e.__scopeTooltip),p=y(t),[h,v]=r.useState(null),g=(0,u.M)(),b=r.useRef(0),m=null!=a?a:d.disableHoverableContent,T=null!=c?c:d.delayDuration,L=r.useRef(!1),[M=!1,R]=(0,f.T)({prop:o,defaultProp:i,onChange:e=>{e?(d.onOpen(),document.dispatchEvent(new CustomEvent(w))):d.onClose(),null==l||l(e)}}),j=r.useMemo(()=>M?L.current?"delayed-open":"instant-open":"closed",[M]),_=r.useCallback(()=>{window.clearTimeout(b.current),b.current=0,L.current=!1,R(!0)},[R]),P=r.useCallback(()=>{window.clearTimeout(b.current),b.current=0,R(!1)},[R]),D=r.useCallback(()=>{window.clearTimeout(b.current),b.current=window.setTimeout(()=>{L.current=!0,R(!0),b.current=0},T)},[T,R]);return r.useEffect(()=>()=>{b.current&&(window.clearTimeout(b.current),b.current=0)},[]),(0,x.jsx)(s.fC,{...p,children:(0,x.jsx)(k,{scope:t,contentId:g,open:M,stateAttribute:j,trigger:h,onTriggerChange:v,onTriggerEnter:r.useCallback(()=>{d.isOpenDelayed?D():_()},[d.isOpenDelayed,D,_]),onTriggerLeave:r.useCallback(()=>{m?P():(window.clearTimeout(b.current),b.current=0)},[P,m]),onOpen:_,onClose:P,disableHoverableContent:m,children:n})})};M.displayName=E;var R="TooltipTrigger",j=r.forwardRef((e,t)=>{let{__scopeTooltip:n,...l}=e,a=L(R,n),u=C(R,n),c=y(n),p=r.useRef(null),f=(0,i.e)(t,p,a.onTriggerChange),h=r.useRef(!1),v=r.useRef(!1),g=r.useCallback(()=>h.current=!1,[]);return r.useEffect(()=>()=>document.removeEventListener("pointerup",g),[g]),(0,x.jsx)(s.ee,{asChild:!0,...c,children:(0,x.jsx)(d.WV.button,{"aria-describedby":a.open?a.contentId:void 0,"data-state":a.stateAttribute,...l,ref:f,onPointerMove:(0,o.M)(e.onPointerMove,e=>{"touch"===e.pointerType||v.current||u.isPointerInTransitRef.current||(a.onTriggerEnter(),v.current=!0)}),onPointerLeave:(0,o.M)(e.onPointerLeave,()=>{a.onTriggerLeave(),v.current=!1}),onPointerDown:(0,o.M)(e.onPointerDown,()=>{h.current=!0,document.addEventListener("pointerup",g,{once:!0})}),onFocus:(0,o.M)(e.onFocus,()=>{h.current||a.onOpen()}),onBlur:(0,o.M)(e.onBlur,a.onClose),onClick:(0,o.M)(e.onClick,a.onClose)})})});j.displayName=R;var[_,P]=v("TooltipPortal",{forceMount:void 0}),D="TooltipContent",O=r.forwardRef((e,t)=>{let n=P(D,e.__scopeTooltip),{forceMount:r=n.forceMount,side:o="top",...i}=e,l=L(D,e.__scopeTooltip);return(0,x.jsx)(c.z,{present:r||l.open,children:l.disableHoverableContent?(0,x.jsx)(A,{side:o,...i,ref:t}):(0,x.jsx)(I,{side:o,...i,ref:t})})}),I=r.forwardRef((e,t)=>{let n=L(D,e.__scopeTooltip),o=C(D,e.__scopeTooltip),l=r.useRef(null),a=(0,i.e)(t,l),[u,s]=r.useState(null),{trigger:c,onClose:d}=n,p=l.current,{onPointerInTransitChange:f}=o,h=r.useCallback(()=>{s(null),f(!1)},[f]),v=r.useCallback((e,t)=>{let n=e.currentTarget,r={x:e.clientX,y:e.clientY},o=function(e,t){let n=Math.abs(t.top-e.y),r=Math.abs(t.bottom-e.y),o=Math.abs(t.right-e.x),i=Math.abs(t.left-e.x);switch(Math.min(n,r,o,i)){case i:return"left";case o:return"right";case n:return"top";case r:return"bottom";default:throw Error("unreachable")}}(r,n.getBoundingClientRect());s(function(e){let t=e.slice();return t.sort((e,t)=>e.x<t.x?-1:e.x>t.x?1:e.y<t.y?-1:e.y>t.y?1:0),function(e){if(e.length<=1)return e.slice();let t=[];for(let n=0;n<e.length;n++){let r=e[n];for(;t.length>=2;){let e=t[t.length-1],n=t[t.length-2];if((e.x-n.x)*(r.y-n.y)>=(e.y-n.y)*(r.x-n.x))t.pop();else break}t.push(r)}t.pop();let n=[];for(let t=e.length-1;t>=0;t--){let r=e[t];for(;n.length>=2;){let e=n[n.length-1],t=n[n.length-2];if((e.x-t.x)*(r.y-t.y)>=(e.y-t.y)*(r.x-t.x))n.pop();else break}n.push(r)}return(n.pop(),1===t.length&&1===n.length&&t[0].x===n[0].x&&t[0].y===n[0].y)?t:t.concat(n)}(t)}([...function(e,t){let n=arguments.length>2&&void 0!==arguments[2]?arguments[2]:5,r=[];switch(t){case"top":r.push({x:e.x-n,y:e.y+n},{x:e.x+n,y:e.y+n});break;case"bottom":r.push({x:e.x-n,y:e.y-n},{x:e.x+n,y:e.y-n});break;case"left":r.push({x:e.x+n,y:e.y-n},{x:e.x+n,y:e.y+n});break;case"right":r.push({x:e.x-n,y:e.y-n},{x:e.x-n,y:e.y+n})}return r}(r,o),...function(e){let{top:t,right:n,bottom:r,left:o}=e;return[{x:o,y:t},{x:n,y:t},{x:n,y:r},{x:o,y:r}]}(t.getBoundingClientRect())])),f(!0)},[f]);return r.useEffect(()=>()=>h(),[h]),r.useEffect(()=>{if(c&&p){let e=e=>v(e,p),t=e=>v(e,c);return c.addEventListener("pointerleave",e),p.addEventListener("pointerleave",t),()=>{c.removeEventListener("pointerleave",e),p.removeEventListener("pointerleave",t)}}},[c,p,v,h]),r.useEffect(()=>{if(u){let e=e=>{let t=e.target,n={x:e.clientX,y:e.clientY},r=(null==c?void 0:c.contains(t))||(null==p?void 0:p.contains(t)),o=!function(e,t){let{x:n,y:r}=e,o=!1;for(let e=0,i=t.length-1;e<t.length;i=e++){let l=t[e].x,a=t[e].y,u=t[i].x,s=t[i].y;a>r!=s>r&&n<(u-l)*(r-a)/(s-a)+l&&(o=!o)}return o}(n,u);r?h():o&&(h(),d())};return document.addEventListener("pointermove",e),()=>document.removeEventListener("pointermove",e)}},[c,p,u,d,h]),(0,x.jsx)(A,{...e,ref:a})}),[N,B]=v(E,{isInside:!1}),A=r.forwardRef((e,t)=>{let{__scopeTooltip:n,children:o,"aria-label":i,onEscapeKeyDown:l,onPointerDownOutside:u,...c}=e,d=L(D,n),f=y(n),{onClose:v}=d;return r.useEffect(()=>(document.addEventListener(w,v),()=>document.removeEventListener(w,v)),[v]),r.useEffect(()=>{if(d.trigger){let e=e=>{let t=e.target;(null==t?void 0:t.contains(d.trigger))&&v()};return window.addEventListener("scroll",e,{capture:!0}),()=>window.removeEventListener("scroll",e,{capture:!0})}},[d.trigger,v]),(0,x.jsx)(a.XB,{asChild:!0,disableOutsidePointerEvents:!1,onEscapeKeyDown:l,onPointerDownOutside:u,onFocusOutside:e=>e.preventDefault(),onDismiss:v,children:(0,x.jsxs)(s.VY,{"data-state":d.stateAttribute,...f,...c,ref:t,style:{...c.style,"--radix-tooltip-content-transform-origin":"var(--radix-popper-transform-origin)","--radix-tooltip-content-available-width":"var(--radix-popper-available-width)","--radix-tooltip-content-available-height":"var(--radix-popper-available-height)","--radix-tooltip-trigger-width":"var(--radix-popper-anchor-width)","--radix-tooltip-trigger-height":"var(--radix-popper-anchor-height)"},children:[(0,x.jsx)(p.A4,{children:o}),(0,x.jsx)(N,{scope:n,isInside:!0,children:(0,x.jsx)(h.f,{id:d.contentId,role:"tooltip",children:i||o})})]})})});O.displayName=D;var Y="TooltipArrow";r.forwardRef((e,t)=>{let{__scopeTooltip:n,...r}=e,o=y(n);return B(Y,n).isInside?null:(0,x.jsx)(s.Eh,{...o,...r,ref:t})}).displayName=Y;var z=T,F=M,H=j,S=O}}]);