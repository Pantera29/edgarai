(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[9091],{66243:function(e,n,r){Promise.resolve().then(r.bind(r,15718))},15718:function(e,n,r){"use strict";r.r(n),r.d(n,{default:function(){return f}});var t=r(57437),i=r(2265),l=r(66840),o="horizontal",a=["horizontal","vertical"],u=i.forwardRef((e,n)=>{let{decorative:r,orientation:i=o,...u}=e,s=a.includes(i)?i:o;return(0,t.jsx)(l.WV.div,{"data-orientation":s,...r?{role:"none"}:{"aria-orientation":"vertical"===s?s:void 0,role:"separator"},...u,ref:n})});u.displayName="Separator";var s=r(94508);let c=i.forwardRef((e,n)=>{let{className:r,orientation:i="horizontal",decorative:l=!0,...o}=e;return(0,t.jsx)(u,{ref:n,decorative:l,orientation:i,className:(0,s.cn)("shrink-0 bg-border","horizontal"===i?"h-[1px] w-full":"h-full w-[1px]",r),...o})});function f(e){let{children:n}=e;return(0,t.jsxs)("div",{className:"space-y-6 p-10 pb-16",children:[(0,t.jsxs)("div",{className:"space-y-0.5",children:[(0,t.jsx)("h2",{className:"text-2xl font-bold tracking-tight",children:"Administraci\xf3n"}),(0,t.jsx)("p",{className:"text-muted-foreground",children:"Gestiona la configuraci\xf3n y servicios de tu taller"})]}),(0,t.jsx)(c,{className:"my-6"}),(0,t.jsx)("div",{className:"flex-1",children:n})]})}c.displayName=u.displayName},94508:function(e,n,r){"use strict";r.d(n,{S:function(){return o},cn:function(){return l}});var t=r(61994),i=r(53335);function l(){for(var e=arguments.length,n=Array(e),r=0;r<e;r++)n[r]=arguments[r];return(0,i.m6)((0,t.W)(n))}function o(){return"/edgarai"}},98575:function(e,n,r){"use strict";r.d(n,{F:function(){return l},e:function(){return o}});var t=r(2265);function i(e,n){if("function"==typeof e)return e(n);null!=e&&(e.current=n)}function l(...e){return n=>{let r=!1,t=e.map(e=>{let t=i(e,n);return r||"function"!=typeof t||(r=!0),t});if(r)return()=>{for(let n=0;n<t.length;n++){let r=t[n];"function"==typeof r?r():i(e[n],null)}}}}function o(...e){return t.useCallback(l(...e),e)}},66840:function(e,n,r){"use strict";r.d(n,{WV:function(){return a},jH:function(){return u}});var t=r(2265),i=r(54887),l=r(37053),o=r(57437),a=["a","button","div","form","h2","h3","img","input","label","li","nav","ol","p","span","svg","ul"].reduce((e,n)=>{let r=t.forwardRef((e,r)=>{let{asChild:t,...i}=e,a=t?l.g7:n;return"undefined"!=typeof window&&(window[Symbol.for("radix-ui")]=!0),(0,o.jsx)(a,{...i,ref:r})});return r.displayName=`Primitive.${n}`,{...e,[n]:r}},{});function u(e,n){e&&i.flushSync(()=>e.dispatchEvent(n))}},37053:function(e,n,r){"use strict";r.d(n,{A4:function(){return u},g7:function(){return o}});var t=r(2265),i=r(98575),l=r(57437),o=t.forwardRef((e,n)=>{let{children:r,...i}=e,o=t.Children.toArray(r),u=o.find(s);if(u){let e=u.props.children,r=o.map(n=>n!==u?n:t.Children.count(e)>1?t.Children.only(null):t.isValidElement(e)?e.props.children:null);return(0,l.jsx)(a,{...i,ref:n,children:t.isValidElement(e)?t.cloneElement(e,void 0,r):null})}return(0,l.jsx)(a,{...i,ref:n,children:r})});o.displayName="Slot";var a=t.forwardRef((e,n)=>{let{children:r,...l}=e;if(t.isValidElement(r)){let e,o;let a=(e=Object.getOwnPropertyDescriptor(r.props,"ref")?.get)&&"isReactWarning"in e&&e.isReactWarning?r.ref:(e=Object.getOwnPropertyDescriptor(r,"ref")?.get)&&"isReactWarning"in e&&e.isReactWarning?r.props.ref:r.props.ref||r.ref;return t.cloneElement(r,{...function(e,n){let r={...n};for(let t in n){let i=e[t],l=n[t];/^on[A-Z]/.test(t)?i&&l?r[t]=(...e)=>{l(...e),i(...e)}:i&&(r[t]=i):"style"===t?r[t]={...i,...l}:"className"===t&&(r[t]=[i,l].filter(Boolean).join(" "))}return{...e,...r}}(l,r.props),ref:n?(0,i.F)(n,a):a})}return t.Children.count(r)>1?t.Children.only(null):null});a.displayName="SlotClone";var u=({children:e})=>(0,l.jsx)(l.Fragment,{children:e});function s(e){return t.isValidElement(e)&&e.type===u}}},function(e){e.O(0,[6137,2971,2117,1744],function(){return e(e.s=66243)}),_N_E=e.O()}]);